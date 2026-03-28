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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_types: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          organization_id: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          organization_id: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity: string
          entity_id: string | null
          id: string
          organization_id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          organization_id: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          organization_id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          file_path: string
          file_size: string
          id: string
          invoice_id: string | null
          name: string
          notes: string
          organization_id: string
          student_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          file_path?: string
          file_size?: string
          id?: string
          invoice_id?: string | null
          name: string
          notes?: string
          organization_id: string
          student_id?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: string
          id?: string
          invoice_id?: string | null
          name?: string
          notes?: string
          organization_id?: string
          student_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          instructor_id: string | null
          notes: string
          organization_id: string
          recurring: boolean
          recurring_period: string | null
          type: Database["public"]["Enums"]["expense_type"]
          vehicle_id: string | null
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          instructor_id?: string | null
          notes?: string
          organization_id: string
          recurring?: boolean
          recurring_period?: string | null
          type?: Database["public"]["Enums"]["expense_type"]
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          instructor_id?: string | null
          notes?: string
          organization_id?: string
          recurring?: boolean
          recurring_period?: string | null
          type?: Database["public"]["Enums"]["expense_type"]
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_availabilities: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          instructor_id: string
          organization_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          instructor_id: string
          organization_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          instructor_id?: string
          organization_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_availabilities_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_availabilities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          created_at: string
          email: string
          first_name: string
          hourly_cost: number
          id: string
          last_name: string
          notes: string
          organization_id: string
          phone: string
          specialties: string[]
          status: Database["public"]["Enums"]["instructor_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          first_name: string
          hourly_cost?: number
          id?: string
          last_name: string
          notes?: string
          organization_id: string
          phone?: string
          specialties?: string[]
          status?: Database["public"]["Enums"]["instructor_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          hourly_cost?: number
          id?: string
          last_name?: string
          notes?: string
          organization_id?: string
          phone?: string
          specialties?: string[]
          status?: Database["public"]["Enums"]["instructor_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          source_formula_id: string | null
          source_lesson_id: string | null
          total_ht: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          invoice_id: string
          quantity?: number
          source_formula_id?: string | null
          source_lesson_id?: string | null
          total_ht?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          source_formula_id?: string | null
          source_lesson_id?: string | null
          total_ht?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_source_formula_id_fkey"
            columns: ["source_formula_id"]
            isOneToOne: false
            referencedRelation: "student_formulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_source_lesson_id_fkey"
            columns: ["source_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          converted_from_id: string | null
          created_at: string
          due_date: string
          id: string
          issue_date: string
          notes: string
          number: string
          organization_id: string
          paid_amount: number
          payer_id: string | null
          remaining_amount: number
          status: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          total_ht: number
          total_ttc: number
          tva_amount: number
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at: string
        }
        Insert: {
          converted_from_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          issue_date?: string
          notes?: string
          number: string
          organization_id: string
          paid_amount?: number
          payer_id?: string | null
          remaining_amount?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          total_ht?: number
          total_ttc?: number
          tva_amount?: number
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
        }
        Update: {
          converted_from_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          issue_date?: string
          notes?: string
          number?: string
          organization_id?: string
          paid_amount?: number
          payer_id?: string | null
          remaining_amount?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id?: string
          total_ht?: number
          total_ttc?: number
          tva_amount?: number
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_converted_from_id_fkey"
            columns: ["converted_from_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          billable_amount: number
          billed_amount: number
          billing_rule: Database["public"]["Enums"]["billing_rule"]
          created_at: string
          date: string
          duration_hours: number
          end_time: string
          formula_id: string | null
          id: string
          instructor_id: string
          note: string
          organization_id: string
          start_time: string
          status: Database["public"]["Enums"]["lesson_status"]
          student_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          billable_amount?: number
          billed_amount?: number
          billing_rule?: Database["public"]["Enums"]["billing_rule"]
          created_at?: string
          date: string
          duration_hours?: number
          end_time: string
          formula_id?: string | null
          id?: string
          instructor_id: string
          note?: string
          organization_id: string
          start_time: string
          status?: Database["public"]["Enums"]["lesson_status"]
          student_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          billable_amount?: number
          billed_amount?: number
          billing_rule?: Database["public"]["Enums"]["billing_rule"]
          created_at?: string
          date?: string
          duration_hours?: number
          end_time?: string
          formula_id?: string | null
          id?: string
          instructor_id?: string
          note?: string
          organization_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["lesson_status"]
          student_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_formula_id_fkey"
            columns: ["formula_id"]
            isOneToOne: false
            referencedRelation: "student_formulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          auto_reminder_enabled: boolean
          created_at: string
          id: string
          notify_instructor_on_change: boolean
          notify_student_on_change: boolean
          organization_id: string
          reminder_before_hours: number
          updated_at: string
        }
        Insert: {
          auto_reminder_enabled?: boolean
          created_at?: string
          id?: string
          notify_instructor_on_change?: boolean
          notify_student_on_change?: boolean
          organization_id: string
          reminder_before_hours?: number
          updated_at?: string
        }
        Update: {
          auto_reminder_enabled?: boolean
          created_at?: string
          id?: string
          notify_instructor_on_change?: boolean
          notify_student_on_change?: boolean
          organization_id?: string
          reminder_before_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          active: boolean
          activity_type: string
          cancellation_policy: string
          created_at: string
          deposit_percent: number
          hours: number | null
          id: string
          name: string
          organization_id: string
          price: number
          tva_rate: number
          type: Database["public"]["Enums"]["offer_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          activity_type?: string
          cancellation_policy?: string
          created_at?: string
          deposit_percent?: number
          hours?: number | null
          id?: string
          name: string
          organization_id: string
          price?: number
          tva_rate?: number
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          activity_type?: string
          cancellation_policy?: string
          created_at?: string
          deposit_percent?: number
          hours?: number | null
          id?: string
          name?: string
          organization_id?: string
          price?: number
          tva_rate?: number
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          accent_color: string | null
          address: string | null
          cancellation_policy: string | null
          created_at: string
          currency: string
          document_header: string | null
          document_logo_url: string | null
          email: string | null
          footer_text: string | null
          id: string
          invoice_next_number: number
          invoice_prefix: string
          legal_mentions: string | null
          locale: string
          logo_url: string | null
          mode: Database["public"]["Enums"]["org_mode"]
          name: string
          phone: string | null
          primary_color: string | null
          quote_next_number: number
          quote_prefix: string
          signature_enabled: boolean | null
          signature_text: string | null
          siret: string | null
          suspended: boolean
          timezone: string
          tva_number: string | null
          tva_rate: number
          updated_at: string
          webhook_api_key: string | null
          webhook_calls_count: number
          webhook_url: string | null
          website: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          cancellation_policy?: string | null
          created_at?: string
          currency?: string
          document_header?: string | null
          document_logo_url?: string | null
          email?: string | null
          footer_text?: string | null
          id?: string
          invoice_next_number?: number
          invoice_prefix?: string
          legal_mentions?: string | null
          locale?: string
          logo_url?: string | null
          mode?: Database["public"]["Enums"]["org_mode"]
          name: string
          phone?: string | null
          primary_color?: string | null
          quote_next_number?: number
          quote_prefix?: string
          signature_enabled?: boolean | null
          signature_text?: string | null
          siret?: string | null
          suspended?: boolean
          timezone?: string
          tva_number?: string | null
          tva_rate?: number
          updated_at?: string
          webhook_api_key?: string | null
          webhook_calls_count?: number
          webhook_url?: string | null
          website?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          cancellation_policy?: string | null
          created_at?: string
          currency?: string
          document_header?: string | null
          document_logo_url?: string | null
          email?: string | null
          footer_text?: string | null
          id?: string
          invoice_next_number?: number
          invoice_prefix?: string
          legal_mentions?: string | null
          locale?: string
          logo_url?: string | null
          mode?: Database["public"]["Enums"]["org_mode"]
          name?: string
          phone?: string | null
          primary_color?: string | null
          quote_next_number?: number
          quote_prefix?: string
          signature_enabled?: boolean | null
          signature_text?: string | null
          siret?: string | null
          suspended?: boolean
          timezone?: string
          tva_number?: string | null
          tva_rate?: number
          updated_at?: string
          webhook_api_key?: string | null
          webhook_calls_count?: number
          webhook_url?: string | null
          website?: string | null
        }
        Relationships: []
      }
      payers: {
        Row: {
          active: boolean
          address: string
          created_at: string
          email: string
          id: string
          name: string
          notes: string
          organization_id: string
          phone: string
          siret: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string
          created_at?: string
          email?: string
          id?: string
          name: string
          notes?: string
          organization_id: string
          phone?: string
          siret?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string
          organization_id?: string
          phone?: string
          siret?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          invoice_id: string | null
          method: Database["public"]["Enums"]["payment_method"]
          notes: string
          organization_id: string
          reference: string
          student_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          invoice_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string
          organization_id: string
          reference?: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          invoice_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string
          organization_id?: string
          reference?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          suspended: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          suspended?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          suspended?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          channel: Database["public"]["Enums"]["reminder_channel"]
          created_at: string
          id: string
          invoice_id: string | null
          message: string
          organization_id: string
          scheduled_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["reminder_status"]
          student_id: string | null
          type: Database["public"]["Enums"]["reminder_type"]
        }
        Insert: {
          channel?: Database["public"]["Enums"]["reminder_channel"]
          created_at?: string
          id?: string
          invoice_id?: string | null
          message?: string
          organization_id: string
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          student_id?: string | null
          type?: Database["public"]["Enums"]["reminder_type"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["reminder_channel"]
          created_at?: string
          id?: string
          invoice_id?: string | null
          message?: string
          organization_id?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          student_id?: string | null
          type?: Database["public"]["Enums"]["reminder_type"]
        }
        Relationships: [
          {
            foreignKeyName: "reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "skill_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_evaluations: {
        Row: {
          category_id: string
          created_at: string
          evaluated_at: string
          id: string
          instructor_id: string | null
          lesson_id: string | null
          note: string
          organization_id: string
          score: number
          student_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          evaluated_at?: string
          id?: string
          instructor_id?: string | null
          lesson_id?: string | null
          note?: string
          organization_id: string
          score: number
          student_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          evaluated_at?: string
          id?: string
          instructor_id?: string | null
          lesson_id?: string | null
          note?: string
          organization_id?: string
          score?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_evaluations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_evaluations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_evaluations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_evaluations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_evaluations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_formulas: {
        Row: {
          active: boolean
          created_at: string
          hours_bought: number
          id: string
          offer_id: string | null
          offer_name: string
          offer_type: Database["public"]["Enums"]["offer_type"]
          organization_id: string
          student_id: string
          total_price: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          hours_bought?: number
          id?: string
          offer_id?: string | null
          offer_name: string
          offer_type?: Database["public"]["Enums"]["offer_type"]
          organization_id: string
          student_id: string
          total_price?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          hours_bought?: number
          id?: string
          offer_id?: string | null
          offer_name?: string
          offer_type?: Database["public"]["Enums"]["offer_type"]
          organization_id?: string
          student_id?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_formulas_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_formulas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_formulas_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          activity_type: string
          address: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string
          organization_id: string
          payer_id: string | null
          phone: string
          status: Database["public"]["Enums"]["student_status"]
          updated_at: string
        }
        Insert: {
          activity_type?: string
          address?: string
          created_at?: string
          email?: string
          first_name: string
          id?: string
          last_name: string
          notes?: string
          organization_id: string
          payer_id?: string | null
          phone?: string
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Update: {
          activity_type?: string
          address?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string
          organization_id?: string
          payer_id?: string | null
          phone?: string
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          category: string
          created_at: string
          id: string
          insurance_expiry: string | null
          last_maintenance_date: string | null
          model: string
          monthly_cost: number
          next_maintenance_date: string | null
          notes: string
          organization_id: string
          plate: string
          status: Database["public"]["Enums"]["vehicle_status"]
          technical_control_date: string | null
          updated_at: string
        }
        Insert: {
          brand?: string
          category?: string
          created_at?: string
          id?: string
          insurance_expiry?: string | null
          last_maintenance_date?: string | null
          model?: string
          monthly_cost?: number
          next_maintenance_date?: string | null
          notes?: string
          organization_id: string
          plate: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          technical_control_date?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          id?: string
          insurance_expiry?: string | null
          last_maintenance_date?: string | null
          model?: string
          monthly_cost?: number
          next_maintenance_date?: string | null
          notes?: string
          organization_id?: string
          plate?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          technical_control_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_organization: {
        Args: { _org_id: string }
        Returns: undefined
      }
      admin_delete_user: { Args: { _user_id: string }; Returns: undefined }
      admin_generate_api_key: { Args: { _org_id: string }; Returns: string }
      admin_get_global_stats: { Args: never; Returns: Json }
      admin_suspend_organization: {
        Args: { _org_id: string; _suspended: boolean }
        Returns: undefined
      }
      admin_suspend_user: {
        Args: { _suspended: boolean; _user_id: string }
        Returns: undefined
      }
      check_lesson_conflicts: {
        Args: {
          _date: string
          _end_time: string
          _exclude_lesson_id?: string
          _instructor_id: string
          _organization_id: string
          _start_time: string
          _vehicle_id: string
        }
        Returns: {
          conflict_type: string
          conflicting_id: string
          conflicting_label: string
        }[]
      }
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      has_any_role: {
        Args: {
          _org_id: string
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      next_document_number: {
        Args: { _org_id: string; _type: string }
        Returns: string
      }
      setup_organization_owner: {
        Args: { _org_id: string; _user_id: string }
        Returns: undefined
      }
      user_is_owner: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "admin" | "instructor" | "accountant"
      billing_rule: "totale" | "partielle" | "non_facturee"
      expense_type: "directe" | "fixe"
      instructor_status: "actif" | "inactif" | "archive"
      invoice_status:
        | "brouillon"
        | "envoyé"
        | "partiellement_payé"
        | "payé"
        | "en_retard"
        | "annulé"
        | "archivé"
      invoice_type: "devis" | "facture"
      lesson_status: "prevu" | "effectue" | "annule" | "absent"
      offer_type: "heure" | "pack" | "forfait"
      org_mode: "independant" | "centre"
      payment_method: "espèces" | "virement" | "carte" | "chèque"
      reminder_channel: "email" | "sms" | "whatsapp"
      reminder_status: "planifié" | "envoyé" | "échoué"
      reminder_type: "séance" | "impayé" | "document" | "autre"
      student_status: "actif" | "en_pause" | "termine" | "archive"
      vehicle_status: "actif" | "indisponible" | "maintenance" | "archive"
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
      app_role: ["owner", "admin", "instructor", "accountant"],
      billing_rule: ["totale", "partielle", "non_facturee"],
      expense_type: ["directe", "fixe"],
      instructor_status: ["actif", "inactif", "archive"],
      invoice_status: [
        "brouillon",
        "envoyé",
        "partiellement_payé",
        "payé",
        "en_retard",
        "annulé",
        "archivé",
      ],
      invoice_type: ["devis", "facture"],
      lesson_status: ["prevu", "effectue", "annule", "absent"],
      offer_type: ["heure", "pack", "forfait"],
      org_mode: ["independant", "centre"],
      payment_method: ["espèces", "virement", "carte", "chèque"],
      reminder_channel: ["email", "sms", "whatsapp"],
      reminder_status: ["planifié", "envoyé", "échoué"],
      reminder_type: ["séance", "impayé", "document", "autre"],
      student_status: ["actif", "en_pause", "termine", "archive"],
      vehicle_status: ["actif", "indisponible", "maintenance", "archive"],
    },
  },
} as const
