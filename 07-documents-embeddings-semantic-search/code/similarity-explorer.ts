import { OpenAIEmbeddings } from "@langchain/openai";
import "dotenv/config";

// Helper function to calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

const texts = [
  // languages
  // web
  "I love programming in JavaScript",
  "JavaScript is my favorite language",
  "I enjoy coding web applications",

  //   python
  "Python is great for data science",
  "Machine learning uses Python often",
  // pets
  "Dogs are loyal pets",
  "Cats are independent animals",
  "Pets bring joy to families",

  //   weather
  "The weather is sunny today",
  "It's raining outside",
];

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
});

const docs = await embeddings.embedDocuments(texts);

let maxSim = 0,
  minSim = 1,
  thres = 0.8;
let maxSimPair = [0, 1],
  minSimPair = [0, 1],
  simG_Thres: Array<[number, number]> = [];

for (let i = 0; i < docs.length; i++) {
  const u = docs[i];
  for (let j = i + 1; j < docs.length; j++) {
    const v = docs[j];

    console.log(`i = ${i}${" ".repeat(40)}j = ${j}`);
    console.log(
      `u = ${texts[i].slice(0, 40)}${" ".repeat(41 - Math.min(texts[i].length, 40))}v = ${texts[j].slice(0, 40)}`
    );

    const sim = cosineSimilarity(u, v);
    console.log("sim:", sim);
    console.log();

    if (sim > maxSim) {
      maxSim = sim;
      maxSimPair = [i, j];
    }
    if (sim < minSim) {
      minSim = sim;
      minSimPair = [i, j];
    }

    if (sim > thres) {
      simG_Thres.push([i, j]);
    }
  }
}

console.log(`maxSim: ${maxSim} maxSimPair: ${maxSimPair}`);
console.log(`minSim: ${minSim} minSimPair: ${minSimPair}`);
console.log(`simG_Thres: ${simG_Thres}`);
