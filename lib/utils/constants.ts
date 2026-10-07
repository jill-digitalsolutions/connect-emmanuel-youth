import type { ColorTheme, CourseTrack, PostCategory } from "@/lib/types/database.types";

export const MESSENGER_URL = "https://www.messenger.com";
export const ZOOM_URL = "https://zoom.us/join";

export const CATEGORY_LABELS: Record<ColorTheme, string> = {
  amber: "Training",
  coral: "Fellowship",
  plum: "Announcement",
  moss: "Calendar",
};

export const POST_CATEGORY_COLOR: Record<PostCategory, ColorTheme> = {
  training: "amber",
  fellowship: "coral",
  announcement: "plum",
  calendar: "moss",
};

export const TRACK_ICONS: Record<CourseTrack, string> = {
  Leadership: "🧭",
  "Bible Study": "📖",
  "Media Team": "🎬",
  Worship: "🎵",
};

export const POSTER_GRADIENTS: Record<ColorTheme, string> = {
  amber: "linear-gradient(150deg,#F4B95C,#C97A20)",
  coral: "linear-gradient(150deg,#F17E70,#B83A2C)",
  plum: "linear-gradient(150deg,#8A67AA,#4A3162)",
  moss: "linear-gradient(150deg,#5FB187,#265E41)",
};

export const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: "Home" },
  { href: "/feed", label: "Feed & Announcements", icon: "Megaphone" },
  { href: "/training", label: "Training", icon: "GraduationCap" },
  { href: "/fellowship", label: "Fellowship", icon: "Video" },
  { href: "/banners", label: "Banners", icon: "Image" },
  { href: "/gallery", label: "Gallery", icon: "Images" },
  { href: "/calendar", label: "Calendar", icon: "Calendar" },
  { href: "/board", label: "Project Board", icon: "Kanban" },
  { href: "/messages", label: "Messages", icon: "MessageCircle" },
] as const;

export const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/home": { title: "Home", subtitle: "Everything your youth ministry runs on, in one place." },
  "/feed": { title: "Feed & Announcements", subtitle: "Post once — everyone sees it." },
  "/training": { title: "Training", subtitle: "Leadership webinars, seminars, and courses." },
  "/fellowship": { title: "Fellowship", subtitle: "Online gatherings, past and upcoming." },
  "/banners": { title: "Banners", subtitle: "Posters for upcoming activities, and the archive." },
  "/gallery": { title: "Gallery", subtitle: "Photos from the ministry, shared by everyone." },
  "/calendar": { title: "Calendar", subtitle: "Every activity, one view." },
  "/board": { title: "Project Board", subtitle: "Track who's doing what." },
  "/admin": { title: "Admin", subtitle: "Create accounts and manage who is an admin." },
  "/messages": { title: "Messages", subtitle: "Quick links to where the chat happens." },
};
