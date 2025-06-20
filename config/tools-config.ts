// Server-side tool configuration
// All tools are enabled by default for the financial co-pilot

export const toolsConfig = {
  // Web search for real-time information
  webSearchEnabled: true,
  webSearchConfig: {
    // No user location by default
    user_location: undefined
  },

  // File search for course materials
  fileSearchEnabled: true,
  vectorStoreId: process.env.VECTOR_STORE_ID || "", // Set this in .env

  // Code interpreter for calculations
  codeInterpreterEnabled: true,

  // Custom functions (weather and joke examples)
  functionsEnabled: true,

  // MCP is disabled by default
  mcpEnabled: false,
  mcpConfig: {
    server_label: "",
    server_url: "",
    allowed_tools: "",
    skip_approval: true
  }
};

// Model routing configuration
export const modelConfig = {
  // Keywords that trigger deep reasoning model (O3)
  deepReasoningPatterns: [
    /analyze/i,
    /explain\s+why/i,
    /compare/i,
    /strategy/i,
    /plan/i,
    /calculate/i,
    /evaluate/i,
    /assess/i,
    /multi[- ]?step/i,
    /complex/i,
    /reasoning/i,
    /think\s+through/i
  ],
  
  // Default models
  defaultModel: "gpt-4o-mini", // Fast responses
  reasoningModel: "o3-mini", // Deep reasoning (when available)
  
  // Fallback to available model
  useAvailableModel: true
};