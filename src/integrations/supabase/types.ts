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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_config: {
        Row: {
          config_key: string
          config_value: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cards: {
        Row: {
          available: boolean
          copies_available: number | null
          created_at: string | null
          description: string | null
          event_id: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          rarity: Database["public"]["Enums"]["card_rarity"]
          updated_at: string | null
        }
        Insert: {
          available?: boolean
          copies_available?: number | null
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number
          rarity: Database["public"]["Enums"]["card_rarity"]
          updated_at?: string | null
        }
        Update: {
          available?: boolean
          copies_available?: number | null
          created_at?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          rarity?: Database["public"]["Enums"]["card_rarity"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cards_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_cards: {
        Row: {
          card_id: string
          event_id: string
        }
        Insert: {
          card_id: string
          event_id: string
        }
        Update: {
          card_id?: string
          event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_cards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          bonus_coins: number | null
          bonus_multiplier: number
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          bonus_coins?: number | null
          bonus_multiplier?: number
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          bonus_coins?: number | null
          bonus_multiplier?: number
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pack_cards: {
        Row: {
          card_id: string
          created_at: string | null
          id: string
          pack_id: string
          quantity: number
        }
        Insert: {
          card_id: string
          created_at?: string | null
          id?: string
          pack_id: string
          quantity?: number
        }
        Update: {
          card_id?: string
          created_at?: string | null
          id?: string
          pack_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "pack_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_cards_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_purchases: {
        Row: {
          cards_received: Json
          coins_spent: number
          id: string
          pack_id: string
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          cards_received?: Json
          coins_spent: number
          id?: string
          pack_id: string
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          cards_received?: Json
          coins_spent?: number
          id?: string
          pack_id?: string
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_purchases_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
      packs: {
        Row: {
          available: boolean
          created_at: string | null
          id: string
          limit_per_student: number
          name: string
          pack_type: string
          price: number
          probability_common: number
          probability_legendary: number
          probability_mythic: number
          probability_rare: number
          updated_at: string | null
        }
        Insert: {
          available?: boolean
          created_at?: string | null
          id?: string
          limit_per_student?: number
          name: string
          pack_type?: string
          price: number
          probability_common?: number
          probability_legendary?: number
          probability_mythic?: number
          probability_rare?: number
          updated_at?: string | null
        }
        Update: {
          available?: boolean
          created_at?: string | null
          id?: string
          limit_per_student?: number
          name?: string
          pack_type?: string
          price?: number
          probability_common?: number
          probability_legendary?: number
          probability_mythic?: number
          probability_rare?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string
          id: string
          option_order: number
          option_text: string
          poll_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_order?: number
          option_text: string
          poll_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_order?: number
          option_text?: string
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          allow_multiple_votes: boolean
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          event_id: string | null
          id: string
          is_active: boolean
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_multiple_votes?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          event_id?: string | null
          id?: string
          is_active?: boolean
          start_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          allow_multiple_votes?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          event_id?: string | null
          id?: string
          is_active?: boolean
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          class: string | null
          coins: number
          created_at: string | null
          email: string
          id: string
          name: string
          ra: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          class?: string | null
          coins?: number
          created_at?: string | null
          email: string
          id?: string
          name: string
          ra?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          class?: string | null
          coins?: number
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          ra?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          answered_at: string | null
          attempt_id: string
          id: string
          is_correct: boolean
          points_earned: number
          question_id: string
          user_answer: string
        }
        Insert: {
          answered_at?: string | null
          attempt_id: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id: string
          user_answer: string
        }
        Update: {
          answered_at?: string | null
          attempt_id?: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id?: string
          user_answer?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          coins_earned: number
          completed_at: string | null
          id: string
          is_completed: boolean
          quiz_id: string
          score: number
          started_at: string | null
          time_taken_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          coins_earned?: number
          completed_at?: string | null
          id?: string
          is_completed?: boolean
          quiz_id: string
          score?: number
          started_at?: string | null
          time_taken_seconds?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          coins_earned?: number
          completed_at?: string | null
          id?: string
          is_completed?: boolean
          quiz_id?: string
          score?: number
          started_at?: string | null
          time_taken_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          id: string
          options: Json | null
          points: number
          question_order: number
          question_text: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          id?: string
          options?: Json | null
          points?: number
          question_order?: number
          question_text: string
          question_type?: string
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          id?: string
          options?: Json | null
          points?: number
          question_order?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          max_attempts: number | null
          reward_coins: number
          time_limit_minutes: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_attempts?: number | null
          reward_coins?: number
          time_limit_minutes?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_attempts?: number | null
          reward_coins?: number
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reward_logs: {
        Row: {
          coins: number
          created_at: string | null
          id: string
          reason: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          coins: number
          created_at?: string | null
          id?: string
          reason: string
          student_id: string
          teacher_id: string
        }
        Update: {
          coins?: number
          created_at?: string | null
          id?: string
          reason?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_logs_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_logs_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_logs_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          target_user_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          created_at: string | null
          from_user_id: string
          id: string
          offered_cards: Json | null
          offered_coins: number | null
          requested_cards: Json | null
          requested_coins: number | null
          status: Database["public"]["Enums"]["trade_status"]
          to_user_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_user_id: string
          id?: string
          offered_cards?: Json | null
          offered_coins?: number | null
          requested_cards?: Json | null
          requested_coins?: number | null
          status?: Database["public"]["Enums"]["trade_status"]
          to_user_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_user_id?: string
          id?: string
          offered_cards?: Json | null
          offered_coins?: number | null
          requested_cards?: Json | null
          requested_coins?: number | null
          status?: Database["public"]["Enums"]["trade_status"]
          to_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cards: {
        Row: {
          acquired_at: string | null
          card_id: string
          id: string
          quantity: number
          user_id: string
        }
        Insert: {
          acquired_at?: string | null
          card_id: string
          id?: string
          quantity?: number
          user_id: string
        }
        Update: {
          acquired_at?: string | null
          card_id?: string
          id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      collection_stats_view: {
        Row: {
          card_id: string | null
          owners_count: number | null
          total_owned: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      rankings_secure: {
        Row: {
          coins: number | null
          created_at: string | null
          id: string | null
          name: string | null
        }
        Relationships: []
      }
      rankings_view: {
        Row: {
          coins: number | null
          created_at: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          coins?: number | null
          created_at?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          coins?: number | null
          created_at?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      buy_card: {
        Args: { card_id: string; user_id: string }
        Returns: Json
      }
      buy_pack: {
        Args: { pack_id: string; user_id: string }
        Returns: Json
      }
      complete_quiz: {
        Args: { attempt_id: string; user_id: string }
        Returns: Json
      }
      create_event: {
        Args: {
          bonus_multiplier: number
          description: string
          end_date: string
          name: string
          start_date: string
        }
        Returns: string
      }
      create_poll_with_options: {
        Args: {
          allow_multiple: boolean
          end_date: string
          options: string[]
          poll_description: string
          poll_event_id: string
          poll_title: string
        }
        Returns: string
      }
      delete_event: {
        Args: { event_id: string }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_poll_results: {
        Args: { poll_id: string }
        Returns: {
          option_id: string
          option_order: number
          option_text: string
          vote_count: number
        }[]
      }
      get_user_role_secure: {
        Args: { user_uuid: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_email: {
        Args: { email_to_check: string }
        Returns: boolean
      }
      update_event: {
        Args: {
          bonus_multiplier: number
          description: string
          end_date: string
          event_id: string
          name: string
          start_date: string
        }
        Returns: boolean
      }
      update_quiz_score: {
        Args: { attempt_id: string; points_to_add: number }
        Returns: undefined
      }
      update_user_coins: {
        Args: { amount: number; user_id: string }
        Returns: undefined
      }
      update_user_role_secure: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"]
          reason?: string
          target_user_id: string
        }
        Returns: boolean
      }
      vote_in_poll: {
        Args: { option_ids: string[]; poll_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
      card_rarity: "common" | "rare" | "legendary" | "mythic"
      trade_status: "pending" | "accepted" | "rejected"
      user_role: "student" | "teacher" | "admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "teacher", "student"],
      card_rarity: ["common", "rare", "legendary", "mythic"],
      trade_status: ["pending", "accepted", "rejected"],
      user_role: ["student", "teacher", "admin"],
    },
  },
} as const
