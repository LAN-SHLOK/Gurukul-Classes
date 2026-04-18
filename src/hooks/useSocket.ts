"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseSocketReturn {
  socket: null;
  isConnected: boolean;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
}

type Handler = (...args: any[]) => void;

// Global Pusher instance
let pusherInstance: any = null;
const listeners: Map<string, Set<Handler>> = new Map();

function getPusher() {
  if (typeof window === "undefined") return null;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";
  if (!key) return null;

  if (!pusherInstance) {
    import("pusher-js").then((PusherModule) => {
      const Pusher = PusherModule.default;
      pusherInstance = new Pusher(key, { cluster });
      const channel = pusherInstance.subscribe("gurukul");

      // Forward all events to registered listeners
      channel.bind_global((event: string, data: any) => {
        const handlers = listeners.get(event);
        if (handlers) handlers.forEach((h) => h(data));
      });
    });
  }
  return pusherInstance;
}

export function useSocket(): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef<Map<string, Handler>>(new Map());

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (!key) return;

    // Lazy init
    getPusher();

    // Poll connection state
    const interval = setInterval(() => {
      if (pusherInstance?.connection?.state === "connected") {
        setIsConnected(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const on = useCallback((event: string, handler: Handler) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(handler);
    handlersRef.current.set(event, handler);
  }, []);

  const off = useCallback((event: string, handler: Handler) => {
    listeners.get(event)?.delete(handler);
    handlersRef.current.delete(event);
  }, []);

  return { socket: null, isConnected, on, off };
}
