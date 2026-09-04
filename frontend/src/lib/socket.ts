import { io, Socket } from "socket.io-client";
import { getAuthToken } from "./api";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") ||
  "http://localhost:3000";

let socket: Socket | null = null;

const messageHandlers = new Set<(data: any) => void>();
const notificationHandlers = new Set<(data: any) => void>();
const typingStartHandlers = new Set<(data: any) => void>();
const typingStopHandlers = new Set<(data: any) => void>();

export const connectSocket = (): Socket | null => {
  const token = getAuthToken();
  if (!token) return null;
  if (socket && socket.connected) return socket;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("message:new", (data: any) => {
    messageHandlers.forEach((h) => h(data));
  });
  socket.on("notification:new", (data: any) => {
    notificationHandlers.forEach((h) => h(data));
  });
  socket.on("typing:start", (data: any) => {
    typingStartHandlers.forEach((h) => h(data));
  });
  socket.on("typing:stop", (data: any) => {
    typingStopHandlers.forEach((h) => h(data));
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    messageHandlers.clear();
    notificationHandlers.clear();
    typingStartHandlers.clear();
    typingStopHandlers.clear();
  }
};

export const joinConversation = (conversationId: string): void => {
  if (socket && socket.connected) {
    socket.emit("joinConversation", { conversationId });
  }
};

export const emitTyping = (conversationId: string, isTyping: boolean): void => {
  if (socket && socket.connected) {
    socket.emit(isTyping ? "typing:start" : "typing:stop", { conversationId });
  }
};

export const onMessageNew = (handler: (data: any) => void): (() => void) => {
  messageHandlers.add(handler);
  return () => { messageHandlers.delete(handler); };
};

export const onNotificationNew = (handler: (data: any) => void): (() => void) => {
  notificationHandlers.add(handler);
  return () => { notificationHandlers.delete(handler); };
};

export const onTypingStart = (handler: (data: any) => void): (() => void) => {
  typingStartHandlers.add(handler);
  return () => { typingStartHandlers.delete(handler); };
};

export const onTypingStop = (handler: (data: any) => void): (() => void) => {
  typingStopHandlers.add(handler);
  return () => { typingStopHandlers.delete(handler); };
};

export const isSocketConnected = (): boolean => !!socket && socket.connected;
