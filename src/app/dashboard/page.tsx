"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  LogOut, Clock, ChevronRight, BookOpen, ArrowRight,
  Sparkles, FileText, TrendingUp, Phone, Calendar,
  AlertCircle, Mail,
} from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import dynamic from "next/dynamic";

const PushNotificationButton = dynamic(() => import("@/components/ui/PushNotificationButton"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────
interface LectureSlot { subject: string; startTime: string; endTime: string; }
interface Schedule { _id: string; standard: string; date: string; dayOfWeek: string; slots: LectureSlot[]; }
interface StudentData {
  _id: string; first_name: string; last_name: string; email: string; image?: string;
  feeStatus: "paid" | "pending" | "partial";
  feeAmount?: number; feePaidDate?: string; feeNote?: string;
  standard?: string; enrolledSubjects?: string[]; courses?: string[];
  created_at?: string; profileComplete?: boolean;
}
interface AttendanceData {
  percentage: number; present: number; total: number; feePaid: boolean;
  bySubject: Record<string, { present: number; total: number; percentage: number }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function formatDateShort(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
  });
}
function isToday(d: string) {
  return new Date(d + "T00:00:00").toDateString() === new Date().toDateString();
}
function isFuture(d: string) {
  return new Date(d + "T00:00:00") >= new Date(new Date().toDateString());
}

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

function FeeBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid:    "bg-green-500/20 text-green-400 border-green-500/20",
    partial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20",
    pending: "bg-red-500/20 text-red-400 border-red-500/20",
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${map[status] || map.pending}`}>
      Fee: {status}
    </span>
  );
}

// ─── Pending Fee Card ─────────────────────────────────────────────────────────
function PendingFeeCard({ status }: { status: "pending" | "partial" }) {
  return (
    <Reveal delay={0.1}>
      <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/[0.05] p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-yellow-400 font-black text-base tracking-tight">
              {status === "partial" ? "Partial Payment Received" : "Enrollment Pending"}
            </p>
            <p className="text-white/50 text-sm font-medium mt-1 leading-relaxed">
              Please pay your fees to access attendance, notes, and class features.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <Phone className="w-4 h-4 text-[#2D31FA] flex-shrink-0" />
          <span className="text-white/60 text-sm font-medium">Contact: </span>
          <a href="tel:+918849035591" className="text-[#2D31FA] font-black text-sm hover:underline">+91 88490 35591</a>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Link href="/schedule">
            <div className="press flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#2D31FA]/30 transition-all">
              <Calendar className="w-4 h-4 text-[#2D31FA]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Schedule</span>
            </div>
          </Link>
          <Link href="/courses">
            <div className="press flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#2D31FA]/30 transition-all">
              <BookOpen className="w-4 h-4 text-[#2D31FA]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Courses</span>
            </div>
          </Link>
          <Link href="/contact">
            <div className="press flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#2D31FA]/30 transition-all">
              <Phone className="w-4 h-4 text-[#2D31FA]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Contact</span>
            </div>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { redirect("/login"); },
  });

  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingSch, setLoadingSch] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [notes, setNotes] = useState<Array<{ _id: string; title: string; subject: string; standard: string; file_url: string }>>([]);
  const { on, off } = useSocket();

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/schedules");
      const data = await res.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
    } finally { setLoadingSch(false); }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  useEffect(() => {
    fetch("/api/student/me")
      .then(r => r.json())
      .then(d => { if (d._id) setStudentData(d); })
      .catch((error) => {
        console.error("Failed to fetch student data:", error);
      });
  }, []);

  useEffect(() => {
    fetch("/api/student/attendance")
      .then(r => r.json())
      .then(d => { if (typeof d.percentage === "number") setAttendance(d); })
      .catch((error) => {
        console.error("Failed to fetch attendance data:", error);
      });
  }, []);

  // Fetch notes for student's standard
  useEffect(() => {
    if (!studentData?.standard) return;
    fetch(`/api/admin/notes?standard=${encodeURIComponent(studentData.standard)}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          // Filter by enrolled subjects if available (case-insensitive & trimmed)
          const enrolled = (studentData.enrolledSubjects || []).map((s: string) => s.toLowerCase().trim());
          const filtered = enrolled.length > 0
            ? d.filter((n: any) => enrolled.includes((n.subject || "").toLowerCase().trim()))
            : d;
          setNotes(filtered);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch notes:", error);
      });
  }, [studentData?.standard, studentData?.enrolledSubjects]);

  useEffect(() => {
    const h = () => fetchSchedules();
    on("schedules:updated", h);
    return () => off("schedules:updated", h);
  }, [on, off, fetchSchedules]);

  const feeStatus = studentData?.feeStatus || "pending";
  const feePaid   = feeStatus === "paid";
  const myStandard = studentData?.standard;

  // Upcoming schedules for student's standard
  const upcoming = myStandard
    ? schedules.filter(s => s.standard === myStandard && isFuture(s.date))
        .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5)
    : [];

  const todaySchedule = myStandard
    ? schedules.find(s => s.standard === myStandard && isToday(s.date))
    : null;

  const firstName = session?.user?.name?.split(" ")[0] || "Student";
  const initials  = (session?.user?.name || "S").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#2D31FA] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-24 overflow-x-hidden">
      <div className="px-4 md:px-8 w-full">
        <div className="container mx-auto max-w-5xl space-y-6">

          {/* ── Header ── */}
          <Reveal>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#2D31FA] mb-2">Student Portal</p>
                <h1 className="font-black text-white tracking-tighter leading-[0.85] uppercase"
                  style={{ fontSize: "clamp(2rem, 8vw, 4rem)" }}>
                  HEY,<br />
                  <span className="text-[#2D31FA]">{firstName.toUpperCase()}.</span>
                </h1>
              </div>
              <button onClick={() => signOut({ callbackUrl: "/" })}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all mt-1">
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </Reveal>

          {/* ── Profile card ── */}
          <Reveal delay={0.06}>
            <div className="relative rounded-3xl overflow-hidden border border-white/10 p-5 md:p-6"
              style={{ background: "linear-gradient(135deg, rgba(45,49,250,0.08) 0%, rgba(0,0,0,0) 60%)" }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(45,49,250,0.12) 0%, transparent 60%)" }} />
              <div className="relative z-10 flex items-center gap-4">
                {session?.user?.image ? (
                  <img src={session.user.image} alt={session.user.name || ""} referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border border-white/10" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#2D31FA] flex items-center justify-center flex-shrink-0 text-white font-black text-lg">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-black text-white tracking-tight truncate">{session?.user?.name}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-white/30 flex-shrink-0" />
                    <p className="text-xs text-white/40 font-medium truncate">{session?.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <FeeBadge status={feeStatus} />
                    {myStandard && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#2D31FA]/10 border border-[#2D31FA]/20 text-[#2D31FA] text-[9px] font-black uppercase tracking-widest">
                        {myStandard}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ── Profile completion prompt ── */}
          {studentData && !studentData.profileComplete && (
            <Reveal delay={0.07}>
              <Link href="/profile">
                <div className="press flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.05] hover:bg-yellow-500/10 transition-all">
                  <div>
                    <p className="text-yellow-400 font-black text-sm">Complete your profile</p>
                    <p className="text-white/30 text-xs font-medium mt-0.5">Add mobile, parent details, address and more</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                </div>
              </Link>
            </Reveal>
          )}

          {/* ── Pending fee gate ── */}
          {!feePaid && <PendingFeeCard status={feeStatus as "pending" | "partial"} />}

          {/* ── PAID CONTENT ── */}
          {feePaid && (<>

            {/* My Standard */}
            {myStandard && (
              <Reveal delay={0.1}>
                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#2D31FA]/10 border border-[#2D31FA]/20">
                  <div className="w-10 h-10 rounded-xl bg-[#2D31FA]/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-[#2D31FA]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#2D31FA]">My Standard</p>
                    <p className="text-white font-black text-base tracking-tight">{myStandard}</p>
                  </div>
                  {(studentData?.enrolledSubjects?.length ?? 0) > 0 && (
                    <div className="ml-auto flex flex-wrap gap-1 justify-end">
                      {studentData!.enrolledSubjects!.slice(0, 3).map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-[#2D31FA]/20 text-[#2D31FA] text-[8px] font-black uppercase tracking-widest">{s}</span>
                      ))}
                      {(studentData!.enrolledSubjects!.length ?? 0) > 3 && (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/30 text-[8px] font-black">+{studentData!.enrolledSubjects!.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </Reveal>
            )}

            {/* Today's Schedule */}
            <Reveal delay={0.12}>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#2D31FA]">Today&apos;s Schedule</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                {loadingSch ? (
                  <div className="flex gap-2 py-4">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[#2D31FA] animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                  </div>
                ) : !myStandard ? (
                  <div className="px-4 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                    <p className="text-white/30 text-sm font-medium">No standard assigned yet. Contact admin.</p>
                  </div>
                ) : !todaySchedule ? (
                  <div className="px-4 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                    <p className="text-white/30 text-sm font-medium">No classes scheduled for today.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#2D31FA]/20 bg-[#2D31FA]/[0.04] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#2D31FA]/10 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-[#2D31FA] text-white text-[7px] font-black uppercase tracking-widest">Today</span>
                      <span className="text-white font-black text-sm">{todaySchedule.dayOfWeek}</span>
                    </div>
                    <div className="px-4 py-3 space-y-2.5">
                      {todaySchedule.slots.map((slot, j) => (
                        <div key={j} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#2D31FA] flex-shrink-0" />
                            <span className="text-white font-bold text-sm truncate">{slot.subject}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/40 text-xs font-medium flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Reveal>

            {/* Upcoming Classes */}
            {myStandard && (
              <Reveal delay={0.14}>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#2D31FA]">Upcoming Classes</span>
                    <div className="h-px flex-1 bg-white/5" />
                    <Link href="/schedule" className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-[#2D31FA] transition-colors flex items-center gap-1">
                      All <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  {upcoming.length === 0 ? (
                    <div className="px-4 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center">
                      <p className="text-white/30 text-sm font-medium">No upcoming classes.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {upcoming.map((entry, i) => (
                          <motion.div key={entry._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                            <div className={`px-4 py-2.5 flex items-center justify-between border-b border-white/[0.06] ${isToday(entry.date) ? "bg-[#2D31FA]/10" : ""}`}>
                              <div className="flex items-center gap-2">
                                {isToday(entry.date) && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#2D31FA] text-white text-[7px] font-black uppercase tracking-widest">Today</span>
                                )}
                                <span className="text-white font-black text-sm">{formatDateShort(entry.date)}</span>
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-[#2D31FA]">{entry.dayOfWeek}</span>
                            </div>
                            <div className="px-4 py-3 space-y-2">
                              {entry.slots.map((slot, j) => (
                                <div key={j} className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#2D31FA] flex-shrink-0" />
                                    <span className="text-white font-bold text-sm truncate">{slot.subject}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-white/40 text-xs font-medium flex-shrink-0">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </Reveal>
            )}

            {/* Attendance */}
            <Reveal delay={0.16}>
              <div className="relative rounded-3xl overflow-hidden border border-white/10 p-5 md:p-6"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-4 h-4 text-[#2D31FA]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#2D31FA]">Attendance</span>
                </div>
                {attendance && attendance.total > 0 ? (
                  <>
                    <div className="flex items-end gap-4 mb-4">
                      <div>
                        <p className="text-4xl font-black text-white tracking-tighter">{attendance.percentage}%</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">
                          {attendance.present} present · {attendance.total - attendance.present} absent · {attendance.total} total
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-4">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${attendance.percentage}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${attendance.percentage >= 75 ? "bg-green-400" : attendance.percentage >= 50 ? "bg-yellow-400" : "bg-red-400"}`} />
                    </div>
                    {Object.keys(attendance.bySubject).length > 0 && (
                      <div className="space-y-2">
                        {Object.entries(attendance.bySubject).map(([sub, data]) => (
                          <div key={sub} className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-white/50 w-24 truncate flex-shrink-0">{sub}</span>
                            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                              <div className={`h-full rounded-full ${data.percentage >= 75 ? "bg-green-400" : data.percentage >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                                style={{ width: `${data.percentage}%` }} />
                            </div>
                            <span className={`text-[9px] font-black w-8 text-right flex-shrink-0 ${data.percentage >= 75 ? "text-green-400" : data.percentage >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                              {data.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-white/30 text-sm font-medium">No attendance records yet. Your staff will update this after each lecture.</p>
                )}
              </div>
            </Reveal>

            {/* Notes & Homework */}
            <Reveal delay={0.18}>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#2D31FA]">Notes & Homework</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                {notes.length > 0 ? (
                  <div className="space-y-2">
                    {notes.slice(0, 5).map(note => (
                      <a key={note._id} href={note.file_url} target="_blank" rel="noopener noreferrer"
                        className="press flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:border-[#2D31FA]/30 hover:bg-[#2D31FA]/05 transition-all group">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-[#2D31FA] flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-black text-white truncate">{note.title}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#2D31FA]">{note.subject}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-[#2D31FA] flex-shrink-0 transition-colors" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
                    <FileText className="w-6 h-6 text-white/10 mx-auto mb-2" />
                    <p className="text-white/30 text-sm font-medium">No notes uploaded yet.</p>
                    <p className="text-white/15 text-xs mt-0.5">Your teacher will upload notes here.</p>
                  </div>
                )}
              </div>
            </Reveal>

            {/* Push Notifications */}
            <Reveal delay={0.2}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Stay Updated</span>
                <PushNotificationButton studentId={session?.user?.id} />
              </div>
            </Reveal>

          </>)}

          {/* ── Help card (always shown) ── */}
          <Reveal delay={feePaid ? 0.22 : 0.14}>
            <div className="relative rounded-3xl overflow-hidden p-5 md:p-6"
              style={{ background: "linear-gradient(135deg, #0a0a1f 0%, #0d0d2e 100%)", border: "1px solid rgba(45,49,250,0.2)" }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 100% 0%, rgba(45,49,250,0.15) 0%, transparent 60%)" }} />
              <div className="relative z-10 flex items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#2D31FA]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#2D31FA]">Need Help?</span>
                  </div>
                  <p className="text-white font-black text-base tracking-tight">Questions about your schedule or courses?</p>
                  <p className="text-white/40 text-sm font-medium mt-1">Our team is here to help.</p>
                </div>
                <Link href="/contact" className="flex-shrink-0">
                  <div className="press flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#2D31FA] text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 active:scale-95 transition-all">
                    Contact <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </div>
            </div>
          </Reveal>

        </div>
      </div>
    </div>
  );
}
