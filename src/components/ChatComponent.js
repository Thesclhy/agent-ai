import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Input } from "antd";
import {
  AudioOutlined,
  MessageOutlined,
  SendOutlined,
} from "@ant-design/icons";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import Speech from "speak-tts";

const { TextArea } = Input;

const DOMAIN = "http://localhost:5001";

const ChatComponent = (props) => {
  const { handleResp, isLoading, setIsLoading } = props;
  const [searchValue, setSearchValue] = useState("");
  const [isChatModeOn, setIsChatModeOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speech, setSpeech] = useState();

  const {
    transcript,
    listening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    const initialized_speech = new Speech();
    initialized_speech
      .init({
        volume: 1,
        lang: "en-US",
        rate: 1,
        pitch: 1,
        voice: "Google US English",
        splitSentences: false,
      })
      .then((data) => {
        console.log("Speech is ready, voices are available", data);
        setSpeech(initialized_speech);
      })
      .catch((e) => {
        console.error("An error occured while initializing : ", e);
      });
  }, []);

  useEffect(() => {
    if (!listening && Boolean(transcript)) {
      setSearchValue(transcript);
      setIsRecording(false);
    }
  }, [listening, transcript]);

  const talk = (what2say) => {
    if (!speech) {
      return;
    }

    speech
      .speak({
        text: what2say,
        queue: false,
        listeners: {
          onstart: () => {
            console.log("Start utterance");
          },
          onend: () => {
            console.log("End utterance");
          },
          onresume: () => {
            console.log("Resume utterance");
          },
          onboundary: (event) => {
            console.log(
              event.name +
                " boundary reached after " +
                event.elapsedTime +
                " milliseconds."
            );
          },
        },
      })
      .then(() => {
        console.log("Success !");
        userStartConvo();
      })
      .catch((e) => {
        console.error("An error occurred :", e);
      });
  };

  const userStartConvo = () => {
    SpeechRecognition.startListening({ language: "en-US" });
    setIsRecording(true);
    resetTranscript();
  };

  const chatModeClickHandler = () => {
    setIsChatModeOn(!isChatModeOn);
    setIsRecording(false);
    SpeechRecognition.stopListening();

    resetTranscript();
  };

  const recordingClickHandler = () => {
    if (isRecording) {
      setIsRecording(false);
      SpeechRecognition.stopListening();

      resetTranscript();
    } else {
      setIsRecording(true);
      SpeechRecognition.startListening({ language: "en-US" });
    }
  };

  const onSearch = async (question) => {
    if (!question?.trim()) {
      return;
    }

    setSearchValue("");
    setIsLoading(true);

    try {
      const response = await axios.get(`${DOMAIN}/chat`, {
        params: {
          question,
        },
      });
      handleResp(question, response.data);
      if (isChatModeOn) {
        talk(response.data?.ragAnswer);
      }
    } catch (error) {
      console.error(`Error: ${error}`);
      handleResp(question, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    await onSearch(searchValue);
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await handleSubmit();
    }
  };

  const handleChange = (e) => {
    setSearchValue(e.target.value);
  };

  return (
    <div className="composer">
      <div className="composer__surface">
        <div className="composer__toolbar">
          <Button
            type={isChatModeOn ? "primary" : "default"}
            icon={<MessageOutlined />}
            onClick={chatModeClickHandler}
            className="composer__mode-button"
          >
            Voice Chat {isChatModeOn ? "On" : "Off"}
          </Button>

          {isChatModeOn && (
            <Button
              type={isRecording ? "primary" : "default"}
              icon={<AudioOutlined />}
              onClick={recordingClickHandler}
              className="composer__mode-button"
            >
              {isRecording ? "Recording..." : "Record"}
            </Button>
          )}
        </div>

        <div className="composer__input-row">
          <TextArea
            placeholder="Message Agent AI about your document..."
            autoSize={{ minRows: 1, maxRows: 6 }}
            value={searchValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="composer__textarea"
          />
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined />}
            loading={isLoading}
            onClick={handleSubmit}
            className="composer__send"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
