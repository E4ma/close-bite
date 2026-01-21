"use client";

import { useState } from "react";

function getMessageText(m: any) {
  if (typeof m.content === "string") return m.content;
  if (typeof m.text === "string") return m.text;
  return "";
}

export default function ChatPage() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setText("");

    // Add user message
    const userMsg = { role: "user", id: Date.now().toString(), content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Fetch response from API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
        }),
      });

      if (!response.body) return;

      let assistantText = "";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;

        // Update assistant message in real-time
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, content: assistantText },
            ];
          }
          return [...prev, {
            role: "assistant",
            id: (Date.now() + 1).toString(),
            content: assistantText,
          }];
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-6">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">CloseBite</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Tell me what you’re in the mood for. I’ll keep it simple.
          </p>
        </header>

        <main className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-white p-4 shadow-sm">
          {messages.length === 0 ? (
            <div className="text-sm text-neutral-500">
              Try:{" "}
              <span className="font-medium">
                “I’m tired and hungry. Something healthy.”
              </span>
            </div>
          ) : null}

          {messages.map((m: any) => {
            const content = getMessageText(m);
            if (!content) return null;

            const isUser = m.role === "user";

            return (
              <div
                key={m.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    isUser
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-900",
                  ].join(" ")}
                >
                  {content}
                </div>
              </div>
            );
          })}


          {isLoading ? (
            <div className="text-xs text-neutral-500">Thinking…</div>
          ) : null}
        </main>

        <form onSubmit={onSubmit} className="mt-4 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='E.g. "not spicy, something light"'
            className="flex-1 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-neutral-400"
          />
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white shadow-sm disabled:opacity-50"
          >
            Send
          </button>
        </form>

        <p className="mt-3 text-xs text-neutral-500">
          Step 2: streaming UX first. We’ll wire OpenAI later.
        </p>
      </div>
    </div>
  );
}
