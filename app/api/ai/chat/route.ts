import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ ok: false, error: "No messages provided" }, { status: 400 });
    }

    const systemPrompt = `You are SkillForge AI, an expert assistant for a premium online learning platform. Help students find courses, suggest learning paths, answer programming questions, give study tips, and provide career advice. Be helpful, encouraging, and specific.`;

    const conversationText = messages
      .map((msg: { role: string; content: string }) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        return `${role}: ${msg.content}`;
      })
      .join("\n\n");

    const fullPrompt = `${systemPrompt}\n\nConversation:\n${conversationText}\n\nAssistant:`;

    // v1beta endpoint directly use করো
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return NextResponse.json(
        { ok: false, error: data.error?.message || "AI service error" },
        { status: 500 }
      );
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ ok: false, error: "Empty response" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: text });
  } catch (error: unknown) {
    console.error("AI error:", error);
    const errorMessage = error instanceof Error ? error.message : "AI service error";
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}