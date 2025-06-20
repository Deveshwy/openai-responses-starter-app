import { toolsList } from "../../config/tools-list";
import { toolsConfig } from "../../config/tools-config";

interface WebSearchTool {
  type: "web_search";
  user_location?: {
    type: "approximate";
    country?: string;
    city?: string;
    region?: string;
  };
}

export const getTools = () => {
  const tools = [];

  // Web Search Tool
  if (toolsConfig.webSearchEnabled) {
    const webSearchTool: WebSearchTool = {
      type: "web_search",
    };
    
    if (toolsConfig.webSearchConfig.user_location) {
      webSearchTool.user_location = toolsConfig.webSearchConfig.user_location;
    }

    tools.push(webSearchTool);
  }

  // File Search Tool
  if (toolsConfig.fileSearchEnabled && toolsConfig.vectorStoreId) {
    const fileSearchTool = {
      type: "file_search",
      vector_store_ids: [toolsConfig.vectorStoreId],
    };
    tools.push(fileSearchTool);
  }

  // Code Interpreter Tool
  if (toolsConfig.codeInterpreterEnabled) {
    tools.push({ 
      type: "code_interpreter", 
      container: { type: "auto" } 
    });
  }

  // Function Tools
  if (toolsConfig.functionsEnabled) {
    tools.push(
      ...toolsList.map((tool) => {
        return {
          type: "function",
          name: tool.name,
          description: tool.description,
          parameters: {
            type: "object",
            properties: { ...tool.parameters },
            required: Object.keys(tool.parameters),
            additionalProperties: false,
          },
          strict: true,
        };
      })
    );
  }

  // MCP Tools (if enabled)
  if (toolsConfig.mcpEnabled && toolsConfig.mcpConfig.server_url && toolsConfig.mcpConfig.server_label) {
    const mcpTool: any = {
      type: "mcp",
      server_label: toolsConfig.mcpConfig.server_label,
      server_url: toolsConfig.mcpConfig.server_url,
    };
    if (toolsConfig.mcpConfig.skip_approval) {
      mcpTool.require_approval = "never";
    }
    if (toolsConfig.mcpConfig.allowed_tools.trim()) {
      mcpTool.allowed_tools = toolsConfig.mcpConfig.allowed_tools
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
    }
    tools.push(mcpTool);
  }

  console.log("Active tools:", tools);

  return tools;
};
