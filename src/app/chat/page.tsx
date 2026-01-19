"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";

export default function ChatPage() {
  const [text, setText] = useState("");

  const { messages, sendMessage, status } = useChat();
  const isLoading = status !== "ready";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setText("");
    await sendMessage({ text: trimmed });
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
            const content = m.content ?? m.text ?? "";
            if (!content) return null;

            return (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "user"
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
