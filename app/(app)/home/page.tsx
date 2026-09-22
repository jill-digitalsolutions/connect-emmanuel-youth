import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getHomeData } from "@/lib/queries/home";
import { HeroCard } from "@/components/home/HeroCard";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { SectionHead } from "@/components/ui/SectionHead";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtDateStr, timeAgo } from "@/lib/utils/dates";
import { POST_CATEGORY_COLOR } from "@/lib/utils/constants";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
  const data = await getHomeData(user.id);

  const stats = [
    { label: "Announcements this month", value: data.postsThisMonth },
    { label: "Active trainings", value: data.activeCourses },
    { label: "Upcoming fellowships", value: data.upcomingSessions },
    { label: "Open tasks", value: data.openTasks },
  ];

  return (
    <div>
      <HeroCard name={profile?.name ?? "there"} stats={stats} />

      <div className="grid gap-4 tablet:grid-cols-2">
        <Card accent="coral">
          <Tag color="coral">Next fellowship</Tag>
          <div className="mt-2.5">
            {data.nextSession ? (
              <>
                <h4 className="m-0 mb-1 text-[15px] font-bold">{data.nextSession.title}</h4>
                <div className="text-[12.5px] text-text-soft">
                  {fmtDateStr(data.nextSession.date)}
                  {data.nextSession.time ? ` · ${data.nextSession.time}` : ""}
                </div>
              </>
            ) : (
              <div className="text-[13.5px] text-text-soft">Nothing scheduled yet.</div>
            )}
          </div>
        </Card>

        <Card accent="plum">
          <Tag color="plum">Latest announcement</Tag>
          <div className="mt-2.5">
            {data.latestPost ? (
              <>
                <h4 className="m-0 mb-1 text-[15px] font-bold">{data.latestPost.title}</h4>
                <div className="text-[12.5px] text-text-soft">{timeAgo(data.latestPost.created_at)}</div>
              </>
            ) : (
              <div className="text-[13.5px] text-text-soft">No announcements yet.</div>
            )}
          </div>
        </Card>
      </div>

      <SectionHead
        title="This week's calendar"
        action={
          <Link href="/calendar" className="text-[12.5px] font-bold text-text-soft underline">
            Open calendar
          </Link>
        }
      />
      <Card>
        {data.weekEvents.length === 0 ? (
          <EmptyState>Nothing on the calendar this week.</EmptyState>
        ) : (
          <div className="divide-y divide-line">
            {data.weekEvents.map((e) => (
              <div key={e.id} className="py-4 first:pt-0 last:pb-0">
                <div className="mb-1.5 flex items-center gap-2.5">
                  <Tag color={e.category} />
                  <span className="text-xs text-text-soft">{fmtDateStr(e.date)}</span>
                </div>
                <h4 className="m-0 text-[15.5px] font-bold">{e.title}</h4>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
