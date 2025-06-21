"use client";
import React from "react";
import Chat from "./chat";
import useConversationStore from "@/stores/useConversationStore";
import { Item, processMessages } from "@/lib/assistant";

export default function Assistant() {
  const {
    chatMessages,
    addConversationItem,
    addChatMessage,
    setAssistantLoading,
  } = useConversationStore();

  const handleSendMessage = async (
    message: string,
    files?: any[],
    modelPreference?: 'fast' | 'reasoning' | 'search'
  ) => {
    if (!message.trim() && (!files || files.length === 0)) return;

    // Create content array that includes text and files
    const content: any[] = [];
    
    if (message.trim()) {
      content.push({ type: "input_text", text: message.trim() });
    }
    
    // Add files to content if any
    if (files && files.length > 0) {
      files.forEach(file => {
        if (file.type === 'image') {
          // Handle images as base64 data URLs
          content.push({
            type: "input_image",
            source: {
              type: "base64",
              media_type: file.mimeType,
              data: file.data.split(',')[1], // Remove data:image/...;base64, prefix
            },
          });
        } else if (file.type === 'file') {
          // Handle regular files uploaded to OpenAI
          content.push({
            type: "input_file",
            file_id: file.fileId,
          });
        }
      });
    }

    const userItem: Item = {
      type: "message",
      role: "user",
      content,
    };
    
    const userMessage: any = {
      role: "user",
      content,
    };

    try {
      setAssistantLoading(true);
      addConversationItem(userMessage);
      addChatMessage(userItem);
      await processMessages(modelPreference);
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  const handleApprovalResponse = async (
    approve: boolean,
    id: string
  ) => {
    const approvalItem = {
      type: "mcp_approval_response",
      approve,
      approval_request_id: id,
    } as any;
    try {
      addConversationItem(approvalItem);
      await processMessages();
    } catch (error) {
      console.error("Error sending approval response:", error);
    }
  };

  return (
    <div className="h-full w-full bg-white">
      <Chat
        items={chatMessages}
        onSendMessage={handleSendMessage}
        onApprovalResponse={handleApprovalResponse}
      />
    </div>
  );
}
