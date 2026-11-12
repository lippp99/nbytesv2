import { playgroundChat } from "@/lib/server/gateway/chat/playground-chat";

// Dashboard Playground: chat as the signed-in user, streamed, charged to the balance (PRD dashboard-playground §5.1).
export async function POST(request: Request) {
  return playgroundChat(request);
}
