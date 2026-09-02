/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { conversationsAPI } from "@/lib/api";
import { useConversationSocket, type ServerMessage } from "@/hooks/useSocket";

const getUserId = (user: any) => user?._id || user?.id;

const Messages = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(searchParams.get("conversationId") || null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => (conversation._id || conversation.id) === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const handleNewMessage = useCallback((message: ServerMessage) => {
    setMessages((current) => {
      const messageId = message._id || (message as any).id;
      if (current.some((m) => (m._id || m.id) === messageId)) {
        return current;
      }
      return [...current, message];
    });
    setConversations((current) =>
      current.map((conv) => {
        const convId = conv._id || conv.id;
        if (convId === message.conversationId) {
          return { ...conv, lastMessageAt: message.createdAt };
        }
        return conv;
      })
    );
  }, []);

  const { typingUser, sendTypingStart, sendTypingStop } = useConversationSocket(
    selectedConversationId,
    handleNewMessage
  );

  const loadConversations = useCallback(async () => {
    if (!user) {
      return;
    }

    const response = await conversationsAPI.getConversations();

    if (response.success && response.data?.conversations) {
      const nextConversations = response.data.conversations;
      setConversations(nextConversations);

      if (!selectedConversationId && nextConversations.length > 0) {
        const firstId = nextConversations[0]._id || nextConversations[0].id;
        setSelectedConversationId(firstId);
        setSearchParams({ conversationId: firstId });
      }
    }

    setLoading(false);
  }, [selectedConversationId, setSearchParams, user]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const response = await conversationsAPI.getMessages(conversationId);

    if (response.success && response.data?.messages) {
      setMessages(response.data.messages);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    loadMessages(selectedConversationId);
  }, [selectedConversationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSearchParams({ conversationId });
  };

  const handleSend = async () => {
    if (!selectedConversationId || !draft.trim()) {
      return;
    }

    setSending(true);

    try {
      const response = await conversationsAPI.sendMessage(selectedConversationId, {
        body: draft.trim(),
      });

      if (response.success && response.data?.message) {
        setMessages((currentMessages) => {
          const newMsg = response.data.message;
          const newId = newMsg._id || newMsg.id;
          if (currentMessages.some((m) => (m._id || m.id) === newId)) {
            return currentMessages;
          }
          return [...currentMessages, newMsg];
        });
        setDraft("");
        sendTypingStop(selectedConversationId);
        await loadConversations();
      }
    } finally {
      setSending(false);
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (selectedConversationId) {
      sendTypingStart(selectedConversationId);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto max-w-3xl py-20 text-center">
        <h1 className="text-3xl font-serif font-bold mb-4">Messages</h1>
        <p className="mb-6 text-muted-foreground">Please sign in to view or send messages.</p>
        <Link to="/login">
          <Button className="bg-gaun-green hover:bg-gaun-light-green">Log in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold">Messages</h1>
        <Link to="/listings">
          <Button variant="outline">Browse stays</Button>
        </Link>
      </div>

      <div className="grid min-h-[720px] grid-cols-1 gap-4 rounded-xl border bg-card md:grid-cols-[320px_1fr]">
        <aside className="border-b border-r bg-muted/20 md:border-b-0">
          <div className="border-b p-4 font-medium">Conversations</div>

          <div className="space-y-2 p-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading conversations…</p>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No conversations yet.</p>
            ) : (
              conversations.map((conversation) => {
                const conversationId = conversation._id || conversation.id;
                const otherParticipant = (conversation.participants || []).find(
                  (participant: any) => getUserId(participant) !== getUserId(user)
                );

                return (
                  <button
                    key={conversationId}
                    type="button"
                    onClick={() => handleSelectConversation(conversationId)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selectedConversationId === conversationId ? "border-gaun-green bg-green-50" : "bg-background hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">{otherParticipant?.name || "Conversation"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {(conversation.listing && typeof conversation.listing === "object" && "title" in conversation.listing)
                        ? conversation.listing.title
                        : "Listing chat"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex flex-col">
          {selectedConversation ? (
            <>
              <div className="flex items-center justify-between border-b p-4">
                <div>
                  {(selectedConversation.participants || []).map((participant: any) => {
                    const participantId = getUserId(participant);
                    if (participantId === getUserId(user)) {
                      return null;
                    }

                    return (
                      <div key={participantId || participant.email || "participant"} className="font-medium">
                        {participant.name || "Host"}
                      </div>
                    );
                  })}
                  {typingUser && typingUser !== getUserId(user) && (
                    <div className="text-xs text-muted-foreground italic">typing…</div>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No messages yet. Start the conversation.</div>
                ) : (
                  messages.map((message: any) => {
                    const senderId = getUserId(message.sender || {});
                    const isMine = senderId === getUserId(user);
                    const isSystem = !!message.systemType;

                    return (
                      <div key={message._id || message.id} className={`flex ${isMine ? "justify-end" : "justify-start"} ${isSystem ? "justify-center" : ""}`}>
                        <div
                          className={`max-w-[75%] rounded-xl px-3 py-2 ${
                            isSystem
                              ? "bg-muted/50 text-muted-foreground text-xs text-center italic"
                              : isMine
                                ? "bg-gaun-green text-white"
                                : "bg-muted text-foreground"
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{message.body || "Sent a file"}</div>
                          <div className={`mt-1 text-[10px] ${isMine ? "text-green-100" : "text-muted-foreground"}`}>
                            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "now"}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2 border-t p-4">
                <Input
                  value={draft}
                  onChange={(event) => handleDraftChange(event.target.value)}
                  placeholder="Type a message…"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button onClick={handleSend} disabled={sending || !draft.trim()} className="bg-gaun-green hover:bg-gaun-light-green">
                  Send
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              Select a conversation to begin messaging.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Messages;
