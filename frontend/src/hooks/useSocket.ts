import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getAuthToken } from "@/lib/api";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:3000";

export interface ServerMessage {
  _id: string;
  conversationId: string;
  sender: { _id: string; name?: string; avatar?: string } | string;
  body: string;
  systemType?: string;
  createdAt: string;
}

export interface TypingPayload {
  userId: string;
  conversationId: string;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, []);

  return { socket: socketRef, connected };
}

export function useConversationSocket(
  conversationId: string | null,
  onNewMessage: (message: ServerMessage) => void,
  onTypingStart?: (payload: TypingPayload) => void,
  onTypingStop?: (payload: TypingPayload) => void
) {
  const { socket } = useSocket();
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const s = socket.current;
    if (!s || !conversationId) return;

    s.emit("joinConversation", conversationId);

    const messageHandler = (payload: { conversationId: string; message: ServerMessage }) => {
      if (payload.conversationId === conversationId) {
        onNewMessage(payload.message);
      }
    };

    const typingStartHandler = (payload: TypingPayload) => {
      if (payload.conversationId === conversationId) {
        setTypingUser(payload.userId);
        onTypingStart?.(payload);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      }
    };

    const typingStopHandler = (payload: TypingPayload) => {
      if (payload.conversationId === conversationId) {
        setTypingUser(null);
        onTypingStop?.(payload);
      }
    };

    s.on("message:new", messageHandler);
    s.on("typing:start", typingStartHandler);
    s.on("typing:stop", typingStopHandler);

    return () => {
      s.off("message:new", messageHandler);
      s.off("typing:start", typingStartHandler);
      s.off("typing:stop", typingStopHandler);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, conversationId, onNewMessage, onTypingStart, onTypingStop]);

  const sendTypingStart = useCallback((convId: string) => {
    socket.current?.emit("typing:start", { conversationId: convId });
  }, [socket]);

  const sendTypingStop = useCallback((convId: string) => {
    socket.current?.emit("typing:stop", { conversationId: convId });
  }, [socket]);

  return { typingUser, sendTypingStart, sendTypingStop };
}
