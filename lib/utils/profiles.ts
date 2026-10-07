import type { Profile } from "@/lib/types/database.types";

export type ProfileLite = Pick<Profile, "name" | "avatar_url"> & { username?: string | null };

export function toProfileMap(profiles: Profile[]): Map<string, ProfileLite> {
  return new Map(
    profiles.map((p) => [p.id, { name: p.name, avatar_url: p.avatar_url, username: p.username }])
  );
}
