import { getImageById } from '../../services/supabase/content'
import { getPublicImageUrl } from '../../services/supabase/storage'
import localImageOne from './assets/day-five-01.png'
import localImageTwo from './assets/day-five-02.png'
import localImageThree from './assets/day-five-03.png'
import localImageFour from './assets/day-five-04.png'

export interface TodayImage {
  id: string
  name: string
  src: string
  alt: string
}

export class MissingTodayContentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingTodayContentError'
  }
}

const localImages: TodayImage[] = [
  {
    id: 'local-day-five-01',
    name: 'Primeiro dia 5 — escadaria',
    src: localImageOne,
    alt: 'Nós dois sorrindo em uma escadaria',
  },
  {
    id: 'local-day-five-02',
    name: 'Primeiro dia 5 — exposição',
    src: localImageTwo,
    alt: 'Nós dois compartilhando fones em uma exposição',
  },
  {
    id: 'local-day-five-03',
    name: 'Primeiro dia 5 — juntos',
    src: localImageThree,
    alt: 'Nós dois sentados e olhando um para o outro',
  },
  {
    id: 'local-day-five-04',
    name: 'Ainda temos muito pela frente',
    src: localImageFour,
    alt: 'Nós dois diante de um espelho',
  },
]

function configuredImageIds(): string[] {
  return [
    import.meta.env.VITE_TODAY_IMAGE_1_ID,
    import.meta.env.VITE_TODAY_IMAGE_2_ID,
    import.meta.env.VITE_TODAY_IMAGE_3_ID,
    import.meta.env.VITE_TODAY_IMAGE_4_ID,
  ].map((id) => id?.trim() ?? '')
}

export async function loadTodayImages(): Promise<TodayImage[]> {
  const imageIds = configuredImageIds()
  const configuredCount = imageIds.filter(Boolean).length

  if (configuredCount === 0) {
    return localImages
  }

  if (configuredCount !== imageIds.length) {
    throw new MissingTodayContentError(
      'Configure os quatro IDs de imagem da cinemática ou deixe todos vazios.',
    )
  }

  const images = await Promise.all(imageIds.map((id) => getImageById(id)))

  if (images.some((image) => image === null)) {
    throw new MissingTodayContentError('Uma das imagens da cinemática não foi encontrada.')
  }

  return images.map((image) => {
    if (!image) {
      throw new MissingTodayContentError('Uma das imagens da cinemática não foi encontrada.')
    }

    return {
      id: image.id,
      name: image.name,
      src: getPublicImageUrl(image.storagePath),
      alt: image.description ?? image.name,
    }
  })
}
