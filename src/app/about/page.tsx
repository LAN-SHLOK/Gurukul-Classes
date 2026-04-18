"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { GraduationCap, Target, Sparkles, BookOpen, Trophy } from "lucide-react";
import gsap from "gsap";
import { annotate } from "rough-notation";
import VivusSVG from "@/components/ui/VivusSVG";

const STATS = [
  { value: "1200+", label: "Students" },
  { value: "15+",   label: "Faculty" },
  { value: "98%",   label: "Results" },
  { value: "12+",   label: "Years" },
];

export default function AboutPage() {
  const headingRef   = useRef<HTMLHeadingElement>(null);
  const estRef       = useRef<HTMLSpanElement>(null);
  const annotated    = useRef(false);

  useEffect(() => {
    if (!headingRef.current) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.from(headingRef.current, {
      opacity: 0,
      y: prefersReduced ? 0 : 60,
      duration: prefersReduced ? 0 : 1,
      ease: "power3.out",
      delay: 0.1,
    });
  }, []);

  // Rough Notation on "Est. 2011"
  useEffect(() => {
    if (!estRef.current || annotated.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !annotated.current) {
          annotated.current = true;
          const annotation = annotate(estRef.current!, {
            type: "circle",
            color: "#2D31FA",
            strokeWidth: 3,
            animationDuration: 800,
            padding: 8,
          });
          annotation.show();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(estRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#F2F2F2] pt-28 md:pt-40 pb-20 px-4 md:px-6">
      <div className="container mx-auto max-w-7xl">

        {/* Hero — with Spline 3D decorative scene */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20 mb-24 items-end">
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge variant="primary">The Guru Legacy</Badge>
            </motion.div>
            <h1
              ref={headingRef}
              className="font-black text-black tracking-tighter leading-[0.8] uppercase italic"
              style={{ fontSize: "clamp(3.5rem, 10vw, 9rem)" }}
            >
              OUR <br />
              <span className="text-[#2D31FA]">STORY.</span>
            </h1>
          </div>

          <div className="relative">
            {/* CSS 3D decorative */}
            <div className="absolute -top-10 right-0 w-72 h-72 pointer-events-none opacity-60 hidden lg:block">
              <div className="w-full h-full bg-gradient-to-br from-[#2D31FA]/20 to-transparent rounded-full blur-3xl animate-pulse" />
            </div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-400 leading-tight max-w-md"
            >
              Since <span ref={estRef} className="font-black text-black">2011</span>, we have been crafting the next generation of academic warriors and global thinkers.
            </motion.p>
          </div>
        </div>

        {/* Vivus SVG divider */}
        <VivusSVG className="mb-16 opacity-20">
          <svg width="100%" height="24" viewBox="0 0 800 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 12 Q200 0 400 12 Q600 24 800 12" stroke="#2D31FA" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        </VivusSVG>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-24">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-10 text-center shadow-sm hover:shadow-xl transition-shadow duration-500"
            >
              <p className="text-3xl md:text-5xl font-black text-[#2D31FA] tracking-tighter">{stat.value}</p>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Mission bento */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-24">
          <Card className="md:col-span-8 p-8 md:p-12 bg-black text-white rounded-[48px] md:rounded-[60px] border-none flex flex-col justify-between min-h-[400px] md:min-h-[500px] group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#2D31FA]/10 blur-[120px] rounded-full group-hover:bg-[#2D31FA]/20 transition-all duration-1000 pointer-events-none" />
            <Sparkles className="w-12 h-12 text-[#2D31FA]" />
            <div className="space-y-8 relative z-10">
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight uppercase">OUR MISSION.</h2>
              <p className="text-lg md:text-xl lg:text-2xl font-medium text-gray-400 leading-relaxed max-w-2xl">
                To bridge the gap between traditional wisdom and future technology. We empower students to conquer competitive exams through a blend of intense discipline and creative analytical thinking.
              </p>
            </div>
          </Card>

          <Card className="md:col-span-4 p-8 md:p-12 bg-[#2D31FA] text-white rounded-[48px] md:rounded-[60px] border-none flex flex-col justify-center items-center text-center space-y-6 md:space-y-8 group hover:scale-[0.98] transition-transform duration-500">
            <div className="w-24 h-24 bg-white/20 rounded-[32px] flex items-center justify-center">
              <Target className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-4xl font-black uppercase tracking-tighter leading-none italic">Precision <br /> Focused.</h3>
            <p className="font-bold opacity-80">Every student is a unique project of excellence.</p>
          </Card>
        </div>

        {/* Timeline — "Est. 2011" gets Rough Notation highlight */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20 py-20 border-t border-black/5 mb-24">
          <div className="lg:sticky lg:top-40 h-fit space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#2D31FA]">Historical Trajectory</h2>
            <h3 className="text-5xl md:text-6xl font-black text-black tracking-tighter uppercase leading-[0.9]">OUR <br />EVOLUTION.</h3>
            <p className="text-lg font-bold text-gray-400">Chronicles of a decade and a half in shaping minds.</p>
          </div>

          <div className="space-y-24">
            {[
              { year: "2011", title: "Genesis", desc: "Started with a vision of 10 students in a single room with a goal of perfect conceptual clarity." },
              { year: "2016", title: "Expansion", desc: "Moved to a premium facility to accommodate 200+ achievers across varied scientific disciplines." },
              { year: "2021", title: "Digital Integration", desc: "First in class to integrate AI diagnostics to predict board and entrance outcomes." },
              { year: "2026", title: "Global Nexus", desc: "Connecting Ahmedabad to international academic benchmarks through hybrid brilliance." },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.6 }}
                className="space-y-4 group"
              >
                <span className="text-8xl font-black text-black/5 group-hover:text-[#2D31FA]/10 transition-colors duration-500 italic uppercase block">
                  {step.year}
                </span>
                <h4 className="text-3xl font-black text-black uppercase tracking-tighter">{step.title}</h4>
                <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-md">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Why us */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { icon: GraduationCap, title: "Scholars", text: "Batches led by IITians and career specialists." },
            { icon: BookOpen,      title: "Vault",    text: "Proprietary research-backed study ecosystem." },
            { icon: Trophy,        title: "Results",  text: "Top-tier selections across JEE and NEET." },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="p-8 md:p-12 bg-white rounded-[40px] md:rounded-[50px] shadow-sm hover:shadow-2xl transition-all duration-700 group cursor-default"
            >
              <div className="w-16 h-16 bg-[#F2F2F2] rounded-2xl flex items-center justify-center mb-10 group-hover:bg-[#2D31FA] group-hover:text-white transition-all duration-500">
                <item.icon className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-black uppercase tracking-tighter mb-4">{item.title}</h4>
              <p className="text-gray-400 font-bold leading-tight">{item.text}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
