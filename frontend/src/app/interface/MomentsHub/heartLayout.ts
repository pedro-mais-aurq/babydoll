import dayFiveOne from "./assets/heart-01.png";
import dayFiveTwo from "./assets/heart-02.png";
import dayFiveThree from "./assets/heart-03.png";
import dayFiveFour from "./assets/heart-04.png";

export type HeartCell =
  | { type: "moment"; momentId: string }
  | { type: "image"; src: string; alt: string }
  | { type: "empty" };

const empty: HeartCell = { type: "empty" };

// Células decorativas reutilizam apenas fotografias já existentes no projeto.
function decorative(index: number): HeartCell {
  const pool = [
    { src: dayFiveTwo, alt: "Nós dois compartilhando fones em uma exposição" },
    { src: dayFiveThree, alt: "Nós dois sentados e olhando um para o outro" },
    { src: dayFiveFour, alt: "Nós dois diante de um espelho" },
    { src: dayFiveOne, alt: "Nós dois sorrindo em uma escadaria" },
  ];
  const picked = pool[index % pool.length];

  return { type: "image", src: picked.src, alt: picked.alt };
}

/**
 * Geometria do coração (7 colunas x 6 linhas).
 * A célula do momento é o ponto de partida do zoom-out.
 */
export const heartLayout: HeartCell[][] = [
  [empty, decorative(0), decorative(1), empty, decorative(2), decorative(3), empty],
  [
    decorative(4),
    decorative(5),
    { type: "moment", momentId: "stars-collide" },
    decorative(6),
    decorative(7),
    decorative(8),
    decorative(9),
  ],
  [
    decorative(10),
    decorative(11),
    decorative(12),
    { type: "moment", momentId: "first-day-five" },
    decorative(14),
    decorative(15),
    decorative(16),
  ],
  [empty, decorative(17), decorative(18), decorative(19), decorative(20), decorative(21), empty],
  [empty, empty, decorative(22), decorative(23), decorative(24), empty, empty],
  [empty, empty, empty, decorative(25), empty, empty, empty],
];

export const heartColumns = heartLayout[0].length;
export const heartRows = heartLayout.length;

/** Posição (coluna, linha) da célula usada como foco inicial do zoom-out. */
export function findFocusCell(layout: HeartCell[][] = heartLayout) {
  for (let row = 0; row < layout.length; row += 1) {
    for (let column = 0; column < layout[row].length; column += 1) {
      if (layout[row][column].type === "moment") {
        return { row, column };
      }
    }
  }

  return { row: 1, column: 3 };
}
