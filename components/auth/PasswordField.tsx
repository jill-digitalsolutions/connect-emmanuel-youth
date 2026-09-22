"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export function PasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-white/70" />
      <input
        type={visible ? "text" : "password"}
        name="password"
        placeholder="Password"
        required
        autoComplete="current-password"
        className="w-full rounded-full border border-white/15 bg-white/10 py-3.5 pr-12 pl-11 text-[15px] text-white placeholder:text-white/60 backdrop-blur-sm focus:border-white/40 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-4 -translate-y-1/2 text-white/70 hover:text-white"
      >
        {visible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
}
