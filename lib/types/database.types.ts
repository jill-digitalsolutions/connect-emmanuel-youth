// Hand-authored to match supabase/migrations/0001_schema.sql.
// Once the Supabase project is linked, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > lib/types/database.types.ts

export type Role = "member" | "admin";
export type PostCategory = "training" | "fellowship" | "announcement" | "calendar";
export type CourseTrack = "Leadership" | "Bible Study" | "Media Team" | "Worship";
export type TaskStatus = "todo" | "doing" | "done";
export type ColorTheme = "amber" | "coral" | "plum" | "moss";
export type ImageFit = "contain" | "cover";
export type ImagePosition = "center" | "top" | "bottom" | "left" | "right";
export type TextPosition = "top" | "center" | "bottom";
export type TextAlign = "left" | "center" | "right";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          username: string | null;
          role: Role;
          approved?: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          username?: string | null;
          avatar_url?: string | null;
          role?: Role;
          approved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          username?: string | null;
          avatar_url?: string | null;
          role?: Role;
          approved?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      ministries: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["ministries"]["Insert"]>;
        Relationships: [];
      };
      ministry_members: {
        Row: { id: string; ministry_id: string; user_id: string; role: string; created_at: string };
        Insert: { id?: string; ministry_id: string; user_id: string; role?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["ministry_members"]["Insert"]>;
        Relationships: [];
      };
      profile_private: {
        Row: { user_id: string; address: string | null; updated_at: string };
        Insert: { user_id: string; address?: string | null; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["profile_private"]["Insert"]>;
        Relationships: [];
      };
      course_modules: {
        Row: { id: string; course_id: string; position: number; title: string; created_at: string };
        Insert: { id?: string; course_id: string; position: number; title: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["course_modules"]["Insert"]>;
        Relationships: [];
      };
      course_topics: {
        Row: {
          id: string; course_id: string; module_id: string; position: number; title: string;
          pdf_path: string | null; pdf_name: string | null; youtube_url: string | null; created_at: string;
        };
        Insert: {
          id?: string; course_id: string; module_id: string; position: number; title: string;
          pdf_path?: string | null; pdf_name?: string | null; youtube_url?: string | null; created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["course_topics"]["Insert"]>;
        Relationships: [];
      };
      course_enrollments: {
        Row: { id: string; course_id: string; user_id: string; status: EnrollmentStatus; requested_at: string; decided_at: string | null };
        Insert: { id?: string; course_id: string; user_id: string; status?: EnrollmentStatus; requested_at?: string; decided_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["course_enrollments"]["Insert"]>;
        Relationships: [];
      };
      topic_completions: {
        Row: { id: string; user_id: string; topic_id: string; course_id: string; completed_at: string };
        Insert: { id?: string; user_id: string; topic_id: string; course_id: string; completed_at?: string };
        Update: Partial<Database["public"]["Tables"]["topic_completions"]["Insert"]>;
        Relationships: [];
      };
      topic_unlocks: {
        Row: { id: string; user_id: string; topic_id: string; unlocked_at: string };
        Insert: { id?: string; user_id: string; topic_id: string; unlocked_at?: string };
        Update: Partial<Database["public"]["Tables"]["topic_unlocks"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: { id: string; kind: NotificationKind; title: string; body: string | null; link: string | null; actor_id: string | null; created_at: string };
        Insert: { id?: string; kind: NotificationKind; title: string; body?: string | null; link?: string | null; actor_id?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      notification_state: {
        Row: { user_id: string; seen_at: string };
        Insert: { user_id: string; seen_at?: string };
        Update: Partial<Database["public"]["Tables"]["notification_state"]["Insert"]>;
        Relationships: [];
      };
      notification_prefs: {
        Row: { user_id: string; announcements: boolean; banners: boolean; fellowship: boolean; reminders: boolean };
        Insert: { user_id: string; announcements?: boolean; banners?: boolean; fellowship?: boolean; reminders?: boolean };
        Update: Partial<Database["public"]["Tables"]["notification_prefs"]["Insert"]>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: { id: string; user_id: string; endpoint: string; p256dh: string; auth: string; created_at: string };
        Insert: { id?: string; user_id: string; endpoint: string; p256dh: string; auth: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]>;
        Relationships: [];
      };
      session_reminders: {
        Row: { session_id: string; sent_at: string };
        Insert: { session_id: string; sent_at?: string };
        Update: Partial<Database["public"]["Tables"]["session_reminders"]["Insert"]>;
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Insert"]>;
        Relationships: [];
      };
      chat_reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: ChatEmoji;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          emoji: ChatEmoji;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_reactions"]["Insert"]>;
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          title: string;
          body: string | null;
          category: PostCategory;
          author_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body?: string | null;
          category: PostCategory;
          author_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          id: string;
          title: string;
          track: CourseTrack;
          total_modules: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          track: CourseTrack;
          total_modules: number;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
        Relationships: [];
      };
      course_progress: {
        Row: {
          id: string;
          course_id: string;
          user_id: string;
          modules_done: number;
        };
        Insert: {
          id?: string;
          course_id: string;
          user_id: string;
          modules_done?: number;
        };
        Update: Partial<Database["public"]["Tables"]["course_progress"]["Insert"]>;
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          title: string;
          date: string;
          time: string | null;
          video_link: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          date: string;
          time?: string | null;
          video_link?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
        Relationships: [];
      };
      banners: {
        Row: {
          id: string;
          title: string;
          event_date_label: string;
          image_url: string | null;
          color_theme: ColorTheme;
          is_past: boolean;
          created_at: string;
          image_fit?: ImageFit;
          image_position?: ImagePosition;
          text_position?: TextPosition;
          text_align?: TextAlign;
          event_date?: string | null;
          event_end_date?: string | null;
          image_x?: number;
          image_y?: number;
          image_zoom?: number;
        };
        Insert: {
          id?: string;
          title: string;
          event_date_label?: string;
          image_url?: string | null;
          color_theme: ColorTheme;
          is_past?: boolean;
          created_at?: string;
          image_fit?: ImageFit;
          image_position?: ImagePosition;
          text_position?: TextPosition;
          text_align?: TextAlign;
          event_date?: string | null;
          event_end_date?: string | null;
          image_x?: number;
          image_y?: number;
          image_zoom?: number;
        };
        Update: Partial<Database["public"]["Tables"]["banners"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          date: string;
          category: ColorTheme;
          related_post_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          date: string;
          category: ColorTheme;
          related_post_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          status: TaskStatus;
          assignee_id: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          status?: TaskStatus;
          assignee_id?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          image_url: string;
          caption: string | null;
          uploaded_by: string;
          album: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          caption?: string | null;
          uploaded_by: string;
          album?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["photos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "photos_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      photo_likes: {
        Row: {
          id: string;
          photo_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          photo_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["photo_likes"]["Insert"]>;
        Relationships: [];
      };
      photo_comments: {
        Row: {
          id: string;
          photo_id: string;
          user_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          photo_id: string;
          user_id: string;
          body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["photo_comments"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      username_taken: {
        Args: { p_username: string };
        Returns: boolean;
      };
      topic_available: {
        Args: { p_user: string; p_topic: string };
        Returns: boolean;
      };
      set_my_avatar: {
        Args: { p_url: string };
        Returns: undefined;
      };
      login_email_for_username: {
        Args: { p_username: string };
        Returns: string | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type NotificationKind = "announcement" | "banner" | "fellowship" | "reminder";
export type EnrollmentStatus = "pending" | "approved" | "declined";
export type ChatEmoji = "heart" | "like" | "laugh" | "sad";
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AppNotification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationPrefs = Database["public"]["Tables"]["notification_prefs"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
export type ChatReaction = Database["public"]["Tables"]["chat_reactions"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type CourseProgress = Database["public"]["Tables"]["course_progress"]["Row"];
export type FellowshipSession = Database["public"]["Tables"]["sessions"]["Row"];
export type Banner = Database["public"]["Tables"]["banners"]["Row"];
export type CalendarEvent = Database["public"]["Tables"]["events"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Photo = Database["public"]["Tables"]["photos"]["Row"];
export type PhotoLike = Database["public"]["Tables"]["photo_likes"]["Row"];
export type PhotoComment = Database["public"]["Tables"]["photo_comments"]["Row"];
