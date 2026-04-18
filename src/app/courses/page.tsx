"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Microscope, Calculator, Brain, ChevronRight, Zap, FlaskConical, Sigma, BookOpen, Leaf, Languages, Globe, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import VivusSVG from "@/components/ui/VivusSVG";

const COURSES = [
  {
    title: "CLASS 1–10",
    subtitle: "Gujarat Board / NCERT",
    icon: BookOpen,
    description: "Concept-first foundation for Gujarat Board and NCERT students — building the mental fortitude for future competitive battles.",
    features: ["Gujarat Board & NCERT", "Olympiad Focus", "Pre-JEE Track"],
    color: "bg-black"
  },
  {
    title: "JEE COACHING",
    subtitle: "Engineering Command",
    icon: Calculator,
    description: "An intensive Physics-Maths-Chemistry ecosystem designed to secure ranks in India's premier engineering institutes.",
    features: ["IITian Faculty", "JEE Advanced + Mains", "Pattern Analysis"],
    color: "bg-blue-600"
  },
  {
    title: "NEET COACHING",
    subtitle: "Medical Mastery",
    icon: Microscope,
    description: "Deep-dive biological sciences and clinical logic for aspirants aiming for AIIMS and top medical colleges.",
    features: ["Bio + Chemistry", "Doctor Mentorship", "NCERT Rigor"],
    color: "bg-[#2D31FA]"
  },
];

const SUBJECTS = [
  { icon: FlaskConical, label: "Physics" },
  { icon: Sigma, label: "Chemistry" },
  { icon: Calculator, label: "Mathematics" },
  { icon: Leaf, label: "Biology" },
  { icon: Languages, label: "English" },
  { icon: Globe, label: "Social Science" },
  { icon: BookMarked, label: "Hindi" },
];

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-black pt-28 md:pt-40 pb-20 px-4 md:px-6">
      <div className="container mx-auto max-w-7xl">

        {/* Cinematic Header — with Spline 3D accent top-right */}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20 mb-16 md:mb-32 items-end overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8 relative z-10"
          >
            <Badge variant="primary" className="bg-[#2D31FA]/10 text-[#2D31FA] border-none tracking-[0.4em]">Curriculum</Badge>
            <h1 className="font-black text-white tracking-tighter leading-[0.8] uppercase italic"
              style={{ fontSize: "clamp(3rem, 10vw, 9rem)" }}>
              WHAT WE <br />
              <span className="text-[#2D31FA]">TEACH.</span>
            </h1>
          </motion.div>

          {/* Spline 3D accent */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 space-y-6"
          >
            {/* CSS decorative accent */}
            <div className="absolute -top-20 -right-10 w-80 h-80 pointer-events-none opacity-70 hidden lg:block">
              <div className="w-full h-full bg-gradient-to-br from-[#2D31FA]/30 to-transparent rounded-full blur-2xl animate-bounce" style={{ animationDuration: '6s' }} />
            </div>
            <p className="text-lg md:text-2xl font-bold text-white/40 leading-tight max-w-md uppercase italic">
              Specialized tracks designed for objective-based academic excellence.
            </p>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
              JEE · NEET · Board Exams · Foundation
            </p>
          </motion.div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {COURSES.map((course, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-0 bg-white/[0.03] border border-white/10 rounded-[48px] md:rounded-[60px] overflow-hidden group hover:bg-white/[0.05] transition-all duration-700 h-full flex flex-col">
                <div className="p-8 md:p-12 flex-1 flex flex-col justify-between">
                  <div className="space-y-12">
                    <div className={cn(
                      "w-20 h-20 rounded-[32px] flex items-center justify-center text-white shadow-2xl transition-all duration-500 group-hover:rotate-12",
                      course.color
                    )}>
                      <course.icon className="w-10 h-10" />
                    </div>

                    <div className="space-y-4">
                      <p className="text-[#2D31FA] text-xs font-black uppercase tracking-[0.4em]">{course.subtitle}</p>
                      <h3 className="text-5xl font-black text-white tracking-tighter">{course.title}</h3>
                      <p className="text-white/40 font-medium leading-relaxed italic">&quot;{course.description}&quot;</p>
                    </div>

                    <div className="space-y-4">
                      {course.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-4 text-white/60">
                          <Zap className="w-4 h-4 text-[#2D31FA]" />
                          <span className="text-xs font-bold uppercase tracking-widest">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-10 md:mt-16">
                    <Link href="/admissions">
                      <Button className="w-full h-16 rounded-[24px] group/btn">
                        Enroll Now
                        <ChevronRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="h-2 bg-gradient-to-r from-transparent via-[#2D31FA]/30 to-transparent" />
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Subjects Grid — with Vivus SVG draw-on-scroll */}
        <div className="mt-16 md:mt-32 pt-20 border-t border-white/5">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 space-y-4"
          >
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#2D31FA]">Subjects Offered</h2>
            <h3 className="text-3xl md:text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase leading-[0.9]">
              EVERY SUBJECT. <br />MASTERED.
            </h3>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
            {SUBJECTS.map((subject, i) => (
              <motion.div
                key={subject.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white/[0.03] border border-white/10 rounded-[24px] md:rounded-[32px] p-4 md:p-8 flex flex-col items-center gap-3 md:gap-4 hover:bg-white/[0.07] transition-colors duration-500 group"
              >
                <VivusSVG className="w-10 h-10 text-[#2D31FA]">
                  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
                    <circle cx="20" cy="20" r="18" stroke="#2D31FA" strokeWidth="2" />
                    <path d="M12 20 L20 12 L28 20 L20 28 Z" stroke="#2D31FA" strokeWidth="1.5" fill="none" />
                  </svg>
                </VivusSVG>
                <subject.icon className="w-6 h-6 text-[#2D31FA] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60 text-center">{subject.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Global Stats Footer */}
        <div className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 py-20 border-t border-white/5">
          {[
            { label: "Success Ratio", value: "94%" },
            { label: "Top Ranks", value: "250+" },
            { label: "Faculty Scholars", value: "45+" },
            { label: "Weekly Tests", value: "100%" }
          ].map((stat, i) => (
            <div key={i} className="text-center md:text-left space-y-2">
              <h4 className="text-xs font-black text-white/20 uppercase tracking-[0.4em]">{stat.label}</h4>
              <p className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">{stat.value}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
