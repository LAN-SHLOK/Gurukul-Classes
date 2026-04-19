"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, X, Loader2, FileText, CheckCircle2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface AINoteGeneratorProps {
  onSuccess: (data: { title: string; subject: string; standard: string; file_url: string }) => void;
  standards: string[];
}

export default function AINoteGenerator({ onSuccess, standards }: AINoteGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [standard, setStandard] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "preview" | "done">("input");
  const [generatedContent, setGeneratedContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, title, subject, standard }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedContent(data.content || "PDF generated successfully.");
        setFileUrl(data.file_url || "");
        setStep("preview");
      } else {
        alert(data.error || "Generation failed");
      }
    } catch (err) {
      alert("Error connecting to AI service");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setStep("done");
    onSuccess({ title, subject, standard, file_url: fileUrl });
    setTimeout(() => {
      setIsOpen(false);
      setStep("input");
      setPrompt("");
      setGeneratedContent("");
      setFileUrl("");
    }, 2000);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-purple-600 to-[#2D31FA] text-white border-none shadow-[0_0_20px_-5px_rgba(45,49,250,0.5)] group"
      >
        <Wand2 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
        Generate with AI
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0A0A0F] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">AI Note Architect</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Admin Pro Tier</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-8">
                {step === "input" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 px-1">What should we create?</label>
                        <textarea
                            placeholder="e.g. Generate a comprehensive note on Quantization of Charge for Class 12 Science with examples and JEE tips."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full h-32 bg-white/[0.04] border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:border-purple-500/60 outline-none p-4 text-sm font-medium transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Subject (Optional)</label>
                            <Input placeholder="Physics" value={subject} onChange={e => setSubject(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Standard (Optional)</label>
                            <select 
                                value={standard} 
                                onChange={e => setStandard(e.target.value)}
                                className="w-full h-12 bg-white/[0.04] border border-white/10 rounded-xl text-white px-4 text-sm font-medium"
                            >
                                <option value="" className="bg-black">Select...</option>
                                {standards.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <Button 
                        onClick={handleGenerate} 
                        isLoading={loading}
                        className="w-full h-14 bg-gradient-to-r from-purple-600 to-[#2D31FA] rounded-2xl font-black uppercase tracking-widest"
                    >
                        {loading ? "Architecting Your Notes..." : "Generate Perfect PDF"}
                    </Button>
                  </div>
                )}

                {step === "preview" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 mb-4">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-sm font-bold">PDF Generated Successfully!</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-sm text-white/60 leading-relaxed whitespace-pre-wrap font-medium">
                        {generatedContent}
                    </div>

                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => setStep("input")} className="flex-1 h-12 rounded-xl text-white/50">
                            Back
                        </Button>
                        <Button onClick={handleSave} className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-xs">
                            Confirm & Add to Notes
                        </Button>
                    </div>
                  </div>
                )}

                {step === "done" && (
                   <div className="py-20 flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h4 className="text-2xl font-black text-white italic">Notes Added!</h4>
                        <p className="text-white/30 text-xs uppercase tracking-widest font-black">Syncing with Library...</p>
                   </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
