"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { LoginBackground } from "@/components/auth/LoginBackground";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!email) return;

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
      setMessage("Check your email for a link to reset your password.");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
      <LoginBackground />

      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center">
          <Image
            src="/brand/connect-mark-v2.png"
            alt="CONNECT logo"
            width={220}
            height={155}
            priority
            className="h-auto w-[150px]"
          />
          <h1 className="font-display -mt-1 text-[28px] font-bold text-white">Reset your password</h1>
          <p className="mt-2 text-center text-[13.5px] text-white/70">
            Enter your email and we&apos;ll send you a link to reset it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {message && (
            <p
              className={`rounded-xl px-4 py-2 text-center text-[13px] text-white ${
                status === "error" ? "bg-coral/20" : "bg-moss/25"
              }`}
            >
              {message}
            </p>
          )}

          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-white/70" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              autoComplete="email"
              className="w-full rounded-full border border-white/15 bg-white/10 py-3.5 pl-11 text-[15px] text-white placeholder:text-white/60 backdrop-blur-sm focus:border-white/40 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="mt-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-from to-accent-to py-3.5 text-[15px] font-bold text-white shadow-lg shadow-accent-from/30 transition hover:brightness-105"
          >
            Send Reset Link
          </button>

          <p className="mt-2 text-center text-[13px] text-white/70">
            <Link href="/login" className="font-semibold text-accent-to hover:underline">
              Back to Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
