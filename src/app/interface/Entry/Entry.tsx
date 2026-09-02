import '@fontsource/fredoka/latin-600.css'
import '@fontsource/fredoka/latin-700.css'

import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'

import entryReference from './assets/entry-reference.png'
import heartCharacter from './assets/hello-kitty-heart.png'
import peekingCharacter from './assets/hello-kitty-peeking.png'
import styles from './Entry.module.css'

type EntryState = 'idle' | 'typing' | 'error' | 'success' | 'leaving'

interface EntryProps {
  onComplete: () => void
}

const EXPECTED_BIRTH_DATE = '08/11/2009'

const EXIT_TIMING = {
  success: 650,
  leaving: 850,
} as const

const CHARACTER_BY_STATE: Record<
  EntryState,
  { src: string; alt: string }
> = {
  idle: {
    src: peekingCharacter,
    alt: 'Hello Kitty espiando com curiosidade',
  },
  typing: {
    src: peekingCharacter,
    alt: 'Hello Kitty espiando com curiosidade',
  },
  error: {
    src: peekingCharacter,
    alt: 'Hello Kitty espiando com curiosidade',
  },
  success: {
    src: heartCharacter,
    alt: 'Hello Kitty segurando uma bolsa com coração',
  },
  leaving: {
    src: heartCharacter,
    alt: 'Hello Kitty segurando uma bolsa com coração',
  },
}

function formatBirthDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 4),
    digits.slice(4, 8),
  ].filter(Boolean)

  return parts.join('/')
}

export function Entry({ onComplete }: EntryProps) {
  const [answer, setAnswer] = useState('')
  const [entryState, setEntryState] = useState<EntryState>('idle')
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    updateMotionPreference()
    mediaQuery.addEventListener('change', updateMotionPreference)

    return () => {
      mediaQuery.removeEventListener('change', updateMotionPreference)
    }
  }, [])

  useEffect(() => {
    if (entryState === 'success') {
      const successTimer = window.setTimeout(
        () => setEntryState('leaving'),
        prefersReducedMotion ? 0 : EXIT_TIMING.success,
      )

      return () => window.clearTimeout(successTimer)
    }

    if (entryState === 'leaving') {
      const leavingTimer = window.setTimeout(
        onComplete,
        prefersReducedMotion ? 50 : EXIT_TIMING.leaving,
      )

      return () => window.clearTimeout(leavingTimer)
    }

    return undefined
  }, [entryState, onComplete, prefersReducedMotion])

  const isCompleting = entryState === 'success' || entryState === 'leaving'
  const character = CHARACTER_BY_STATE[entryState]

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const formattedAnswer = formatBirthDate(event.target.value)

    setAnswer(formattedAnswer)

    if (entryState !== 'success' && entryState !== 'leaving') {
      setEntryState(formattedAnswer ? 'typing' : 'idle')
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isCompleting) {
      return
    }

    setEntryState(answer === EXPECTED_BIRTH_DATE ? 'success' : 'error')
  }

  const feedback =
    entryState === 'error'
      ? 'tem certeza, amor?'
      : entryState === 'success' || entryState === 'leaving'
        ? 'claro que você lembrava.'
        : ''

  return (
    <main
      className={styles.entry}
      data-state={entryState}
      aria-busy={isCompleting}
    >
      <div className={styles.content}>
        <h1 className={styles.logo}>
          <span className={styles.srOnly}>BABYDOLL</span>
          <span className={styles.logoVisual} aria-hidden="true">
            <img className={styles.logoReference} src={entryReference} alt="" />
          </span>
        </h1>

        <div className={styles.characterFrame}>
          <img
            key={character.src}
            className={styles.character}
            src={character.src}
            alt={character.alt}
          />
        </div>

        <p className={styles.question}>Qual é minha data de nascimento?</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.srOnly} htmlFor="birth-date">
            Data de nascimento no formato dia, mês e ano
          </label>

          <input
            className={styles.input}
            id="birth-date"
            name="birth-date"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="DD/MM/AAAA"
            value={answer}
            maxLength={10}
            aria-describedby="entry-feedback"
            aria-invalid={entryState === 'error'}
            disabled={isCompleting}
            onChange={handleChange}
          />

          <button
            className={styles.submitButton}
            type="submit"
            aria-label="Entrar"
            disabled={isCompleting}
          >
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p
          className={styles.feedback}
          id="entry-feedback"
          aria-live="polite"
        >
          {feedback || '\u00a0'}
        </p>
      </div>

      <div className={styles.fade} aria-hidden="true" />
    </main>
  )
}
