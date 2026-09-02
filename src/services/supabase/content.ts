import type { PostgrestError } from '@supabase/supabase-js'

import { getSupabaseClient } from './client'
import type {
  ImageContent,
  ImageRow,
  SongContent,
  SongRow,
  TextContent,
  TextRow,
  VideoContent,
  VideoRow,
} from './types'

const imageColumns = 'id,name,storage_path,description,created_at'
const textColumns = 'id,content,author,sent_at,context,source,created_at'
const videoColumns = 'id,name,storage_path,description,created_at'
const songColumns = 'id,name,spotify_url,created_at'

function queryError(action: string, error: PostgrestError): Error {
  const code = error.code ? ` (${error.code})` : ''

  return new Error(`Falha ao ${action} no Supabase${code}: ${error.message}`, {
    cause: error,
  })
}

function mapImage(row: ImageRow): ImageContent {
  return {
    id: row.id,
    name: row.name,
    storagePath: row.storage_path,
    description: row.description ?? undefined,
    createdAt: row.created_at,
  }
}

function mapText(row: TextRow): TextContent {
  return {
    id: row.id,
    content: row.content,
    author: row.author,
    sentAt: row.sent_at,
    context: row.context ?? undefined,
    source: row.source ?? undefined,
    createdAt: row.created_at,
  }
}

function mapVideo(row: VideoRow): VideoContent {
  return {
    id: row.id,
    name: row.name,
    storagePath: row.storage_path,
    description: row.description ?? undefined,
    createdAt: row.created_at,
  }
}

function mapSong(row: SongRow): SongContent {
  return {
    id: row.id,
    name: row.name,
    spotifyUrl: row.spotify_url,
    createdAt: row.created_at,
  }
}

export async function getImageById(id: string): Promise<ImageContent | null> {
  const { data, error } = await getSupabaseClient()
    .from('images')
    .select(imageColumns)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw queryError('buscar imagem', error)
  }

  return data ? mapImage(data) : null
}

export async function getTextById(id: string): Promise<TextContent | null> {
  const { data, error } = await getSupabaseClient()
    .from('texts')
    .select(textColumns)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw queryError('buscar texto', error)
  }

  return data ? mapText(data) : null
}

export async function getVideoById(id: string): Promise<VideoContent | null> {
  const { data, error } = await getSupabaseClient()
    .from('videos')
    .select(videoColumns)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw queryError('buscar vídeo', error)
  }

  return data ? mapVideo(data) : null
}

export async function getSongById(id: string): Promise<SongContent | null> {
  const { data, error } = await getSupabaseClient()
    .from('songs')
    .select(songColumns)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw queryError('buscar música', error)
  }

  return data ? mapSong(data) : null
}

export async function listImages(): Promise<ImageContent[]> {
  const { data, error } = await getSupabaseClient()
    .from('images')
    .select(imageColumns)
    .order('created_at', { ascending: true })

  if (error) {
    throw queryError('listar imagens', error)
  }

  return data.map(mapImage)
}

export async function listTexts(): Promise<TextContent[]> {
  const { data, error } = await getSupabaseClient()
    .from('texts')
    .select(textColumns)
    .order('created_at', { ascending: true })

  if (error) {
    throw queryError('listar textos', error)
  }

  return data.map(mapText)
}

export async function listVideos(): Promise<VideoContent[]> {
  const { data, error } = await getSupabaseClient()
    .from('videos')
    .select(videoColumns)
    .order('created_at', { ascending: true })

  if (error) {
    throw queryError('listar vídeos', error)
  }

  return data.map(mapVideo)
}

export async function listSongs(): Promise<SongContent[]> {
  const { data, error } = await getSupabaseClient()
    .from('songs')
    .select(songColumns)
    .order('created_at', { ascending: true })

  if (error) {
    throw queryError('listar músicas', error)
  }

  return data.map(mapSong)
}
