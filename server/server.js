import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer"; // Import multer
import chat from "./chat.js";
import chatMCP from "./chat-mcp.js";

dotenv.config();

const app = express();
app.use(cors());

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

const PORT = 5001;

let filePath;

app.post("/upload", upload.single("file"), (req, res) => {
  // Use multer to handle file upload
  filePath = req.file.path; // The path where the file is temporarily saved
  console.log(`[UPLOAD] Received file: ${filePath}`);
  res.send(filePath + " upload successfully.");
});

app.get("/chat", async (req, res) => {
  let ragResp = { text: "" };
  let ragError = null;
  let mcpResp = { text: "" };
  let mcpError = null;

  try {
    ragResp = await chat(filePath, req.query.question);
  } catch (error) {
    ragError =
      error?.message ||
      "Failed to read the uploaded PDF. It may be corrupted, scanned, or incompatible.";
    console.error("[RAG] Failed to answer from PDF:", {
      filePath,
      question: req.query.question,
      error: error?.message || String(error),
      details: error?.details || null,
    });
  }

  try {
    mcpResp = await chatMCP(req.query.question);
  } catch (error) {
    mcpError =
      error?.message ||
      "Web search failed while answering this question.";
    console.error("[MCP] Failed to answer from web search:", {
      question: req.query.question,
      error: error?.message || String(error),
    });
  }

  res.send({
    ragAnswer: ragResp.text || ragError,
    ragError,
    mcpAnswer: mcpResp.text || mcpError,
    mcpError,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
