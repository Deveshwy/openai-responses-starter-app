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

  // Custom functions (currently disabled, can be enabled for financial calculations)
  functionsEnabled: false,

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
    /analyze.*complex/i,
    /explain\s+(why|how).*detail/i,
    /compare.*multiple/i,
    /strategy.*develop/i,
    /plan.*multi[- ]?step/i,
    /calculate.*complex/i,
    /evaluate.*thoroughly/i,
    /assess.*comprehensive/i,
    /multi[- ]?step.*process/i,
    /complex.*reasoning/i,
    /deep.*analysis/i,
    /think\s+through.*step/i,
    /break.*down.*analyze/i,
    /comprehensive.*review/i,
    /detailed.*explanation/i
  ],
  
  // Default models - GPT-4.1 as default, O3 for deep reasoning
  defaultModel: "gpt-4.1", // GPT-4.1 for fast responses
  reasoningModel: "o3", // O3 for deep reasoning tasks
  
  // Model selection logic
  selectModel: (query: string): string => {
    // Check if query needs deep reasoning
    const needsReasoning = modelConfig.deepReasoningPatterns.some(
      pattern => pattern.test(query)
    );
    
    return needsReasoning ? modelConfig.reasoningModel : modelConfig.defaultModel;
  }
};