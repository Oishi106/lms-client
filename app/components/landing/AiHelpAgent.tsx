"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STORAGE_KEY = "skillforge_home_ai_chat";

const defaultGreeting: UiMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I am SkillForge AI Assistant powered by Gemini. Ask me anything about learning paths, courses, coding, interview prep, or career advice! 🚀",
};

const getInitialMessages = (): UiMessage[] => {
  if (typeof window === "undefined") return [defaultGreeting];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [defaultGreeting];

  try {
    const parsed = JSON.parse(raw) as UiMessage[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [defaultGreeting];
    const normalized = parsed
      .filter((item) => item && (item.role === "user" || item.role === "assistant"))
      .map((item, index) => ({
        id: item.id || `m-${index + 1}`,
        role: item.role,
        content: String(item.content || "").trim(),
      }))
      .filter((item) => item.content);

    return normalized.length ? normalized.slice(-20) : [defaultGreeting];
  } catch {
    return [defaultGreeting];
  }
};

const SUGGESTIONS = [
  "What courses should I start with?",
  "How do I become a web developer?",
  "Give me a Python learning roadmap",
  "How to prepare for interviews?",
  "What is the best way to learn React?",
];

export default function AiHelpAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>(getInitialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
  }, [messages]);

  const requestPayloadHistory = useMemo(
    () => messages.slice(-8).map((item) => ({ role: item.role, content: item.content })),
    [messages]
  );

  const sendMessage = async (overrideText?: string) => {
    const question = (overrideText ?? input).trim();
    if (!question || loading) return;

    const userMessage: UiMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...requestPayloadHistory, { role: "user", content: question }],
        }),
      });

      const data = (await response.json()) as { ok: boolean; message?: string; error?: string };
      const reply = data.message?.trim() || "I could not generate a response. Please try again.";

      const assistantMessage: UiMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "Network error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([defaultGreeting]);
  };

  const showSuggestions = messages.length <= 1;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open AI Help"
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          width: 58,
          height: 58,
          borderRadius: "50%",
          border: "1px solid var(--border-default)",
          background: "linear-gradient(135deg, var(--gold), #f59e0b)",
          color: "#111827",
          fontSize: 24,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 14px 34px rgba(245, 158, 11, 0.35)",
          zIndex: 2001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isOpen ? "✕" : "AI"}
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            right: 20,
            top: 84,
            bottom: 88,
            width: "min(420px, calc(100vw - 24px))",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: 14,
            boxShadow: "0 20px 44px rgba(0, 0, 0, 0.35)",
            display: "flex",
            flexDirection: "column",
            zIndex: 2001,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--border-default)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(90deg, var(--gold-dim), rgba(245, 158, 11, 0.08))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 20 }}>✨</div>
              <div>
                <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: 14 }}>
                  SkillForge AI
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>
                  Powered by Google Gemini
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={clearChat}
              style={{
                background: "transparent",
                border: "1px solid var(--border-default)",
                borderRadius: 8,
                color: "var(--text-secondary)",
                fontSize: 12,
                padding: "5px 9px",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {messages.map((item) => (
              <div
                key={item.id}
                style={{
                  alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  borderRadius: 10,
                  padding: "9px 12px",
                  fontSize: 13,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  background: item.role === "user" ? "var(--gold)" : "var(--bg-card-alt)",
                  color: item.role === "user" ? "var(--text-inverse)" : "var(--text-primary)",
                  border: item.role === "user" ? "none" : "1px solid var(--border-default)",
                }}
              >
                {item.role === "assistant" && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", marginBottom: 4 }}>
                    SkillForge AI ✨
                  </div>
                )}
                {item.content}
              </div>
            ))}

            {/* Suggestions */}
            {showSuggestions && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>
                  Try asking:
                </div>
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border-default)",
                      borderRadius: 8,
                      padding: "7px 10px",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--gold-dim)";
                      e.currentTarget.style.color = "var(--gold)";
                      e.currentTarget.style.borderColor = "var(--gold)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-secondary)";
                      e.currentTarget.style.borderColor = "var(--border-default)";
                    }}
                  >
                    💡 {suggestion}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  borderRadius: 10,
                  padding: "9px 12px",
                  fontSize: 13,
                  background: "var(--bg-card-alt)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-default)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ animation: "pulse 1s infinite" }}>✨</span> Thinking...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div
            style={{
              borderTop: "1px solid var(--border-default)",
              padding: 10,
              display: "flex",
              gap: 8,
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Ask anything about learning..."
              style={{
                flex: 1,
                borderRadius: 8,
                border: "1px solid var(--border-default)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                padding: "10px 11px",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={loading}
              style={{
                borderRadius: 8,
                border: "none",
                background: loading ? "var(--border-default)" : "var(--gold)",
                color: "var(--text-inverse)",
                fontSize: 13,
                fontWeight: 700,
                padding: "0 14px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}