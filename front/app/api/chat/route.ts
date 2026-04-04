import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 30; 

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const lastMessage = messages[messages.length - 1].content;
    
    let history = [];
    history.push({
      role: 'user',
      parts: [{ text: `SYSTEM INSTRUCTIONS:
1. MATCH LANGUAGE: Answer in the same language as the user.
2. VERY CONCISE: Provide exactly 1 short introductory sentence, followed by 2 or 3 short bullet points. Do not exceed this length.
3. MANDATORY LINKS: If you tell the user to go to a page or mention a module, you MUST use one of these EXACT markdown links in your sentence:
- [Projects](/admin/projects)
- [Workflows](/admin/workflows)
- [Forms](/admin/form)
- [Tasks](/user/tasks)
Example: "To get started, navigate to [Projects](/admin/projects)."` }]
    });
    history.push({
      role: 'model',
      parts: [{ text: "Understood. I will answer in the correct language, provide helpful step-by-step details, and I will strictly use the exact markdown formats like [Projects](/admin/projects)." }]
    });

    const userHistory = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || '' }]
    }));

    const chat = model.startChat({ history: [...history, ...userHistory] });
    const resultStream = await chat.sendMessageStream(lastMessage);
    
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of resultStream.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(new TextEncoder().encode(chunkText));
            }
          }
          controller.close();
        } catch(e) {
          console.error("Stream parsing error:", e);
          controller.error(e);
        }
      }
    });

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } catch (error: any) {
    console.error("Erreur API Chatbot:", error);
    return new Response(error.message, { status: 500 });
  }
}
