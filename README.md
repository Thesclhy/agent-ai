# Agent AI

Agent AI is a full-stack AI assistant prototype that combines:

- PDF-based RAG question answering
- Web-search-assisted answers through MCP
- A ChatGPT-like chat interface
- Optional voice input and speech playback

Users can upload a PDF, ask questions about it, and receive two parallel answers:

- `RAG Answer`: grounded in the uploaded document
- `MCP Answer`: based on live web search results

This project demonstrates my ability to build and improve an AI product end to end, including frontend experience, backend API design, retrieval pipelines, tool integration, and debugging of real-world document parsing issues.

## Features

- Upload a PDF and use it as the active knowledge source
- Ask free-form questions in a chat interface
- Get document-grounded answers through a RAG pipeline
- Get external context through MCP-based web search
- Use voice mode for English speech input
- See clear backend error messages when PDF parsing or web search fails

## Tech Stack

### Frontend

- React
- Ant Design
- Axios
- react-speech-recognition
- speak-tts

### Backend

- Node.js
- Express
- Multer
- LangChain
- OpenAI Embeddings / ChatOpenAI
- MemoryVectorStore
- MCP SDK
- SerpAPI
- Ghostscript fallback for PDF text extraction

## How It Works

### 1. PDF Upload

The frontend uploads a PDF to:

```http
POST /upload
```

The backend stores the uploaded file in `server/uploads/` and keeps it as the current document context.

### 2. Chat Request

When the user asks a question, the frontend calls:

```http
GET /chat?question=...
```

The backend then runs two answer paths:

- `chat.js`: PDF RAG pipeline
- `chat-mcp.js`: MCP web search pipeline

### 3. RAG Path

The RAG pipeline:

1. Loads PDF text
2. Splits the document into chunks
3. Builds embeddings
4. Stores them in an in-memory vector store
5. Retrieves relevant chunks for the user’s question
6. Uses `ChatOpenAI` to generate a concise answer

### 4. MCP Web Search Path

The MCP path:

1. Starts a local MCP server over stdio
2. Registers a `search_web` tool
3. Calls SerpAPI for search results
4. Passes results to the model for summarization

## Engineering Improvements Implemented

This project includes several practical improvements beyond a basic demo.

### UI / UX Improvements

- Refactored the interface into a ChatGPT-like layout
- Added a fixed left sidebar and bottom composer
- Moved PDF upload into the sidebar
- Improved response presentation using expandable answer sections
- Changed voice mode so speech fills the text box before sending
- Restricted voice recognition to English

### PDF Parsing Robustness

Some PDFs open successfully but fail to yield readable text with the default parser. To make the system more reliable:

- Added logs for file path, extracted page count, and total extracted text length
- Added clear error handling for parser failures
- Detects empty extracted text instead of silently continuing
- Added Ghostscript fallback extraction for PDFs that LangChain/PDFLoader cannot read properly

### Web Search Reliability

- Improved SerpAPI error handling
- Trimmed `SERPAPI_KEY` to avoid trailing-space issues
- Properly surfaces API errors instead of returning `undefined`
- Prevents the model from “summarizing” an error string as if it were a search result

## Project Structure

```text
agentai/
├── src/
│   ├── App.js
│   └── components/
│       ├── ChatComponent.js
│       ├── PdfUploader.js
│       └── RenderQA.js
├── server/
│   ├── server.js
│   ├── chat.js
│   ├── chat-mcp.js
│   └── mcp-server.js
└── README.md
```

## Run Locally

From the project root:

```bash
npm install
cd server && npm install
cd ..
npm run dev
```

Frontend:

- `http://localhost:3000`

Backend:

- `http://localhost:5001`

## Environment Variables

Root `.env`:

```bash
REACT_APP_DOMAIN=http://localhost:5001
```

Backend environment:

```bash
OPENAI_API_KEY=your_openai_key
SERPAPI_KEY=your_serpapi_key
```

## Current Limitations

- Vector storage is in-memory only
- Uploaded document state is process-local, not user-isolated
- No database or authentication
- Search summarization still uses raw search response text and can be further structured
- OCR support is partial and currently relies on Ghostscript fallback

## What This Project Demonstrates

This project shows that I can:

- Build a React + Node.js full-stack application
- Integrate LLMs into a working product flow
- Implement a RAG pipeline
- Work with tool-based AI architecture through MCP
- Debug real parsing and third-party API issues
- Improve both system reliability and user experience

## Additional Project Writeup

For a more detailed project showcase oriented toward interviews, portfolio reviews, or technical presentations, see:

- [PROJECT_SHOWCASE.md](./PROJECT_SHOWCASE.md)
