export const runtime = "nodejs";

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Return response in a format that useChat can parse
  // The AI SDK expects text chunks separated by newlines
  const text = `Got it. I'll keep this simple.\n\nIf you share your location, I can suggest 3 nearby food options and whether to walk or drive.\n\nNext step: I'll return a calm summary card with distances and food you might like.`;
  
  const textStream = new ReadableStream<string>({
    async start(controller) {
      // Send the full text as a single chunk
      controller.enqueue(text);
      controller.close();
    },
  });

  return new Response(textStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
