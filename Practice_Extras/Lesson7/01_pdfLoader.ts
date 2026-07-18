import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

async function loadPDF() {
  // Pass the path to your PDF file
  const loader = new PDFLoader("./data/sample.pdf");

  // Each page in the PDF becomes a separate Document object in the array
  const docs = await loader.load();

  console.log(`📚 Loaded ${docs.length} pages`);
  console.log("📝 Content of Page 1:", docs[0].pageContent);
}

loadPDF();