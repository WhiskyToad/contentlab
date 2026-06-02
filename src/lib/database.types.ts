export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      ai_generations: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: 'video' | 'script'
          error: string | null
          id: string
          input: Json
          output: Json
          status: 'succeeded' | 'failed'
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: 'video' | 'script'
          error?: string | null
          id?: string
          input?: Json
          output?: Json
          status?: 'succeeded' | 'failed'
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: 'video' | 'script'
          error?: string | null
          id?: string
          input?: Json
          output?: Json
          status?: 'succeeded' | 'failed'
          user_id?: string
        }
        Relationships: []
      }
      script_references: {
        Row: {
          created_at: string
          script_id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          script_id: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          script_id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'script_references_script_id_fkey'
            columns: ['script_id']
            isOneToOne: false
            referencedRelation: 'scripts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'script_references_video_id_fkey'
            columns: ['video_id']
            isOneToOne: false
            referencedRelation: 'videos'
            referencedColumns: ['id']
          },
        ]
      }
      scripts: {
        Row: {
          body: string
          created_at: string
          cta: string
          hook: string
          id: string
          notes: string
          status: 'idea' | 'draft' | 'ready' | 'filmed' | 'posted'
          tags: string[]
          target_platform: 'youtube' | 'tiktok' | 'instagram' | 'other'
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          cta?: string
          hook?: string
          id?: string
          notes?: string
          status?: 'idea' | 'draft' | 'ready' | 'filmed' | 'posted'
          tags?: string[]
          target_platform?: 'youtube' | 'tiktok' | 'instagram' | 'other'
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          cta?: string
          hook?: string
          id?: string
          notes?: string
          status?: 'idea' | 'draft' | 'ready' | 'filmed' | 'posted'
          tags?: string[]
          target_platform?: 'youtube' | 'tiktok' | 'instagram' | 'other'
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          id: number
          inserted_at: string
          is_complete: boolean | null
          task: string | null
          user_id: string
        }
        Insert: {
          id?: number
          inserted_at?: string
          is_complete?: boolean | null
          task?: string | null
          user_id: string
        }
        Update: {
          id?: number
          inserted_at?: string
          is_complete?: boolean | null
          task?: string | null
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          caption: string | null
          clean_script: string
          comment_count: number | null
          created_at: string
          creator: string | null
          duration_seconds: number | null
          external_id: string | null
          format: string | null
          id: string
          like_count: number | null
          niche: string | null
          notes: string
          platform: 'youtube' | 'tiktok' | 'instagram' | 'other'
          published_at: string | null
          raw_transcript: string
          status: 'saved' | 'used' | 'archived'
          tags: string[]
          thumbnail_url: string | null
          title: string | null
          transcript_segments: Json
          updated_at: string
          url: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          caption?: string | null
          clean_script?: string
          comment_count?: number | null
          created_at?: string
          creator?: string | null
          duration_seconds?: number | null
          external_id?: string | null
          format?: string | null
          id?: string
          like_count?: number | null
          niche?: string | null
          notes?: string
          platform: 'youtube' | 'tiktok' | 'instagram' | 'other'
          published_at?: string | null
          raw_transcript?: string
          status?: 'saved' | 'used' | 'archived'
          tags?: string[]
          thumbnail_url?: string | null
          title?: string | null
          transcript_segments?: Json
          updated_at?: string
          url: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          caption?: string | null
          clean_script?: string
          comment_count?: number | null
          created_at?: string
          creator?: string | null
          duration_seconds?: number | null
          external_id?: string | null
          format?: string | null
          id?: string
          like_count?: number | null
          niche?: string | null
          notes?: string
          platform?: 'youtube' | 'tiktok' | 'instagram' | 'other'
          published_at?: string | null
          raw_transcript?: string
          status?: 'saved' | 'used' | 'archived'
          tags?: string[]
          thumbnail_url?: string | null
          title?: string | null
          transcript_segments?: Json
          updated_at?: string
          url?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<TName extends keyof Database['public']['Tables']> = Database['public']['Tables'][TName]['Row']
export type TablesInsert<TName extends keyof Database['public']['Tables']> = Database['public']['Tables'][TName]['Insert']
export type TablesUpdate<TName extends keyof Database['public']['Tables']> = Database['public']['Tables'][TName]['Update']
