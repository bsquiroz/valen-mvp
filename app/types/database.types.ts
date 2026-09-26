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
      profiles: {
        Row: {
          created_at: string
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
      admin_add_diagnostic_option: {
        Args: { p_label: Json; p_question_id: string; p_score: number }
        Returns: string
      }
      admin_create_diagnostic_question: {
        Args: {
          p_options: Json
          p_pillar: Database["public"]["Enums"]["pillar"]
          p_prompt: Json
        }
        Returns: string
      }
      admin_delete_diagnostic_option: {
        Args: { p_option_id: string }
        Returns: undefined
      }
      admin_reorder_diagnostic_questions: {
        Args: {
          p_ids: string[]
          p_pillar: Database["public"]["Enums"]["pillar"]
        }
        Returns: undefined
      }
      complete_diagnostic: { Args: { p_answers: Json }; Returns: string }
      compute_diagnostic_scores: {
        Args: { p_answers: Json }
        Returns: {
          pillar: Database["public"]["Enums"]["pillar"]
          score: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_localized_text: { Args: { value: Json }; Returns: boolean }
      is_valid_diagnostic_option: { Args: { value: Json }; Returns: boolean }
      preview_diagnostic: {
        Args: { p_answers: Json }
        Returns: {
          pillar: Database["public"]["Enums"]["pillar"]
          score: number
        }[]
      }
    }
    Enums: {
      app_role: "user" | "admin"
      pillar: "psychology" | "finance" | "fitness" | "relationships"
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
      app_role: ["user", "admin"],
      pillar: ["psychology", "finance", "fitness", "relationships"],
    },
  },
} as const
