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
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          username?: string | null;
          avatar_url?: string | null;
          role?: Role;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          username?: string | null;
          avatar_url?: string | null;
          role?: Role;
          created_at?: string;
        };
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
      login_email_for_username: {
        Args: { p_username: string };
        Returns: string | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
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
