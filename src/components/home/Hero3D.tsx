"use client";

import { useEffect, useState } from "react";

export default function Hero3D() {
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, delay: number}>>([]);

  useEffect(() => {
    // Create sphere-like particle distribution
    const particleArray = Array.from({ length: 100 }, (_, i) => {
      const angle = (i / 100) * Math.PI * 2;
      const radius = 30 + Math.random() * 40;
      return {
        id: i,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 5
      };
    });
    setParticles(particleArray);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Rotating particle sphere effect */}
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '60s' }}>
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-[#2D31FA] animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: 0.6,
              animationDelay: `${particle.delay}s`,
              animationDuration: '3s',
              boxShadow: `0 0 ${particle.size * 3}px rgba(45, 49, 250, 0.4)`
            }}
          />
        ))}
      </div>
      
      {/* Central glow effect */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2D31FA]/10 rounded-full blur-3xl animate-pulse" 
           style={{ animationDuration: '4s' }} />
    </div>
  );
}