import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatOpenAI } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { PromptTemplate } from "@langchain/core/prompts";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { unlink } from "fs/promises";
import { basename, join } from "path";
import { tmpdir } from "os";
import { promisify } from "util";
import { execFile } from "child_process";

const execFileAsync = promisify(execFile);

class PdfProcessingError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PdfProcessingError";
    this.details = details;
  }
}

const buildPdfErrorMessage = (error) => {
  const message = error?.message || "Unknown PDF parsing error.";

  if (message.includes("bad XRef entry")) {
    return "The uploaded PDF could not be parsed. It may be corrupted, scanned as images, or saved in a format this parser cannot read.";
  }

  return `The uploaded PDF could not be parsed. It may be corrupted, scanned, or incompatible with the current parser. Original error: ${message}`;
};

const extractTextWithGhostscript = async (filePath) => {
  const safeBaseName = basename(filePath).replace(/[^a-zA-Z0-9._-]/g, "_");
  const outputPath = join(
    tmpdir(),
    `agentai-gs-${Date.now()}-${safeBaseName}.txt`
  );

  try {
    await execFileAsync("gs", [
      "-o",
      outputPath,
      "-sDEVICE=txtwrite",
      filePath,
    ]);

    const loader = await import("fs/promises");
    const extractedText = await loader.readFile(outputPath, "utf8");
    const normalizedText = extractedText.trim();

    console.log(
      `[RAG] Ghostscript fallback extractedTextLength=${normalizedText.length}`
    );

    return normalizedText;
  } finally {
    await unlink(outputPath).catch(() => {});
  }
};

const loadPdfDocuments = async (filePath) => {
  console.log(`[RAG] Loading PDF from path: ${filePath}`);

  let data = [];
  let loaderError = null;

  try {
    const loader = new PDFLoader(filePath);
    data = await loader.load();
  } catch (error) {
    loaderError = error;
  }

  const extractedPages = data.length;
  const totalExtractedTextLength = data.reduce((total, doc) => {
    return total + (doc.pageContent || "").trim().length;
  }, 0);

  console.log(
    `[RAG] PDF loaded. pages=${extractedPages}, extractedTextLength=${totalExtractedTextLength}`
  );

  if (totalExtractedTextLength > 0) {
    return {
      documents: data,
      pages: extractedPages,
      extractedTextLength: totalExtractedTextLength,
      extractionMethod: "pdf-loader",
    };
  }

  console.log("[RAG] Primary PDF extraction unavailable. Trying Ghostscript fallback.");

  try {
    const ghostscriptText = await extractTextWithGhostscript(filePath);

    if (ghostscriptText.length > 0) {
      return {
        documents: [
          new Document({
            pageContent: ghostscriptText,
            metadata: {
              source: filePath,
              extractionMethod: "ghostscript-txtwrite",
            },
          }),
        ],
        pages: extractedPages || 1,
        extractedTextLength: ghostscriptText.length,
        extractionMethod: "ghostscript-txtwrite",
      };
    }
  } catch (ghostscriptError) {
    console.error("[RAG] Ghostscript fallback failed:", {
      filePath,
      error: ghostscriptError?.message || String(ghostscriptError),
    });
  }

  if (loaderError) {
    throw new PdfProcessingError(buildPdfErrorMessage(loaderError), {
      filePath,
      cause: loaderError?.message || String(loaderError),
      pages: extractedPages,
      extractedTextLength: totalExtractedTextLength,
    });
  }

  throw new PdfProcessingError(
    "The uploaded PDF was opened, but no readable text could be extracted. The file may be scanned, image-based, empty, or incompatible with the current parser.",
    {
      filePath,
      pages: extractedPages,
      extractedTextLength: totalExtractedTextLength,
    }
  );
};

// NOTE: change this default filePath to any of your default file name
const chat = async (filePath = "./uploads/hbs-lean-startup.pdf", query) => {
  // Get API key from environment
  const apiKey = process.env.OPENAI_API_KEY;

  const {
    documents,
    pages: extractedPages,
    extractedTextLength: totalExtractedTextLength,
  } = await loadPdfDocuments(filePath);

  // step 2:
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500, //  (in terms of number of characters)
    chunkOverlap: 0,
  });

  const splitDocs = await textSplitter.splitDocuments(documents);

  // step 3

  const embeddings = new OpenAIEmbeddings(apiKey ? { apiKey } : {});

  const vectorStore = await MemoryVectorStore.fromDocuments(
    splitDocs,
    embeddings
  );

  // step 4: retrieval

  // const relevantDocs = await vectorStore.similaritySearch(
  // "What is task decomposition?"
  // );

  // step 5: qa w/ customize the prompt
  const model = new ChatOpenAI({
    model: "gpt-5",
    ...(apiKey && { apiKey }),
  });

  const template = `Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Use three sentences maximum and keep the answer as concise as possible.

{context}
Question: {question}
Helpful Answer:`;

  const prompt = PromptTemplate.fromTemplate(template);

  // Use retriever to get relevant documents
  const retriever = vectorStore.asRetriever();
  const relevantDocs = await retriever.invoke(query);

  // Format context from retrieved documents
  const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

  if (!context.trim()) {
    throw new PdfProcessingError(
      "The PDF text was extracted, but no usable context was retrieved for this question. Try a more specific question or upload a PDF with selectable text.",
      {
        filePath,
        pages: extractedPages,
        extractedTextLength: totalExtractedTextLength,
      }
    );
  }

  // Create a simple chain using the prompt template
  const formattedPrompt = await prompt.format({
    context,
    question: query,
  });

  // Get response from the model
  const response = await model.invoke(formattedPrompt);

  return { text: response.content };
};

export default chat;
