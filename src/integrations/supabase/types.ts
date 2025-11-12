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
      achievement_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
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
      bank: {
        Row: {
          coins_in_circulation: number
          created_at: string | null
          id: string
          total_coins: number
          updated_at: string | null
        }
        Insert: {
          coins_in_circulation?: number
          created_at?: string | null
          id?: string
          total_coins?: number
          updated_at?: string | null
        }
        Update: {
          coins_in_circulation?: number
          created_at?: string | null
          id?: string
          total_coins?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      card_achievements: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          is_active: boolean
          name: string
          objective_type: string
          objective_value: number
          reward_card_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          is_active?: boolean
          name: string
          objective_type: string
          objective_value: number
          reward_card_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          objective_type?: string
          objective_value?: number
          reward_card_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_achievements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_achievements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_achievements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_achievements_reward_card_id_fkey"
            columns: ["reward_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          assigned_to: string | null
          available: boolean
          copies_available: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          event_id: string | null
          id: string
          image_url: string | null
          is_special: boolean | null
          name: string
          price: number
          rarity: Database["public"]["Enums"]["card_rarity"]
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          available?: boolean
          copies_available?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          image_url?: string | null
          is_special?: boolean | null
          name: string
          price?: number
          rarity: Database["public"]["Enums"]["card_rarity"]
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          available?: boolean
          copies_available?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          image_url?: string | null
          is_special?: boolean | null
          name?: string
          price?: number
          rarity?: Database["public"]["Enums"]["card_rarity"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cards_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      class_invites: {
        Row: {
          class_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          invite_code: string
          is_active: boolean | null
          max_uses: number | null
          uses_count: number | null
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          invite_code: string
          is_active?: boolean | null
          max_uses?: number | null
          uses_count?: number | null
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          is_active?: boolean | null
          max_uses?: number | null
          uses_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "class_invites_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      class_messages: {
        Row: {
          class_id: string
          created_at: string
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_messages_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      class_students: {
        Row: {
          added_at: string | null
          added_by: string
          class_id: string
          id: string
          student_id: string
        }
        Insert: {
          added_at?: string | null
          added_by: string
          class_id: string
          id?: string
          student_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string
          class_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          additional_teachers: string[] | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          additional_teachers?: string[] | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_teachers?: string[] | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      custom_badges: {
        Row: {
          badge_level: string | null
          color: string
          created_at: string | null
          created_by: string
          description: string
          icon: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          badge_level?: string | null
          color?: string
          created_at?: string | null
          created_by: string
          description: string
          icon: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          badge_level?: string | null
          color?: string
          created_at?: string | null
          created_by?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_coin_config: {
        Row: {
          amount: number
          created_at: string
          enabled: boolean
          friday: boolean
          id: string
          monday: boolean
          reset_weekly: boolean
          saturday: boolean
          sunday: boolean
          target_role: string
          thursday: boolean
          tuesday: boolean
          updated_at: string
          wednesday: boolean
        }
        Insert: {
          amount?: number
          created_at?: string
          enabled?: boolean
          friday?: boolean
          id?: string
          monday?: boolean
          reset_weekly?: boolean
          saturday?: boolean
          sunday?: boolean
          target_role?: string
          thursday?: boolean
          tuesday?: boolean
          updated_at?: string
          wednesday?: boolean
        }
        Update: {
          amount?: number
          created_at?: string
          enabled?: boolean
          friday?: boolean
          id?: string
          monday?: boolean
          reset_weekly?: boolean
          saturday?: boolean
          sunday?: boolean
          target_role?: string
          thursday?: boolean
          tuesday?: boolean
          updated_at?: string
          wednesday?: boolean
        }
        Relationships: []
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
      exclusive_card_history: {
        Row: {
          card_id: string
          granted_at: string
          granted_by: string
          id: string
          metadata: Json | null
          reason: string
          user_id: string
        }
        Insert: {
          card_id: string
          granted_at?: string
          granted_by: string
          id?: string
          metadata?: Json | null
          reason: string
          user_id: string
        }
        Update: {
          card_id?: string
          granted_at?: string
          granted_by?: string
          id?: string
          metadata?: Json | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exclusive_card_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exclusive_card_history_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exclusive_card_history_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exclusive_card_history_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exclusive_card_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exclusive_card_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exclusive_card_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          installment_number: number
          is_automatic: boolean | null
          loan_id: string
          paid_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          installment_number: number
          is_automatic?: boolean | null
          loan_id: string
          paid_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          installment_number?: number
          is_automatic?: boolean | null
          loan_id?: string
          paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          amount: number
          counter_installments: number | null
          counter_payment_method: string | null
          counter_status: string | null
          created_at: string | null
          debt_forgiven: boolean | null
          forgiven_at: string | null
          forgiven_by: string | null
          id: string
          installments: number | null
          installments_paid: number | null
          interest_rate: number | null
          is_overdue: boolean | null
          next_payment_date: string | null
          payment_method: string | null
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["loan_status"]
          student_id: string
          total_with_interest: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          counter_installments?: number | null
          counter_payment_method?: string | null
          counter_status?: string | null
          created_at?: string | null
          debt_forgiven?: boolean | null
          forgiven_at?: string | null
          forgiven_by?: string | null
          id?: string
          installments?: number | null
          installments_paid?: number | null
          interest_rate?: number | null
          is_overdue?: boolean | null
          next_payment_date?: string | null
          payment_method?: string | null
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          student_id: string
          total_with_interest?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          counter_installments?: number | null
          counter_payment_method?: string | null
          counter_status?: string | null
          created_at?: string | null
          debt_forgiven?: boolean | null
          forgiven_at?: string | null
          forgiven_by?: string | null
          id?: string
          installments?: number | null
          installments_paid?: number | null
          interest_rate?: number | null
          is_overdue?: boolean | null
          next_payment_date?: string | null
          payment_method?: string | null
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          student_id?: string
          total_with_interest?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_forgiven_by_fkey"
            columns: ["forgiven_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_forgiven_by_fkey"
            columns: ["forgiven_by"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_forgiven_by_fkey"
            columns: ["forgiven_by"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      market_listings: {
        Row: {
          card_id: string
          created_at: string | null
          expires_at: string
          id: string
          price: number
          seller_id: string
          sold_at: string | null
          sold_to: string | null
          status: Database["public"]["Enums"]["listing_status"]
          updated_at: string | null
        }
        Insert: {
          card_id: string
          created_at?: string | null
          expires_at?: string
          id?: string
          price: number
          seller_id: string
          sold_at?: string | null
          sold_to?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string | null
        }
        Update: {
          card_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          price?: number
          seller_id?: string
          sold_at?: string | null
          sold_to?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_listings_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_sold_to_fkey"
            columns: ["sold_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_sold_to_fkey"
            columns: ["sold_to"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_sold_to_fkey"
            columns: ["sold_to"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_activities: {
        Row: {
          activity_type: string
          coins_earned: number
          created_at: string
          description: string
          id: string
          mentorship_id: string
        }
        Insert: {
          activity_type: string
          coins_earned?: number
          created_at?: string
          description: string
          id?: string
          mentorship_id: string
        }
        Update: {
          activity_type?: string
          coins_earned?: number
          created_at?: string
          description?: string
          id?: string
          mentorship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_activities_mentorship_id_fkey"
            columns: ["mentorship_id"]
            isOneToOne: false
            referencedRelation: "mentorships"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          mentorship_id: string
          rating: number
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          mentorship_id: string
          rating: number
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          mentorship_id?: string
          rating?: number
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_reviews_mentorship_id_fkey"
            columns: ["mentorship_id"]
            isOneToOne: false
            referencedRelation: "mentorships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorships: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          mentee_feedback: string | null
          mentee_id: string
          mentor_id: string
          mentor_notes: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mentee_feedback?: string | null
          mentee_id: string
          mentor_id: string
          mentor_notes?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          mentee_feedback?: string | null
          mentee_id?: string
          mentor_id?: string
          mentor_notes?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorships_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorships_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorships_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_match_history: {
        Row: {
          created_at: string
          finished_at: string
          id: string
          match_data: Json
          quiz_id: string
          room_id: string
          started_at: string
          total_players: number
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          finished_at: string
          id?: string
          match_data?: Json
          quiz_id: string
          room_id: string
          started_at: string
          total_players: number
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          finished_at?: string
          id?: string
          match_data?: Json
          quiz_id?: string
          room_id?: string
          started_at?: string
          total_players?: number
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_match_history_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiplayer_match_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "quiz_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiplayer_match_history_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiplayer_match_history_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiplayer_match_history_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "pack_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
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
          image_url: string | null
          option_order: number
          option_text: string
          poll_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          option_order?: number
          option_text: string
          poll_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
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
      power_up_usage: {
        Row: {
          id: string
          power_up_id: string
          question_id: string
          room_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          id?: string
          power_up_id: string
          question_id: string
          room_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          id?: string
          power_up_id?: string
          question_id?: string
          room_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "power_up_usage_power_up_id_fkey"
            columns: ["power_up_id"]
            isOneToOne: false
            referencedRelation: "power_ups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "power_up_usage_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "power_up_usage_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "quiz_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "power_up_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "power_up_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "power_up_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      power_ups: {
        Row: {
          cost_coins: number
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          type: string
        }
        Insert: {
          cost_coins?: number
          created_at?: string
          description: string
          icon: string
          id?: string
          is_active?: boolean
          name: string
          type: string
        }
        Update: {
          cost_coins?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          class: string | null
          coins: number
          created_at: string | null
          daily_streak: number | null
          email: string
          id: string
          last_daily_reward: string | null
          name: string
          ra: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          class?: string | null
          coins?: number
          created_at?: string | null
          daily_streak?: number | null
          email: string
          id?: string
          last_daily_reward?: string | null
          name: string
          ra?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          class?: string | null
          coins?: number
          created_at?: string | null
          daily_streak?: number | null
          email?: string
          id?: string
          last_daily_reward?: string | null
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
          correct_answers: number
          id: string
          is_completed: boolean
          practice_mode: boolean | null
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
          correct_answers?: number
          id?: string
          is_completed?: boolean
          practice_mode?: boolean | null
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
          correct_answers?: number
          id?: string
          is_completed?: boolean
          practice_mode?: boolean | null
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
      quiz_badges: {
        Row: {
          badge_level: string | null
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          next_level_requirement: number | null
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          badge_level?: string | null
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
          next_level_requirement?: number | null
          requirement_type: string
          requirement_value: number
        }
        Update: {
          badge_level?: string | null
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          next_level_requirement?: number | null
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
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
      quiz_room_chat: {
        Row: {
          created_at: string
          id: string
          message: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_room_chat_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "quiz_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_room_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_room_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_room_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_room_players: {
        Row: {
          attempt_id: string | null
          id: string
          joined_at: string | null
          position: number | null
          room_id: string
          user_id: string
        }
        Insert: {
          attempt_id?: string | null
          id?: string
          joined_at?: string | null
          position?: number | null
          room_id: string
          user_id: string
        }
        Update: {
          attempt_id?: string | null
          id?: string
          joined_at?: string | null
          position?: number | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_room_players_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "quiz_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_rooms: {
        Row: {
          created_at: string | null
          created_by: string
          finished_at: string | null
          id: string
          max_players: number
          quiz_id: string
          room_code: string
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          finished_at?: string | null
          id?: string
          max_players?: number
          quiz_id: string
          room_code: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          finished_at?: string | null
          id?: string
          max_players?: number
          quiz_id?: string
          room_code?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_rooms_quiz_id_fkey"
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
          reward_card_id: string | null
          reward_coins: number
          reward_type: string | null
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
          reward_card_id?: string | null
          reward_coins?: number
          reward_type?: string | null
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
          reward_card_id?: string | null
          reward_coins?: number
          reward_type?: string | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_reward_card_id_fkey"
            columns: ["reward_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_thresholds: {
        Row: {
          color: string
          created_at: string | null
          icon: string
          id: string
          min_badges: number
          min_points: number
          min_quizzes: number
          rank_name: string
        }
        Insert: {
          color: string
          created_at?: string | null
          icon: string
          id?: string
          min_badges: number
          min_points: number
          min_quizzes: number
          rank_name: string
        }
        Update: {
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          min_badges?: number
          min_points?: number
          min_quizzes?: number
          rank_name?: string
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
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          receiver_id: string | null
          sender_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          receiver_id?: string | null
          sender_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          receiver_id?: string | null
          sender_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badge_progress: {
        Row: {
          badge_id: string
          created_at: string | null
          current_level: string | null
          current_progress: number | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string | null
          current_level?: string | null
          current_progress?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string | null
          current_level?: string | null
          current_progress?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badge_progress_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "quiz_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_card_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_card_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "card_achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_card_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_card_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_card_achievements_user_id_fkey"
            columns: ["user_id"]
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
      user_custom_badges: {
        Row: {
          awarded_at: string | null
          awarded_by: string
          badge_id: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          awarded_by: string
          badge_id: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          awarded_by?: string
          badge_id?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "custom_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_power_ups: {
        Row: {
          id: string
          power_up_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          id?: string
          power_up_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          id?: string
          power_up_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_power_ups_power_up_id_fkey"
            columns: ["power_up_id"]
            isOneToOne: false
            referencedRelation: "power_ups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_power_ups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_power_ups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_power_ups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "quiz_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "rankings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ranks: {
        Row: {
          badges_earned: number | null
          created_at: string | null
          current_rank: string
          id: string
          matches_won: number | null
          quizzes_completed: number | null
          rank_updated_at: string | null
          total_points: number | null
          user_id: string
        }
        Insert: {
          badges_earned?: number | null
          created_at?: string | null
          current_rank?: string
          id?: string
          matches_won?: number | null
          quizzes_completed?: number | null
          rank_updated_at?: string | null
          total_points?: number | null
          user_id: string
        }
        Update: {
          badges_earned?: number | null
          created_at?: string | null
          current_rank?: string
          id?: string
          matches_won?: number | null
          quizzes_completed?: number | null
          rank_updated_at?: string | null
          total_points?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_reputation: {
        Row: {
          created_at: string | null
          id: string
          purchases_count: number
          reputation_level: string
          sales_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          purchases_count?: number
          reputation_level?: string
          sales_count?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          purchases_count?: number
          reputation_level?: string
          sales_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reputation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reputation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "rankings_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reputation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      accept_loan_counter_proposal: {
        Args: { loan_id: string; student_id: string }
        Returns: Json
      }
      buy_card: { Args: { card_id: string; user_id: string }; Returns: Json }
      buy_market_item: {
        Args: { buyer_id: string; listing_id: string }
        Returns: Json
      }
      buy_pack: { Args: { pack_id: string; user_id: string }; Returns: Json }
      check_and_award_quiz_badges: {
        Args: { p_attempt_id: string; p_user_id: string }
        Returns: undefined
      }
      complete_quiz: {
        Args: { attempt_id: string; user_id: string }
        Returns: Json
      }
      create_achievement_notification: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
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
      create_poll_with_options_and_images: {
        Args: {
          allow_multiple: boolean
          end_date: string
          options: Json
          poll_description: string
          poll_event_id: string
          poll_title: string
        }
        Returns: string
      }
      delete_event: { Args: { event_id: string }; Returns: boolean }
      dreamlit_auth_admin_executor: {
        Args: { command: string }
        Returns: undefined
      }
      early_loan_payment: {
        Args: { loan_id: string; user_id: string }
        Returns: Json
      }
      forgive_loan_debt: {
        Args: { admin_id: string; loan_id: string }
        Returns: Json
      }
      generate_invite_code: { Args: never; Returns: string }
      generate_room_code: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_poll_results: {
        Args: { poll_id: string }
        Returns: {
          option_id: string
          option_order: number
          option_text: string
          vote_count: number
        }[]
      }
      get_user_role_secure: { Args: { user_uuid: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_email: { Args: { email_to_check: string }; Returns: boolean }
      process_loan_approval:
        | { Args: { admin_id: string; loan_id: string }; Returns: Json }
        | {
            Args: {
              admin_id: string
              installments?: number
              loan_id: string
              payment_method?: string
            }
            Returns: Json
          }
      reject_loan_counter_proposal: {
        Args: { loan_id: string; student_id: string }
        Returns: Json
      }
      start_quiz_attempt: {
        Args: {
          p_practice_mode?: boolean
          p_quiz_id: string
          p_user_id: string
        }
        Returns: Json
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
      update_user_rank: { Args: { p_user_id: string }; Returns: string }
      update_user_role_secure: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"]
          reason?: string
          target_user_id: string
        }
        Returns: boolean
      }
      user_owns_card: {
        Args: { _card_id: string; _user_id: string }
        Returns: boolean
      }
      validate_quiz_answer: {
        Args: {
          p_attempt_id: string
          p_question_id: string
          p_user_answer: string
          p_user_id: string
        }
        Returns: Json
      }
      vote_in_poll: {
        Args: { option_ids: string[]; poll_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
      card_rarity: "common" | "rare" | "legendary" | "mythic"
      listing_status: "active" | "sold" | "expired" | "removed"
      loan_status: "pending" | "approved" | "denied" | "repaid"
      trade_status: "pending" | "accepted" | "rejected"
      transaction_type:
        | "send"
        | "purchase"
        | "reward"
        | "loan_granted"
        | "loan_repaid"
        | "market_sale"
        | "market_fee"
        | "system_buy"
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
      listing_status: ["active", "sold", "expired", "removed"],
      loan_status: ["pending", "approved", "denied", "repaid"],
      trade_status: ["pending", "accepted", "rejected"],
      transaction_type: [
        "send",
        "purchase",
        "reward",
        "loan_granted",
        "loan_repaid",
        "market_sale",
        "market_fee",
        "system_buy",
      ],
      user_role: ["student", "teacher", "admin"],
    },
  },
} as const
