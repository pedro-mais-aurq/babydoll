import type { ReactNode } from 'react'

import styles from './CinematicStage.module.css'

interface CinematicStageProps {
  children: ReactNode
}

export function CinematicStage({ children }: CinematicStageProps) {
  return <main className={styles.stage}>{children}</main>
}
