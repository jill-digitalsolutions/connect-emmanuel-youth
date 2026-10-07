import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { LoginBackground } from "@/components/auth/LoginBackground";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
      <LoginBackground />

      <div className="w-full max-w-[400px]">
        <div className="mb-2 flex flex-col items-center">
          <Image
            src="/brand/runners-mark.png"
            alt="CONNECT logo"
            width={220}
            height={155}
            priority
            className="h-auto w-[170px] drop-shadow-[0_0_16px_rgba(255,255,255,0.3)]"
          />
          <h1 className="font-display mt-1 text-[42px] font-bold tracking-wide text-white">
            CONN<span className="text-accent-to">E</span>CT
          </h1>
          <p className="mt-1 text-[13px] font-semibold tracking-[0.25em] text-white/85">
            EMMANUEL RUNNERS
          </p>
        </div>

        <form action={login} className="mt-8 flex flex-col gap-3.5">
          {notice === "check-email" && (
            <p className="rounded-xl bg-white/10 px-4 py-2 text-center text-[13px] text-white">
              Check your email to confirm your account, then log in.
            </p>
          )}
          {notice === "confirmed" && (
            <p className="rounded-xl bg-white/10 px-4 py-2 text-center text-[13px] text-white">
              Email confirmed. Log in with your email and password.
            </p>
          )}
          {error && (
            <p className="rounded-xl bg-coral/20 px-4 py-2 text-center text-[13px] text-white">
              {error}
            </p>
          )}

          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-white/70" />
            <input
              type="text"
              name="email"
              placeholder="Email or Username"
              required
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full rounded-full border border-white/15 bg-white/10 py-3.5 pl-11 text-[15px] text-white placeholder:text-white/60 backdrop-blur-sm focus:border-white/40 focus:outline-none"
            />
          </div>

          <PasswordField />

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-[13px] font-semibold text-accent-to hover:underline">
              Forgot Password?
            </Link>
          </div>

          <SubmitButton label="Log In" pendingLabel="Logging in…" />

          <div className="my-2 flex items-center gap-3 text-[11px] font-bold tracking-[0.15em] text-white/60">
            <span className="h-px flex-1 bg-white/20" />
            OR CONTINUE WITH
            <span className="h-px flex-1 bg-white/20" />
          </div>

          <OAuthButtons />
        </form>
      </div>
    </div>
  );
}
