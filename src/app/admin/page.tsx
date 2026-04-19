"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, ChevronRight, X, Plus, Trash2, Pencil,
  Home, Users, BookOpen, Calendar, BarChart2,
  Megaphone, Search, Clock, TrendingUp, GraduationCap,
  Briefcase, Download,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend,
} from "chart.js";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import ImageUpload from "@/components/admin/ImageUpload";
import FileUpload from "@/components/admin/FileUpload";
import { LenisContext as LenisCtx } from "@/components/layout/SmoothScrollProvider";
import { useSocket } from "@/hooks/useSocket";
import { 
  adminFacultySchema, 
  adminEventSchema, 
  adminTopperSchema, 
  adminNoteSchema 
} from "@/lib/validations";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ─── Constants ────────────────────────────────────────────────────────────────
const STANDARDS = [
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11 Science", "Class 11 Commerce", "Class 11 Arts",
  "Class 12 Science", "Class 12 Commerce", "Class 12 Arts",
  "JEE Mains", "JEE Advanced", "NEET",
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface LectureSlot { subject: string; startTime: string; endTime: string; }
interface Schedule { _id: string; standard: string; date: string; dayOfWeek: string; slots: LectureSlot[]; }
interface StudentDoc {
  _id: string; first_name: string; last_name: string; email: string;
  mobile?: string; gender?: string; image?: string;
  dob?: string; parent_name?: string; parent_mobile?: string;
  address?: string; previous_school?: string; profileComplete?: boolean;
  feeStatus: "paid" | "pending" | "partial";
  feeAmount?: number; feePaidDate?: string; feeNote?: string;
  standard?: string; enrolledSubjects?: string[]; courses?: string[];
  created_at: string;
}

type AdminTab = "home" | "students" | "content" | "schedules" | "applications";
type ContentSubTab = "faculty" | "events" | "toppers" | "notes";

interface ContentItem {
  _id: string;
  title?: string;
  name?: string;
  role?: string;
  date?: string;
  subject?: string;
  exam?: string;
  standard?: string;
  image?: string;
  file_url?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputCls = "w-full h-12 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-[#2D31FA]/60 outline-none px-4 text-sm font-medium transition-all";
const selectCls = "w-full h-12 bg-gradient-to-br from-white/[0.08] to-white/[0.04] border border-white/10 rounded-xl text-white focus:border-[#2D31FA] focus:ring-2 focus:ring-[#2D31FA]/20 outline-none px-4 pr-12 text-sm font-bold transition-all cursor-pointer [color-scheme:dark] appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxNiAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMSAxTDggOEwxNSAxIiBzdHJva2U9IiMyRDMxRkEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-[length:16px] bg-[right_1rem_center] bg-no-repeat hover:bg-white/[0.06] hover:border-white/20 hover:shadow-[0_0_20px_-8px_rgba(45,49,250,0.4)]";
const textareaCls = "w-full bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-[#2D31FA]/60 outline-none p-4 text-sm font-medium transition-all resize-none";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}
function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function FeeBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid:    "bg-green-500/20 text-green-400 border-green-500/20",
    partial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20",
    pending: "bg-red-500/20 text-red-400 border-red-500/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${map[status] || map.pending}`}>
      {status}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D31FA] block px-1">{label}</label>
      {children}
    </div>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#2D31FA] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────
function AuthGate({ onAuth }: { onAuth: () => void }) {
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey }),
      });
      if (res.ok) { onAuth(); }
      else { setError("INVALID PASSKEY"); setPasskey(""); setTimeout(() => setError(""), 2000); }
    } catch { setError("CONNECTION FAILED"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="mb-12 text-center space-y-4">
          <div className="w-20 h-20 bg-[#2D31FA]/10 border border-[#2D31FA]/20 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_-12px_rgba(45,49,250,0.3)]">
            <Lock className="w-8 h-8 text-[#2D31FA]" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Terminal <span className="text-[#2D31FA]">Root.</span>
          </h1>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-white/20">Admin Access Required</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <Input type="password" placeholder="Secure Passkey" value={passkey}
            onChange={e => setPasskey(e.target.value)}
            className="h-16 bg-white/5 border-white/10 text-white rounded-2xl pl-6" />
          {error && <p className="text-[10px] font-black tracking-widest text-[#2D31FA] text-center uppercase">{error}</p>}
          <Button type="submit" isLoading={loading} className="w-full h-16 rounded-2xl group">
            ESTABLISH CONNECTION
            <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Schedule Modal ───────────────────────────────────────────────────────────
function ScheduleModal({ open, onClose, onSuccess, editData }: {
  open: boolean; onClose: () => void; onSuccess: () => void; editData?: Schedule | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [standard, setStandard] = useState("");
  const [date, setDate] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [slots, setSlots] = useState<LectureSlot[]>([{ subject: "", startTime: "", endTime: "" }]);
  const lenisCtx = useContext(LenisCtx);

  useEffect(() => {
    lenisCtx.destroy(); document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; lenisCtx.reinit(); };
  }, [lenisCtx]);

  useEffect(() => {
    if (editData) {
      setStandard(editData.standard); setDate(editData.date); setDayOfWeek(editData.dayOfWeek);
      setSlots(editData.slots.length ? editData.slots : [{ subject: "", startTime: "", endTime: "" }]);
    } else {
      setStandard(""); setDate(""); setDayOfWeek("");
      setSlots([{ subject: "", startTime: "", endTime: "" }]);
    }
    setError("");
  }, [editData, open]);

  const handleDateChange = (val: string) => {
    setDate(val);
    setDayOfWeek(val ? new Date(val + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" }) : "");
  };
  const updateSlot = (i: number, field: keyof LectureSlot, val: string) =>
    setSlots(p => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!standard.trim()) { setError("Standard is required"); return; }
    if (!date) { setError("Date is required"); return; }
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s.subject.trim()) { setError(`Subject required for slot ${i + 1}`); return; }
      if (!s.startTime || !s.endTime) { setError(`Times required for slot ${i + 1}`); return; }
      if (s.startTime >= s.endTime) { setError(`Start must be before end for slot ${i + 1}`); return; }
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = { standard, date, dayOfWeek, slots };
      if (editData) body.id = editData._id;
      const res = await fetch("/api/admin/schedules", {
        method: editData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) { onSuccess(); onClose(); }
      else { const d = await res.json(); setError(d.message || "Failed"); }
    } catch { setError("An error occurred."); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg bg-[#0A0A0F] border border-white/10 rounded-3xl shadow-2xl flex flex-col"
          style={{ height: "min(92dvh, 760px)" }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2D31FA]/10 border border-[#2D31FA]/20 rounded-2xl flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#2D31FA]" />
              </div>
              <p className="text-base font-black text-white">{editData ? "Edit Schedule" : "Add Schedule"}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white active:scale-95 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0 [&::-webkit-scrollbar]:hidden" onTouchMove={e => e.stopPropagation()}>
            <form id="sch-form" onSubmit={handleSubmit} className="space-y-4 pb-4">
              <Field label="Standard *">
                <select value={standard} onChange={e => setStandard(e.target.value)}
                  className={selectCls}>
                  <option value="">Select standard</option>
                  {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="custom">Custom...</option>
                </select>
                {standard === "custom" && (
                  <input type="text" placeholder="Enter custom standard" className={inputCls + " mt-2"}
                    onChange={e => setStandard(e.target.value)} />
                )}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date *">
                  <input type="date" value={date} onChange={e => handleDateChange(e.target.value)}
                    className={inputCls + " [color-scheme:dark]"} />
                </Field>
                <Field label="Day">
                  <input type="text" value={dayOfWeek} readOnly placeholder="Auto"
                    className={inputCls + " opacity-50 cursor-not-allowed"} />
                </Field>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D31FA] px-1">Lecture Slots *</label>
                  <button type="button" onClick={() => setSlots(p => [...p, { subject: "", startTime: "", endTime: "" }])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D31FA]/10 border border-[#2D31FA]/20 text-[#2D31FA] text-[10px] font-black uppercase tracking-widest hover:bg-[#2D31FA]/20 transition-all">
                    <Plus className="w-3 h-3" /> Add Slot
                  </button>
                </div>
                {slots.map((slot, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Slot {i + 1}</span>
                      <button type="button" onClick={() => slots.length > 1 && setSlots(p => p.filter((_, idx) => idx !== i))}
                        disabled={slots.length <= 1}
                        className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:bg-red-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <Field label="Subject *">
                      <input type="text" placeholder="e.g. Physics" value={slot.subject}
                        onChange={e => updateSlot(i, "subject", e.target.value)} className={inputCls} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Start *">
                        <input type="time" value={slot.startTime} onChange={e => updateSlot(i, "startTime", e.target.value)}
                          className={inputCls + " [color-scheme:dark]"} />
                      </Field>
                      <Field label="End *">
                        <input type="time" value={slot.endTime} onChange={e => updateSlot(i, "endTime", e.target.value)}
                          className={inputCls + " [color-scheme:dark]"} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
              {error && <p className="text-[10px] font-black tracking-widest text-red-400 uppercase px-1">{error}</p>}
            </form>
          </div>
          <div className="flex items-center gap-3 px-5 pb-6 pt-4 border-t border-white/[0.06] flex-shrink-0 bg-[#0A0A0F] rounded-b-3xl">
            <Button type="submit" form="sch-form" isLoading={loading}
              className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-sm bg-[#2D31FA] hover:bg-blue-500 active:scale-[0.98] transition-all">
              {loading ? "Saving..." : editData ? "Update" : "Add Schedule"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}
              className="h-12 rounded-xl bg-white/5 border-white/10 hover:bg-red-500/10 hover:text-red-400 active:scale-[0.98] text-white/60 font-black uppercase tracking-widest text-sm px-5 transition-all">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Content Modal ────────────────────────────────────────────────────────────
function ContentModal({ open, onClose, subTab, onSuccess }: {
  open: boolean; onClose: () => void; subTab: ContentSubTab; onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const lenisCtx = useContext(LenisCtx);
  useEffect(() => {
    lenisCtx.destroy(); document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; lenisCtx.reinit(); };
  }, [lenisCtx]);

  const [faculty, setFaculty] = useState({ name: "", role: "", expertise: "", image: "", bio: "", linkedin: "", email: "" });
  const [event, setEvent] = useState({ title: "", date: "", location: "", category: "", image: "", description: "" });
  const [topper, setTopper] = useState({ name: "", score: "", year: "", exam: "", image: "", achievement: "" });
  const [note, setNote] = useState({ title: "", subject: "", standard: "", file_url: "" });

  const reset = () => {
    setFaculty({ name: "", role: "", expertise: "", image: "", bio: "", linkedin: "", email: "" });
    setEvent({ title: "", date: "", location: "", category: "", image: "", description: "" });
    setTopper({ name: "", score: "", year: "", exam: "", image: "", achievement: "" });
    setNote({ title: "", subject: "", standard: "", file_url: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let body: Record<string, unknown>;
    
    try {
      if (subTab === "faculty") {
        adminFacultySchema.parse(faculty);
        body = faculty;
      } else if (subTab === "events") {
        adminEventSchema.parse(event);
        body = event;
      } else if (subTab === "toppers") {
        adminTopperSchema.parse(topper);
        body = topper;
      } else {
        adminNoteSchema.parse(note);
        body = note;
      }
    } catch (err: any) {
      if (err.errors) {
        alert(err.errors[0].message);
      } else {
        alert("Validation error");
      }
      return;
    }

    setLoading(true);
    try {
      const endpoint = subTab === "notes" ? "/api/admin/notes" : `/api/admin/${subTab}`;
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { onSuccess(); onClose(); reset(); }
      else { const d = await res.json(); alert(d.message || "Failed"); }
    } catch { alert("Error"); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg bg-[#0A0A0F] border border-white/10 rounded-3xl shadow-2xl flex flex-col"
          style={{ height: "min(88dvh, 680px)" }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
            <p className="text-base font-black text-white capitalize">Add {subTab.slice(0, -1)}</p>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white active:scale-95 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0 [&::-webkit-scrollbar]:hidden" onTouchMove={e => e.stopPropagation()}>
            <form id="content-form" onSubmit={handleSubmit} className="space-y-4 pb-4">
              {subTab === "faculty" && (<>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-3">Profile Photo *</p>
                  <ImageUpload value={faculty.image} onUpload={url => setFaculty(p => ({ ...p, image: url }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Full Name *"><input required placeholder="Dr. Rajesh Sharma" value={faculty.name} onChange={e => setFaculty(p => ({ ...p, name: e.target.value }))} className={inputCls} /></Field>
                  <Field label="Subject / Role *"><input required placeholder="Physics" value={faculty.role} onChange={e => setFaculty(p => ({ ...p, role: e.target.value }))} className={inputCls} /></Field>
                </div>
                <Field label="Expertise *"><input required placeholder="15 Years JEE Experience" value={faculty.expertise} onChange={e => setFaculty(p => ({ ...p, expertise: e.target.value }))} className={inputCls} /></Field>
                <Field label="Bio"><textarea placeholder="Brief background..." value={faculty.bio} onChange={e => setFaculty(p => ({ ...p, bio: e.target.value }))} className={textareaCls + " h-20"} /></Field>
                <Field label="LinkedIn URL"><input type="url" placeholder="https://linkedin.com/in/..." value={faculty.linkedin} onChange={e => setFaculty(p => ({ ...p, linkedin: e.target.value }))} className={inputCls} /></Field>
                <Field label="Contact Email"><input type="email" placeholder="faculty@gurukulclasses.com" value={faculty.email} onChange={e => setFaculty(p => ({ ...p, email: e.target.value }))} className={inputCls} /></Field>
              </>)}
              {subTab === "events" && (<>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-3">Event Banner *</p>
                  <ImageUpload value={event.image} onUpload={url => setEvent(p => ({ ...p, image: url }))} />
                </div>
                <Field label="Event Title *"><input required placeholder="JEE Mains Bootcamp 2025" value={event.title} onChange={e => setEvent(p => ({ ...p, title: e.target.value }))} className={inputCls} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date *"><input required placeholder="DEC 15, 2025" value={event.date} onChange={e => setEvent(p => ({ ...p, date: e.target.value }))} className={inputCls} /></Field>
                  <Field label="Category *"><input required placeholder="Seminar / Test" value={event.category} onChange={e => setEvent(p => ({ ...p, category: e.target.value }))} className={inputCls} /></Field>
                </div>
                <Field label="Location"><input placeholder="Main Campus / Online" value={event.location} onChange={e => setEvent(p => ({ ...p, location: e.target.value }))} className={inputCls} /></Field>
                <Field label="Description"><textarea placeholder="Describe the event..." value={event.description} onChange={e => setEvent(p => ({ ...p, description: e.target.value }))} className={textareaCls + " h-24"} /></Field>
              </>)}
              {subTab === "toppers" && (<>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-3">Student Portrait *</p>
                  <ImageUpload value={topper.image} onUpload={url => setTopper(p => ({ ...p, image: url }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name *"><input required placeholder="Arjun Patel" value={topper.name} onChange={e => setTopper(p => ({ ...p, name: e.target.value }))} className={inputCls} /></Field>
                  <Field label="Score *"><input required placeholder="99.2% / AIR 45" value={topper.score} onChange={e => setTopper(p => ({ ...p, score: e.target.value }))} className={inputCls} /></Field>
                  <Field label="Year *"><input required placeholder="2025" value={topper.year} onChange={e => setTopper(p => ({ ...p, year: e.target.value }))} className={inputCls} /></Field>
                  <Field label="Exam *"><input required placeholder="JEE Advanced / NEET" value={topper.exam} onChange={e => setTopper(p => ({ ...p, exam: e.target.value }))} className={inputCls} /></Field>
                </div>
                <Field label="Achievement"><textarea placeholder="A short achievement note..." value={topper.achievement} onChange={e => setTopper(p => ({ ...p, achievement: e.target.value }))} className={textareaCls + " h-20"} /></Field>
              </>)}
              {subTab === "notes" && (<>
                <Field label="Title *"><input required placeholder="Chapter 3 — Kinematics" value={note.title} onChange={e => setNote(p => ({ ...p, title: e.target.value }))} className={inputCls} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Subject *"><input required placeholder="Physics" value={note.subject} onChange={e => setNote(p => ({ ...p, subject: e.target.value }))} className={inputCls} /></Field>
                  <Field label="Standard *">
                    <select value={note.standard} onChange={e => setNote(p => ({ ...p, standard: e.target.value }))}
                      className={selectCls}>
                      <option value="">Select</option>
                      {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-3">Upload Attachment (PDF/DOC) *</p>
                  <FileUpload 
                    value={note.file_url} 
                    onUpload={url => setNote(p => ({ ...p, file_url: url }))}
                    label="UPLOAD NOTE"
                  />
                </div>
              </>)}
            </form>
          </div>
          <div className="flex items-center gap-3 px-5 pb-6 pt-4 border-t border-white/[0.06] flex-shrink-0 bg-[#0A0A0F] rounded-b-3xl">
            <Button type="submit" form="content-form" isLoading={loading}
              className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-sm bg-[#2D31FA] hover:bg-blue-500 active:scale-[0.98] transition-all">
              {loading ? "Saving..." : `Add ${subTab.slice(0, -1)}`}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}
              className="h-12 rounded-xl bg-white/5 border-white/10 hover:bg-red-500/10 hover:text-red-400 active:scale-[0.98] text-white/60 font-black uppercase tracking-widest text-sm px-5 transition-all">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Student Detail Sheet ─────────────────────────────────────────────────────
function StudentDetailSheet({ student, schedules, onClose, onSave }: {
  student: StudentDoc; schedules: Schedule[];
  onClose: () => void; onSave: () => void;
}) {
  const [tab, setTab] = useState<"profile" | "enrollment" | "attendance">("profile");
  const [saving, setSaving] = useState(false);
  const [feeStatus, setFeeStatus] = useState(student.feeStatus);
  const [feeAmount, setFeeAmount] = useState(student.feeAmount?.toString() || "");
  const [feePaidDate, setFeePaidDate] = useState(
    student.feePaidDate ? new Date(student.feePaidDate).toISOString().split("T")[0] : ""
  );
  const [feeNote, setFeeNote] = useState(student.feeNote || "");
  const [standard, setStandard] = useState(student.standard || "");
  const [enrolledSubjects, setEnrolledSubjects] = useState<string[]>(student.enrolledSubjects || []);
  const [subjectInput, setSubjectInput] = useState("");
  const [attendance, setAttendance] = useState<{ total: number; present: number; bySubject: Record<string, { present: number; total: number }> } | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const lenisCtx = useContext(LenisCtx);

  // Re-sync state when student changes
  useEffect(() => {
    setTab("profile");
    setFeeStatus(student.feeStatus);
    setFeeAmount(student.feeAmount?.toString() || "");
    setFeePaidDate(student.feePaidDate ? new Date(student.feePaidDate).toISOString().split("T")[0] : "");
    setFeeNote(student.feeNote || "");
    setStandard(student.standard || "");
    setEnrolledSubjects(student.enrolledSubjects || []);
    setSubjectInput("");
    setAttendance(null);
  }, [student._id]);

  useEffect(() => {
    lenisCtx.destroy(); document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; lenisCtx.reinit(); };
  }, [lenisCtx]);

  useEffect(() => {
    if (tab === "attendance") {
      setAttendanceLoading(true);
      fetch(`/api/admin/attendance?student_id=${student._id}`)
        .then(r => r.json())
        .then(d => setAttendance(d))
        .catch((error) => {
          console.error("Failed to fetch student attendance:", error);
          setAttendance({ total: 0, present: 0, bySubject: {} });
        })
        .finally(() => setAttendanceLoading(false));
    }
  }, [tab, student._id]);

  // Subjects from schedules for the selected standard
  const scheduleSubjects = [...new Set(
    schedules.filter(s => s.standard === standard).flatMap(s => s.slots.map(sl => sl.subject))
  )].sort();

  const toggleSubject = (sub: string) =>
    setEnrolledSubjects(p => p.includes(sub) ? p.filter(s => s !== sub) : [...p, sub]);

  const addCustomSubject = () => {
    const s = subjectInput.trim();
    if (s && !enrolledSubjects.includes(s)) setEnrolledSubjects(p => [...p, s]);
    setSubjectInput("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: student._id, feeStatus,
          feeAmount: feeAmount ? Number(feeAmount) : undefined,
          feePaidDate: feePaidDate || null, feeNote, standard, enrolledSubjects,
        }),
      });
      if (res.ok) { onSave(); onClose(); }
      else { alert("Failed to save"); }
    } catch { alert("Error saving"); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9998]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 flex flex-col bg-[#0A0A0F] border-t border-white/10 rounded-t-3xl shadow-2xl"
        style={{ height: "min(92dvh, 800px)" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {student.image ? (
              <img src={student.image} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-2xl object-cover border border-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#2D31FA]/20 flex items-center justify-center text-[#2D31FA] font-black text-sm">
                {student.first_name[0]}{student.last_name[0]}
              </div>
            )}
            <div>
              <p className="text-white font-black text-base">{student.first_name} {student.last_name}</p>
              <p className="text-white/30 text-xs font-medium truncate max-w-[200px]">{student.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 px-5 pb-4 flex-shrink-0">
          {(["profile", "enrollment", "attendance"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                tab === t ? "bg-[#2D31FA] text-white" : "bg-white/5 text-white/40 hover:text-white"
              }`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-5 min-h-0 [&::-webkit-scrollbar]:hidden" onTouchMove={e => e.stopPropagation()}>
          {tab === "profile" && (
            <div className="space-y-4 pb-6">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                {[
                  ["Email", student.email],
                  ["Mobile", student.mobile || "—"],
                  ["Gender", student.gender || "—"],
                  ["Date of Birth", student.dob || "—"],
                  ["Parent Name", student.parent_name || "—"],
                  ["Parent Mobile", student.parent_mobile || "—"],
                  ["Address", student.address || "—"],
                  ["Previous School", student.previous_school || "—"],
                  ["Joined", new Date(student.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })],
                  ["Profile", student.profileComplete ? "Complete" : "Incomplete"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{label}</span>
                    <span className="text-white/70 text-xs font-medium text-right truncate max-w-[180px]">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Fee Status</span>
                <FeeBadge status={student.feeStatus} />
              </div>
              {student.standard && (
                <div className="px-4 py-3 rounded-2xl bg-[#2D31FA]/10 border border-[#2D31FA]/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#2D31FA] mb-1">Standard</p>
                  <p className="text-white font-black">{student.standard}</p>
                </div>
              )}
              {(student.enrolledSubjects?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Enrolled Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {student.enrolledSubjects!.map(s => (
                      <span key={s} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs font-bold">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === "enrollment" && (
            <div className="space-y-5 pb-6">
              <Field label="Standard">
                <select value={standard} onChange={e => setStandard(e.target.value)}
                  className={selectCls}>
                  <option value="">Select standard</option>
                  {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D31FA] block px-1 mb-2">Enrolled Subjects</label>
                {scheduleSubjects.length > 0 ? (
                  <div className="mb-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2 px-1">From schedule — tap to toggle</p>
                    <div className="flex flex-wrap gap-2">
                      {scheduleSubjects.map(sub => (
                        <button key={sub} type="button" onClick={() => toggleSubject(sub)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            enrolledSubjects.includes(sub) ? "bg-[#2D31FA] text-white" : "bg-white/5 border border-white/10 text-white/50 hover:text-white"
                          }`}>
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : standard ? (
                  <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-3">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                      No schedules found for {standard}. Add subjects manually below.
                    </p>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <input type="text" placeholder="Type subject name and press Add" value={subjectInput}
                    onChange={e => setSubjectInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomSubject())}
                    className={inputCls + " flex-1"} />
                  <button type="button" onClick={addCustomSubject}
                    className="px-4 h-12 rounded-xl bg-[#2D31FA]/10 border border-[#2D31FA]/20 text-[#2D31FA] text-xs font-black hover:bg-[#2D31FA]/20 transition-all">
                    Add
                  </button>
                </div>
                {enrolledSubjects.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {enrolledSubjects.map(s => (
                      <span key={s} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2D31FA]/10 border border-[#2D31FA]/20 text-[#2D31FA] text-xs font-bold">
                        {s}
                        <button onClick={() => setEnrolledSubjects(p => p.filter(x => x !== s))} className="text-[#2D31FA]/60 hover:text-red-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-px bg-white/[0.06]" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2D31FA] px-1">Fee Management</p>
              <Field label="Fee Status">
                <select value={feeStatus} onChange={e => setFeeStatus(e.target.value as StudentDoc["feeStatus"])}
                  className={selectCls}>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (₹)">
                  <input type="number" placeholder="5000" value={feeAmount}
                    onChange={e => setFeeAmount(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Paid Date">
                  <input type="date" value={feePaidDate} onChange={e => setFeePaidDate(e.target.value)}
                    className={inputCls + " [color-scheme:dark]"} />
                </Field>
              </div>
              <Field label="Note">
                <input type="text" placeholder="e.g. Paid ₹5000 cash - Apr 2026" value={feeNote}
                  onChange={e => setFeeNote(e.target.value)} className={inputCls} />
              </Field>
              {feeStatus !== "paid" && (
                <div className="px-3 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                    Only "Paid" students can access attendance, notes, and dashboard features.
                  </p>
                </div>
              )}
            </div>
          )}
          {tab === "attendance" && (
            <div className="space-y-4 pb-6">
              {attendanceLoading ? <Loader /> : !attendance || attendance.total === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-8 h-8 text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 font-medium">No attendance records yet.</p>
                  <p className="text-white/20 text-xs mt-1">Staff marks attendance after each lecture.</p>
                </div>
              ) : (
                <>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-3xl font-black text-white">{Math.round((attendance.present / attendance.total) * 100)}%</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">
                      {attendance.present} present · {attendance.total - attendance.present} absent · {attendance.total} total
                    </p>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-3">
                      <div className="h-full rounded-full bg-[#2D31FA]"
                        style={{ width: `${Math.round((attendance.present / attendance.total) * 100)}%` }} />
                    </div>
                  </div>
                  {Object.entries(attendance.bySubject).map(([sub, data]) => (
                    <div key={sub} className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-white/50 w-28 truncate flex-shrink-0">{sub}</span>
                      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-[#2D31FA]"
                          style={{ width: `${Math.round((data.present / data.total) * 100)}%` }} />
                      </div>
                      <span className="text-[9px] font-black text-white/40 w-8 text-right flex-shrink-0">
                        {Math.round((data.present / data.total) * 100)}%
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        {tab === "enrollment" && (
          <div className="flex items-center gap-3 px-5 pb-6 pt-4 border-t border-white/[0.06] flex-shrink-0 bg-[#0A0A0F]">
            <Button onClick={handleSave} isLoading={saving}
              className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-sm bg-[#2D31FA] hover:bg-blue-500 active:scale-[0.98] transition-all">
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={onClose}
              className="h-12 rounded-xl bg-white/5 border-white/10 hover:bg-red-500/10 hover:text-red-400 active:scale-[0.98] text-white/60 font-black uppercase tracking-widest text-sm px-5 transition-all">
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ─── Home Section ─────────────────────────────────────────────────────────────
function HomeSection({ students, schedules, inquiries }: {
  students: StudentDoc[]; schedules: Schedule[]; inquiries: unknown[];
}) {
  const [announcement, setAnnouncement] = useState<{ _id: string; text: string } | null>(null);
  const [annText, setAnnText] = useState("");
  const [annLoading, setAnnLoading] = useState(false);

  useEffect(() => {
    fetch("/api/announcements").then(r => r.json()).then(d => { if (d?._id) setAnnouncement(d); }).catch((error) => {
      console.error("Failed to fetch announcements:", error);
    });
  }, []);

  const postAnn = async () => {
    if (!annText.trim()) return;
    setAnnLoading(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: annText }),
      });
      if (res.ok) { const d = await res.json(); setAnnouncement(d.data); setAnnText(""); }
      else {
        const errorData = await res.json();
        console.error("Failed to post announcement:", errorData);
        alert(errorData.message || "Failed to post announcement");
      }
    } catch (error) {
      console.error("Failed to post announcement:", error);
      alert("Network error. Please try again.");
    } finally { setAnnLoading(false); }
  };

  const clearAnn = async () => {
    if (!announcement) return;
    setAnnLoading(true);
    try {
      await fetch("/api/announcements", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: announcement._id }),
      });
      setAnnouncement(null);
    } catch (error) {
      console.error("Failed to delete announcement:", error);
      alert("Failed to delete announcement. Please try again.");
    } finally { setAnnLoading(false); }
  };

  const paid    = students.filter(s => s.feeStatus === "paid").length;
  const pending = students.filter(s => s.feeStatus === "pending").length;
  const months  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyCounts = new Array(12).fill(0);
  const yr = new Date().getFullYear();
  (inquiries as Array<{ created_at?: string }>).forEach(inq => {
    if (!inq.created_at) return;
    const d = new Date(inq.created_at);
    if (d.getFullYear() === yr) monthlyCounts[d.getMonth()]++;
  });

  const chartData = {
    labels: months,
    datasets: [{ label: "Inquiries", data: monthlyCounts, backgroundColor: "rgba(45,49,250,0.75)", borderRadius: 8, borderSkipped: false as const }],
  };
  const chartOptions = {
    responsive: true, plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "rgba(255,255,255,0.3)", font: { size: 10 } } },
      y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "rgba(255,255,255,0.3)", font: { size: 10 }, stepSize: 1 } },
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total Students", value: students.length },
          { label: "Paid", value: paid },
          { label: "Pending Fees", value: pending },
          { label: "Schedules", value: schedules.length },
        ].map(s => (
          <div key={s.label} className="neuro-card-dark rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-[#2D31FA]">{s.value}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="neuro-card-dark rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-[#2D31FA]" />
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Inquiry Trend — {yr}</span>
        </div>
        <Bar data={chartData} options={chartOptions} height={80} />
      </div>
      <div className="neuro-card-dark rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-[#2D31FA]" />
          <span className="text-[9px] font-black uppercase tracking-widest text-[#2D31FA]">Announcement</span>
        </div>
        {announcement ? (
          <div className="bg-[#2D31FA]/10 border border-[#2D31FA]/20 rounded-xl p-3 flex items-start justify-between gap-3">
            <p className="text-white/80 text-sm font-medium flex-1">{announcement.text}</p>
            <button onClick={clearAnn} disabled={annLoading}
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input type="text" placeholder="Post an announcement..." value={annText}
              onChange={e => setAnnText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && postAnn()}
              className={inputCls + " flex-1"} />
            <button onClick={postAnn} disabled={annLoading || !annText.trim()}
              className="px-4 h-12 rounded-xl bg-[#2D31FA] text-white text-xs font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-40 transition-all">
              Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Students Section ─────────────────────────────────────────────────────────
function StudentsSection({ students, schedules, onRefresh }: {
  students: StudentDoc[]; schedules: Schedule[]; onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "partial">("all");
  const [selected, setSelected] = useState<StudentDoc | null>(null);

  const filtered = students.filter(s => {
    const matchSearch = `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || s.feeStatus === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input type="text" placeholder="Search students..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-12 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-[#2D31FA]/60 outline-none pl-11 pr-4 text-sm font-medium transition-all" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {(["all", "paid", "pending", "partial"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f ? "bg-[#2D31FA] text-white" : "bg-white/5 border border-white/10 text-white/40 hover:text-white"
            }`}>
            {f}
          </button>
        ))}
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-white/20">{filtered.length} students</p>
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((s, i) => (
            <motion.button key={s._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelected(s)}
              className="w-full text-left neuro-card-dark rounded-2xl p-4 hover:border-[#2D31FA]/30 transition-all active:scale-[0.99]">
              <div className="flex items-center gap-3">
                {s.image ? (
                  <img src={s.image} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#2D31FA]/20 flex items-center justify-center text-[#2D31FA] font-black text-sm flex-shrink-0">
                    {s.first_name[0]}{s.last_name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-black text-sm truncate">{s.first_name} {s.last_name}</p>
                    <FeeBadge status={s.feeStatus} />
                  </div>
                  <p className="text-white/30 text-xs font-medium truncate">{s.email}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {s.standard && <span className="text-[8px] font-black uppercase tracking-widest text-[#2D31FA]">{s.standard}</span>}
                    {(s.enrolledSubjects?.length ?? 0) > 0 && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/20">
                        {s.enrolledSubjects!.length} subject{s.enrolledSubjects!.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      {selected && (
        <StudentDetailSheet student={selected} schedules={schedules}
          onClose={() => setSelected(null)} onSave={() => { onRefresh(); setSelected(null); }} />
      )}
    </div>
  );
}

// ─── Content Section ──────────────────────────────────────────────────────────
function ContentSection() {
  const [subTab, setSubTab] = useState<ContentSubTab>("faculty");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = subTab === "notes" ? "/api/admin/notes" : `/api/admin/${subTab}`;
      const res = await fetch(`${endpoint}?t=${Date.now()}`);
      const d = await res.json();
      setItems(Array.isArray(d) ? d : []);
    } catch {} finally { setLoading(false); }
  }, [subTab]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const endpoint = subTab === "notes" ? "/api/admin/notes" : `/api/admin/${subTab}`;
    await fetch(endpoint, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems(p => (p as Array<{ _id: string }>).filter(x => x._id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["faculty", "events", "toppers", "notes"] as ContentSubTab[]).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              subTab === t ? "bg-[#2D31FA] text-white" : "bg-white/5 text-white/40 hover:text-white"
            }`}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2D31FA] text-white text-xs font-black uppercase tracking-widest hover:bg-blue-500 active:scale-95 transition-all shadow-[0_0_30px_-8px_rgba(45,49,250,0.6)]">
          <Plus className="w-4 h-4" /> Add {subTab === "faculty" ? "Faculty" : subTab.slice(0, -1)}
        </button>

        {/* AI Note Generator removed for stability focus */}
      </div>
      {loading ? <Loader /> : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item._id} className="neuro-card-dark rounded-2xl p-4 flex items-center gap-3">
              {item.image && (
                <img src={item.image} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-sm truncate">
                  {item.title || item.name || "Untitled"}
                </p>
                <p className="text-white/30 text-xs font-medium truncate">
                  {item.role || item.date || item.subject || item.exam || item.standard}
                </p>
                {item.file_url && (
                  <div className="flex items-center gap-3 mt-1" onClick={e => e.stopPropagation()}>
                    <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                      className="text-[9px] font-black text-[#2D31FA] uppercase tracking-widest hover:underline">
                      View File
                    </a>
                    {subTab === "notes" && (
                      <button onClick={async () => {
                        const confirmSend = confirm(`Send push notification to all students for ${item.title}?`);
                        if (!confirmSend) return;
                        try {
                          const res = await fetch("/api/push/send", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              title: `New Note: ${item.title}`,
                              body: `A new ${item.subject || "subject"} note has been added for ${item.standard || "your class"}.`,
                              url: "/dashboard"
                            })
                          });
                          if (res.ok) alert("Notifications sent successfully!");
                          else alert("Failed to send notifications.");
                        } catch (err) {
                          alert("Error sending notifications.");
                        }
                      }}
                        className="text-[9px] font-black text-green-400 uppercase tracking-widest hover:underline border border-green-500/20 px-2 py-0.5 rounded-md bg-green-500/10">
                        Send to Students
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => handleDelete(item._id)}
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:bg-red-600 hover:text-white transition-all flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {items.length === 0 && <div className="text-center py-12"><p className="text-white/20 font-medium">No {subTab} yet.</p></div>}
        </div>
      )}
      <ContentModal open={modalOpen} onClose={() => setModalOpen(false)} subTab={subTab} onSuccess={fetchItems} />
    </div>
  );
}

// ─── Schedules Section ────────────────────────────────────────────────────────
function SchedulesSection({ schedules, loading, onRefresh }: {
  schedules: Schedule[]; loading: boolean; onRefresh: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Schedule | null>(null);
  const [search, setSearch] = useState("");

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this schedule?")) return;
    await fetch("/api/admin/schedules", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    onRefresh();
  };

  const filtered = schedules.filter(s =>
    s.standard.toLowerCase().includes(search.toLowerCase()) ||
    s.date.includes(search) || s.dayOfWeek.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, s) => {
    if (!acc[s.standard]) acc[s.standard] = [];
    acc[s.standard].push(s);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input type="text" placeholder="Search schedules..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-12 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-[#2D31FA]/60 outline-none pl-4 pr-4 text-sm font-medium transition-all" />
        </div>
        <button onClick={() => { setEditData(null); setModalOpen(true); }}
          className="press flex items-center gap-2 h-12 px-5 rounded-2xl bg-[#2D31FA] text-white text-xs font-black uppercase tracking-widest hover:bg-blue-500 active:scale-95 transition-all flex-shrink-0">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {loading ? <Loader /> : schedules.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 font-medium">No schedules yet.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([std, entries]) => (
          <div key={std} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#2D31FA]">{std}</span>
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[9px] font-black text-white/20">{entries.length} day{entries.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2">
              {entries.map(s => (
                <div key={s._id} className="neuro-card-dark rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#2D31FA]" />
                        <span className="text-white font-black text-sm">{formatDate(s.date)}</span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#2D31FA] mt-0.5 block">{s.dayOfWeek}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => { setEditData(s); setModalOpen(true); }}
                        className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-[#2D31FA]/20 hover:text-[#2D31FA] transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(s._id)}
                        className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-red-600 hover:text-white transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="h-px bg-white/[0.06] mb-3" />
                  <div className="space-y-2">
                    {s.slots.map((slot, j) => (
                      <div key={j} className="flex items-center justify-between gap-3">
                        <span className="text-white/80 font-bold text-sm">{slot.subject}</span>
                        <div className="flex items-center gap-1.5 text-white/40 text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      <ScheduleModal open={modalOpen} onClose={() => { setModalOpen(false); setEditData(null); }}
        onSuccess={onRefresh} editData={editData} />
    </div>
  );
}

// ─── Applications Section ─────────────────────────────────────────────────────
function ApplicationsSection() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "rejected">("all");
  const [search, setSearch] = useState("");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/join-faculty?t=${Date.now()}`);
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/join-faculty", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setApplications(prev =>
          prev.map(app => app._id === id ? { ...app, status } : app)
        );
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm("Delete this application?")) return;
    try {
      const res = await fetch("/api/join-faculty", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setApplications(prev => prev.filter(app => app._id !== id));
      }
    } catch (error) {
      console.error("Failed to delete application:", error);
      alert("Failed to delete application");
    }
  };

  const filtered = applications.filter(app => {
    const matchSearch = `${app.name} ${app.email} ${app.position}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || app.status === filter;
    return matchSearch && matchFilter;
  });

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20",
      reviewed: "bg-blue-500/20 text-blue-400 border-blue-500/20",
      rejected: "bg-red-500/20 text-red-400 border-red-500/20",
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${colors[status] || colors.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          type="text"
          placeholder="Search applications..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-12 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-[#2D31FA]/60 outline-none pl-11 pr-4 text-sm font-medium transition-all"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "reviewed", "rejected"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f ? "bg-[#2D31FA] text-white" : "bg-white/5 border border-white/10 text-white/40 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <p className="text-[9px] font-black uppercase tracking-widest text-white/20">
        {filtered.length} application{filtered.length !== 1 ? "s" : ""}
      </p>

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-3">
          {filtered.map((app, i) => (
            <motion.div
              key={app._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="neuro-card-dark rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="text-white font-black text-base">{app.name}</h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-white/60 text-sm font-medium flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-[#2D31FA]" />
                      {app.position}
                    </p>
                    <p className="text-white/40 text-xs font-medium">{app.email} • {app.phone}</p>
                    <p className="text-white/40 text-xs">
                      <span className="text-[#2D31FA] font-black">Experience:</span> {app.experience} • 
                      <span className="text-[#2D31FA] font-black ml-2">Qualification:</span> {app.qualification}
                    </p>
                    <p className="text-white/40 text-xs">
                      <span className="text-[#2D31FA] font-black">Subjects:</span> {app.subjects}
                    </p>
                    {app.message && (
                      <p className="text-white/30 text-xs italic mt-2 p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                        &quot;{app.message}&quot;
                      </p>
                    )}
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mt-2">
                      Submitted: {new Date(app.submittedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-white/[0.06]">
                {app.resumeUrl && (
                  <a
                    href={app.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D31FA]/10 border border-[#2D31FA]/20 text-[#2D31FA] text-[10px] font-black uppercase tracking-widest hover:bg-[#2D31FA]/20 transition-all"
                  >
                    <Download className="w-3 h-3" />
                    Download Resume
                  </a>
                )}
                <select
                  value={app.status}
                  onChange={e => updateStatus(app._id, e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
                >
                  <option value="pending" className="bg-black">Pending</option>
                  <option value="reviewed" className="bg-black">Reviewed</option>
                  <option value="rejected" className="bg-black">Rejected</option>
                </select>
                <button
                  onClick={() => deleteApplication(app._id)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/40 text-sm font-medium">No applications found</p>
        </div>
      )}
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("home");
  const [students, setStudents] = useState<StudentDoc[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [inquiries, setInquiries] = useState<unknown[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const { on, off } = useSocket();

  const fetchStudents = useCallback(async () => {
    try { 
      const res = await fetch(`/api/admin/students?t=${Date.now()}`); 
      const d = await res.json(); 
      setStudents(Array.isArray(d) ? d : []); 
    }
    catch (error) {
      console.error("Failed to fetch students:", error);
    } finally { setLoadingStudents(false); }
  }, []);

  const fetchSchedules = useCallback(async () => {
    try { 
      const res = await fetch(`/api/admin/schedules?t=${Date.now()}`); 
      const d = await res.json(); 
      setSchedules(Array.isArray(d) ? d : []); 
    }
    catch (error) {
      console.error("Failed to fetch schedules:", error);
    } finally { setLoadingSchedules(false); }
  }, []);

  const fetchInquiries = useCallback(async () => {
    try { 
      const res = await fetch(`/api/admin/inquiries?t=${Date.now()}`); 
      const d = await res.json(); 
      setInquiries(Array.isArray(d) ? d : []); 
    }
    catch (error) {
      console.error("Failed to fetch inquiries:", error);
    }
  }, []);

  useEffect(() => { fetchStudents(); fetchSchedules(); fetchInquiries(); }, [fetchStudents, fetchSchedules, fetchInquiries]);
  useEffect(() => {
    const h = () => fetchSchedules();
    on("schedules:updated", h);
    return () => off("schedules:updated", h);
  }, [on, off, fetchSchedules]);

  const NAV_TABS: Array<{ key: AdminTab; label: string; icon: React.ElementType }> = [
    { key: "home",      label: "Home",      icon: Home      },
    { key: "students",  label: "Students",  icon: Users     },
    { key: "content",   label: "Content",   icon: BookOpen  },
    { key: "schedules", label: "Schedules", icon: Calendar  },
    { key: "applications", label: "Applications", icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-black pb-28 overflow-x-hidden">
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#2D31FA]/10 border border-[#2D31FA]/20 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-[#2D31FA]" />
          </div>
          <div>
            <p className="text-white font-black text-sm tracking-tight leading-none">Gurukul Admin</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mt-0.5">Control Panel</p>
          </div>
        </div>
        <button onClick={onLogout}
          className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 transition-all">
          Exit
        </button>
      </div>

      <div className="px-4 pt-6 max-w-2xl mx-auto md:flex md:gap-8 md:max-w-6xl md:pt-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col gap-2 w-48 flex-shrink-0">
          {NAV_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all text-left ${
                activeTab === tab.key ? "bg-[#2D31FA] text-white" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}>
              {React.createElement(tab.icon, { className: "w-4 h-4 flex-shrink-0" })}
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {activeTab === "home" && <HomeSection students={students} schedules={schedules} inquiries={inquiries} />}
            {activeTab === "students" && (loadingStudents ? <Loader /> : <StudentsSection students={students} schedules={schedules} onRefresh={fetchStudents} />)}
            {activeTab === "content" && <ContentSection />}
            {activeTab === "schedules" && <SchedulesSection schedules={schedules} loading={loadingSchedules} onRefresh={fetchSchedules} />}
            {activeTab === "applications" && <ApplicationsSection />}
          </motion.div>
        </AnimatePresence>
        </div>
      </div>

      {/* Admin Bottom Nav — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] flex justify-center md:hidden"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="glass-pill flex items-center gap-1 px-3 py-2 rounded-[28px] shadow-[0_8px_40px_-8px_rgba(0,0,0,0.8)] mx-4"
          style={{ maxWidth: 360, width: "calc(100% - 2rem)" }}>
          {NAV_TABS.map((tab, i) => {
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="relative flex-1 flex flex-col items-center gap-[3px] py-1.5 transition-all active:scale-90 press"
                style={{ animationDelay: `${i * 60}ms` }}>
                <AnimatePresence>
                  {active && (
                    <motion.div layoutId="admin-nav-blob"
                      className="absolute inset-0 rounded-[18px] bg-[#2D31FA]"
                      initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }} />
                  )}
                </AnimatePresence>
                <div className="relative z-10 w-7 h-7 flex items-center justify-center">
                  {React.createElement(tab.icon, {
                    className: cn("w-4 h-4 transition-colors duration-200", active ? "text-white" : "text-white/40"),
                    strokeWidth: active ? 2.5 : 1.8,
                  })}
                </div>
                <span className={cn("relative z-10 text-[7px] font-black uppercase tracking-wider leading-none transition-colors duration-200",
                  active ? "text-white" : "text-white/25")}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </motion.div>
      </nav>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  if (!authed) return <AuthGate onAuth={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={() => setAuthed(false)} />;
}
