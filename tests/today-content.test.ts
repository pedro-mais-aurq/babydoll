import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ImageContent } from '../src/services/supabase/types'
import { loadTodayImages, MissingTodayContentError } from '../src/cinematics/today/todayContent'

const supabaseMocks = vi.hoisted(() => ({
  getImageById: vi.fn<(id: string) => Promise<ImageContent | null>>(),
  getPublicImageUrl: vi.fn<(storagePath: string) => string>(),
}))

vi.mock('../src/services/supabase/content', () => ({
  getImageById: supabaseMocks.getImageById,
}))

vi.mock('../src/services/supabase/storage', () => ({
  getPublicImageUrl: supabaseMocks.getPublicImageUrl,
}))

function configureRemoteIds() {
  vi.stubEnv('VITE_TODAY_IMAGE_1_ID', 'image-1')
  vi.stubEnv('VITE_TODAY_IMAGE_2_ID', 'image-2')
  vi.stubEnv('VITE_TODAY_IMAGE_3_ID', 'image-3')
  vi.stubEnv('VITE_TODAY_IMAGE_4_ID', 'image-4')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('conteúdo da cinemática de hoje', () => {
  it('usa as quatro imagens anexadas quando nenhum ID remoto foi configurado', async () => {
    const images = await loadTodayImages()

    expect(images).toHaveLength(4)
    expect(images.map((image) => image.id)).toEqual([
      'local-day-five-01',
      'local-day-five-02',
      'local-day-five-03',
      'local-day-five-04',
    ])
    expect(supabaseMocks.getImageById).not.toHaveBeenCalled()
  })

  it('busca IDs explícitos pela camada Supabase e resolve os storage paths', async () => {
    configureRemoteIds()
    supabaseMocks.getImageById.mockImplementation(async (id) => ({
      id,
      name: `Imagem ${id}`,
      storagePath: `today/${id}.png`,
      description: `Descrição ${id}`,
      createdAt: '2026-09-02T00:00:00.000Z',
    }))
    supabaseMocks.getPublicImageUrl.mockImplementation(
      (storagePath) => `https://example.supabase.co/storage/${storagePath}`,
    )

    const images = await loadTodayImages()

    expect(supabaseMocks.getImageById).toHaveBeenCalledTimes(4)
    expect(images[0]).toEqual({
      id: 'image-1',
      name: 'Imagem image-1',
      src: 'https://example.supabase.co/storage/today/image-1.png',
      alt: 'Descrição image-1',
    })
  })

  it('rejeita configuração parcial de IDs', async () => {
    vi.stubEnv('VITE_TODAY_IMAGE_1_ID', 'image-1')

    await expect(loadTodayImages()).rejects.toBeInstanceOf(MissingTodayContentError)
  })

  it('diferencia um registro ausente de uma configuração local válida', async () => {
    configureRemoteIds()
    supabaseMocks.getImageById.mockResolvedValue(null)

    await expect(loadTodayImages()).rejects.toThrow(
      'Uma das imagens da cinemática não foi encontrada.',
    )
  })
})
