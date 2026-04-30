import React, { useEffect, useRef } from "react";
import { Collapse, Spin } from "antd";

const RenderQA = (props) => {
  const { conversation, isLoading } = props;
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, isLoading]);

  if (!conversation?.length && !isLoading) {
    return (
      <div className="empty-state">
        <div className="empty-state__panel">
          <div className="empty-state__eyebrow">Ready to chat</div>
          <h3 className="empty-state__title">Start a conversation</h3>
          <p className="empty-state__text">
            Upload a PDF from the left sidebar, then ask a question below. The
            app will reply with both a document-grounded answer and a web-backed
            summary.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation">
      {conversation?.map((each, index) => {
        const hasRagError = Boolean(each.answer?.ragError);
        const hasMcpError = Boolean(each.answer?.mcpError);
        const items = [
          {
            key: "rag",
            label: "From your document",
            children: (
              <div
                className={`answer-card ${
                  hasRagError
                    ? "answer-card--error"
                    : "answer-card--document"
                }`}
              >
                {each.answer.ragAnswer}
              </div>
            ),
          },
          {
            key: "mcp",
            label: "From web search",
            children: (
              <div
                className={`answer-card ${
                  hasMcpError ? "answer-card--error" : "answer-card--web"
                }`}
              >
                {each.answer.mcpAnswer}
              </div>
            ),
          },
        ];

        return (
          <div key={index} className="conversation__group">
            <div className="message-row message-row--user">
              <div className="message-bubble message-bubble--user">
                {each.question}
              </div>
            </div>

            <div className="message-row message-row--assistant">
              <div className="message-bubble message-bubble--assistant">
                <div className="assistant-response">
                  <div className="assistant-response__label">Agent AI</div>
                  <div
                    className={`assistant-response__summary ${
                      hasRagError ? "assistant-response__summary--error" : ""
                    }`}
                  >
                    {each.answer.ragAnswer}
                  </div>
                  <Collapse
                    defaultActiveKey={["rag"]}
                    ghost
                    items={items}
                    className="assistant-response__details"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="message-row message-row--assistant">
          <div className="message-bubble message-bubble--assistant message-bubble--loading">
            <div className="assistant-response__label">Agent AI</div>
            <div className="loading-state">
              <Spin size="small" />
              <span>Thinking through your document and the web...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default RenderQA;
