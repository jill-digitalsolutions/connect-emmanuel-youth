import { Card } from "@/components/ui/Card";
import { MESSENGER_URL, ZOOM_URL } from "@/lib/utils/constants";

const TILES = [
  {
    href: MESSENGER_URL,
    label: "Messenger — Main group chat",
    hint: "Open Messenger",
    bg: "#0084FF",
    initial: "M",
  },
  {
    href: ZOOM_URL,
    label: "Zoom — Join a live fellowship",
    hint: "See the Fellowship tab for the current link",
    bg: "#2D8CFF",
    initial: "Z",
  },
];

export default function MessagesPage() {
  return (
    <Card>
      <p className="m-0 mb-3.5 text-[13.5px] text-text-soft">
        Day-to-day chatting still happens where your group already lives. These jump straight there —
        everything else (training, schedules, files, posters) stays organized here in CONNECT.
      </p>
      <div className="grid gap-3">
        {TILES.map((t) => (
          <a
            key={t.href}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 rounded-xl border border-line bg-surface p-4 no-underline transition hover:bg-page"
          >
            <div
              className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] font-extrabold text-white"
              style={{ background: t.bg }}
            >
              {t.initial}
            </div>
            <div>
              <div className="text-sm font-extrabold text-text">{t.label}</div>
              <div className="text-xs text-text-soft">{t.hint}</div>
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
}
