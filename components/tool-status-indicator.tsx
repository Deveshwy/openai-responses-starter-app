"use client";

import React from "react";
import { Search, FileText, Code, Zap } from "lucide-react";
import { ToolCallItem } from "@/lib/assistant";

interface ToolStatusIndicatorProps {
  toolCall: ToolCallItem;
}

export default function ToolStatusIndicator({ toolCall }: ToolStatusIndicatorProps) {
  const getStatusMessage = () => {
    switch (toolCall.tool_type) {
      case "web_search_call":
        if (toolCall.status === "searching") {
          return "Searching the web for relevant information...";
        }
        return "Web search";
      
      case "file_search_call":
        if (toolCall.status === "in_progress") {
          return "Searching course materials...";
        }
        return "File search";
      
      case "code_interpreter_call":
        if (toolCall.status === "in_progress") {
          return "Running calculations...";
        }
        return "Code execution";
      
      case "function_call":
        if (toolCall.status === "in_progress") {
          if (toolCall.name === "get_weather") {
            return "Fetching weather data...";
          }
          return `Calling ${toolCall.name}...`;
        }
        return toolCall.name || "Function call";
      
      default:
        return "Processing...";
    }
  };

  const getIcon = () => {
    switch (toolCall.tool_type) {
      case "web_search_call":
        return <Search className="animate-pulse" size={16} />;
      case "file_search_call":
        return <FileText className="animate-pulse" size={16} />;
      case "code_interpreter_call":
        return <Code className="animate-pulse" size={16} />;
      case "function_call":
        return <Zap className="animate-pulse" size={16} />;
      default:
        return null;
    }
  };

  if (toolCall.status === "completed") {
    return null; // Don't show status for completed tools
  }

  return (
    <div className="max-w-[85%] md:max-w-[75%]">
      {/* Tool status bubble */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl rounded-tl-lg px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          {getIcon()}
          <span className="italic">{getStatusMessage()}</span>
          {toolCall.status === "in_progress" && (
            <div className="flex gap-1 ml-1">
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}