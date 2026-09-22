export function HeroCard({
  name,
  stats,
}: {
  name: string;
  stats: { label: string; value: number }[];
}) {
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return (
    <div className="relative mb-5.5 overflow-hidden rounded-[18px] bg-ink p-7 text-[#EFEDFB]">
      <div
        className="pointer-events-none absolute -top-[40%] -right-[10%] h-80 w-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(232,163,61,.35), transparent 70%)" }}
      />
      <h2 className="font-display relative m-0 mb-1.5 text-[26px] font-semibold">Hi {firstName}!</h2>
      <p className="relative m-0 max-w-[46ch] text-[14.5px] leading-relaxed text-[#B9B6DA]">
        One home for training, fellowship, announcements, and planning — so nothing gets buried in a
        group chat again.
      </p>
      <div className="relative mt-5 flex flex-wrap gap-6.5">
        {stats.map((s) => (
          <div key={s.label}>
            <b className="font-display block text-2xl font-semibold">{s.value}</b>
            <span className="text-xs text-[#9C99BE]">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
