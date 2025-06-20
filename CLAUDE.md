# Financial Co-Pilot Chatbot Project

## Project Overview

Transform the OpenAI Responses API starter app into a production-ready financial co-pilot chatbot for students of a paid online course. The chatbot will leverage OpenAI's Responses API with built-in tools for web search, file search, and code interpreter.

## Core Requirements

### User Access & Authentication (Deferred to Later Phase)
- Students purchase course → Zapier triggers user creation
- 12-month access from purchase date
- Email/magic link authentication via Clerk.com
- Access control enforcement

### Chat Features
- **Multiple conversations** - Users can have multiple saved chats
- **Conversation history** - Revisit and continue previous conversations
- **New chat creation** - Start fresh conversations anytime
- **Auto-save** - All messages saved automatically

### AI Capabilities
- **Web Search** - Live research for current information
- **File Search** - Search through course PDF materials
- **Code Interpreter** - Calculations and data analysis
- **Smart Model Routing**:
  - O3 model for deep reasoning/multi-step queries
  - GPT-4.1 for quick/factual answers

### UI/UX Requirements
- **Minimalist design** - Clean, professional interface
- **No visible tool configuration** - All tools work automatically based on context
- **Tool status indicators** - Show "Searching web...", "Running calculations..."
- **Responsive** - Works on desktop and mobile
- **Customizable branding** - Logo, colors, fonts

## Technical Architecture

### Current Stack
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Streaming**: Server-Sent Events (SSE)
- **API**: OpenAI Responses API

### Planned Additions (Later Phases)
- **Auth**: Clerk.com
- **Database**: Supabase
- **Deployment**: Vercel
- **Integrations**: Zapier webhooks

## Implementation Plan

### Phase 1: UI Transformation ✅ CURRENT FOCUS

#### 1.1 Remove Tools Panel
- Delete all tool configuration components
- Update main layout from 70/30 split to 20/80 (sidebar/chat)
- Clean up unused imports and dependencies

#### 1.2 Add Conversation Sidebar
- Create conversation list component
- Add new chat button
- Show conversation titles (auto-generated)
- Highlight active conversation

#### 1.3 Update Chat Interface
- Adjust width and responsive behavior
- Clean up styling for minimalist look
- Remove OpenAI branding

### Phase 2: Multi-Chat State Management

#### 2.1 Update Conversation Store
- Add conversations array with full history
- Add active conversation tracking
- Implement conversation switching
- Use localStorage for persistence initially

#### 2.2 Conversation Features
- Auto-generate titles from first message
- Create new conversations
- Delete conversations
- Search conversations (future)

### Phase 3: Backend Tool Integration

#### 3.1 Move Tools to Backend
- Create server-side tool configuration
- Remove frontend tool toggles
- Pre-configure vector store with course PDF
- All tools enabled by default

#### 3.2 Smart Tool Selection
- Tools activate based on query context
- No user configuration needed
- Implicit tool usage based on intent

### Phase 4: Enhanced Features

#### 4.1 Tool Status Indicators
- Show inline status messages during tool use
- Visual feedback for different tool types
- Progress indicators for long operations

#### 4.2 Model Routing Logic
- Implement intelligent model selection
- Route to O3 for complex reasoning
- Use GPT-4.1 for quick responses

### Phase 5: Polish & Branding

#### 5.1 UI Refinements
- Custom color scheme
- Professional typography
- Smooth animations
- Loading states

#### 5.2 Mobile Optimization
- Sliding sidebar for mobile
- Touch-friendly controls
- Responsive message display

## File Structure Changes

### Files to Remove
```
/components/tools-panel.tsx
/components/file-search-setup.tsx
/components/websearch-config.tsx
/components/functions-view.tsx
/components/mcp-config.tsx
/components/panel-config.tsx
/stores/useToolsStore.ts (after migrating needed parts)
```

### Files to Add
```
/components/conversation-sidebar.tsx
/components/conversation-item.tsx
/components/new-chat-button.tsx
/components/tool-status-indicator.tsx
/config/tools-config.ts
/lib/model-router.ts
```

### Files to Modify
```
/app/page.tsx - New layout
/components/chat.tsx - Adjust styling
/stores/useConversationStore.ts - Multi-chat support
/lib/assistant.ts - Add model routing
/app/api/turn_response/route.ts - Tool configuration
```

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow existing component patterns
- Keep components small and focused
- Use Tailwind for styling

### State Management
- Use Zustand stores for global state
- Keep conversation data structured
- Implement proper error handling
- Add loading states

### API Integration
- Maintain SSE streaming functionality
- Handle tool events properly
- Implement proper error boundaries
- Add retry logic for failures

### Testing Approach
- Test conversation switching
- Verify tool activation logic
- Check responsive behavior
- Validate model routing

## Future Enhancements (Not Current Scope)

1. **Authentication System**
   - Clerk.com integration
   - Protected routes
   - User profiles

2. **Database Persistence**
   - Supabase for conversation storage
   - User management
   - Access control

3. **Zapier Integration**
   - Webhook for user provisioning
   - Automated email sending
   - Expiry management

4. **Advanced Features**
   - Export conversations
   - Share conversations
   - Conversation templates
   - Analytics dashboard

## Success Metrics

1. **Clean Interface** - No visible tool configuration
2. **Multi-Chat Works** - Users can manage multiple conversations
3. **Smart Tools** - Tools activate automatically based on context
4. **Fast Responses** - Model routing improves speed
5. **Professional Look** - Suitable for paid course students

## Current Status

Starting with Phase 1: UI Transformation. The goal is to create a clean, professional chat interface with conversation management before adding authentication and database features.