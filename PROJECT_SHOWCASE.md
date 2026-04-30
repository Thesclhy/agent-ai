# Agent AI

一个结合 `RAG + Web Search + Voice Chat` 的智能问答项目。用户可以上传 PDF 文档，围绕文档内容提问，系统同时给出：

- 基于上传文档的 `RAG Answer`
- 基于网页搜索的 `MCP Answer`

这个项目适合展示我在全栈开发、AI 应用集成、问题排查和用户体验改进方面的能力。

## 1. 项目定位

这个项目不是单纯的聊天界面，而是一个面向真实使用场景的 AI 助手原型：

- 用户上传自己的 PDF 文档
- 前端提供类似 ChatGPT 的对话体验
- 后端对 PDF 做解析、切块、向量化和检索
- 同时通过 MCP 调用外部搜索能力补充答案
- 最终把“文档内知识”和“外部网页信息”并行返回给用户

它体现的是一种典型的 AI Product Engineering 思路：不是只调用模型，而是围绕模型搭建完整的数据入口、推理链路、错误处理和交互体验。

## 2. 我做了什么

### 前端

- 将原始 demo 风格页面重构为更接近 ChatGPT 的布局
- 设计了固定左侧 sidebar、主消息流和底部 composer 输入区
- 将 PDF 上传入口整合到 sidebar 底部
- 将回答展示重构为更自然的消息形式，而不是简单堆叠文本块
- 保留 `RAG Answer` 和 `MCP Answer`，并改造成可展开的分区展示
- 增加空状态、loading 状态和错误态
- 保留语音模式，并调整为：
  - 只识别英文 `en-US`
  - 录音结束后先回填到输入框，而不是自动发送

### 后端

- 维护了现有 Express API 结构，不破坏原有接口
- 为 PDF 解析链路增加了更稳健的日志和错误处理
- 解决了部分 PDF 可打开但无法正常提取文本的问题
- 为 PDF 解析增加 Ghostscript fallback，提高兼容性
- 修复了 MCP web search 的错误处理问题
- 让前端能够清晰看到后端错误，而不是得到空答案或误导性总结

## 3. 技术架构

### 前端

- React
- Ant Design
- Axios
- react-speech-recognition
- speak-tts

### 后端

- Node.js
- Express
- Multer
- LangChain
- OpenAI Embeddings / ChatOpenAI
- MemoryVectorStore
- MCP SDK
- SerpAPI
- Ghostscript fallback for PDF text extraction

### 整体流程

1. 用户在前端上传 PDF
2. 文件通过 `POST /upload` 发送到后端
3. 后端将文件保存到 `server/uploads/`
4. 用户提问后，前端调用 `GET /chat?question=...`
5. 后端并行执行两条链路：
   - 文档问答链路：PDF -> 文本提取 -> 切块 -> embeddings -> 向量检索 -> LLM 生成答案
   - 网页搜索链路：MCP client -> MCP server -> SerpAPI -> LLM 总结
6. 前端把两个结果整理成统一回答展示

## 4. 核心工程亮点

### 4.1 RAG 文档问答链路

项目的 PDF 问答逻辑不是简单把整份文档发给模型，而是标准的 RAG 流程：

- `PDFLoader` 读取 PDF
- `RecursiveCharacterTextSplitter` 做文本切块
- `OpenAIEmbeddings` 生成向量
- `MemoryVectorStore` 做向量索引
- `retriever.invoke(query)` 做相似检索
- 把检索结果拼接进 prompt
- 最后由 `ChatOpenAI` 生成回答

这说明我不仅会调用模型 API，也理解“检索增强生成”这种 AI 系统的基本结构。

### 4.2 PDF 解析鲁棒性提升

项目里有一个实际遇到的问题：有些 PDF 能打开，但 `PDFLoader` 提取不到正文。

我做了以下增强：

- 为 PDF 加入了明确日志：
  - 上传文件路径
  - 加载页数
  - 提取文本总长度
- 如果 `pageContent` 为空，不再静默继续
- 对 `bad XRef entry` 这类解析异常返回清晰解释
- 引入 `Ghostscript txtwrite` 作为 fallback

这部分非常能体现工程能力，因为它不是“功能开发”，而是对真实不稳定输入的兼容性处理。

### 4.3 MCP 搜索链路排障

项目里的网页搜索不是直接在业务代码里调搜索 API，而是拆成 MCP 架构：

- `chat-mcp.js` 作为 MCP client
- `mcp-server.js` 注册 `search_web` 工具
- 工具底层调用 SerpAPI

我在这里处理了几个关键问题：

- 环境变量 `SERPAPI_KEY` 自动 `trim`
- 识别 SerpAPI 返回的业务错误
- 修复错误对象被格式化成 `undefined` 的问题
- 避免把错误字符串继续交给模型“总结”

这能展示我不仅会“接 API”，也会做 tool-based AI architecture 的错误隔离与调试。

### 4.4 前端交互重构

原始项目更像课程 demo。我把它改造成了更接近真实产品的聊天界面：

- 重新组织信息层级
- 固定 sidebar，主区域单列消息流
- 回答以对话形式展示
- 上传、文档状态、输入区之间的关系更自然
- 语音识别交互更符合用户习惯

这部分体现的是我不仅会写功能，还能从产品视角优化交互。

## 5. 体现出的编程能力

这个项目可以比较完整地体现我的以下能力：

### Full-Stack Development

- 能独立修改前端 React 页面和后端 Express 服务
- 能处理接口设计、状态管理、组件重构和服务逻辑

### AI Application Engineering

- 理解并实现 RAG
- 能把 LLM、embeddings、vector store、prompt 组合成完整链路
- 能把外部工具能力通过 MCP 方式接入应用

### Debugging and Reliability

- 能根据日志定位问题到底在 UI、API、解析器还是第三方服务
- 能给不可控输入增加 fallback 路径
- 能把模糊失败变成可观测、可解释的错误

### Product Thinking

- 不只满足“能跑”，而是主动优化界面、输入体验和错误反馈
- 能把一个技术 demo 往真实用户可用的方向推进

## 6. 我在这个项目里解决过的真实问题

### 问题 1：上传的 PDF 读不出来

现象：

- PDF 已上传
- 但 RAG 返回 “I don’t know”

排查过程：

- 验证上传路径是否正确
- 验证默认 PDF 是否可读
- 验证目标 PDF 的 `pageContent` 是否为空
- 发现特定 PDF 在主解析链路中抽取文本长度为 0

解决方案：

- 增加 PDF 提取日志
- 加强异常处理
- 引入 Ghostscript fallback

### 问题 2：web search 返回 `undefined`

现象：

- 前端显示 `Error performing web search: undefined`

排查过程：

- 检查 MCP server 错误对象结构
- 检查环境变量
- 检查 SerpAPI 响应格式

解决方案：

- 对异常做统一格式化
- 检查 `results.error`
- 让搜索失败时直接返回清晰错误

### 问题 3：语音模式体验不合理

现象：

- 录音后自动发送
- 识别结果可能混入中文

解决方案：

- 改成录音结束后先填入输入框
- 语音识别参数限制为 `en-US`

## 7. 项目当前的不足

这个项目目前仍然是一个很有价值的原型，但不是完整生产系统。它的不足也很明确：

- 向量库目前是内存型，不是持久化存储
- 上传文件路径用的是进程内变量，暂时没有用户隔离
- 搜索结果仍然是先取原始 JSON，再交给模型总结，后续可以精简结构
- 没有鉴权、会话管理和数据库
- OCR 目前依赖系统里的 Ghostscript fallback，而不是完整文档处理管线

这些不足我能说清楚，说明我知道“能跑”和“可生产”之间的差距。

## 8. 如果继续迭代，我会怎么做

下一步优化方向：

1. 把向量存储替换成持久化方案，例如 Chroma / PGVector
2. 为每个用户或会话维护独立文档上下文
3. 对搜索结果做结构化提取，而不是直接把原始 JSON 交给模型
4. 增加 OCR 管线，支持更多扫描版 PDF
5. 增加错误监控、日志收集和 usage tracking
6. 增加消息历史存储和会话切换

## 9. 如何运行

项目根目录运行：

```bash
npm install
cd server && npm install
cd ..
npm run dev
```

前端默认运行在：

- `http://localhost:3000`

后端默认运行在：

- `http://localhost:5001`

需要的环境变量：

```bash
REACT_APP_DOMAIN=http://localhost:5001
OPENAI_API_KEY=your_openai_key
SERPAPI_KEY=your_serpapi_key
```

## 10. 一句话总结

`Agent AI` 展示了我把一个 AI demo 推进成更完整产品原型的能力：我不仅能完成前后端开发，还能处理 PDF 解析鲁棒性、RAG 设计、MCP 工具集成、错误排查和聊天式交互优化。
