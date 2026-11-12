import { chatCompletions } from "@/lib/server/gateway/chat/chat-completions";

// OpenAI-compatible chat completions, streaming included (PRD gateway-api §6, §7, §8). Never cached (POST).
export async function POST(request: Request) {
  return chatCompletions(request);
}
