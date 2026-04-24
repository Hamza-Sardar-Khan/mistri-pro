import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getInboxConversations } from "@/lib/actions/chat";
import InboxClient from "./InboxClient";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const conversations = await getInboxConversations();

  return (
    <InboxClient
      currentUserId={user.id}
      initialConversations={conversations as unknown as Parameters<typeof InboxClient>[0]["initialConversations"]}
    />
  );
}
