import {
  type CSSProperties,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import styles from './styles.module.css'
import {
  loadTodayImages,
  MissingTodayContentError,
  type TodayImage,
} from './todayContent'

type ContentState =
  | { status: 'loading' }
  | { status: 'ready'; images: TodayImage[] }
  | { status: 'error'; reason: 'missing' | 'unavailable' }

type FinalState = 'idle' | 'error' | 'success'

interface TodayCinematicProps {
  onComplete: () => void
  loadImages?: () => Promise<TodayImage[]>
}

interface CinematicVariables extends CSSProperties {
  '--gallery-offset': string
  '--timeline-line-width': string
  '--timeline-opacity': number
  '--marker-one-opacity': number
  '--marker-two-opacity': number
  '--marker-three-opacity': number
  '--marker-four-opacity': number
  '--image-progress': number
  '--image-clip': string
  '--image-scale': number
  '--caption-progress': number
  '--caption-offset': string
  '--final-progress': number
  '--final-offset': string
}

const EXPECTED_FINAL_ANSWER = 'ida e volta'

function clamp(value: number): number {
  return Math.min(Math.max(value, 0), 1)
}

function sectionProgress(section: HTMLElement): number {
  const sectionTop = window.scrollY + section.getBoundingClientRect().top
  const travel = Math.max(section.offsetHeight - window.innerHeight, 1)

  return clamp((window.scrollY - sectionTop) / travel)
}

function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR')
}

export function TodayCinematic({
  onComplete,
  loadImages = loadTodayImages,
}: TodayCinematicProps) {
  const [content, setContent] = useState<ContentState>({ status: 'loading' })
  const [answer, setAnswer] = useState('')
  const [finalState, setFinalState] = useState<FinalState>('idle')
  const [scrollProgress, setScrollProgress] = useState({
    gallery: 0,
    timeline: 0,
    final: 0,
  })
  const gallerySection = useRef<HTMLElement>(null)
  const timelineSection = useRef<HTMLElement>(null)
  const finalSection = useRef<HTMLElement>(null)
  const completionTimer = useRef<number | null>(null)

  useEffect(() => {
    let active = true

    void loadImages()
      .then((images) => {
        if (!active) {
          return
        }

        if (images.length !== 4) {
          throw new MissingTodayContentError('A cinemática precisa de quatro imagens.')
        }

        setContent({ status: 'ready', images })
      })
      .catch((error: unknown) => {
        if (!active) {
          return
        }

        console.error('Não foi possível carregar a cinemática de hoje.', error)
        setContent({
          status: 'error',
          reason: error instanceof MissingTodayContentError ? 'missing' : 'unavailable',
        })
      })

    return () => {
      active = false
    }
  }, [loadImages])

  useEffect(() => {
    if (content.status !== 'ready') {
      return
    }

    let frame = 0

    const updateProgress = () => {
      frame = 0

      if (!gallerySection.current || !timelineSection.current || !finalSection.current) {
        return
      }

      const finalRect = finalSection.current.getBoundingClientRect()
      const finalProgress = clamp(
        (window.innerHeight * 0.85 - finalRect.top) / (window.innerHeight * 0.65),
      )

      setScrollProgress({
        gallery: sectionProgress(gallerySection.current),
        timeline: sectionProgress(timelineSection.current),
        final: finalProgress,
      })
    }

    const scheduleProgressUpdate = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(updateProgress)
      }
    }

    scheduleProgressUpdate()
    window.addEventListener('scroll', scheduleProgressUpdate, { passive: true })
    window.addEventListener('resize', scheduleProgressUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleProgressUpdate)
      window.removeEventListener('resize', scheduleProgressUpdate)

      if (frame !== 0) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [content.status])

  useEffect(() => {
    return () => {
      if (completionTimer.current !== null) {
        window.clearTimeout(completionTimer.current)
      }
    }
  }, [])

  const handleFinalAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (normalizeAnswer(answer) !== EXPECTED_FINAL_ANSWER) {
      setFinalState('error')
      return
    }

    setFinalState('success')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    completionTimer.current = window.setTimeout(onComplete, reducedMotion ? 0 : 900)
  }

  if (content.status === 'loading') {
    return (
      <section className={styles.statusScreen} aria-label="Carregando cinemática" aria-live="polite">
        <span className={styles.loadingPulse} aria-hidden="true" />
      </section>
    )
  }

  if (content.status === 'error') {
    return (
      <section className={styles.statusScreen} role="alert">
        <p>
          {content.reason === 'missing'
            ? 'uma lembrança não conseguiu chegar até aqui.'
            : 'essa lembrança precisa de mais um instante para aparecer.'}
        </p>
        <small>tente recarregar a página.</small>
      </section>
    )
  }

  const timelineLine = clamp(scrollProgress.timeline / 0.5)
  const imageProgress = clamp((scrollProgress.timeline - 0.35) / 0.5)
  const captionProgress = clamp((scrollProgress.timeline - 0.72) / 0.2)
  const cinematicVariables: CinematicVariables = {
    '--gallery-offset': `${scrollProgress.gallery * -200}vw`,
    '--timeline-line-width': `${timelineLine * 100}%`,
    '--timeline-opacity': 1 - imageProgress,
    '--marker-one-opacity': clamp(timelineLine * 5 - 0.25),
    '--marker-two-opacity': clamp(timelineLine * 5 - 1.5),
    '--marker-three-opacity': clamp(timelineLine * 5 - 2.75),
    '--marker-four-opacity': clamp(timelineLine * 5 - 4),
    '--image-progress': imageProgress,
    '--image-clip': `${(1 - imageProgress) * 34}%`,
    '--image-scale': 1.08 - imageProgress * 0.08,
    '--caption-progress': captionProgress,
    '--caption-offset': `${(1 - captionProgress) * 2}rem`,
    '--final-progress': scrollProgress.final,
    '--final-offset': `${(1 - scrollProgress.final) * 2.75}rem`,
  }
  const finalClassName = [
    styles.finalSection,
    finalState === 'success' ? styles.finalSectionLeaving : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={styles.cinematic}
      style={cinematicVariables}
      aria-label="Nosso primeiro dia 5"
    >
      <section className={styles.intro} aria-labelledby="cinematic-intro-title">
        <div className={styles.introGlow} aria-hidden="true" />
        <p className={styles.eyebrow}>05 · 05</p>
        <h1 id="cinematic-intro-title">
          Nosso primeiro dia 5,
          <span>quando tudo ainda era doce</span>
        </h1>
        <div className={styles.scrollCue} aria-hidden="true">
          <span />
        </div>
      </section>

      <section
        ref={gallerySection}
        className={styles.gallerySection}
        aria-label="As três primeiras lembranças"
      >
        <div className={styles.galleryViewport}>
          <div className={styles.galleryTrack}>
            {content.images.slice(0, 3).map((image, index) => (
              <figure className={styles.memoryPanel} key={image.id}>
                <div className={styles.memoryFrame}>
                  <img src={image.src} alt={image.alt} draggable="false" />
                </div>
                <figcaption>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <span>05</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section
        ref={timelineSection}
        className={styles.timelineSection}
        aria-label="Linha do tempo até hoje"
      >
        <div className={styles.timelineViewport}>
          <div className={styles.timelinePath} aria-hidden="true">
            <div className={styles.timelineLine} />
            {[0, 1, 2, 3].map((marker) => (
              <span className={styles.timelineMarker} key={marker}>
                05
              </span>
            ))}
          </div>

          <figure className={styles.lastMemory}>
            <img src={content.images[3].src} alt={content.images[3].alt} draggable="false" />
            <div className={styles.lastMemoryShade} aria-hidden="true" />
            <figcaption>
              esse não é o nosso último dia 5,
              <span>é apenas um lembrete que ainda temos muito pela frente</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section ref={finalSection} className={finalClassName} aria-labelledby="andromeda-title">
        <div className={styles.finalGlow} aria-hidden="true" />
        <div className={styles.finalContent}>
          <p className={styles.finalEyebrow}>antes de terminar</p>
          <h2 id="andromeda-title">Eu te amo daqui até andrômeda</h2>

          <form className={styles.finalForm} onSubmit={handleFinalAnswer} noValidate>
            <label htmlFor="andromeda-answer">complete o caminho</label>
            <div className={styles.answerControl}>
              <input
                id="andromeda-answer"
                value={answer}
                onChange={(event) => {
                  setAnswer(event.target.value)
                  if (finalState === 'error') {
                    setFinalState('idle')
                  }
                }}
                autoComplete="off"
                autoCapitalize="sentences"
                aria-describedby="andromeda-feedback"
                disabled={finalState === 'success'}
              />
              <button type="submit" disabled={finalState === 'success'} aria-label="Responder">
                →
              </button>
            </div>
            <p
              id="andromeda-feedback"
              className={styles.finalFeedback}
              role="status"
              aria-live="polite"
            >
              {finalState === 'error' && 'ainda falta uma parte desse caminho, amor.'}
              {finalState === 'success' && 'sempre.'}
            </p>
          </form>
        </div>
      </section>
    </article>
  )
}
