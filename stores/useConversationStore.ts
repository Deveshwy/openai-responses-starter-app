import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Item } from "@/lib/assistant";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { INITIAL_MESSAGE } from "@/config/constants";

interface Conversation {
  id: string;
  title: string;
  preview: string;
  createdAt: Date;
  updatedAt: Date;
  chatMessages: Item[];
  conversationItems: any[];
}

interface ConversationState {
  // All conversations
  conversations: Conversation[];
  // Currently active conversation ID
  activeConversationId: string | null;
  // Whether we are waiting for the assistant response
  isAssistantLoading: boolean;
  // Current conversation data (computed)
  chatMessages: Item[];
  conversationItems: any[];

  // Conversation management
  createNewConversation: () => void;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;

  // Message operations (work on active conversation)
  setChatMessages: (items: Item[]) => void;
  setConversationItems: (messages: any[]) => void;
  addChatMessage: (item: Item) => void;
  addConversationItem: (message: ChatCompletionMessageParam) => void;
  setAssistantLoading: (loading: boolean) => void;
  rawSet: (state: any) => void;

  // Update conversation metadata
  updateConversationTitle: (id: string, title: string) => void;
  updateConversationPreview: (id: string, preview: string) => void;

  // Helper to get current conversation
  getCurrentConversation: () => Conversation | null;
  updateCurrentConversation: () => void;
}

const generateId = () => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createNewConversationObject = (): Conversation => ({
  id: generateId(),
  title: "",
  preview: "",
  createdAt: new Date(),
  updatedAt: new Date(),
  chatMessages: [
    {
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text: INITIAL_MESSAGE }],
    },
  ],
  conversationItems: [],
});

const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isAssistantLoading: false,

      // Computed properties for current conversation
      chatMessages: [],
      conversationItems: [],

      getCurrentConversation: () => {
        const state = get();
        return state.conversations.find(c => c.id === state.activeConversationId) || null;
      },

      updateCurrentConversation: () => {
        const state = get();
        const current = state.conversations.find(c => c.id === state.activeConversationId);
        set({
          chatMessages: current?.chatMessages || [],
          conversationItems: current?.conversationItems || [],
        });
      },

      createNewConversation: () => {
        const newConversation = createNewConversationObject();
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: newConversation.id,
          chatMessages: newConversation.chatMessages,
          conversationItems: newConversation.conversationItems,
        }));
      },

      switchConversation: (id) => {
        set((state) => {
          const conversation = state.conversations.find(c => c.id === id);
          return {
            activeConversationId: id,
            chatMessages: conversation?.chatMessages || [],
            conversationItems: conversation?.conversationItems || [],
          };
        });
      },

      deleteConversation: (id) => {
        set((state) => {
          const newConversations = state.conversations.filter(c => c.id !== id);
          const newActiveId = state.activeConversationId === id 
            ? (newConversations[0]?.id || null)
            : state.activeConversationId;
          
          return {
            conversations: newConversations,
            activeConversationId: newActiveId,
          };
        });
      },

      setChatMessages: (items) => {
        set((state) => ({
          chatMessages: items,
          conversations: state.conversations.map(conv =>
            conv.id === state.activeConversationId
              ? { ...conv, chatMessages: items, updatedAt: new Date() }
              : conv
          ),
        }));
      },

      setConversationItems: (messages) => {
        set((state) => ({
          conversationItems: messages,
          conversations: state.conversations.map(conv =>
            conv.id === state.activeConversationId
              ? { ...conv, conversationItems: messages, updatedAt: new Date() }
              : conv
          ),
        }));
      },

      addChatMessage: (item) => {
        set((state) => {
          const updatedMessages = [...state.chatMessages, item];
          return {
            chatMessages: updatedMessages,
            conversations: state.conversations.map(conv => {
              if (conv.id === state.activeConversationId) {
                // Auto-generate title from first user message if not set
                if (!conv.title && item.type === "message" && item.role === "user") {
                  const text = item.content[0]?.text || "";
                  const title = text.length > 50 ? text.substring(0, 50) + "..." : text;
                  return { 
                    ...conv, 
                    chatMessages: updatedMessages, 
                    title: title,
                    preview: text.substring(0, 100),
                    updatedAt: new Date() 
                  };
                }
                
                return { ...conv, chatMessages: updatedMessages, updatedAt: new Date() };
              }
              return conv;
            }),
          };
        });
      },

      addConversationItem: (message) => {
        set((state) => {
          const updatedItems = [...state.conversationItems, message];
          return {
            conversationItems: updatedItems,
            conversations: state.conversations.map(conv =>
              conv.id === state.activeConversationId
                ? { 
                    ...conv, 
                    conversationItems: updatedItems,
                    updatedAt: new Date() 
                  }
                : conv
            ),
          };
        });
      },

      setAssistantLoading: (loading) => set({ isAssistantLoading: loading }),
      
      rawSet: set,

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.id === id ? { ...conv, title } : conv
          ),
        }));
      },

      updateConversationPreview: (id, preview) => {
        set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.id === id ? { ...conv, preview } : conv
          ),
        }));
      },
    }),
    {
      name: "conversation-store",
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);

// Initialize with a default conversation if none exist
const state = useConversationStore.getState();
if (state.conversations.length === 0) {
  state.createNewConversation();
}

export default useConversationStore;
