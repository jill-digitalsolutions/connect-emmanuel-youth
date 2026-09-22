import { getBanners } from "@/lib/queries/banners";
import { BannersClient } from "@/components/banners/BannersClient";

export default async function BannersPage() {
  const banners = await getBanners();
  return <BannersClient initialBanners={banners} />;
}
