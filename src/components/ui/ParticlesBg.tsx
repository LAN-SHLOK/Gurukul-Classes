"use client";

import { useEffect, useState } from "react";

export default function ParticlesBg() {
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, opacity: number, delay: number}>>([]);

  useEffect(() => {
    // Create more sophisticated animated particles
    const particleArray = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      opacity: Math.random() * 0.4 + 0.1,
      delay: Math.random() * 5
    }));
    setParticles(particleArray);
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Animated particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-[#2D31FA] animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
            boxShadow: `0 0 ${particle.size * 2}px rgba(45, 49, 250, 0.3)`
          }}
        />
      ))}
      
      {/* Floating connection lines */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={`line-${i}`}
            className="absolute bg-gradient-to-r from-transparent via-[#2D31FA]/15 to-transparent animate-pulse"
            style={{
              left: `${Math.random() * 80}%`,
              top: `${Math.random() * 80}%`,
              width: `${80 + Math.random() * 120}px`,
              height: '1px',
              transform: `rotate(${Math.random() * 360}deg)`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2D31FA]/5 via-transparent to-[#2D31FA]/5 animate-pulse" 
           style={{ animationDuration: '8s' }} />
      
      {/* Floating orbs for extra ambiance */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`orb-${i}`}
          className="absolute rounded-full bg-[#2D31FA]/20 blur-sm animate-bounce"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            width: `${20 + Math.random() * 40}px`,
            height: `${20 + Math.random() * 40}px`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${6 + Math.random() * 4}s`
          }}
        />
      ))}
    </div>
  );
}