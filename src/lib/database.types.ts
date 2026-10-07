// Tipos do banco gerados a partir de supabase/migrations/0001_initial_schema.sql.
// Se você alterar o schema, regenere com:
//   npx supabase gen types typescript --project-id anapagpjwljzpbwjerng > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          document: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          phone?: string | null
          document?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          document?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          document: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          document?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          document?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          customer_id: string | null
          product_id: string | null
          amount: number
          fee: number
          net_amount: number
          method: string
          status: string
          external_id: string | null
          description: string | null
          payer_name: string | null
          payer_document: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_id?: string | null
          product_id?: string | null
          amount: number
          fee?: number
          net_amount?: number
          method: string
          status?: string
          external_id?: string | null
          description?: string | null
          payer_name?: string | null
          payer_document?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_id?: string | null
          product_id?: string | null
          amount?: number
          fee?: number
          net_amount?: number
          method?: string
          status?: string
          external_id?: string | null
          description?: string | null
          payer_name?: string | null
          payer_document?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
      pix_transactions: {
        Row: {
          id: string
          user_id: string
          transaction_id: string | null
          amount: number
          status: string
          provider_request_id: string | null
          qr_code_base64: string | null
          copy_paste_code: string | null
          expires_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_id?: string | null
          amount: number
          status?: string
          provider_request_id?: string | null
          qr_code_base64?: string | null
          copy_paste_code?: string | null
          expires_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_id?: string | null
          amount?: number
          status?: string
          provider_request_id?: string | null
          qr_code_base64?: string | null
          copy_paste_code?: string | null
          expires_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pix_transactions_transaction_id_fkey'
            columns: ['transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
        ]
      }
      bank_accounts: {
        Row: {
          id: string
          user_id: string
          bank_code: string
          bank_name: string
          agency: string
          account: string
          account_digit: string | null
          account_type: string
          holder_name: string
          holder_document: string | null
          pix_key: string | null
          is_primary: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bank_code: string
          bank_name: string
          agency: string
          account: string
          account_digit?: string | null
          account_type?: string
          holder_name: string
          holder_document?: string | null
          pix_key?: string | null
          is_primary?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bank_code?: string
          bank_name?: string
          agency?: string
          account?: string
          account_digit?: string | null
          account_type?: string
          holder_name?: string
          holder_document?: string | null
          pix_key?: string | null
          is_primary?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_entries: {
        Row: {
          id: string
          user_id: string
          transaction_id: string | null
          withdrawal_request_id: string | null
          type: string
          description: string
          amount: number
          balance_after: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_id?: string | null
          withdrawal_request_id?: string | null
          type: string
          description: string
          amount: number
          balance_after: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_id?: string | null
          withdrawal_request_id?: string | null
          type?: string
          description?: string
          amount?: number
          balance_after?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'financial_entries_transaction_id_fkey'
            columns: ['transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_entries_withdrawal_request_id_fkey'
            columns: ['withdrawal_request_id']
            isOneToOne: false
            referencedRelation: 'withdrawal_requests'
            referencedColumns: ['id']
          },
        ]
      }
      integrations: {
        Row: {
          id: string
          user_id: string
          provider: string
          external_id: string | null
          api_token: string | null
          webhook_url: string | null
          connected: boolean
          last_tested_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          external_id?: string | null
          api_token?: string | null
          webhook_url?: string | null
          connected?: boolean
          last_tested_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          external_id?: string | null
          api_token?: string | null
          webhook_url?: string | null
          connected?: boolean
          last_tested_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_events: {
        Row: {
          id: string
          user_id: string
          integration_id: string | null
          event: string
          payload: Json | null
          status: string
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          integration_id?: string | null
          event: string
          payload?: Json | null
          status?: string
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          integration_id?: string | null
          event?: string
          payload?: Json | null
          status?: string
          error_message?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'integration_events_integration_id_fkey'
            columns: ['integration_id']
            isOneToOne: false
            referencedRelation: 'integrations'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string | null
          type: string
          link: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body?: string | null
          type?: string
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string | null
          type?: string
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          cta_label: string | null
          cta_href: string | null
          image_url: string | null
          active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          cta_label?: string | null
          cta_href?: string | null
          image_url?: string | null
          active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          cta_label?: string | null
          cta_href?: string | null
          image_url?: string | null
          active?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          description: string | null
          price_cents: number
          image_url: string | null
          status: string
          model: string
          checkout_settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          description?: string | null
          price_cents: number
          image_url?: string | null
          status?: string
          model?: string
          checkout_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          description?: string | null
          price_cents?: number
          image_url?: string | null
          status?: string
          model?: string
          checkout_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          user_id: string
          notify_payment: boolean
          notify_pix: boolean
          notify_withdrawal: boolean
          notify_sale: boolean
          notify_email: boolean
          theme: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          notify_payment?: boolean
          notify_pix?: boolean
          notify_withdrawal?: boolean
          notify_sale?: boolean
          notify_email?: boolean
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          notify_payment?: boolean
          notify_pix?: boolean
          notify_withdrawal?: boolean
          notify_sale?: boolean
          notify_email?: boolean
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          prefix: string
          key_hash: string
          suffix: string
          last_used_at: string | null
          expires_at: string | null
          revoked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          prefix: string
          key_hash: string
          suffix: string
          last_used_at?: string | null
          expires_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          prefix?: string
          key_hash?: string
          suffix?: string
          last_used_at?: string | null
          expires_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      webhook_endpoints: {
        Row: {
          id: string
          user_id: string
          url: string
          secret: string
          events: string[]
          active: boolean
          last_delivery_at: string | null
          last_status: number | null
          last_error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          secret: string
          events?: string[]
          active?: boolean
          last_delivery_at?: string | null
          last_status?: number | null
          last_error?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          secret?: string
          events?: string[]
          active?: boolean
          last_delivery_at?: string | null
          last_status?: number | null
          last_error?: string | null
          created_at?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          id: string
          user_id: string
          amount_brl: number
          pix_key: string
          pix_key_type: string
          holder_name: string
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          payout_reference: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount_brl: number
          pix_key: string
          pix_key_type: string
          holder_name: string
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          payout_reference?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount_brl?: number
          pix_key?: string
          pix_key_type?: string
          holder_name?: string
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          payout_reference?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'withdrawal_requests_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'withdrawal_requests_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      admin_actions: {
        Row: {
          id: string
          admin_id: string
          action: string
          entity: string
          entity_id: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          entity: string
          entity_id: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          entity?: string
          entity_id?: string
          details?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      bio_pages: {
        Row: {
          id: string
          user_id: string
          slug: string
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          theme: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          slug: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          theme?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          slug?: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          theme?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      integrations_safe: {
        Row: {
          id: string
          user_id: string
          provider: string
          external_id: string | null
          webhook_url: string | null
          connected: boolean
          last_tested_at: string | null
          created_at: string
          updated_at: string
        }
        // A view é somente-leitura.
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Functions: {
      is_owner: { Args: { row_user_id: string }; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']