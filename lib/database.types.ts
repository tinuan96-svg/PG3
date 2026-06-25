export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          auth_user_id: string
          full_name: string
          email: string
          phone: string | null
          avatar: string | null
          role: 'customer' | 'admin'
          name: string | null
          address: string | null
          city: string | null
          postcode: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          full_name?: string
          email?: string
          phone?: string | null
          avatar?: string | null
          role?: 'customer' | 'admin'
          name?: string | null
          address?: string | null
          city?: string | null
          postcode?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          full_name?: string
          email?: string
          phone?: string | null
          avatar?: string | null
          role?: 'customer' | 'admin'
          name?: string | null
          address?: string | null
          city?: string | null
          postcode?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_auth_user_id_fkey"
            columns: ["auth_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          name: string
          role: 'customer' | 'admin'
          phone: string
          address: string
          city: string
          postcode: string
          referral_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string
          role?: 'customer' | 'admin'
          phone?: string
          address?: string
          city?: string
          postcode?: string
          referral_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          role?: 'customer' | 'admin'
          phone?: string
          address?: string
          city?: string
          postcode?: string
          referral_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          password_hash: string
          role: 'customer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          password_hash: string
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          password_hash: string
          role?: 'customer' | 'admin'
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          seo_title: string | null
          seo_description: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          seo_title?: string | null
          seo_description?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          seo_title?: string | null
          seo_description?: string | null
          image_url?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          source_product_id: string | null
          source_type: string
          name: string
          slug: string
          synced_at: string | null
          short_description: string | null
          description: string | null
          image: string | null
          gallery: any[] | null
          category_id: string | null
          sku: string | null
          tags: string[] | null
          seo_title: string | null
          seo_description: string | null
          seo_keywords: string | null
          price: number
          compare_price: number | null
          visibility_status: 'visible' | 'hidden'
          featured: boolean
          approval_status: 'draft' | 'approved' | 'rejected'
          approval_notes: string | null
          approved_by: string | null
          approved_at: string | null
          brand: string | null
          ingredients: string | null
          nutritional_info: string | null
          storage_instructions: string | null
          how_to_use: string | null
          raw_title: string | null
          supplier_price: number | null
          weight: string | null
          weight_value: number | null
          weight_unit: string | null
          needs_ai_image: boolean | null
          supplier_id: string | null
          supplier_connection_id: string | null
          profit_margin: number | null
          status: string | null
          coin_reward: number | null
          stock_quantity: number | null
          stock_status: string | null
          offer_price: number | null
          images: any[] | null
          brand_id: string | null
          is_bestseller: boolean | null
          is_deal: boolean | null
          is_new_arrival: boolean | null
          is_trending: boolean | null
          sold_count: number | null
          rating: number | null
          review_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          source_product_id?: string | null
          source_type?: string
          name?: string
          slug: string
          synced_at?: string | null
          short_description?: string | null
          description?: string | null
          image?: string | null
          gallery?: any[] | null
          category_id?: string | null
          sku?: string | null
          tags?: string[] | null
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          price?: number
          compare_price?: number | null
          visibility_status?: 'visible' | 'hidden'
          featured?: boolean
          approval_status?: 'draft' | 'approved' | 'rejected'
          approval_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          brand?: string | null
          ingredients?: string | null
          nutritional_info?: string | null
          storage_instructions?: string | null
          how_to_use?: string | null
          raw_title?: string | null
          supplier_price?: number | null
          weight?: string | null
          weight_value?: number | null
          weight_unit?: string | null
          needs_ai_image?: boolean | null
          supplier_id?: string | null
          supplier_connection_id?: string | null
          profit_margin?: number | null
          status?: string | null
          coin_reward?: number | null
          stock_quantity?: number | null
          stock_status?: string | null
          offer_price?: number | null
          images?: any[] | null
          brand_id?: string | null
          is_bestseller?: boolean | null
          is_deal?: boolean | null
          is_new_arrival?: boolean | null
          is_trending?: boolean | null
          sold_count?: number | null
          rating?: number | null
          review_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          source_product_id?: string | null
          source_type?: string
          name?: string
          slug?: string
          synced_at?: string | null
          short_description?: string | null
          description?: string | null
          image?: string | null
          gallery?: any[] | null
          category_id?: string | null
          sku?: string | null
          tags?: string[] | null
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          price?: number
          compare_price?: number | null
          visibility_status?: 'visible' | 'hidden'
          featured?: boolean
          approval_status?: 'draft' | 'approved' | 'rejected'
          approval_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          brand?: string | null
          ingredients?: string | null
          nutritional_info?: string | null
          storage_instructions?: string | null
          how_to_use?: string | null
          raw_title?: string | null
          supplier_price?: number | null
          weight?: string | null
          weight_value?: number | null
          weight_unit?: string | null
          needs_ai_image?: boolean | null
          supplier_id?: string | null
          supplier_connection_id?: string | null
          profit_margin?: number | null
          status?: string | null
          coin_reward?: number | null
          stock_quantity?: number | null
          stock_status?: string | null
          offer_price?: number | null
          images?: any[] | null
          brand_id?: string | null
          is_bestseller?: boolean | null
          is_deal?: boolean | null
          is_new_arrival?: boolean | null
          is_trending?: boolean | null
          sold_count?: number | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          order_number: string
          order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'chargeback'
          payment_method: string | null
          payment_reference: string | null
          subtotal: number
          delivery_fee: number
          coins_discount: number
          coins_used: number
          coins_earned: number
          total: number
          customer_name: string
          customer_email: string
          customer_phone: string
          delivery_address: string
          delivery_city: string
          delivery_postcode: string
          company_name: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          order_number: string
          order_status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'chargeback'
          payment_method?: string | null
          payment_reference?: string | null
          subtotal: number
          delivery_fee: number
          coins_discount?: number
          coins_used?: number
          coins_earned?: number
          total: number
          customer_name: string
          customer_email: string
          customer_phone: string
          delivery_address: string
          delivery_city: string
          delivery_postcode: string
          company_name?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          order_status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'chargeback'
          payment_reference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          variation_id: string | null
          product_name: string
          product_price: number
          quantity: number
          coins_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          variation_id?: string | null
          product_name: string
          product_price: number
          quantity: number
          coins_earned?: number
          created_at?: string
        }
        Update: {
          quantity?: number
          variation_id?: string | null
        }
        Relationships: []
      }
      product_variations: {
        Row: {
          id: string
          product_id: string
          variation_label: string
          weight: number | null
          price: number
          stock_quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          variation_label: string
          weight?: number | null
          price: number
          stock_quantity?: number
          created_at?: string
        }
        Update: {
          variation_label?: string
          weight?: number | null
          price?: number
          stock_quantity?: number
        }
        Relationships: []
      }
      supplier_products: {
        Row: {
          id: string
          supplier_product_id: string
          name: string
          brand: string
          price: number | null
          stock: number
          connection_id: string | null
          normalized: boolean
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          supplier_product_id: string
          name: string
          brand?: string
          price?: number | null
          stock?: number
          connection_id?: string | null
          normalized?: boolean
          last_updated?: string
          created_at?: string
        }
        Update: {
          supplier_product_id?: string
          name?: string
          brand?: string
          price?: number | null
          stock?: number
          connection_id?: string | null
          normalized?: boolean
          last_updated?: string
        }
        Relationships: []
      }
      seo_pages: {
        Row: {
          id: string
          title: string
          slug: string
          meta_title: string
          meta_description: string
          content: string
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          meta_title?: string
          meta_description?: string
          content?: string
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          slug?: string
          meta_title?: string
          meta_description?: string
          content?: string
          published?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'earned' | 'used' | 'expired' | 'referral' | 'bonus'
          amount: number
          order_id: string | null
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'earned' | 'used' | 'expired' | 'referral' | 'bonus'
          amount: number
          order_id?: string | null
          description: string
          created_at?: string
        }
        Update: {
          [key: string]: never
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          id: string
          user_id: string
          total_coins: number
          coins_earned: number
          coins_used: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_coins?: number
          coins_earned?: number
          coins_used?: number
          updated_at?: string
        }
        Update: {
          total_coins?: number
          coins_earned?: number
          coins_used?: number
          updated_at?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          user_id: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referee_id: string | null
          referral_code: string
          status: 'pending' | 'completed'
          coins_awarded: boolean
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referee_id?: string | null
          referral_code: string
          status?: 'pending' | 'completed'
          coins_awarded?: boolean
          created_at?: string
        }
        Update: {
          referee_id?: string | null
          status?: 'pending' | 'completed'
          coins_awarded?: boolean
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          rating: number
          review: string | null
          images: string[]
          verified_purchase: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          rating: number
          review?: string | null
          images?: string[]
          verified_purchase?: boolean
          created_at?: string
        }
        Update: {
          rating?: number
          review?: string | null
          images?: string[]
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string
          featured_image: string | null
          tags: string[]
          seo_title: string | null
          seo_description: string | null
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content: string
          featured_image?: string | null
          tags?: string[]
          seo_title?: string | null
          seo_description?: string | null
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string
          featured_image?: string | null
          tags?: string[]
          seo_title?: string | null
          seo_description?: string | null
          published?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          value?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_connections: {
        Row: {
          id: string
          name: string
          api_url: string
          consumer_key: string
          consumer_secret: string
          markup_percentage: number
          is_active: boolean
          last_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string
          api_url: string
          consumer_key?: string
          consumer_secret?: string
          markup_percentage?: number
          is_active?: boolean
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          api_url?: string
          consumer_key?: string
          consumer_secret?: string
          markup_percentage?: number
          is_active?: boolean
          last_synced_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          id: string
          connection_id: string | null
          products_fetched: number
          products_inserted: number
          products_updated: number
          products_categorized: number
          products_cleaned: number
          duplicates_detected: number
          products_failed: number
          error_details: string | null
          triggered_by: string
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          connection_id?: string | null
          products_fetched?: number
          products_inserted?: number
          products_updated?: number
          products_categorized?: number
          products_cleaned?: number
          duplicates_detected?: number
          products_failed?: number
          error_details?: string | null
          triggered_by?: string
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          products_fetched?: number
          products_inserted?: number
          products_updated?: number
          products_categorized?: number
          products_cleaned?: number
          duplicates_detected?: number
          products_failed?: number
          error_details?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      supplier_sync_logs: {
        Row: {
          id: string
          connection_id: string | null
          connection_name: string | null
          triggered_by: string
          started_at: string
          completed_at: string | null
          products_fetched: number
          products_inserted: number
          products_updated: number
          products_failed: number
          error_messages: string[] | null
          supplier_api_response: Record<string, unknown> | null
          debug_logs: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          connection_id?: string | null
          connection_name?: string | null
          triggered_by?: string
          started_at?: string
          completed_at?: string | null
          products_fetched?: number
          products_inserted?: number
          products_updated?: number
          products_failed?: number
          error_messages?: string[] | null
          supplier_api_response?: Record<string, unknown> | null
          debug_logs?: string[] | null
          created_at?: string
        }
        Update: {
          completed_at?: string | null
          products_fetched?: number
          products_inserted?: number
          products_updated?: number
          products_failed?: number
          error_messages?: string[] | null
          supplier_api_response?: Record<string, unknown> | null
          debug_logs?: string[] | null
        }
        Relationships: []
      }
      woocommerce_products: {
        Row: {
          id: string
          wc_product_id: number
          name: string
          slug: string
          description: string | null
          short_description: string | null
          images: string[]
          category_ids: number[]
          brand: string | null
          price: number
          sale_price: number | null
          stock_quantity: number
          stock_status: string
          weight: string | null
          tags: string[]
          coin_reward: number
          last_synced_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wc_product_id: number
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          images?: string[]
          category_ids?: number[]
          brand?: string | null
          price: number
          sale_price?: number | null
          stock_quantity?: number
          stock_status?: string
          weight?: string | null
          tags?: string[]
          coin_reward?: number
          last_synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          wc_product_id?: number
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          images?: string[]
          category_ids?: number[]
          brand?: string | null
          price?: number
          sale_price?: number | null
          stock_quantity?: number
          stock_status?: string
          weight?: string | null
          tags?: string[]
          coin_reward?: number
          last_synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_bundles: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          product_ids: string[]
          original_price: number
          bundle_price: number
          savings_amount: number
          coin_reward: number
          is_active: boolean
          display_locations: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          product_ids?: string[]
          original_price: number
          bundle_price: number
          coin_reward?: number
          is_active?: boolean
          display_locations?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          product_ids?: string[]
          original_price?: number
          bundle_price?: number
          coin_reward?: number
          is_active?: boolean
          display_locations?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      cross_sell_rules: {
        Row: {
          id: string
          product_id: string
          recommended_product_id: string
          rule_type: string
          priority: number
          conversion_rate: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          recommended_product_id: string
          rule_type?: string
          priority?: number
          conversion_rate?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          product_id?: string
          recommended_product_id?: string
          rule_type?: string
          priority?: number
          conversion_rate?: number
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cross_sell_rules_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "woocommerce_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_sell_rules_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            referencedRelation: "woocommerce_products"
            referencedColumns: ["id"]
          }
        ]
      }
      growth_analytics: {
        Row: {
          id: string
          event_type: string
          product_id: string | null
          bundle_id: string | null
          user_id: string | null
          session_id: string | null
          revenue_impact: number
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          product_id?: string | null
          bundle_id?: string | null
          user_id?: string | null
          session_id?: string | null
          revenue_impact?: number
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          event_type?: string
          product_id?: string | null
          bundle_id?: string | null
          user_id?: string | null
          session_id?: string | null
          revenue_impact?: number
          metadata?: Record<string, unknown>
        }
        Relationships: [
          {
            foreignKeyName: "growth_analytics_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "woocommerce_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_analytics_bundle_id_fkey"
            columns: ["bundle_id"]
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          }
        ]
      }
      sync_logs: {
        Row: {
          id: string
          sync_type: string
          products_synced: number
          products_added: number
          products_updated: number
          products_failed: number
          error_log: string | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          sync_type: string
          products_synced?: number
          products_added?: number
          products_updated?: number
          products_failed?: number
          error_log?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          products_synced?: number
          products_added?: number
          products_updated?: number
          products_failed?: number
          error_log?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          id: string
          section_key: string
          title: string
          is_enabled: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          section_key: string
          title: string
          is_enabled?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          section_key?: string
          title?: string
          is_enabled?: boolean
          display_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      homepage_banners: {
        Row: {
          id: string
          title: string
          subtitle: string
          cta_text: string
          cta_url: string
          badge_text: string
          badge_color: string
          background_color: string
          image_url: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle: string
          cta_text?: string
          cta_url?: string
          badge_text?: string
          badge_color?: string
          background_color?: string
          image_url?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          subtitle?: string
          cta_text?: string
          cta_url?: string
          badge_text?: string
          badge_color?: string
          background_color?: string
          image_url?: string
          display_order?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      delivery_regions: {
        Row: {
          id: string
          name: string
          description: string
          href: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          href: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string
          href?: string
          display_order?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          content: string | null
          ingredients: string[] | null
          instructions: string[] | null
          image_url: string | null
          difficulty: string | null
          prep_time: string | null
          cook_time: string | null
          servings: number | null
          is_featured: boolean
          show_on_homepage: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          content?: string | null
          ingredients?: string[] | null
          instructions?: string[] | null
          image_url?: string | null
          difficulty?: string | null
          prep_time?: string | null
          cook_time?: string | null
          servings?: number | null
          is_featured?: boolean
          show_on_homepage?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          slug?: string
          description?: string | null
          content?: string | null
          ingredients?: string[] | null
          instructions?: string[] | null
          image_url?: string | null
          difficulty?: string | null
          prep_time?: string | null
          cook_time?: string | null
          servings?: number | null
          is_featured?: boolean
          show_on_homepage?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          message: string
          type: string
          bg_color: string | null
          text_color: string | null
          is_active: boolean
          starts_at: string | null
          ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          message: string
          type?: string
          bg_color?: string | null
          text_color?: string | null
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          message?: string
          type?: string
          bg_color?: string | null
          text_color?: string | null
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          cta_text: string | null
          cta_url: string | null
          image_url: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          cta_text?: string | null
          cta_url?: string | null
          image_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          subtitle?: string | null
          cta_text?: string | null
          cta_url?: string | null
          image_url?: string | null
          display_order?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          alt_text: string | null
          sort_order: number
          is_primary: boolean
          storage_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          alt_text?: string | null
          sort_order?: number
          is_primary?: boolean
          storage_path?: string | null
          created_at?: string
        }
        Update: {
          product_id?: string
          url?: string
          alt_text?: string | null
          sort_order?: number
          is_primary?: boolean
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      image_processing_jobs: {
        Row: {
          id: string
          product_id: string | null
          product_image_id: string | null
          original_url: string
          processed_url: string | null
          thumbnail_url: string | null
          status: string
          pipeline_stage: string | null
          error_message: string | null
          processing_started_at: string | null
          processing_completed_at: string | null
          duration_ms: number | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          product_image_id?: string | null
          original_url: string
          processed_url?: string | null
          thumbnail_url?: string | null
          status?: string
          pipeline_stage?: string | null
          error_message?: string | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          duration_ms?: number | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          product_id?: string | null
          product_image_id?: string | null
          original_url?: string
          processed_url?: string | null
          thumbnail_url?: string | null
          status?: string
          pipeline_stage?: string | null
          error_message?: string | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          duration_ms?: number | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_processing_jobs_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      customer_addresses: {
        Row: {
          id: string
          customer_id: string
          full_name: string
          phone: string
          address_line_1: string
          address_line_2: string | null
          city: string
          county: string | null
          postcode: string
          country: string
          delivery_notes: string | null
          address_type: 'home' | 'work' | 'other'
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          full_name?: string
          phone?: string
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          county?: string | null
          postcode?: string
          country?: string
          delivery_notes?: string | null
          address_type?: 'home' | 'work' | 'other'
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          customer_id?: string
          full_name?: string
          phone?: string
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          county?: string | null
          postcode?: string
          country?: string
          delivery_notes?: string | null
          address_type?: 'home' | 'work' | 'other'
          is_default?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      account_deletion_requests: {
        Row: {
          id: string
          user_id: string
          email: string
          status: 'pending' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          status?: 'pending' | 'completed' | 'cancelled'
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'completed' | 'cancelled'
        }
        Relationships: []
      }
      communication_preferences: {
        Row: {
          id: string
          user_profile_id: string
          email_transactional: boolean
          email_marketing: boolean
          sms_transactional: boolean
          sms_marketing: boolean
          whatsapp_transactional: boolean
          whatsapp_marketing: boolean
          push_order_updates: boolean
          push_promotions: boolean
          push_flash_deals: boolean
          push_new_products: boolean
          push_recipes: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          user_profile_id: string
          email_transactional?: boolean
          email_marketing?: boolean
          sms_transactional?: boolean
          sms_marketing?: boolean
          whatsapp_transactional?: boolean
          whatsapp_marketing?: boolean
          push_order_updates?: boolean
          push_promotions?: boolean
          push_flash_deals?: boolean
          push_new_products?: boolean
          push_recipes?: boolean
          updated_at?: string
        }
        Update: {
          email_transactional?: boolean
          email_marketing?: boolean
          sms_transactional?: boolean
          sms_marketing?: boolean
          whatsapp_transactional?: boolean
          whatsapp_marketing?: boolean
          push_order_updates?: boolean
          push_promotions?: boolean
          push_flash_deals?: boolean
          push_new_products?: boolean
          push_recipes?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          id: string
          user_profile_id: string
          channel: string
          consent_type: string
          granted: boolean
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          user_profile_id: string
          channel: string
          consent_type: string
          granted: boolean
          source: string
          created_at?: string
        }
        Update: {
          granted?: boolean
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          id: string
          order_id: string
          transaction_id: string
          payment_method: string
          amount: number
          currency: string
          status: string
          authorization_code: string | null
          card_last_four: string | null
          card_scheme: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          transaction_id: string
          payment_method: string
          amount: number
          currency?: string
          status: string
          authorization_code?: string | null
          card_last_four?: string | null
          card_scheme?: string | null
          created_at?: string
        }
        Update: {
          status?: string
        }
        Relationships: []
      }
      worldpay_settings: {
        Row: {
          id: string
          service_key: string
          entity_id: string
          client_key: string
          webhook_secret: string
          test_mode: boolean
          apple_pay_merchant_id: string
          apple_pay_domain_verification: string
          google_pay_merchant_id: string
          google_pay_merchant_name: string
          last_transaction_at: string | null
          last_webhook_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_key?: string
          entity_id?: string
          client_key?: string
          webhook_secret?: string
          test_mode?: boolean
          apple_pay_merchant_id?: string
          apple_pay_domain_verification?: string
          google_pay_merchant_id?: string
          google_pay_merchant_name?: string
          last_transaction_at?: string | null
          last_webhook_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          service_key?: string
          entity_id?: string
          client_key?: string
          webhook_secret?: string
          test_mode?: boolean
          apple_pay_merchant_id?: string
          apple_pay_domain_verification?: string
          google_pay_merchant_id?: string
          google_pay_merchant_name?: string
          last_transaction_at?: string | null
          last_webhook_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [key: string]: never
    }
    Functions: {
      get_admin_products: {
        Args: {
          p_sort_field: string
          p_sort_dir: string
          p_limit: number
          p_offset: number
          p_search: string | null
          p_status: string | null
          p_stock_status: string | null
          p_approval_status: string | null
          p_brand: string | null
          p_category_id: string | null
          p_price_min: number | null
          p_price_max: number | null
        }
        Returns: Record<string, unknown>[]
      }
      get_brands_with_counts: {
        Args: Record<string, never>
        Returns: {
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          product_count: number
        }[]
      }
      get_my_profile: {
        Args: Record<string, never>
        Returns: Record<string, unknown>
      }
      retry_failed_ai_jobs: {
        Args: {
          p_batch_id: string | null
        }
        Returns: void
      }
      get_worldpay_client_key: {
        Args: Record<string, never>
        Returns: string
      }
      get_worldpay_wallet_config: {
        Args: Record<string, never>
        Returns: Record<string, unknown>
      }
    }
  }
}
