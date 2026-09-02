import { afterEach, describe, expect, it, vi } from 'vitest'

const rows = {
  images: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Primeiro encontro',
    storage_path: 'memories/first-date.webp',
    description: 'Uma lembrança',
    created_at: '2026-09-01T12:00:00.000Z',
  },
  texts: {
    id: '22222222-2222-2222-2222-222222222222',
    content: 'eu te amo',
    author: 'ela',
    sent_at: '2026-03-14T18:42:00.000Z',
    context: 'depois da nossa primeira discussão',
    source: 'conversa',
    created_at: '2026-09-01T12:01:00.000Z',
  },
  videos: {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Um instante',
    storage_path: 'memories/an-instant.mp4',
    description: null,
    created_at: '2026-09-01T12:02:00.000Z',
  },
  songs: {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Nossa música',
    spotify_url: 'https://open.spotify.com/track/example',
    created_at: '2026-09-01T12:03:00.000Z',
  },
} as const

type TableName = keyof typeof rows

function requestUrl(input: RequestInfo | URL): URL {
  if (typeof input === 'string') {
    return new URL(input)
  }

  if (input instanceof URL) {
    return input
  }

  return new URL(input.url)
}

function tableFromRequest(input: RequestInfo | URL): TableName {
  const table = requestUrl(input).pathname.split('/').at(-1)

  if (!table || !(table in rows)) {
    throw new Error(`Tabela inesperada no teste: ${table ?? 'ausente'}`)
  }

  return table as TableName
}

function configureEnvironment() {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://babydoll-test.supabase.co')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('camada de conteúdo Supabase', () => {
  it('consulta as quatro tabelas e converte snake_case para camelCase', async () => {
    configureEnvironment()

    const requestedTables: TableName[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const table = tableFromRequest(input)
        requestedTables.push(table)

        return new Response(JSON.stringify([rows[table]]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }),
    )

    const {
      getImageById,
      getSongById,
      getTextById,
      getVideoById,
      listImages,
      listSongs,
      listTexts,
      listVideos,
    } = await import('../src/services/supabase/content')

    await expect(getImageById(rows.images.id)).resolves.toEqual({
      id: rows.images.id,
      name: rows.images.name,
      storagePath: rows.images.storage_path,
      description: rows.images.description,
      createdAt: rows.images.created_at,
    })
    await expect(getTextById(rows.texts.id)).resolves.toEqual({
      id: rows.texts.id,
      content: rows.texts.content,
      author: rows.texts.author,
      sentAt: rows.texts.sent_at,
      context: rows.texts.context,
      source: rows.texts.source,
      createdAt: rows.texts.created_at,
    })
    await expect(getVideoById(rows.videos.id)).resolves.toEqual({
      id: rows.videos.id,
      name: rows.videos.name,
      storagePath: rows.videos.storage_path,
      description: undefined,
      createdAt: rows.videos.created_at,
    })
    await expect(getSongById(rows.songs.id)).resolves.toEqual({
      id: rows.songs.id,
      name: rows.songs.name,
      spotifyUrl: rows.songs.spotify_url,
      createdAt: rows.songs.created_at,
    })

    await expect(listImages()).resolves.toHaveLength(1)
    await expect(listTexts()).resolves.toHaveLength(1)
    await expect(listVideos()).resolves.toHaveLength(1)
    await expect(listSongs()).resolves.toHaveLength(1)

    expect(requestedTables).toEqual([
      'images',
      'texts',
      'videos',
      'songs',
      'images',
      'texts',
      'videos',
      'songs',
    ])
  })

  it('retorna null quando o registro individual não existe', async () => {
    configureEnvironment()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('[]', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )

    const { getImageById } = await import('../src/services/supabase/content')

    await expect(getImageById(rows.images.id)).resolves.toBeNull()
  })

  it('propaga um erro claro quando a consulta falha', async () => {
    configureEnvironment()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            code: 'XX000',
            details: 'database unavailable',
            hint: null,
            message: 'temporary failure',
          }),
          {
            status: 500,
            statusText: 'Internal Server Error',
            headers: { 'content-type': 'application/json' },
          },
        ),
      ),
    )

    const { getTextById } = await import('../src/services/supabase/content')

    await expect(getTextById(rows.texts.id)).rejects.toThrow(
      'Falha ao buscar texto no Supabase (XX000): temporary failure',
    )
  })

  it('só exige as variáveis quando o cliente é realmente utilizado', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    const { getSupabaseClient } = await import('../src/services/supabase/client')

    expect(getSupabaseClient).toThrow(
      'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
    )
  })
})
