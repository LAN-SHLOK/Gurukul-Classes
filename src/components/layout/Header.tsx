"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight, LogIn, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";

const NAV_LINKS = [
  { name: "About",      href: "/about"      },
  { name: "Courses",    href: "/courses"    },
  { name: "Faculty",    href: "/faculty"    },
  { name: "Events",     href: "/events"     },
  { name: "Admissions", href: "/admissions" },
  { name: "Contact",    href: "/contact"    },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Hide on admin and staff pages
  if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-4 md:pt-6 px-4 md:px-6 pointer-events-none">
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "w-full max-w-5xl pointer-events-auto rounded-full transition-all duration-500 flex items-center justify-between border shadow-2xl",
            "h-14 md:h-16 px-4 md:px-8",
            isScrolled
              ? "bg-black/95 backdrop-blur-2xl border-white/20"
              : "bg-black/80 backdrop-blur-xl border-white/10"
          )}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 group h-full py-2">
            <div className="h-8 md:h-full aspect-square bg-white rounded-xl p-1 shadow-xl transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="Gurukul Classes" className="h-full w-auto object-contain" />
            </div>
            <span className="font-black text-base md:text-xl tracking-tighter text-white">
              Gurukul<span className="text-[#2D31FA]">.</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            {NAV_LINKS.map((link) => (
              <Link key={link.name} href={link.href}
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.25em] transition-all",
                  pathname === link.href ? "text-[#2D31FA]" : "text-white/70 hover:text-white"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Auth button */}
            {session ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    {session.user?.image ? (
                      <img src={session.user.image} alt="" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#2D31FA] flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="hidden md:block text-[10px] font-black text-white/70 uppercase tracking-widest max-w-[80px] truncate">
                      {session.user?.name?.split(" ")[0]}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="hidden md:flex w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#2D31FA] text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-[0_0_20px_-6px_rgba(45,49,250,0.6)]">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </div>
              </Link>
            )}

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white transition-all active:scale-95"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={menuOpen ? "x" : "menu"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </motion.nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-3 top-20 z-[160] bg-[#0A0A0F] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl md:hidden"
            >
              <div className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2D31FA]">Navigation</p>
                <button onClick={() => setMenuOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-4 py-4 space-y-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.div key={link.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link href={link.href} onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-4 py-4 rounded-2xl transition-all",
                        pathname === link.href ? "bg-[#2D31FA]/10 text-[#2D31FA]" : "text-white hover:bg-white/5"
                      )}
                    >
                      <span className="text-lg font-black uppercase tracking-tight">{link.name}</span>
                      <ChevronRight className={cn("w-5 h-5", pathname === link.href ? "text-[#2D31FA]" : "text-white/20")} />
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Auth + Admin in mobile menu */}
              <div className="px-4 pb-6 pt-2 border-t border-white/5 mt-2 space-y-2">
                {session ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#2D31FA]/10 text-[#2D31FA]">
                      {session.user?.image
                        ? <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" />
                        : <User className="w-4 h-4" />}
                      <span className="text-xs font-black uppercase tracking-widest">{session.user?.name?.split(" ")[0] || "Dashboard"}</span>
                    </Link>
                    <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 text-red-400 hover:bg-red-500/10 transition-all">
                      <LogOut className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
                    </button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#2D31FA] text-white">
                    <span className="text-xs font-black uppercase tracking-widest">Student Login</span>
                    <LogIn className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
