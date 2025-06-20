import React from "react";

const LoadingMessage: React.FC = () => {
  return (
    <div className="max-w-[85%] md:max-w-[75%]">
      {/* Assistant label */}
      <div className="text-xs font-medium text-gray-500 mb-1 px-1">
        Financial Co-Pilot
      </div>
      
      {/* Loading bubble */}
      <div className="bg-gray-100 border border-gray-200 text-gray-900 rounded-2xl rounded-tl-lg px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
};

export default LoadingMessage;
