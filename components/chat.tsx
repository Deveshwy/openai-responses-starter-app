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
import { Paperclip, X, ArrowUp, Zap, Search, Globe, Square } from "lucide-react";

interface ChatProps {
  items: Item[];
  onSendMessage: (message: string, files?: any[], modelPreference?: 'fast' | 'reasoning') => void;
  onApprovalResponse: (approve: boolean, id: string) => void;
}

const Chat: React.FC<ChatProps> = ({
  items,
  onSendMessage,
  onApprovalResponse,
}) => {
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputMessageText, setinputMessageText] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  // This state is used to provide better user experience for non-English IMEs such as Japanese
  const [isComposing, setIsComposing] = useState(false);
  const [useReasoningModel, setUseReasoningModel] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const { isAssistantLoading, isStreaming, stopStreaming } = useConversationStore();

  const scrollToBottom = () => {
    itemsEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  // Auto-resize textarea
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
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
        onSendMessage(
          messageContent || "Please analyze the attached files.", 
          uploadedFiles,
          useReasoningModel ? 'reasoning' : 'fast'
        );
      }
      
      setinputMessageText("");
      setAttachedFiles([]);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
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

  useEffect(() => {
    // Auto-resize on value change
    if (textareaRef.current) {
      autoResize(textareaRef.current);
    }
  }, [inputMessageText]);

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
          
          {/* Input Container */}
          <div className="relative">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Main Input Field with Controls */}
            <div className="relative border border-gray-200 rounded-2xl bg-white focus-within:ring-2 focus-within:ring-black focus-within:border-transparent">
              <div className="flex items-center px-4 py-3 gap-3">
                {/* File Upload Icon */}
                <button
                  onClick={handleAttachmentClick}
                  className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Attach file"
                >
                  <Paperclip size={20} />
                </button>
                
                {/* Text Input */}
                <textarea
                  ref={textareaRef}
                  id="prompt-textarea"
                  tabIndex={0}
                  dir="auto"
                  rows={1}
                  placeholder="Ask about investments, financial planning, tax strategies..."
                  className="flex-1 resize-none bg-transparent border-none outline-none placeholder-gray-400 min-h-[24px] max-h-[200px] overflow-y-auto"
                  value={inputMessageText}
                  onChange={(e) => {
                    setinputMessageText(e.target.value);
                    autoResize(e.target);
                  }}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  style={{ height: 'auto' }}
                />
                
                {/* Controls Group */}
                <div className="flex items-center gap-2">
                  {/* Fast/Reasoning Model Toggle */}
                  <button
                    onClick={() => setUseReasoningModel(!useReasoningModel)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                      useReasoningModel 
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={useReasoningModel ? "Using reasoning model" : "Using fast model"}
                  >
                    <Zap size={14} />
                    {useReasoningModel ? 'Thinking' : 'Fast'}
                  </button>
                  
                  {/* Web Search Toggle */}
                  <button
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      webSearchEnabled 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={webSearchEnabled ? "Web search enabled" : "Web search disabled"}
                  >
                    <Globe size={16} />
                  </button>
                  
                  {/* Send/Stop Button */}
                  {isStreaming ? (
                    <button
                      data-testid="stop-button"
                      className="flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      onClick={stopStreaming}
                      title="Stop generation"
                    >
                      <Square size={14} />
                    </button>
                  ) : (
                    <button
                      disabled={!inputMessageText.trim() && attachedFiles.length === 0}
                      data-testid="send-button"
                      className="flex items-center justify-center w-8 h-8 bg-black text-white rounded-full hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      onClick={handleSend}
                    >
                      <ArrowUp size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
