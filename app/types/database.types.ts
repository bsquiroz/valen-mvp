export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      challenge_checkins: {
        Row: {
          challenge_id: string
          created_at: string
          day: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          day: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          day?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_checkins_user_id_challenge_id_fkey"
            columns: ["user_id", "challenge_id"]
            isOneToOne: false
            referencedRelation: "challenge_enrollments"
            referencedColumns: ["user_id", "challenge_id"]
          },
        ]
      }
      challenge_enrollments: {
        Row: {
          challenge_id: string
          completed_at: string | null
          started_at: string
          target_days: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          started_at?: string
          target_days: number
          user_id?: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          started_at?: string
          target_days?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_enrollments_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: Json
          duration_days: number
          id: string
          is_active: boolean
          pillar: Database["public"]["Enums"]["pillar"]
          position: number
          title: Json
        }
        Insert: {
          created_at?: string
          description: Json
          duration_days: number
          id?: string
          is_active?: boolean
          pillar: Database["public"]["Enums"]["pillar"]
          position: number
          title: Json
        }
        Update: {
          created_at?: string
          description?: Json
          duration_days?: number
          id?: string
          is_active?: boolean
          pillar?: Database["public"]["Enums"]["pillar"]
          position?: number
          title?: Json
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          description: Json
          id: string
          is_active: boolean
          pillar: Database["public"]["Enums"]["pillar"]
          position: number
          title: Json
        }
        Insert: {
          created_at?: string
          description: Json
          id?: string
          is_active?: boolean
          pillar: Database["public"]["Enums"]["pillar"]
          position: number
          title: Json
        }
        Update: {
          created_at?: string
          description?: Json
          id?: string
          is_active?: boolean
          pillar?: Database["public"]["Enums"]["pillar"]
          position?: number
          title?: Json
        }
        Relationships: []
      }
      diagnostic_answers: {
        Row: {
          attempt_id: string
          option_id: string
          question_id: string
        }
        Insert: {
          attempt_id: string
          option_id: string
          question_id: string
        }
        Update: {
          attempt_id?: string
          option_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_answers_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_attempts: {
        Row: {
          completed_at: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      diagnostic_options: {
        Row: {
          id: string
          label: Json
          position: number
          question_id: string
          score: number
        }
        Insert: {
          id?: string
          label: Json
          position: number
          question_id: string
          score: number
        }
        Update: {
          id?: string
          label?: Json
          position?: number
          question_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_questions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          pillar: Database["public"]["Enums"]["pillar"]
          position: number
          prompt: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          pillar: Database["public"]["Enums"]["pillar"]
          position: number
          prompt: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          pillar?: Database["public"]["Enums"]["pillar"]
          position?: number
          prompt?: Json
        }
        Relationships: []
      }
      diagnostic_scores: {
        Row: {
          attempt_id: string
          pillar: Database["public"]["Enums"]["pillar"]
          score: number
        }
        Insert: {
          attempt_id: string
          pillar: Database["public"]["Enums"]["pillar"]
          score: number
        }
        Update: {
          attempt_id?: string
          pillar?: Database["public"]["Enums"]["pillar"]
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_scores_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          page: string | null
          status: Database["public"]["Enums"]["feedback_status"]
          type: Database["public"]["Enums"]["feedback_type"]
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          page?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          type: Database["public"]["Enums"]["feedback_type"]
          user_agent?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          page?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          type?: Database["public"]["Enums"]["feedback_type"]
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          lesson_id: string
          user_id?: string
        }
        Update: {
          completed_at?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          description: Json | null
          duration_seconds: number | null
          id: string
          is_active: boolean
          position: number
          title: Json
          video_id: string
          video_provider: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: Json | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          position: number
          title: Json
          video_id: string
          video_provider?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: Json | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          position?: number
          title?: Json
          video_id?: string
          video_provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_step_templates: {
        Row: {
          created_at: string
          description: Json | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["plan_step_kind"]
          levels: Database["public"]["Enums"]["score_level"][]
          pillar: Database["public"]["Enums"]["pillar"]
          position: number
          title: Json
        }
        Insert: {
          created_at?: string
          description?: Json | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["plan_step_kind"]
          levels: Database["public"]["Enums"]["score_level"][]
          pillar: Database["public"]["Enums"]["pillar"]
          position: number
          title: Json
        }
        Update: {
          created_at?: string
          description?: Json | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["plan_step_kind"]
          levels?: Database["public"]["Enums"]["score_level"][]
          pillar?: Database["public"]["Enums"]["pillar"]
          position?: number
          title?: Json
        }
        Relationships: []
      }
      plan_steps: {
        Row: {
          completed_at: string | null
          created_at: string
          template_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          template_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "plan_step_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          diagnostic_retake_allowed: boolean
          display_name: string
          id: string
          last_diagnostic_at: string | null
          locale: string
          role: Database["public"]["Enums"]["app_role"]
          theme: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnostic_retake_allowed?: boolean
          display_name?: string
          id: string
          last_diagnostic_at?: string | null
          locale?: string
          role?: Database["public"]["Enums"]["app_role"]
          theme?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnostic_retake_allowed?: boolean
          display_name?: string
          id?: string
          last_diagnostic_at?: string | null
          locale?: string
          role?: Database["public"]["Enums"]["app_role"]
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_challenge_usage: {
        Args: never
        Returns: {
          challenge_id: string
          completed: number
          started: number
        }[]
      }
      admin_lesson_usage: {
        Args: never
        Returns: {
          lesson_id: string
          users: number
        }[]
      }
      admin_plan_step_usage: {
        Args: never
        Returns: {
          template_id: string
          users: number
        }[]
      }
      admin_save_challenges: {
        Args: { p_challenges: Json }
        Returns: undefined
      }
      admin_save_courses: { Args: { p_courses: Json }; Returns: undefined }
      admin_save_diagnostic: { Args: { p_questions: Json }; Returns: undefined }
      admin_save_plan_steps: { Args: { p_steps: Json }; Returns: undefined }
      challenge_check_in: {
        Args: { p_challenge_id: string; p_day: string }
        Returns: undefined
      }
      complete_diagnostic: { Args: { p_answers: Json }; Returns: string }
      completed_lesson: { Args: { p_lesson_id: string }; Returns: boolean }
      compute_diagnostic_scores: {
        Args: { p_answers: Json }
        Returns: {
          pillar: Database["public"]["Enums"]["pillar"]
          score: number
        }[]
      }
      dev_allow_diagnostic_retake: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      enrolled_in_challenge: {
        Args: { p_challenge_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_localized_text: { Args: { value: Json }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_valid_diagnostic_option: { Args: { value: Json }; Returns: boolean }
      is_valid_plan_step_levels: {
        Args: { p_levels: Database["public"]["Enums"]["score_level"][] }
        Returns: boolean
      }
      lesson_is_active: { Args: { p_lesson_id: string }; Returns: boolean }
      lesson_is_unlocked: { Args: { p_lesson_id: string }; Returns: boolean }
      preview_diagnostic: {
        Args: { p_answers: Json }
        Returns: {
          pillar: Database["public"]["Enums"]["pillar"]
          score: number
        }[]
      }
      rebuild_plan: {
        Args: { p_attempt_id: string; p_user_id: string }
        Returns: undefined
      }
      save_plan_progress: {
        Args: { p_changes: Json }
        Returns: {
          completed_at: string
          template_id: string
        }[]
      }
      score_level: {
        Args: { p_score: number }
        Returns: Database["public"]["Enums"]["score_level"]
      }
      start_challenge: { Args: { p_challenge_id: string }; Returns: undefined }
      started_course: { Args: { p_course_id: string }; Returns: boolean }
      submit_feedback: {
        Args: {
          p_message: string
          p_page: string
          p_type: Database["public"]["Enums"]["feedback_type"]
          p_user_agent: string
        }
        Returns: string
      }
      super_admin_list_admins: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
        }[]
      }
      super_admin_list_feedback: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
          message: string
          page: string
          status: Database["public"]["Enums"]["feedback_status"]
          type: Database["public"]["Enums"]["feedback_type"]
          user_agent: string
          user_id: string
        }[]
      }
      super_admin_set_feedback_status: {
        Args: {
          p_id: string
          p_status: Database["public"]["Enums"]["feedback_status"]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "admin" | "super_admin"
      feedback_status: "new" | "in_review" | "resolved" | "dismissed"
      feedback_type: "suggestion" | "bug" | "complaint" | "improvement"
      pillar: "psychology" | "finance" | "fitness" | "relationships"
      plan_step_kind: "action" | "lesson" | "challenge" | "session"
      score_level: "low" | "medium" | "high"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin", "super_admin"],
      feedback_status: ["new", "in_review", "resolved", "dismissed"],
      feedback_type: ["suggestion", "bug", "complaint", "improvement"],
      pillar: ["psychology", "finance", "fitness", "relationships"],
      plan_step_kind: ["action", "lesson", "challenge", "session"],
      score_level: ["low", "medium", "high"],
    },
  },
} as const
