import { modelConfig } from "@/config/tools-config";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Intelligent model selection based on query
function selectModel(messages: any[]): string {
  // Get the last user message
  const lastUserMessage = messages
    .slice()
    .reverse()
    .find((m: any) => m.role === "user");
  
  if (!lastUserMessage) {
    return modelConfig.defaultModel;
  }

  const query = typeof lastUserMessage.content === "string" 
    ? lastUserMessage.content 
    : lastUserMessage.content?.[0]?.text || "";

  // Use the model selection logic from config
  const selectedModel = modelConfig.selectModel(query);
  
  if (selectedModel === modelConfig.reasoningModel) {
    console.log("Using O3 model for query:", query.substring(0, 50) + "...");
  } else {
    console.log("Using GPT-4.1 model for query:", query.substring(0, 50) + "...");
  }
  
  return selectedModel;
}

export async function POST(request: Request) {
  try {
    const { messages, tools, modelPreference } = await request.json();
    console.log("Received messages:", JSON.stringify(messages, null, 2));
    console.log("Model preference received:", modelPreference);
    console.log("Tools:", tools?.length || 0, "tools available");

    const openai = new OpenAI();
    
    // No need to separate image handling - Responses API supports images natively

    // Use Responses API for both models
    // Select model based on toggle preference or automatic detection
    let selectedModel: string;
    
    if (modelPreference === 'reasoning') {
      selectedModel = 'o3'; // Force O3 when thinking toggle is on
      console.log("Using O3 model (reasoning toggle enabled)");
    } else if (modelPreference === 'fast') {
      selectedModel = 'gpt-4.1'; // Force GPT-4.1 when fast toggle is on
      console.log("Using GPT-4.1 model (fast toggle enabled)");
    } else if (modelPreference === 'search') {
      selectedModel = 'sonar-small-online'; // Use Perplexity Sonar when web search toggle is on
      console.log("Using Perplexity Sonar model (web search enabled)");
    } else {
      // Automatic selection when no toggle preference is set
      selectedModel = selectModel(messages);
    }

    // Format messages for Responses API (supports both text and images)
    const cleanMessages = messages
      .map((msg: any) => {
        if (Array.isArray(msg.content)) {
          const cleanContent = msg.content
            .map((item: any) => {
              // Handle text content
              if (item.type === "input_text" || item.type === "output_text") {
                return {
                  type: item.type,
                  text: item.text || ""
                };
              }
              
              // Handle image content - convert to Responses API format
              if (item.type === "input_image" && item.source) {
                return {
                  type: "input_image",
                  image_url: `data:${item.source.media_type};base64,${item.source.data}`
                };
              }
              
              // Return other valid content as-is
              return item;
            })
            .filter((item: any) => item !== null);
          
          // Only return message if it has content
          if (cleanContent.length > 0) {
            return {
              role: msg.role,
              content: cleanContent
            };
          }
          return null;
        }
        
        // Handle string content
        if (typeof msg.content === "string") {
          return {
            role: msg.role,
            content: msg.content
          };
        }
        
        return null;
      })
      .filter((msg: any) => msg !== null); // Remove null entries

    // Ensure we have valid messages
    if (cleanMessages.length === 0) {
      console.error("No valid messages after cleaning");
      return NextResponse.json({ error: "No valid messages" }, { status: 400 });
    }

    // Create request parameters based on model type
    const requestParams: any = {
      model: selectedModel,
      input: cleanMessages,
      stream: true,
      parallel_tool_calls: false,
    };

    // Only add tools if they exist and are not empty
    if (tools && tools.length > 0) {
      requestParams.tools = tools;
    }

    // Add reasoning parameter for O3 models
    if (selectedModel === 'o3' || selectedModel === 'o3-mini') {
      requestParams.reasoning = { effort: "medium" };
      console.log("Adding reasoning parameter for O3 model");
    }

    let events;
    try {
      console.log("Sending to Responses API with params:", JSON.stringify({
        ...requestParams,
        input: requestParams.input.slice(-2) // Only log last 2 messages to avoid clutter
      }, null, 2));
      
      events = await openai.responses.create(requestParams);
    } catch (error: any) {
      console.error("Error creating response:", error);
      console.error("Error details:", error.response?.data || error.message);
      console.error("Request params were:", JSON.stringify(requestParams, null, 2));
      throw error;
    }

    // Create a ReadableStream that emits SSE data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events) {
            // Sending all events to the client
            const data = JSON.stringify({
              event: event.type,
              data: event,
            });
            controller.enqueue(`data: ${data}\n\n`);
          }
          // End of stream
          controller.close();
        } catch (error) {
          console.error("Error in streaming loop:", error);
          controller.error(error);
        }
      },
    });

    // Return the ReadableStream as SSE
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
