/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { conversationsAPI } from "@/lib/api";
import {
  joinConversation,
  onMessageNew,
  onTypingStart,
  onTypingStop,
  emitTyping,
} from "@/lib/socket";
import MessageReplySuggestions from "@/components/ai/MessageReplySuggestions";

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
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = useMemo(
    () => conversations.find((c) => (c._id || c.id) === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const res = await conversationsAPI.getConversations();
    if (res.success && res.data?.conversations) {
      setConversations(res.data.conversations);
      if (!selectedConversationId && res.data.conversations.length > 0) {
        const firstId = res.data.conversations[0]._id || res.data.conversations[0].id;
        setSelectedConversationId(firstId);
        setSearchParams({ conversationId: firstId });
      }
    }
    setLoading(false);
  }, [selectedConversationId, setSearchParams, user]);

  const loadUnreadCounts = useCallback(async () => {
    if (!user) return;
    const res = await conversationsAPI.getUnreadCounts();
    if (res.success && res.data?.perConversation) {
      setUnreadCounts(res.data.perConversation);
    }
  }, [user]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) { setMessages([]); return; }
    const res = await conversationsAPI.getMessages(conversationId);
    if (res.success && res.data?.messages) setMessages(res.data.messages);
  }, []);

  const markRead = useCallback(async (conversationId: string) => {
    if (!conversationId || !user) return;
    await conversationsAPI.markMessagesRead(conversationId);
    setUnreadCounts((prev) => { const next = { ...prev }; delete next[conversationId]; return next; });
  }, [user]);

  useEffect(() => {
    if (user) { loadConversations(); loadUnreadCounts(); }
  }, [user, loadConversations, loadUnreadCounts]);

  useEffect(() => {
    if (!selectedConversationId) { setMessages([]); return; }
    loadMessages(selectedConversationId);
    joinConversation(selectedConversationId);
    markRead(selectedConversationId);
  }, [selectedConversationId, loadMessages, markRead]);

  useEffect(() => {
    const unsub = onMessageNew((data: any) => {
      if (data?.conversationId === selectedConversationId && data?.message) {
        setMessages((prev) => {
          const exists = prev.some((m) => (m._id || m.id) === (data.message._id || data.message.id));
          return exists ? prev : [...prev, data.message];
        });
        markRead(selectedConversationId);
      }
      loadConversations();
      loadUnreadCounts();
    });
    return unsub;
  }, [selectedConversationId, markRead, loadConversations, loadUnreadCounts]);

  useEffect(() => {
    const unsubStart = onTypingStart((data: any) => {
      if (data?.conversationId === selectedConversationId) setIsTyping(true);
    });
    const unsubStop = onTypingStop((data: any) => {
      if (data?.conversationId === selectedConversationId) setIsTyping(false);
    });
    return () => { unsubStart(); unsubStop(); };
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSearchParams({ conversationId });
  };

  const handleSend = async () => {
    if (!selectedConversationId || !draft.trim()) return;
    setSending(true);
    emitTyping(selectedConversationId, false);
    try {
      const res = await conversationsAPI.sendMessage(selectedConversationId, { body: draft.trim() });
      if (res.success && res.data?.message) {
        setMessages((prev) => [...prev, res.data.message]);
        setDraft("");
        await loadConversations();
      }
    } finally { setSending(false); }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (selectedConversationId) {
      emitTyping(selectedConversationId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => emitTyping(selectedConversationId, false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto max-w-3xl py-20 text-center">
        <h1 className="text-3xl font-serif font-bold mb-4">Messages</h1>
        <p className="mb-6 text-muted-foreground">Please sign in to view or send messages.</p>
        <Link to="/login"><Button className="bg-gaun-green hover:bg-gaun-light-green">Log in</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold">Messages</h1>
        <Link to="/listings"><Button variant="outline">Browse stays</Button></Link>
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
                  (p: any) => getUserId(p) !== getUserId(user),
                );
                const unread = unreadCounts[conversationId] || 0;
                return (
                  <button
                    key={conversationId}
                    type="button"
                    onClick={() => handleSelectConversation(conversationId)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selectedConversationId === conversationId
                        ? "border-gaun-green bg-green-50"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{otherParticipant?.name || "Conversation"}</span>
                      {unread > 0 && (
                        <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gaun-green px-1.5 text-xs font-semibold text-white">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {conversation.listing && typeof conversation.listing === "object" && "title" in conversation.listing
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
                    if (participantId === getUserId(user)) return null;
                    return (
                      <div key={participantId || participant.email || "p"} className="font-medium">
                        {participant.name || "Host"}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No messages yet. Start the conversation.</div>
                ) : (
                  messages.map((message: any) => {
                    const senderId = getUserId(message.sender || {});
                    const isMine = senderId === getUserId(user);
                    if (message.systemType) {
                      return (
                        <div key={message._id || message.id} className="flex justify-center">
                          <div className="rounded-lg bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground">
                            {message.body}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={message._id || message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-xl px-3 py-2 ${isMine ? "bg-gaun-green text-white" : "bg-muted text-foreground"}`}>
                          <div className="text-sm whitespace-pre-wrap">{message.body || "Sent a file"}</div>
                          <div className={`mt-1 text-[10px] ${isMine ? "text-green-100" : "text-muted-foreground"}`}>
                            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "now"}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="rounded-xl bg-muted px-4 py-2 text-xs text-muted-foreground">typing…</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2 border-t p-4">
                <Input
                  value={draft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  placeholder="Type a message…"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
                />
                <Button onClick={handleSend} disabled={sending || !draft.trim()} className="bg-gaun-green hover:bg-gaun-light-green">
                  Send
                </Button>
              </div>
              <MessageReplySuggestions
                conversationId={selectedConversationId || ""}
                onReplySelect={(text) => setDraft(text)}
              />
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
