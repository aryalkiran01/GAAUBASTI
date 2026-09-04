/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  connectSocket,
  disconnectSocket,
  onMessageNew,
  onNotificationNew,
  isSocketConnected,
} from "../lib/socket";

export const useSocket = (isAuthenticated: boolean, userId?: string) => {
  const queryClient = useQueryClient();
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();
    if (!socket) return;

    const unsubMessage = onMessageNew((data: any) => {
      if (data?.conversationId) {
        queryClient.invalidateQueries({ queryKey: ["messages", data.conversationId] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    });

    const unsubNotification = onNotificationNew(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    });

    cleanupRef.current = [unsubMessage, unsubNotification];

    return () => {
      cleanupRef.current.forEach((fn) => fn());
      cleanupRef.current = [];
    };
  }, [isAuthenticated, userId, queryClient]);

  useEffect(() => {
    return () => { disconnectSocket(); };
  }, []);

  return { isConnected: isSocketConnected() };
};
