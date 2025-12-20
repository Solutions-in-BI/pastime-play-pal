/**
 * ===========================================
 * CONSTANTES DO JOGO TETRIS
 * ===========================================
 */

// ============ DIMENSÕES ============

/** Colunas do tabuleiro */
export const BOARD_WIDTH = 10;

/** Linhas do tabuleiro */
export const BOARD_HEIGHT = 20;

/** Tamanho de cada célula em pixels */
export const CELL_SIZE = 28;

// ============ VELOCIDADE ============

/** Velocidade inicial (ms entre quedas) */
export const INITIAL_SPEED = 800;

/** Velocidade mínima (mais rápido) */
export const MIN_SPEED = 100;

/** Redução de velocidade por nível */
export const SPEED_DECREASE = 50;

// ============ PONTUAÇÃO ============

/** Pontos por linha limpa (multiplicado pelo nível) */
export const POINTS_PER_LINE = 100;

/** Bônus para múltiplas linhas */
export const LINE_CLEAR_BONUS = {
  1: 1,    // 100 pts
  2: 3,    // 300 pts
  3: 5,    // 500 pts
  4: 8,    // 800 pts (Tetris!)
};

/** Linhas para subir de nível */
export const LINES_PER_LEVEL = 10;

// ============ PEÇAS (TETROMINOS) ============

export type TetrominoType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export interface Tetromino {
  shape: number[][];
  color: string;
}

/** Cores das peças */
export const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: "#06b6d4", // Cyan
  O: "#eab308", // Yellow
  T: "#a855f7", // Purple
  S: "#22c55e", // Green
  Z: "#ef4444", // Red
  J: "#3b82f6", // Blue
  L: "#f97316", // Orange
};

/** Formas das peças (0 = vazio, 1 = preenchido) */
export const TETROMINOES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

/** Chave do localStorage para recorde */
export const TETRIS_STORAGE_KEY = "tetrisBestScore";

// ============ TIPOS ============

export type CellValue = string | null;

export interface GamePiece {
  type: TetrominoType;
  x: number;
  y: number;
  rotation: number;
}
