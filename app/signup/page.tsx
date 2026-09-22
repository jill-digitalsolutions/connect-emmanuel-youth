import Image from "next/image";
import Link from "next/link";
import { Mail, User } from "lucide-react";
import { LoginBackground } from "@/components/auth/LoginBackground";
import { PasswordField } from "@/components/auth/PasswordField";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
      <LoginBackground />

      <div className="w-full max-w-[400px]">
        <div className="mb-2 flex flex-col items-center">
          <Image
            src="/brand/connect-mark.png"
            alt="CONNECT logo"
            width={220}
            height={155}
            priority
            className="h-auto w-[150px]"
          />
          <h1 className="font-display -mt-1 text-[32px] font-bold tracking-wide text-white">
            Create your account
          </h1>
          <p className="mt-1 text-[13px] font-semibold tracking-[0.2em] text-white/85">
            EMMANUEL YOUTH
          </p>
        </div>

        <form action={signup} className="mt-8 flex flex-col gap-3.5">
          {error && (
            <p className="rounded-xl bg-coral/20 px-4 py-2 text-center text-[13px] text-white">
              {error}
            </p>
          )}

          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-white/70" />
            <input
              type="text"
              name="name"
              placeholder="Full name"
              required
              autoComplete="name"
              className="w-full rounded-full border border-white/15 bg-white/10 py-3.5 pl-11 text-[15px] text-white placeholder:text-white/60 backdrop-blur-sm focus:border-white/40 focus:outline-none"
            />
          </div>

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

          <PasswordField />

          <button
            type="submit"
            className="mt-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-from to-accent-to py-3.5 text-[15px] font-bold text-white shadow-lg shadow-accent-from/30 transition hover:brightness-105"
          >
            Create Account <span aria-hidden>→</span>
          </button>

          <p className="mt-2 text-center text-[13px] text-white/70">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-accent-to hover:underline">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
