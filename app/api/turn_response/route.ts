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
    
    // Check if any message contains images
    const hasImages = messages.some((msg: any) => 
      Array.isArray(msg.content) && msg.content.some((item: any) => item.type === "input_image")
    );

    if (hasImages) {
      // Use Chat Completions API for vision capabilities
      const chatMessages = messages.map((msg: any) => {
        if (Array.isArray(msg.content)) {
          const content = msg.content.map((item: any) => {
            if (item.type === "input_text") {
              return { type: "text", text: item.text };
            } else if (item.type === "input_image") {
              return {
                type: "image_url",
                image_url: {
                  url: `data:${item.source.media_type};base64,${item.source.data}`
                }
              };
            }
            return item;
          });
          return { role: msg.role, content };
        }
        return msg;
      });

      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: chatMessages,
        stream: true,
      });

      // Convert chat completion stream to responses format
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send start event
            const startData = JSON.stringify({
              event: "response.created",
              data: { id: "vision_response" },
            });
            controller.enqueue(`data: ${startData}\n\n`);

            for await (const chunk of completion) {
              const delta = chunk.choices[0]?.delta?.content || "";
              if (delta) {
                const data = JSON.stringify({
                  event: "response.output_text.delta",
                  data: { delta, item_id: "vision_response" },
                });
                controller.enqueue(`data: ${data}\n\n`);
              }
              
              // Check if this is the last chunk
              if (chunk.choices[0]?.finish_reason) {
                const endData = JSON.stringify({
                  event: "response.completed",
                  data: { 
                    response: {
                      id: "vision_response",
                      output: [{
                        id: "vision_response",
                        type: "message", 
                        role: "assistant",
                        status: "completed"
                      }]
                    }
                  },
                });
                controller.enqueue(`data: ${endData}\n\n`);
              }
            }
            controller.close();
          } catch (error) {
            console.error("Error in vision streaming loop:", error);
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Use Responses API for non-vision requests
    const selectedModel = MODEL;

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
