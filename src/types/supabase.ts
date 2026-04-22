export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      cars: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          price: number;
          mileage: number | null;
          year: number | null;
          make: string | null;
          model: string | null;
          category: string | null;
          condition: string;
          fuel_type: string;
          transmission: string;
          color: string | null;
          tags: string[] | null;
          specs: Json | null;
          images: string[] | null;
          primary_image_index: number | null;
          seller_id: string | null;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          price: number;
          mileage?: number | null;
          year?: number | null;
          make?: string | null;
          model?: string | null;
          category?: string | null;
          condition?: string;
          fuel_type?: string;
          transmission?: string;
          color?: string | null;
          tags?: string[] | null;
          specs?: Json | null;
          images?: string[] | null;
          primary_image_index?: number | null;
          seller_id?: string | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          price?: number;
          mileage?: number | null;
          year?: number | null;
          make?: string | null;
          model?: string | null;
          category?: string | null;
          condition?: string;
          fuel_type?: string;
          transmission?: string;
          color?: string | null;
          tags?: string[] | null;
          specs?: Json | null;
          images?: string[] | null;
          primary_image_index?: number | null;
          seller_id?: string | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_inquiries: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string;
          message: string;
          car_id: string | null;
          read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          subject: string;
          message: string;
          car_id?: string | null;
          read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          subject?: string;
          message?: string;
          car_id?: string | null;
          read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_inquiries_car_id_fkey';
            columns: ['car_id'];
            isOneToOne: false;
            referencedRelation: 'cars';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};