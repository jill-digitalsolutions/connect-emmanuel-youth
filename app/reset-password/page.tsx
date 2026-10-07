"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LoginBackground } from "@/components/auth/LoginBackground";
import { PasswordField } from "@/components/auth/PasswordField";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      router.push("/home");
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
          <h1 className="font-display -mt-1 text-[28px] font-bold text-white">Set a new password</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {message && (
            <p className="rounded-xl bg-coral/20 px-4 py-2 text-center text-[13px] text-white">
              {message}
            </p>
          )}

          <PasswordField />

          <button
            type="submit"
            disabled={status === "saving"}
            className="mt-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-from to-accent-to py-3.5 text-[15px] font-bold text-white shadow-lg shadow-accent-from/30 transition hover:brightness-105 disabled:opacity-60"
          >
            {status === "saving" ? "Saving…" : "Save Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
