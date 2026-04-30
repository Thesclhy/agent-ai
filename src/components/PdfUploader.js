import React from "react";
import axios from "axios"; // Import axios for HTTP requests
import { InboxOutlined } from "@ant-design/icons";
import { Button, message, Upload } from "antd";

const { Dragger } = Upload;

const DOMAIN = process.env.REACT_APP_DOMAIN;

const uploadToBackend = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await axios.post(`${DOMAIN}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    console.error("Error uploading file: ", error);
    return null;
  }
};

const PdfUploader = ({ onUploadSuccess }) => {
  const attributes = {
    name: "file",
    multiple: true,
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      const response = await uploadToBackend(file);
      if (response && response.status === 200) {
        onSuccess(response.data);
        if (onUploadSuccess) {
          onUploadSuccess(file.name);
        }
      } else {
        onError(new Error("Upload failed"));
      }
    },
    onChange(info) {
      const { status } = info.file;
      if (status === "done") {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <Dragger {...attributes} className="sidebar-uploader">
      <div className="sidebar-uploader__icon">
        <InboxOutlined />
      </div>
      <div className="sidebar-uploader__body">
        <p className="sidebar-uploader__title">Upload PDF</p>
        <p className="sidebar-uploader__hint">
          Drag a file here or click to choose a document.
        </p>
        <Button className="sidebar-uploader__button">Choose File</Button>
      </div>
    </Dragger>
  );
};

export default PdfUploader;
