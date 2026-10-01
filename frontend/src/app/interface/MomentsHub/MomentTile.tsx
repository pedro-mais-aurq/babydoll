import type { HeartCell } from "./heartLayout";
import { findMoment } from "../../../moments/moments";
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
