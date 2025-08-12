export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
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
      packs: {
        Row: {
          available: boolean
          created_at: string | null
          id: string
          limit_per_student: number
          name: string
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
          price?: number
          probability_common?: number
          probability_legendary?: number
          probability_mythic?: number
          probability_rare?: number
          updated_at?: string | null
        }
        Relationships: []
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
            foreignKeyName: "reward_logs_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "trades_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buy_card: {
        Args: { card_id: string; user_id: string }
        Returns: Json
      }
      create_event: {
        Args: {
          name: string
          description: string
          start_date: string
          end_date: string
          bonus_multiplier: number
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
      update_event: {
        Args: {
          event_id: string
          name: string
          description: string
          start_date: string
          end_date: string
          bonus_multiplier: number
        }
        Returns: boolean
      }
      update_user_coins: {
        Args: { user_id: string; amount: number }
        Returns: undefined
      }
    }
    Enums: {
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
      card_rarity: ["common", "rare", "legendary", "mythic"],
      trade_status: ["pending", "accepted", "rejected"],
      user_role: ["student", "teacher", "admin"],
    },
  },
} as const
