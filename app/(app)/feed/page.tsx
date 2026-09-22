import { getPosts } from "@/lib/queries/posts";
import { getAllProfiles } from "@/lib/queries/profiles";
import { toProfileMap } from "@/lib/utils/profiles";
import { FeedClient } from "@/components/feed/FeedClient";

export default async function FeedPage() {
  const [posts, profiles] = await Promise.all([getPosts(), getAllProfiles()]);
  return <FeedClient initialPosts={posts} profilesById={toProfileMap(profiles)} />;
}
