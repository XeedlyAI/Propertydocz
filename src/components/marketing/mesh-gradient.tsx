"use client";

import { motion } from "framer-motion";

export function MeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0C0F14] via-[#1A1A2E] to-[#0C0F14]" />

      {/* Animated orbs */}
      <motion.div
        className="absolute -top-[40%] -left-[20%] h-[80%] w-[60%] rounded-full bg-[#38b6ff]/8 blur-[120px]"
        animate={{
          x: [0, 40, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute -bottom-[30%] -right-[10%] h-[70%] w-[50%] rounded-full bg-[#38b6ff]/6 blur-[100px]"
        animate={{
          x: [0, -30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-[20%] right-[20%] h-[40%] w-[30%] rounded-full bg-[#1A1A2E]/80 blur-[80px]"
        animate={{
          x: [0, -20, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
