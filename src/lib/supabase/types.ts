export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          location: string | null;
          trade_score: number;
          trader_level: number;
          total_trades: number;
          total_sales: number;
          is_verified: boolean;
          is_premium: boolean;
          subscription_tier: "free" | "pro" | "elite";
          stripe_customer_id: string | null;
          stripe_connect_id: string | null;
          drop_alerts_active: boolean;
          drop_alerts_subscription_id: string | null;
          verification_level: number;
          phone_verified: boolean;
          id_verified: boolean;
          address_verified: boolean;
          verification_data: Record<string, unknown>;
          trust_score: number;
          trust_score_updated_at: string | null;
          min_trade_trust_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          trade_score?: number;
          trader_level?: number;
          total_trades?: number;
          total_sales?: number;
          is_verified?: boolean;
          is_premium?: boolean;
          subscription_tier?: "free" | "pro" | "elite";
          stripe_customer_id?: string | null;
          stripe_connect_id?: string | null;
          verification_level?: number;
          phone_verified?: boolean;
          id_verified?: boolean;
          address_verified?: boolean;
          verification_data?: Record<string, unknown>;
          trust_score?: number;
          trust_score_updated_at?: string | null;
          min_trade_trust_score?: number;
          drop_alerts_active?: boolean;
          drop_alerts_subscription_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      card_sets: {
        Row: {
          id: string;
          name: string;
          series: string;
          release_date: string | null;
          total_cards: number;
          symbol_url: string | null;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          series: string;
          release_date?: string | null;
          total_cards?: number;
          symbol_url?: string | null;
          logo_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["card_sets"]["Insert"]>;
      };
      cards: {
        Row: {
          id: string;
          set_id: string;
          name: string;
          number: string;
          rarity: string | null;
          card_type: string | null;
          hp: number | null;
          illustrator: string | null;
          image_url: string | null;
          market_value: number | null;
          reverse_holo: boolean;
          first_edition: boolean;
          supertype: string | null;
          subtypes: string[] | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          set_id: string;
          name: string;
          number: string;
          rarity?: string | null;
          card_type?: string | null;
          hp?: number | null;
          illustrator?: string | null;
          image_url?: string | null;
          market_value?: number | null;
          reverse_holo?: boolean;
          first_edition?: boolean;
          supertype?: string | null;
          subtypes?: string[] | null;
          description?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["cards"]["Insert"]>;
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          is_public?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["collections"]["Insert"]>;
      };
      collection_items: {
        Row: {
          id: string;
          collection_id: string;
          card_id: string;
          quantity: number;
          condition: string;
          purchase_price: number | null;
          purchase_date: string | null;
          current_value: number | null;
          is_graded: boolean;
          grading_company: string | null;
          grade: string | null;
          notes: string | null;
          photos: string[] | null;
          for_trade: boolean;
          for_sale: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          card_id: string;
          quantity?: number;
          condition?: string;
          purchase_price?: number | null;
          purchase_date?: string | null;
          current_value?: number | null;
          is_graded?: boolean;
          grading_company?: string | null;
          grade?: string | null;
          notes?: string | null;
          photos?: string[] | null;
          for_trade?: boolean;
          for_sale?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["collection_items"]["Insert"]>;
      };
      want_lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["want_lists"]["Insert"]>;
      };
      want_list_items: {
        Row: {
          id: string;
          want_list_id: string;
          card_id: string;
          desired_condition: string | null;
          desired_grade: string | null;
          max_budget: number | null;
          trade_preferred: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          want_list_id: string;
          card_id: string;
          desired_condition?: string | null;
          desired_grade?: string | null;
          max_budget?: number | null;
          trade_preferred?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["want_list_items"]["Insert"]>;
      };
      trade_offers: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: "pending" | "accepted" | "declined" | "countered" | "completed" | "cancelled";
          cash_amount: number | null;
          notes: string | null;
          shipping_tracking_sender: string | null;
          shipping_tracking_receiver: string | null;
          shipped_at_sender: string | null;
          shipped_at_receiver: string | null;
          received_at_sender: string | null;
          received_at_receiver: string | null;
          completed_at: string | null;
          parent_trade_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: "pending" | "accepted" | "declined" | "countered" | "completed" | "cancelled";
          cash_amount?: number | null;
          notes?: string | null;
          parent_trade_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["trade_offers"]["Insert"]>;
      };
      trade_items: {
        Row: {
          id: string;
          trade_offer_id: string;
          user_id: string;
          collection_item_id: string | null;
          card_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trade_offer_id: string;
          user_id: string;
          collection_item_id?: string | null;
          card_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["trade_items"]["Insert"]>;
      };
      listings: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          title: string;
          description: string | null;
          condition: string;
          is_graded: boolean;
          grading_company: string | null;
          grade: string | null;
          price: number;
          shipping_cost: number;
          accepts_offers: boolean;
          open_to_trades: boolean;
          photos: string[];
          status: "active" | "sold" | "cancelled" | "expired";
          featured_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          title: string;
          description?: string | null;
          condition?: string;
          is_graded?: boolean;
          grading_company?: string | null;
          grade?: string | null;
          price: number;
          shipping_cost?: number;
          accepts_offers?: boolean;
          open_to_trades?: boolean;
          photos?: string[];
          status?: "active" | "sold" | "cancelled" | "expired";
        };
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          platform_fee: number;
          seller_payout: number;
          stripe_payment_intent_id: string | null;
          status: "pending" | "paid" | "shipped" | "delivered" | "completed" | "refunded" | "disputed";
          shipping_tracking: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          platform_fee: number;
          seller_payout: number;
          stripe_payment_intent_id?: string | null;
          status?: "pending" | "paid" | "shipped" | "delivered" | "completed" | "refunded" | "disputed";
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      offers: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          amount: number;
          status: "pending" | "accepted" | "declined" | "countered" | "expired";
          counter_amount: number | null;
          message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id: string;
          amount: number;
          status?: "pending" | "accepted" | "declined" | "countered" | "expired";
          counter_amount?: number | null;
          message?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["offers"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          reviewer_id: string;
          reviewee_id: string;
          trade_offer_id: string | null;
          order_id: string | null;
          rating: number;
          comment: string | null;
          review_type: "trade" | "sale";
          communication_rating: number | null;
          accuracy_rating: number | null;
          shipping_rating: number | null;
          condition_rating: number | null;
          review_photos: string[];
          seller_response: string | null;
          seller_response_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reviewer_id: string;
          reviewee_id: string;
          trade_offer_id?: string | null;
          order_id?: string | null;
          rating: number;
          comment?: string | null;
          review_type: "trade" | "sale";
          communication_rating?: number | null;
          accuracy_rating?: number | null;
          shipping_rating?: number | null;
          condition_rating?: number | null;
          review_photos?: string[];
          seller_response?: string | null;
          seller_response_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      trade_events: {
        Row: {
          id: string;
          trade_id: string;
          event_type: string;
          actor_id: string;
          details: Record<string, unknown>;
          photos: string[];
          integrity_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trade_id: string;
          event_type: string;
          actor_id: string;
          details?: Record<string, unknown>;
          photos?: string[];
          integrity_hash?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["trade_events"]["Insert"]>;
      };
      fraud_flags: {
        Row: {
          id: string;
          listing_id: string | null;
          trade_id: string | null;
          user_id: string;
          risk_score: number;
          risk_level: string;
          flags: string[];
          status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id?: string | null;
          trade_id?: string | null;
          user_id: string;
          risk_score: number;
          risk_level: string;
          flags?: string[];
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["fraud_flags"]["Insert"]>;
      };
      conversations: {
        Row: {
          id: string;
          participant_1: string;
          participant_2: string;
          last_message_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant_1: string;
          participant_2: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["follows"]["Insert"]>;
      };
      activity_feed: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          data: Json | null;
          related_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: string;
          data?: Json | null;
          related_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["activity_feed"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          notification_type: string;
          title: string;
          message: string;
          data: Json | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_type: string;
          title: string;
          message: string;
          data?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string | null;
          reported_listing_id: string | null;
          report_type: string;
          reason: string;
          details: string | null;
          status: "pending" | "reviewed" | "resolved" | "dismissed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id?: string | null;
          reported_listing_id?: string | null;
          report_type: string;
          reason: string;
          details?: string | null;
          status?: "pending" | "reviewed" | "resolved" | "dismissed";
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
      };
      disputes: {
        Row: {
          id: string;
          order_id: string | null;
          trade_offer_id: string | null;
          initiator_id: string;
          reason: string;
          details: string | null;
          status: "open" | "investigating" | "resolved" | "closed";
          resolution: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          trade_offer_id?: string | null;
          initiator_id: string;
          reason: string;
          details?: string | null;
          status?: "open" | "investigating" | "resolved" | "closed";
        };
        Update: Partial<Database["public"]["Tables"]["disputes"]["Insert"]>;
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_type: string;
          achieved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["achievements"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string | null;
          tier: "free" | "pro" | "elite";
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id?: string | null;
          tier?: "free" | "pro" | "elite";
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: string;
          amount: number;
          stripe_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_type: string;
          amount: number;
          stripe_id?: string | null;
          metadata?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
      };
      admin_actions: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_user_id: string | null;
          target_listing_id: string | null;
          details: string | null;
          performed_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          target_user_id?: string | null;
          target_listing_id?: string | null;
          details?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["admin_actions"]["Insert"]>;
      };
    };
    Functions: {
      is_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      subscription_tier: "free" | "pro" | "elite";
      trade_status: "pending" | "accepted" | "declined" | "countered" | "completed" | "cancelled";
      listing_status: "active" | "sold" | "cancelled" | "expired";
      order_status: "pending" | "paid" | "shipped" | "delivered" | "completed" | "refunded" | "disputed";
      report_status: "pending" | "reviewed" | "resolved" | "dismissed";
      dispute_status: "open" | "investigating" | "resolved" | "closed";
      review_type: "trade" | "sale";
    };
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Card = Database["public"]["Tables"]["cards"]["Row"];
export type CardSet = Database["public"]["Tables"]["card_sets"]["Row"];
export type Collection = Database["public"]["Tables"]["collections"]["Row"];
export type CollectionItem = Database["public"]["Tables"]["collection_items"]["Row"];
export type WantList = Database["public"]["Tables"]["want_lists"]["Row"];
export type WantListItem = Database["public"]["Tables"]["want_list_items"]["Row"];
export type TradeOffer = Database["public"]["Tables"]["trade_offers"]["Row"];
export type TradeItem = Database["public"]["Tables"]["trade_items"]["Row"];
export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Offer = Database["public"]["Tables"]["offers"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type TradeEvent = Database["public"]["Tables"]["trade_events"]["Row"];
export type FraudFlag = Database["public"]["Tables"]["fraud_flags"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
