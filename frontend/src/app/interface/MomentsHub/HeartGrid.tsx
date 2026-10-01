import type { CSSProperties } from "react";

import { MomentTile } from "./MomentTile";
import { findFocusCell, heartColumns, heartLayout } from "./heartLayout";
import styles from "./MomentsHub.module.css";

interface HeartGridProps {
  isInteractive: boolean;
  selectedMomentId: string | null;
  onSelect: (momentId: string) => void;
}

const focus = findFocusCell();

export function HeartGrid({ isInteractive, selectedMomentId, onSelect }: HeartGridProps) {
  return (
    <div
      className={styles.grid}
      style={
        {
          "--columns": heartColumns,
          "--max-scale": 5.2,
          "--focus-x": `${((focus.column + 0.5) / heartColumns) * 100}%`,
          "--focus-y": `${((focus.row + 0.5) / heartLayout.length) * 100}%`,
        } as CSSProperties
      }
    >
      {heartLayout.map((row, rowIndex) =>
        row.map((cell, columnIndex) => (
          <MomentTile
            key={`${rowIndex}-${columnIndex}`}
            cell={cell}
            isFocus={rowIndex === focus.row && columnIndex === focus.column}
            isInteractive={isInteractive}
            hasSelection={selectedMomentId !== null}
            isSelected={cell.type === "moment" && cell.momentId === selectedMomentId}
            onSelect={onSelect}
          />
        )),
      )}
    </div>
  );
}
