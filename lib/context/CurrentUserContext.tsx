"use client";

import { createContext, useContext } from "react";
import type { Profile } from "@/lib/types/database.types";

const CurrentUserContext = createContext<Profile | null>(null);

export function CurrentUserProvider({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return <CurrentUserContext value={profile}>{children}</CurrentUserContext>;
}

export function useCurrentUser() {
  const profile = useContext(CurrentUserContext);
  if (!profile) throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  return profile;
}
