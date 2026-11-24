export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SketchCategory = 'western' | 'eastern';
export type BoardItemType = 'sketch' | 'swatch' | 'palette' | 'photo' | 'snapshot';
export type TechPackUnit = 'inch' | 'cm';
export type AiUsageKind = 'text' | 'image';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          role_title: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          role_title?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          role_title?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sketches: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: SketchCategory | null;
          fabric_label: string | null;
          data: Json;
          thumbnail_path: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category?: SketchCategory | null;
          fabric_label?: string | null;
          data?: Json;
          thumbnail_path?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: SketchCategory | null;
          fabric_label?: string | null;
          data?: Json;
          thumbnail_path?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      boards: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      board_items: {
        Row: {
          id: string;
          board_id: string;
          user_id: string;
          type: BoardItemType;
          ref_id: string | null;
          payload: Json;
          x: number;
          y: number;
          rotation: number;
          scale: number;
          z_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          user_id: string;
          type: BoardItemType;
          ref_id?: string | null;
          payload?: Json;
          x?: number;
          y?: number;
          rotation?: number;
          scale?: number;
          z_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          user_id?: string;
          type?: BoardItemType;
          ref_id?: string | null;
          payload?: Json;
          x?: number;
          y?: number;
          rotation?: number;
          scale?: number;
          z_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      palettes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          colors: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          colors?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          colors?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      tech_packs: {
        Row: {
          id: string;
          user_id: string;
          sketch_id: string;
          measurements: Json;
          fabrics: Json;
          notes: string | null;
          unit: TechPackUnit;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sketch_id: string;
          measurements?: Json;
          fabrics?: Json;
          notes?: string | null;
          unit?: TechPackUnit;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sketch_id?: string;
          measurements?: Json;
          fabrics?: Json;
          notes?: string | null;
          unit?: TechPackUnit;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_usage: {
        Row: {
          id: string;
          user_id: string;
          kind: AiUsageKind;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: AiUsageKind;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: AiUsageKind;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type SketchRow = Database['public']['Tables']['sketches']['Row'];
export type SketchInsert = Database['public']['Tables']['sketches']['Insert'];
export type SketchUpdate = Database['public']['Tables']['sketches']['Update'];

export type BoardRow = Database['public']['Tables']['boards']['Row'];
export type BoardInsert = Database['public']['Tables']['boards']['Insert'];
export type BoardUpdate = Database['public']['Tables']['boards']['Update'];

export type BoardItemRow = Database['public']['Tables']['board_items']['Row'];
export type BoardItemInsert = Database['public']['Tables']['board_items']['Insert'];
export type BoardItemUpdate = Database['public']['Tables']['board_items']['Update'];

export type PaletteRow = Database['public']['Tables']['palettes']['Row'];
export type PaletteInsert = Database['public']['Tables']['palettes']['Insert'];
export type PaletteUpdate = Database['public']['Tables']['palettes']['Update'];

export type TechPackRow = Database['public']['Tables']['tech_packs']['Row'];
export type TechPackInsert = Database['public']['Tables']['tech_packs']['Insert'];
export type TechPackUpdate = Database['public']['Tables']['tech_packs']['Update'];

export type AiUsageRow = Database['public']['Tables']['ai_usage']['Row'];
export type AiUsageInsert = Database['public']['Tables']['ai_usage']['Insert'];
export type AiUsageUpdate = Database['public']['Tables']['ai_usage']['Update'];
