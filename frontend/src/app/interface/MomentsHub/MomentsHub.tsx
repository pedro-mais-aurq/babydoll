import { useCallback, useRef, useState } from "react";

import { HeartGrid } from "./HeartGrid";
import { HeartReveal } from "./HeartReveal";
import { moments } from "../../../moments/moments";
import styles from "./MomentsHub.module.css";

type HubState = "revealing" | "exploring";

interface MomentsHubProps {
  onOpenMoment: (momentId: string) => void;
}

const SELECTION_DELAY = 420;

export function MomentsHub({ onOpenMoment }: MomentsHubProps) {
  const [state, setState] = useState<HubState>("revealing");
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const handleProgress = useCallback((progress: number) => {
    setState(progress >= 0.99 ? "exploring" : "revealing");
  }, []);

  const handleSelect = useCallback(
    (momentId: string) => {
      if (timerRef.current !== null) {
        return;
      }

      setSelectedMomentId(momentId);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        onOpenMoment(momentId);
      }, SELECTION_DELAY);
    },
    [onOpenMoment],
  );

  const isExploring = state === "exploring";

  return (
    <div className={styles.backdrop}>
      <main
        className={`${styles.hub} ${selectedMomentId ? styles.leaving : ""}`}
        data-state={state}
      >
        <HeartReveal
          onProgress={handleProgress}
          header={<p className={styles.title}>nossos momentos</p>}
          hint={<p className={styles.hint}>role para baixo</p>}
          footer={
            isExploring ? (
              <div className={styles.momentList}>
                {moments.map((moment) => (
                  <button
                    key={moment.id}
                    type="button"
                    className={styles.momentListItem}
                    onClick={() => handleSelect(moment.id)}
                  >
                    {moment.title}
                  </button>
                ))}
              </div>
            ) : null
          }
        >
          <HeartGrid
            isInteractive={isExploring && selectedMomentId === null}
            selectedMomentId={selectedMomentId}
            onSelect={handleSelect}
          />
        </HeartReveal>
      </main>
    </div>
  );
}
