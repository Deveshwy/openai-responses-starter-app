"use client";
import Assistant from "@/components/assistant";
import ConversationSidebar from "@/components/conversation-sidebar";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import useConversationStore from "@/stores/useConversationStore";

export default function Main() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { conversations, createNewConversation } = useConversationStore();

  useEffect(() => {
    setIsHydrated(true);
    // Ensure we have at least one conversation after hydration
    if (conversations.length === 0) {
      createNewConversation();
    }
  }, [conversations.length, createNewConversation]);

  if (!isHydrated) {
    return (
      <div className="h-screen w-full flex bg-gray-50">
        <div className="w-[260px] bg-white border-r border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        </div>
        <div className="flex-1 bg-white">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-[260px] flex-shrink-0 bg-white border-r border-gray-200">
        <ConversationSidebar />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 min-w-0">
        <Assistant />
      </div>
      
      {/* Mobile Menu Button */}
      <div className="absolute top-4 left-4 md:hidden">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-[280px] bg-white h-full shadow-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-semibold">Conversations</h2>
              <button 
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors" 
                onClick={() => setIsSidebarOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <ConversationSidebar />
          </div>
          <div 
            className="flex-1 bg-black bg-opacity-30" 
            onClick={() => setIsSidebarOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
