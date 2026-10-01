import type { HeartCell } from "./heartLayout";
import { findMoment, isMomentReady } from "../../../moments/moments";
import styles from "./MomentsHub.module.css";

interface MomentTileProps {
  cell: HeartCell;
  isFocus: boolean;
  isInteractive: boolean;
  isSelected: boolean;
  hasSelection: boolean;
  onSelect: (momentId: string) => void;
}

export function MomentTile({
  cell,
  isFocus,
  isInteractive,
  isSelected,
  hasSelection,
  onSelect,
}: MomentTileProps) {
  if (cell.type === "empty") {
    return <div className={`${styles.cell} ${styles.empty}`} aria-hidden="true" />;
  }

  const classes = [styles.cell, styles.filled];

  if (isFocus) {
    classes.push(styles.focus);
  }

  if (hasSelection && !isSelected) {
    classes.push(styles.dimmed);
  }

  if (cell.type === "image") {
    return (
      <div className={classes.join(" ")}>
        <img className={styles.image} src={cell.src} alt={cell.alt ?? ""} loading="lazy" />
      </div>
    );
  }

  const moment = findMoment(cell.momentId);

  if (!moment) {
    return <div className={`${styles.cell} ${styles.empty}`} aria-hidden="true" />;
  }

  classes.push(styles.momentCell);

  // Lembrança reservada: aparece no coração, mas não abre rota nenhuma.
  if (!isMomentReady(moment)) {
    classes.push(styles.lockedCell);

    return (
      <div className={classes.join(" ")} data-moment-id={moment.id} data-locked="true">
        <img className={styles.image} src={moment.cover} alt="" loading="lazy" />
        <span className={styles.lockBadge} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor">
            <rect x="5" y="11" width="14" height="9" rx="2" strokeWidth="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeWidth="2" />
          </svg>
        </span>
        <span className={styles.momentLabel}>
          {moment.title}
          <span className={styles.soon}>em breve</span>
        </span>
      </div>
    );
  }

  if (isInteractive) {
    classes.push(styles.interactive);
  }

  if (isSelected) {
    classes.push(styles.selected);
  }

  return (
    <button
      type="button"
      className={classes.join(" ")}
      disabled={!isInteractive}
      aria-label={`Abrir o momento ${moment.title}`}
      data-moment-id={moment.id}
      onClick={() => {
        if (isInteractive) {
          onSelect(moment.id);
        }
      }}
    >
      <img className={styles.image} src={moment.cover} alt={moment.coverAlt} />
      <span className={styles.momentLabel} aria-hidden="true">
        {moment.title}
      </span>
    </button>
  );
}
