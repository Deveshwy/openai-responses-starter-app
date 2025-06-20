"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Message from "./message";
import Annotations from "./annotations";
import McpToolsList from "./mcp-tools-list";
import McpApproval from "./mcp-approval";
import ToolStatusIndicator from "./tool-status-indicator";
import { Item, McpApprovalRequestItem, ToolCallItem } from "@/lib/assistant";
import LoadingMessage from "./loading-message";
import useConversationStore from "@/stores/useConversationStore";
import { Paperclip, X } from "lucide-react";

interface ChatProps {
  items: Item[];
  onSendMessage: (message: string, files?: any[]) => void;
  onApprovalResponse: (approve: boolean, id: string) => void;
}

const Chat: React.FC<ChatProps> = ({
  items,
  onSendMessage,
  onApprovalResponse,
}) => {
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputMessageText, setinputMessageText] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  // This state is used to provide better user experience for non-English IMEs such as Japanese
  const [isComposing, setIsComposing] = useState(false);
  const { isAssistantLoading } = useConversationStore();

  const scrollToBottom = () => {
    itemsEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const handleFileRemove = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleSend = useCallback(async () => {
    if (!inputMessageText.trim() && attachedFiles.length === 0) return;
    
    try {
      let messageContent = inputMessageText.trim();
      let uploadedFiles = [];

      // Process files if any are attached
      if (attachedFiles.length > 0) {
        const filePromises = attachedFiles.map(async (file) => {
          const isImage = file.type.startsWith('image/');
          
          if (isImage) {
            // Convert image to base64 for vision model
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  type: 'image',
                  filename: file.name,
                  mimeType: file.type,
                  data: reader.result as string,
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          } else {
            // Upload non-image files to OpenAI
            const formData = new FormData();
            formData.append("file", file);
            
            const response = await fetch("/api/upload-file", {
              method: "POST",
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error(`Failed to upload ${file.name}`);
            }
            
            const uploadResult = await response.json();
            return {
              type: 'file',
              ...uploadResult,
            };
          }
        });

        uploadedFiles = await Promise.all(filePromises);
      }

      // Send message with or without files
      if (messageContent || uploadedFiles.length > 0) {
        const hasImages = uploadedFiles.some(file => file.type === 'image');
        if (hasImages) {
          // Show a brief notification that image conversations aren't saved
          console.log("Note: Conversations with images are not saved to prevent storage issues");
        }
        onSendMessage(messageContent || "Please analyze the attached files.", uploadedFiles);
      }
      
      setinputMessageText("");
      setAttachedFiles([]);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to upload files. Please try again.");
    }
  }, [inputMessageText, attachedFiles, onSendMessage]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey && !isComposing) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend, isComposing]
  );

  useEffect(() => {
    scrollToBottom();
  }, [items]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 md:px-10">
        <div className="max-w-4xl mx-auto py-6">
          <div className="space-y-2">
            {items.map((item, index) => (
              <React.Fragment key={index}>
                {item.type === "tool_call" ? (
                  // Show simplified tool status instead of full tool details
                  <div className="flex justify-start mb-2">
                    <ToolStatusIndicator toolCall={item as ToolCallItem} />
                  </div>
                ) : item.type === "message" ? (
                  <>
                    <Message message={item} />
                    {item.content &&
                      item.content[0].annotations &&
                      item.content[0].annotations.length > 0 && (
                        <div className="ml-4 mb-4">
                          <Annotations
                            annotations={item.content[0].annotations}
                          />
                        </div>
                      )}
                  </>
                ) : item.type === "mcp_list_tools" ? (
                  <div className="mb-4">
                    <McpToolsList item={item} />
                  </div>
                ) : item.type === "mcp_approval_request" ? (
                  <div className="mb-4">
                    <McpApproval
                      item={item as McpApprovalRequestItem}
                      onRespond={onApprovalResponse}
                    />
                  </div>
                ) : null}
              </React.Fragment>
            ))}
            {isAssistantLoading && (
              <div className="flex justify-start mb-4">
                <LoadingMessage />
              </div>
            )}
            <div ref={itemsEndRef} />
          </div>
        </div>
      </div>
      
      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto">
          {/* Attached Files Display */}
          {attachedFiles.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
                  >
                    <Paperclip size={14} className="text-gray-500" />
                    <span className="text-gray-700 truncate max-w-[200px]">
                      {file.name}
                    </span>
                    <button
                      onClick={() => handleFileRemove(index)}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Input Row */}
          <div className="flex items-end gap-2">
            {/* File Upload Button */}
            <button
              onClick={handleAttachmentClick}
              className="flex-shrink-0 p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              title="Attach file"
            >
              <Paperclip size={20} />
            </button>
            
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Text Input */}
            <div className="flex-1">
              <textarea
                id="prompt-textarea"
                tabIndex={0}
                dir="auto"
                rows={1}
                placeholder="Message..."
                className="w-full resize-none border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                value={inputMessageText}
                onChange={(e) => setinputMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
              />
            </div>
            
            {/* Send Button */}
            <button
              disabled={!inputMessageText.trim() && attachedFiles.length === 0}
              data-testid="send-button"
              className="flex-shrink-0 p-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              onClick={handleSend}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 32 32"
                className="transform rotate-45"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M15.192 8.906a1.143 1.143 0 0 1 1.616 0l5.143 5.143a1.143 1.143 0 0 1-1.616 1.616l-3.192-3.192v9.813a1.143 1.143 0 0 1-2.286 0v-9.813l-3.192 3.192a1.143 1.143 0 1 1-1.616-1.616z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
