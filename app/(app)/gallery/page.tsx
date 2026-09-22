import { getGalleryData } from "@/lib/queries/photos";
import { getAllProfiles } from "@/lib/queries/profiles";
import { toProfileMap } from "@/lib/utils/profiles";
import { GalleryClient } from "@/components/gallery/GalleryClient";

export default async function GalleryPage() {
  const [data, profiles] = await Promise.all([getGalleryData(), getAllProfiles()]);
  return <GalleryClient initialData={data} profilesById={toProfileMap(profiles)} />;
}
