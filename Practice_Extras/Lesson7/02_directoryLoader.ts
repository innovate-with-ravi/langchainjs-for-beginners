import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

async function loadDirectory() {
  // 1. Point to the folder (directory)
  // 2. Map file extensions to the correct loader

  const loader = new DirectoryLoader("./data/", {
    ".txt": (path) => new TextLoader(path),
    ".pdf": (path) => new PDFLoader(path),
  });
  // loads only files that have given extensions

  // This will recursively grab {{every .txt and .pdf}} in the folder
  const docs = await loader.load();

  console.log(`📚 Ingested ${docs.length} total documents from the directory`);
  console.log("docs:", JSON.stringify(docs, null, 2));
}

loadDirectory();
