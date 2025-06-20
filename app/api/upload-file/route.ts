import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const openai = new OpenAI();

    // Upload file to OpenAI
    const uploadedFile = await openai.files.create({
      file: file,
      purpose: "user_data",
    });

    return NextResponse.json({
      fileId: uploadedFile.id,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}