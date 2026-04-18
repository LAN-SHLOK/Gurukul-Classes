"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Megaphone } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/hooks/useSocket";

export default function AnnouncementBanner() {
  const [text, setText] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { data: session } = useSession();
  const { on, off } = useSocket();

  useEffect(() => {
    if (!session || session.user?.role !== "student") return;

    // Fetch latest announcement on mount
    fetch("/api/announcements")
      .then(r => r.json())
      .then(d => { if (d?.text) setText(d.text); })
      .catch(() => {});

    // Listen for real-time announcements via Pusher
    const handler = (data: { text: string }) => {
      if (data?.text) {
        setText(data.text);
        setDismissed(false); // re-show on new announcement
      }
    };
    on("announcement", handler);
    return () => off("announcement", handler);
  }, [session, on, off]);

  if (!session || session.user?.role !== "student") return null;
  if (!text || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -48, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-[200] bg-[#2D31FA] text-white"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="container mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Megaphone className="w-3.5 h-3.5 flex-shrink-0" />
            <p className="text-[11px] font-black uppercase tracking-widest truncate">{text}</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
