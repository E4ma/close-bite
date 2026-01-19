import { createTextStreamResponse } from "ai";

export const runtime = "edge";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const lastUserMessage =
    messages?.filter((m: any) => m.role === "user")?.at(-1)?.content ??
    messages?.filter((m: any) => m.role === "user")?.at(-1)?.text ??
    "";

  // ✅ Make this a ReadableStream<string>
  const textStream = new ReadableStream<string>({
    async start(controller) {
      const text =
        `Got it. I’ll keep this simple.\n\n` +
        `You said: "${lastUserMessage}".\n\n` +
        `If you share your location, I can suggest 3 nearby food options and whether to walk or drive.\n\n` +
        `Next step: I’ll return a calm summary card with distances and food you might like.`;

      for (const word of text.split(" ")) {
        controller.enqueue(word + " ");
        await sleep(35);
      }

      controller.close();
    },
  });

  // ✅ Correct call signature for your installed version
  return createTextStreamResponse({ textStream });
}
