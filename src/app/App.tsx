import { useState } from 'react'

import { Entry } from './interface/Entry/Entry'
import styles from './App.module.css'

function TemporaryStage() {
  return (
    <main className={styles.temporaryStage}>
      <p>Entrada concluída.</p>
    </main>
  )
}

export function App() {
  const [entered, setEntered] = useState(false)

  return entered ? (
    <TemporaryStage />
  ) : (
    <Entry onComplete={() => setEntered(true)} />
  )
}
