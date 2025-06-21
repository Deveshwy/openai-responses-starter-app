import { MessageItem } from "@/lib/assistant";
import React from "react";
import ReactMarkdown from "react-markdown";
import { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface MessageProps {
  message: MessageItem;
}

// Custom markdown components for better styling including tables
const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  h1: ({ children }) => <h1 className="text-xl font-semibold mb-3 text-gray-900">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-gray-900">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-gray-900">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc list-outside ml-6 mb-4 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
  code: ({ children, className }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className="block bg-gray-100 text-gray-800 p-3 rounded-lg text-sm font-mono overflow-x-auto">
        {children}
      </code>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 mb-3">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  // Enhanced table support
  table: ({ children }) => (
    <div className="overflow-x-auto mb-6 shadow-sm rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gray-50">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="bg-white divide-y divide-gray-200">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-100">
      <div className="break-words">
        {children}
      </div>
    </td>
  ),
  // Enhanced code blocks with syntax highlighting
  pre: ({ children }) => (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-4">
      {children}
    </pre>
  ),
  // Task lists
  input: ({ checked, ...props }) => (
    <input
      type="checkbox"
      checked={checked}
      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      readOnly
      {...props}
    />
  ),
};

const Message: React.FC<MessageProps> = ({ message }) => {
  const textContent = message.content.find(c => c.type === "input_text" || c.type === "output_text");
  const fileContent = message.content.filter(c => c.type === "input_file");
  const imageContent = message.content.filter(c => c.type === "input_image");
  const messageText = textContent?.text as string;

  return (
    <div className="w-full">
      {message.role === "user" ? (
        // User message - right aligned with blue bubble
        <div className="flex justify-end mb-4">
          <div className="max-w-[75%] md:max-w-[60%]">
            <div className="bg-blue-500 text-white rounded-2xl rounded-tr-lg px-4 py-3 shadow-sm">
              <div className="text-[15px] leading-relaxed">
                {messageText && (
                  <ReactMarkdown 
                    components={markdownComponents}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {messageText}
                  </ReactMarkdown>
                )}
                
                {/* Show attached images */}
                {imageContent.length > 0 && (
                  <div className="mt-2">
                    {imageContent.map((image, index) => (
                      <img
                        key={index}
                        src={`data:${(image as any).source?.media_type};base64,${(image as any).source?.data}`}
                        alt="Uploaded image"
                        className="max-w-full h-auto rounded-lg mt-1"
                        style={{ maxHeight: '200px' }}
                      />
                    ))}
                  </div>
                )}
                
                {/* Show attached files */}
                {fileContent.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-blue-400">
                    <div className="text-xs text-blue-100 mb-1">Attached files:</div>
                    {fileContent.map((file, index) => (
                      <div key={index} className="text-xs text-blue-100">
                        📎 File uploaded (ID: {(file as any).file_id?.slice(0, 10)}...)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Assistant message - left aligned with gray bubble
        <div className="flex justify-start mb-4">
          <div className="max-w-[85%] md:max-w-[75%]">
            {/* Assistant label */}
            <div className="text-xs font-medium text-gray-500 mb-1 px-1">
              Financial Co-Pilot
            </div>
            
            {/* Message bubble */}
            <div className="bg-gray-100 border border-gray-200 text-gray-900 rounded-2xl rounded-tl-lg px-4 py-3 shadow-sm">
              <div className="text-[15px] leading-relaxed">
                <ReactMarkdown 
                  components={markdownComponents}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {messageText}
                </ReactMarkdown>
                
                {/* Handle image annotations */}
                {message.content[0].annotations &&
                  message.content[0].annotations
                    .filter(
                      (a) =>
                        a.type === "container_file_citation" &&
                        a.filename &&
                        /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(a.filename)
                    )
                    .map((a, i) => (
                      <img
                        key={i}
                        src={`/api/container_files/content?file_id=${a.fileId}${a.containerId ? `&container_id=${a.containerId}` : ""}${a.filename ? `&filename=${encodeURIComponent(a.filename)}` : ""}`}
                        alt={a.filename || ""}
                        className="mt-3 max-w-full rounded-lg border border-gray-200"
                      />
                    ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;
