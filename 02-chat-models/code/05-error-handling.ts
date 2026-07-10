/**
 * Error Handling with Built-In Retries
 * Run: npx tsx 02-chat-models/code/05-error-handling.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - {{"How does withRetry() implement exponential backoff?"}}
 * - {{"Can I customize the retry delay and max attempts with withRetry()?"}}
 */

import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

// Global counter to simulate transient failures (for demonstration only!)
let attemptCount = 0;

/**
 * Makes an API call with automatic retry logic using LangChain's built-in withRetry()
 */

async function robustCall(
  prompt: string,
  maxRetries = 3
): Promise<string> /*async functions can return only promise<type>*/ {
  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  // Use LangChain's built-in retry logic - automatically handles retries with exponential backoff => automatically {{handles 429 errors}}

  const modelWithRetry = model.withRetry({
    stopAfterAttempt: maxRetries,
    retryd
  });

  console.log(`🔄 Making call with automatic retry (max ${maxRetries} attempts)...`);

  const response = await modelWithRetry.invoke(prompt);
  console.log(`✅ Success!`);

  return response.content.toString();
}

/**
 * Demonstrates different error scenarios
 */
async function errorExamples() {
  console.log("🛡️  Error Handling Examples\n");
  console.log("=".repeat(80));

  // Example 1: Invalid API key - actually demonstrate the error!
  console.log("\n1️⃣  Example: Invalid API Key\n");
  try {
    const badModel = new ChatOpenAI({
      model: process.env.AI_MODEL,
      configuration: { baseURL: process.env.AI_ENDPOINT },
      apiKey: "invalid_key_12345", // Intentionally invalid
    });

    console.log("🔄 Attempting call with invalid API key...");
    await badModel.invoke("Hello");
    console.log("✅ Call succeeded (unexpected!)");
  } catch (error: any) {
    console.log("❌ Caught error:", error.message.substring(0, 100) + "...");
    console.log("💡 Solution: Check your API key in .env file\n");
  }

  // Example 2: Demonstrating retry in action (fail once, then succeed)
  console.log("\n2️⃣  Example: Retry in Action - Simulating Transient Failure\n");
  console.log("💡 This simulates a temporary network/API issue that resolves on retry\n");

  // Reset counter
  attemptCount = 0;

  try {
    // Create a model that will fail on first attempt, succeed on second
    const model = new ChatOpenAI({
      model: process.env.AI_MODEL,
      configuration: { baseURL: process.env.AI_ENDPOINT },
      apiKey: process.env.AI_API_KEY,
    });

    // Add retry logic
    const modelWithRetry = model.withRetry({
      stopAfterAttempt: 3,
    });

    // Simulate transient failure by temporarily breaking credentials
    const originalKey = process.env.AI_API_KEY;

    const originalInvoke = model.invoke.bind(model);

    // Override invoke to simulate transient failure
    (model as any).invoke = async function (input: any) {
      attemptCount++;
      console.log(`   🔄 Attempt ${attemptCount}...`);

      // First attempt: fail with invalid key
      if (attemptCount === 1) {
        console.log(`   ❌ Simulating transient failure (invalid credentials)`);
        const failModel = new ChatOpenAI({
          model: process.env.AI_MODEL,
          configuration: { baseURL: process.env.AI_ENDPOINT },
          apiKey: "invalid_key_for_demo",
        });
        return await failModel.invoke(input);
      }

      // Second+ attempts: succeed with valid credentials
      console.log(`   ✅ Using valid credentials (retry working!)`);
      return await originalInvoke(input);
    };

    const response = await modelWithRetry.invoke("What is 2+2?");
    console.log("\n🤖 Final Response:", response.content.toString());
    console.log("💡 withRetry() automatically handled the failure and succeeded on attempt 2!\n");
  } catch (error: any) {
    console.log("❌ All retries failed:", error.message);
  }

  // Example 3: Normal withRetry() usage (no failures)
  console.log("\n3️⃣  Example: Using withRetry() with Valid Credentials\n");
  try {
    console.log("🔄 Making call with withRetry() (should succeed on first try)...");
    const response = await robustCall("What is 5+5?");
    console.log("🤖 Response:", response);
    console.log("💡 No retries needed when everything works correctly!\n");
  } catch (error: any) {
    console.log("❌ All retries failed:", error.message);
  }

  // Example 4: Error categorization
  console.log("\n4️⃣  Example: Categorizing Different Error Types\n");

  // Save original key
  const originalKey = process.env.AI_API_KEY;

  try {
    // Test with invalid key
    process.env.AI_API_KEY = "sk-invalid12345";

    const model = new ChatOpenAI({
      model: process.env.AI_MODEL,
      configuration: { baseURL: process.env.AI_ENDPOINT },
      apiKey: process.env.AI_API_KEY,
    });

    console.log("🔄 Testing error categorization with invalid credentials...");
    await model.invoke("Hello");
  } catch (error: any) {
    // Categorize the error
    let errorType = "Unknown error";
    let solution = "Check the error message for details";

    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      errorType = "Authentication Error (401)";
      solution = "Verify your API key is correct";
    } else if (error.message.includes("429") || error.message.includes("rate limit")) {
      errorType = "Rate Limit Error (429)";
      solution = "Use withRetry() to handle rate limits automatically";
    } else if (error.message.includes("timeout")) {
      errorType = "Timeout Error";
      solution = "Increase timeout or use withRetry()";
    }

    console.log("📋 Error type detected:", errorType);
    console.log("💡 Solution:", solution);
  } finally {
    // Restore original key
    process.env.AI_API_KEY = originalKey;
  }
}

/**
 * Best practices for error handling
 */
function showBestPractices() {
  console.log("\n\n📋 Error Handling Best Practices\n");
  console.log("=".repeat(80));

  console.log(`
1. ✅ Always wrap API calls in try-catch
   try {
     const response = await model.invoke(prompt);
   } catch (error) {
     console.error("Error:", error.message);
   }

2. ✅ Use built-in retry logic with withRetry()
   const modelWithRetry = model.withRetry({ stopAfterAttempt: 3 });
   // Automatically handles exponential backoff!

3. ✅ Handle specific error types
   if (error.message.includes("429")) {
     // Rate limit - withRetry() handles this automatically
   } else if (error.message.includes("401")) {
     // Auth error - check API key
   }

4. ✅ Log errors for debugging
   console.error("API Error:", error.message, error.stack);

5. ✅ Provide helpful error messages to users
   "Sorry, I'm having trouble connecting. Please try again."

6. ✅ Have fallback behavior
   if (apiCallFails) {
     return cachedResponse || defaultResponse;
   }

7. ✅ Monitor error rates in production
   Track failed requests to identify issues early
`);
}

async function main() {
  await errorExamples();
  showBestPractices();

  console.log("\n✅ Remember: Good error handling makes your app reliable!");
}

main();
