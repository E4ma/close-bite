"use client";

import { useRef, useState } from "react";

/**
 * A tiny helper to make ids (good enough for a demo).
 * In real apps you might use crypto.randomUUID().
 */
function makeId() {
  return Math.random().toString(36).slice(2);
}

export default function ChatPage() {
  // What the user is typing
  const [text, setText] = useState("");

  // Our chat history (user + assistant messages)
  const [messages, setMessages] = useState<
    { id: string; role: "user" | "assistant"; content: string }[]
  >([]);

  // Used to show "Thinking..." and disable the send button
  const [isLoading, setIsLoading] = useState(false);

  /**
   * AbortController lets us cancel an in-flight streaming response.
   * Optional, but nice for reliability.
   */
  const abortRef = useRef<AbortController | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setText("");

    // 1) Add the user message immediately
    const userMsg = { id: makeId(), role: "user" as const, content: trimmed };

    // IMPORTANT: compute nextMessages once to avoid stale state bugs
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    // 2) Create an empty assistant message we will stream into
    const assistantId = makeId();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    setIsLoading(true);

    // If there is an existing stream, cancel it before starting a new one
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      // 3) Call the API route
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      // 4) Read the response body as a stream
      if (!response.body) {
        throw new Error("No response body (stream missing).");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantText = "";

      // 5) Read chunks until the server closes the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert bytes -> text
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;

        // 6) Update the assistant message in React state
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantText } : m
          )
        );
      }
    } catch (err: any) {
      // If the user cancelled, don't treat it as a "real" error
      if (err?.name === "AbortError") return;

      console.error(err);

      // Show the error as an assistant message (simple UX)
      setMessages((prev) =>
        prev.map((m) =>
          m.role === "assistant" && m.content === ""
            ? { ...m, content: "Something went wrong. Try again." }
            : m
        )
      );
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

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={[
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-900",
                ].join(" ")}
              >
                {m.content}
              </div>
            </div>
          ))}

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
