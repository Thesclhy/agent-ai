import React, { useState } from "react";
import "./App.css";
import PdfUploader from "./components/PdfUploader";
import ChatComponent from "./components/ChatComponent";
import RenderQA from "./components/RenderQA";
import { Layout, Typography } from "antd";

const App = () => {
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const { Sider, Content } = Layout;
  const { Title, Paragraph, Text } = Typography;

  const handleResp = (question, answer) => {
    setConversation((prev) => [...prev, { question, answer }]);
  };

  const handleUploadSuccess = (fileName) => {
    setUploadedFileName(fileName);
  };

  return (
    <Layout className="app-shell">
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        width={280}
        className="app-sidebar"
      >
        <div className="app-sidebar__inner">
          <div className="app-brand">
            <div>
              <Title level={3} className="app-brand__title">
                Agent AI
              </Title>
              <Paragraph className="app-brand__subtitle">
                Chat with your uploaded document and a live web search answer in
                one workspace.
              </Paragraph>
            </div>
          </div>

          <div className="app-sidebar__section app-sidebar__status">
            <Text className="app-sidebar__label">Current Document</Text>
            <div className="app-sidebar__status-card">
              {uploadedFileName ? (
                <>
                  <Text className="app-sidebar__status-name">
                    {uploadedFileName}
                  </Text>
                  <Text className="app-sidebar__status-meta">
                    Answers will use this PDF for the RAG response.
                  </Text>
                </>
              ) : (
                <>
                  <Text className="app-sidebar__status-name">
                    Default sample PDF
                  </Text>
                  <Text className="app-sidebar__status-meta">
                    Upload a file to replace the default document context.
                  </Text>
                </>
              )}
            </div>
          </div>

          <div className="app-sidebar__section app-sidebar__upload">
            <Text className="app-sidebar__label">Knowledge Source</Text>
            <PdfUploader onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>
      </Sider>

      <Content className="app-main">
        <div className="app-main__header">
          <div>
            <Title level={2} className="app-main__title">
              Ask anything about your document
            </Title>
            <Paragraph className="app-main__subtitle">
              Each response blends a document-grounded answer with a web-backed
              summary.
            </Paragraph>
          </div>
        </div>

        <div className="app-main__body">
          <RenderQA conversation={conversation} isLoading={isLoading} />
        </div>

        <div className="app-main__composer">
          <ChatComponent
            handleResp={handleResp}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </div>
      </Content>
    </Layout>
  );
};

export default App;
