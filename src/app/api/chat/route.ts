export const runtime = "nodejs";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const lastUser =
    messages?.filter((m: any) => m.role === "user")?.at(-1)?.content ??
    messages?.filter((m: any) => m.role === "user")?.at(-1)?.text ??
    "";

  const fullText =
    `Got it. I’ll keep this simple.\n\n` +
    `You said: "${lastUser}".\n\n` +
    `If you share your location, I can suggest 3 nearby food options.\n\n` +
    `Next step: I’ll return a calm summary card.`;

  const stream = new ReadableStream({
    async start(controller) {
      for (const word of fullText.split(" ")) {
        controller.enqueue(new TextEncoder().encode(word + " "));
        await sleep(35);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
