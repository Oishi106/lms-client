import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type BodyPayload = {
  message?: string;
  history?: ChatMessage[];
};

const LOCAL_FALLBACK_PREFIX =
  "I am running in fallback mode right now (no AI key configured), but I can still help with structured guidance.";

const buildFallbackReply = (message: string): string => {
  const text = message.trim();
  const lower = text.toLowerCase();

  if (!text) {
    return `${LOCAL_FALLBACK_PREFIX} Please type a clear question and I will help step by step.`;
  }

  if (/hello|hi|hey|assalamu|salam/.test(lower)) {
    return `${LOCAL_FALLBACK_PREFIX} Hi! Ask me anything: learning path, coding help, interview prep, career planning, or LMS usage.`;
  }

  if (/payment|checkout|pay|invoice/.test(lower)) {
    return `${LOCAL_FALLBACK_PREFIX} For payment issues: 1) verify checkout details, 2) confirm transaction status, 3) refresh enrollment state, 4) contact admin with order time and course id.`;
  }

  if (/course|learn|roadmap|skill/.test(lower)) {
    return `${LOCAL_FALLBACK_PREFIX} A practical roadmap: pick one goal, complete one beginner course, build one mini project, then move to intermediate topics with weekly revision.`;
  }

  if (/bug|error|fix|not work|issue/.test(lower)) {
    return `${LOCAL_FALLBACK_PREFIX} Debug flow: reproduce consistently, check browser console/network tab, isolate the component, inspect state/localStorage, then verify after each small fix.`;
  }

  if (/interview|cv|resume|job/.test(lower)) {
    return `${LOCAL_FALLBACK_PREFIX} Interview plan: 1) core concepts, 2) 2 portfolio projects, 3) mock interview practice, 4) tailored CV with measurable outcomes.`;
  }

  return `${LOCAL_FALLBACK_PREFIX} Here is a direct answer to your question:\n\n${text}\n\nSuggested approach: break this into requirements, choose the simplest valid solution first, test quickly, then refine.`;
};

const callGemini = async (prompt: string, history: ChatMessage[]) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const contextLines = history
    .slice(-8)
    .map((item) => `${item.role === "user" ? "User" : "Assistant"}: ${item.content}`)
    .join("\n");

  const finalPrompt = [
    "You are a helpful AI assistant on an LMS homepage.",
    "Answer clearly, safely, and concisely.",
    contextLines ? `Conversation:\n${contextLines}` : "",
    `User: ${prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: finalPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 600,
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n").trim();
  return text || null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BodyPayload;
    const message = body.message?.trim() || "";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const aiReply = await callGemini(message, history);
    if (aiReply) {
      return NextResponse.json({ reply: aiReply, mode: "gemini" });
    }

    return NextResponse.json({ reply: buildFallbackReply(message), mode: "fallback" });
  } catch {
    return NextResponse.json(
      { reply: "I am having trouble right now. Please try again in a moment.", mode: "error" },
      { status: 200 }
    );
  }
}
