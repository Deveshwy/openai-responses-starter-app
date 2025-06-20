"use client";

import React from "react";
import { Plus, MessageSquare, Search } from "lucide-react";
import useConversationStore from "@/stores/useConversationStore";

export default function ConversationSidebar() {
  const { 
    conversations, 
    activeConversationId, 
    createNewConversation, 
    switchConversation 
  } = useConversationStore();
  
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleNewChat = () => {
    createNewConversation();
  };

  // Filter conversations based on search query
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(query) ||
      conv.preview.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  // Group conversations by date
  const groupedConversations = React.useMemo(() => {
    const groups: { [key: string]: typeof conversations } = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      "Previous 30 Days": [],
      Older: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    filteredConversations.forEach(conv => {
      const convDate = new Date(conv.updatedAt);
      if (convDate >= today) {
        groups.Today.push(conv);
      } else if (convDate >= yesterday) {
        groups.Yesterday.push(conv);
      } else if (convDate >= weekAgo) {
        groups["Previous 7 Days"].push(conv);
      } else if (convDate >= monthAgo) {
        groups["Previous 30 Days"].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    return groups;
  }, [filteredConversations]);

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search Conversations */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
          />
        </div>
        {searchQuery && (
          <div className="mt-2 text-xs text-gray-500 px-1">
            {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2">
        {Object.entries(groupedConversations).map(([groupName, groupConvs]) => {
          if (groupConvs.length === 0) return null;
          
          return (
            <div key={groupName} className="mb-4">
              <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                {groupName}
              </h3>
              {groupConvs.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => switchConversation(conversation.id)}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors
                    ${activeConversationId === conversation.id 
                      ? 'bg-gray-100' 
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare size={16} className="mt-0.5 flex-shrink-0 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate text-gray-800">
                        {conversation.title || "New conversation"}
                      </p>
                      {conversation.preview && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {conversation.preview}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          );
        })}

        {conversations.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare size={48} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start a new chat to begin</p>
          </div>
        )}
      </div>

      {/* User Section (Future) */}
      <div className="border-t border-gray-200 p-4">
        <div className="text-sm text-gray-500 text-center">
          Financial Co-Pilot
        </div>
      </div>
    </div>
  );
}