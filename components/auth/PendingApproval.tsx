"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoginBackground } from "@/components/auth/LoginBackground";
import { createClient } from "@/lib/supabase/client";

export function PendingApproval({ name }: { name: string }) {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-10">
      <LoginBackground />
      <div className="w-full max-w-[400px] text-center text-white">
        <Image
          src="/brand/runners-mark.png"
          alt="CONNECT logo"
          width={220}
          height={155}
          priority
          className="mx-auto h-auto w-[130px] drop-shadow-[0_0_14px_rgba(255,255,255,0.3)]"
        />
        <h1 className="font-display mt-2 text-[28px] font-bold">Waiting for approval</h1>
        <p className="mt-3 text-[14.5px] text-white/80">
          Thanks for signing up, {name}! An admin needs to approve your account before you can enter CONNECT.
          Check back soon.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="rounded-full bg-gradient-to-r from-accent-from to-accent-to py-3.5 text-[15px] font-bold text-white shadow-lg shadow-accent-from/30 transition hover:brightness-105"
          >
            Check again
          </button>
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-white/20 py-3 text-[14px] font-semibold text-white/80 hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
