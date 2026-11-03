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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          calendar_event_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          paid_at: string | null
          payment_amount: number | null
          payment_currency: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
          phone: string
          photo_count: number
          photo_paths: string[]
          reference: string
          service: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          calendar_event_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          paid_at?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          phone: string
          photo_count?: number
          photo_paths?: string[]
          reference: string
          service: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          calendar_event_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          paid_at?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          phone?: string
          photo_count?: number
          photo_paths?: string[]
          reference?: string
          service?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      call_records: {
        Row: {
          booking_id: string | null
          contact_name: string | null
          created_at: string
          direction: string
          duration_seconds: number
          from_number: string
          id: string
          recording_path: string | null
          sentiment: string | null
          status: string
          summary: string | null
          to_number: string
          transcript: Json
        }
        Insert: {
          booking_id?: string | null
          contact_name?: string | null
          created_at?: string
          direction: string
          duration_seconds?: number
          from_number: string
          id?: string
          recording_path?: string | null
          sentiment?: string | null
          status?: string
          summary?: string | null
          to_number: string
          transcript?: Json
        }
        Update: {
          booking_id?: string | null
          contact_name?: string | null
          created_at?: string
          direction?: string
          duration_seconds?: number
          from_number?: string
          id?: string
          recording_path?: string | null
          sentiment?: string | null
          status?: string
          summary?: string | null
          to_number?: string
          transcript?: Json
        }
        Relationships: [
          {
            foreignKeyName: "call_records_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          booking_reference: string | null
          comments: string | null
          created_at: string
          email: string
          handled: boolean
          id: string
          kind: string
          name: string
          overall: number | null
          phone: string | null
          rating_affordability: number | null
          rating_conclusions: number | null
          rating_duration: number | null
          rating_layout: number | null
          rating_page: number | null
          rating_representative: number | null
          rating_timing: number | null
          reference: string
          service: string | null
        }
        Insert: {
          booking_reference?: string | null
          comments?: string | null
          created_at?: string
          email: string
          handled?: boolean
          id?: string
          kind?: string
          name: string
          overall?: number | null
          phone?: string | null
          rating_affordability?: number | null
          rating_conclusions?: number | null
          rating_duration?: number | null
          rating_layout?: number | null
          rating_page?: number | null
          rating_representative?: number | null
          rating_timing?: number | null
          reference: string
          service?: string | null
        }
        Update: {
          booking_reference?: string | null
          comments?: string | null
          created_at?: string
          email?: string
          handled?: boolean
          id?: string
          kind?: string
          name?: string
          overall?: number | null
          phone?: string | null
          rating_affordability?: number | null
          rating_conclusions?: number | null
          rating_duration?: number | null
          rating_layout?: number | null
          rating_page?: number | null
          rating_representative?: number | null
          rating_timing?: number | null
          reference?: string
          service?: string | null
        }
        Relationships: []
      }
      meta_connections: {
        Row: {
          created_at: string
          id: string
          page_id: string
          page_name: string
          status: string
          token_ciphertext: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_id: string
          page_name: string
          status?: string
          token_ciphertext: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_id?: string
          page_name?: string
          status?: string
          token_ciphertext?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meta_oauth_states: {
        Row: {
          created_at: string
          expires_at: string
          state_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          state_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          state_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meta_publish_events: {
        Row: {
          connection_id: string | null
          created_at: string
          id: string
          provider_error_code: number | null
          provider_post_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          id?: string
          provider_error_code?: number | null
          provider_post_id?: string | null
          status: string
          user_id: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          id?: string
          provider_error_code?: number | null
          provider_post_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_publish_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "meta_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_attempts: {
        Row: {
          created_at: string
          id: string
          ip: string
          reference: string
          succeeded: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          ip?: string
          reference: string
          succeeded?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string
          reference?: string
          succeeded?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
