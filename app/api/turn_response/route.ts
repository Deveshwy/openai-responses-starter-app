import { MODEL } from "@/config/constants";
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

  // Check if query matches deep reasoning patterns
  const needsDeepReasoning = modelConfig.deepReasoningPatterns.some(
    pattern => pattern.test(query)
  );

  if (needsDeepReasoning) {
    console.log("Using reasoning model for query:", query.substring(0, 50) + "...");
    // For now, use the default model until O3 is available
    // return modelConfig.reasoningModel;
    return MODEL; // Fallback to configured model
  }

  console.log("Using default model for query:", query.substring(0, 50) + "...");
  return modelConfig.defaultModel;
}

export async function POST(request: Request) {
  try {
    const { messages, tools } = await request.json();
    console.log("Received messages:", messages);

    const openai = new OpenAI();
    
    // Select model based on query
    const selectedModel = selectModel(messages);

    const events = await openai.responses.create({
      model: selectedModel,
      input: messages,
      tools,
      stream: true,
      parallel_tool_calls: false,
    });

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
