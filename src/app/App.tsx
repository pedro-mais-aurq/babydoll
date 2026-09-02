import { useState } from 'react'

import { TodayCinematic } from '../cinematics/today/TodayCinematic'
import { CinematicStage } from './interface/CinematicStage/CinematicStage'
import { Entry } from './interface/Entry/Entry'
import styles from './App.module.css'

type AppPhase = 'entry' | 'cinematic' | 'complete'

export function App() {
  const [phase, setPhase] = useState<AppPhase>('entry')

  if (phase === 'entry') {
    return <Entry onComplete={() => setPhase('cinematic')} />
  }

  return (
    <CinematicStage>
      {phase === 'cinematic' ? (
        <TodayCinematic onComplete={() => setPhase('complete')} />
      ) : (
        <div className={styles.finishedStage} aria-label="Cinemática encerrada" />
      )}
    </CinematicStage>
  )
}
