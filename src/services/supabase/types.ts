export interface ImageContent {
  id: string
  name: string
  storagePath: string
  description?: string
  createdAt: string
}

export interface TextContent {
  id: string
  content: string
  author: string
  sentAt: string
  context?: string
  source?: string
  createdAt: string
}

export interface VideoContent {
  id: string
  name: string
  storagePath: string
  description?: string
  createdAt: string
}

export interface SongContent {
  id: string
  name: string
  spotifyUrl: string
  createdAt: string
}

export interface ImageRow {
  id: string
  name: string
  storage_path: string
  description: string | null
  created_at: string
}

export interface TextRow {
  id: string
  content: string
  author: string
  sent_at: string
  context: string | null
  source: string | null
  created_at: string
}

export interface VideoRow {
  id: string
  name: string
  storage_path: string
  description: string | null
  created_at: string
}

export interface SongRow {
  id: string
  name: string
  spotify_url: string
  created_at: string
}

interface ImageInsert {
  id?: string
  name: string
  storage_path: string
  description?: string | null
  created_at?: string
}

interface TextInsert {
  id?: string
  content: string
  author: string
  sent_at: string
  context?: string | null
  source?: string | null
  created_at?: string
}

interface VideoInsert {
  id?: string
  name: string
  storage_path: string
  description?: string | null
  created_at?: string
}

interface SongInsert {
  id?: string
  name: string
  spotify_url: string
  created_at?: string
}

interface TableDefinition<Row, Insert, Update> {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      images: TableDefinition<ImageRow, ImageInsert, Partial<ImageInsert>>
      texts: TableDefinition<TextRow, TextInsert, Partial<TextInsert>>
      videos: TableDefinition<VideoRow, VideoInsert, Partial<VideoInsert>>
      songs: TableDefinition<SongRow, SongInsert, Partial<SongInsert>>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
