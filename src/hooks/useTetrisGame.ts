import { useState, useCallback, useEffect, useRef } from "react";
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  INITIAL_SPEED,
  MIN_SPEED,
  SPEED_DECREASE,
  POINTS_PER_LINE,
  LINE_CLEAR_BONUS,
  LINES_PER_LEVEL,
  TETROMINOES,
  TETROMINO_COLORS,
  TETRIS_STORAGE_KEY,
  TetrominoType,
  CellValue,
  GamePiece,
} from "@/constants/tetris";
import { useLocalStorage } from "./useLocalStorage";

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                           useTetrisGame                                    ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ Hook que encapsula TODA a lógica do Tetris.                               ║
 * ║                                                                           ║
 * ║ MECÂNICAS:                                                                ║
 * ║ - Peças caem automaticamente                                              ║
 * ║ - Rotação de peças (sentido horário)                                      ║
 * ║ - Movimento lateral e queda rápida                                        ║
 * ║ - Limpeza de linhas completas                                             ║
 * ║ - Sistema de níveis e velocidade crescente                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Cria tabuleiro vazio
const createEmptyBoard = (): CellValue[][] => 
  Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));

// Tipos de peças disponíveis
const PIECE_TYPES: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];

// Gera peça aleatória
const randomPiece = (): TetrominoType => 
  PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];

// Rotaciona matriz 90 graus sentido horário
const rotateMatrix = (matrix: number[][]): number[][] => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: number[][] = [];
  
  for (let i = 0; i < cols; i++) {
    rotated.push([]);
    for (let j = rows - 1; j >= 0; j--) {
      rotated[i].push(matrix[j][i]);
    }
  }
  
  return rotated;
};

// Aplica rotações à forma original
const getRotatedShape = (type: TetrominoType, rotation: number): number[][] => {
  let shape = TETROMINOES[type];
  for (let i = 0; i < rotation; i++) {
    shape = rotateMatrix(shape);
  }
  return shape;
};

export function useTetrisGame() {
  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADO DO JOGO
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [board, setBoard] = useState<CellValue[][]>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<GamePiece | null>(null);
  const [nextPiece, setNextPiece] = useState<TetrominoType>(randomPiece());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [bestScore, setBestScore] = useLocalStorage(TETRIS_STORAGE_KEY, 0);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const speedRef = useRef(INITIAL_SPEED);

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICAÇÃO DE COLISÃO
  // ═══════════════════════════════════════════════════════════════════════════

  const checkCollision = useCallback((piece: GamePiece, boardState: CellValue[][]): boolean => {
    const shape = getRotatedShape(piece.type, piece.rotation);
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = piece.x + col;
          const newY = piece.y + row;
          
          // Fora dos limites
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true;
          }
          
          // Colisão com peça fixa (ignora células acima do tabuleiro)
          if (newY >= 0 && boardState[newY][newX]) {
            return true;
          }
        }
      }
    }
    
    return false;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // FIXAR PEÇA NO TABULEIRO
  // ═══════════════════════════════════════════════════════════════════════════

  const lockPiece = useCallback((piece: GamePiece, boardState: CellValue[][]): CellValue[][] => {
    const newBoard = boardState.map(row => [...row]);
    const shape = getRotatedShape(piece.type, piece.rotation);
    const color = TETROMINO_COLORS[piece.type];
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const y = piece.y + row;
          const x = piece.x + col;
          if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
            newBoard[y][x] = color;
          }
        }
      }
    }
    
    return newBoard;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // LIMPAR LINHAS COMPLETAS
  // ═══════════════════════════════════════════════════════════════════════════

  const clearLines = useCallback((boardState: CellValue[][]): { board: CellValue[][], cleared: number } => {
    const newBoard = boardState.filter(row => row.some(cell => cell === null));
    const cleared = BOARD_HEIGHT - newBoard.length;
    
    // Adiciona linhas vazias no topo
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }
    
    return { board: newBoard, cleared };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // SPAWN DE NOVA PEÇA
  // ═══════════════════════════════════════════════════════════════════════════

  const spawnPiece = useCallback((): GamePiece => {
    const type = nextPiece;
    setNextPiece(randomPiece());
    
    return {
      type,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(TETROMINOES[type][0].length / 2),
      y: -1,
      rotation: 0,
    };
  }, [nextPiece]);

  // ═══════════════════════════════════════════════════════════════════════════
  // MOVIMENTOS
  // ═══════════════════════════════════════════════════════════════════════════

  const moveLeft = useCallback(() => {
    if (!currentPiece || !isPlaying || isPaused || isGameOver) return;
    
    const newPiece = { ...currentPiece, x: currentPiece.x - 1 };
    if (!checkCollision(newPiece, board)) {
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, isPlaying, isPaused, isGameOver, board, checkCollision]);

  const moveRight = useCallback(() => {
    if (!currentPiece || !isPlaying || isPaused || isGameOver) return;
    
    const newPiece = { ...currentPiece, x: currentPiece.x + 1 };
    if (!checkCollision(newPiece, board)) {
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, isPlaying, isPaused, isGameOver, board, checkCollision]);

  const rotate = useCallback(() => {
    if (!currentPiece || !isPlaying || isPaused || isGameOver) return;
    
    const newRotation = (currentPiece.rotation + 1) % 4;
    const newPiece = { ...currentPiece, rotation: newRotation };
    
    // Tenta rotação normal
    if (!checkCollision(newPiece, board)) {
      setCurrentPiece(newPiece);
      return;
    }
    
    // Wall kick: tenta mover para esquerda ou direita
    for (const offset of [-1, 1, -2, 2]) {
      const kickedPiece = { ...newPiece, x: newPiece.x + offset };
      if (!checkCollision(kickedPiece, board)) {
        setCurrentPiece(kickedPiece);
        return;
      }
    }
  }, [currentPiece, isPlaying, isPaused, isGameOver, board, checkCollision]);

  const softDrop = useCallback(() => {
    if (!currentPiece || !isPlaying || isPaused || isGameOver) return;
    
    const newPiece = { ...currentPiece, y: currentPiece.y + 1 };
    if (!checkCollision(newPiece, board)) {
      setCurrentPiece(newPiece);
      setScore(prev => prev + 1); // Bônus por soft drop
    }
  }, [currentPiece, isPlaying, isPaused, isGameOver, board, checkCollision]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || !isPlaying || isPaused || isGameOver) return;
    
    let newPiece = { ...currentPiece };
    let dropDistance = 0;
    
    while (!checkCollision({ ...newPiece, y: newPiece.y + 1 }, board)) {
      newPiece.y++;
      dropDistance++;
    }
    
    setScore(prev => prev + dropDistance * 2); // Bônus por hard drop
    setCurrentPiece(newPiece);
    
    // Força fixação imediata
    const newBoard = lockPiece(newPiece, board);
    const { board: clearedBoard, cleared } = clearLines(newBoard);
    
    setBoard(clearedBoard);
    
    if (cleared > 0) {
      const bonus = LINE_CLEAR_BONUS[cleared as keyof typeof LINE_CLEAR_BONUS] || cleared;
      setScore(prev => prev + POINTS_PER_LINE * bonus * level);
      setLinesCleared(prev => prev + cleared);
    }
    
    const nextP = spawnPiece();
    if (checkCollision(nextP, clearedBoard)) {
      setIsGameOver(true);
      setIsPlaying(false);
      if (score > bestScore) {
        setBestScore(score);
      }
    } else {
      setCurrentPiece(nextP);
    }
  }, [currentPiece, isPlaying, isPaused, isGameOver, board, level, score, bestScore, checkCollision, lockPiece, clearLines, spawnPiece, setBestScore]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME LOOP
  // ═══════════════════════════════════════════════════════════════════════════

  const tick = useCallback(() => {
    if (!currentPiece || !isPlaying || isPaused || isGameOver) return;
    
    const newPiece = { ...currentPiece, y: currentPiece.y + 1 };
    
    if (!checkCollision(newPiece, board)) {
      setCurrentPiece(newPiece);
    } else {
      // Fixa peça
      const newBoard = lockPiece(currentPiece, board);
      const { board: clearedBoard, cleared } = clearLines(newBoard);
      
      setBoard(clearedBoard);
      
      if (cleared > 0) {
        const bonus = LINE_CLEAR_BONUS[cleared as keyof typeof LINE_CLEAR_BONUS] || cleared;
        setScore(prev => prev + POINTS_PER_LINE * bonus * level);
        setLinesCleared(prev => prev + cleared);
      }
      
      // Spawn próxima peça
      const nextP = spawnPiece();
      if (checkCollision(nextP, clearedBoard)) {
        setIsGameOver(true);
        setIsPlaying(false);
        if (score > bestScore) {
          setBestScore(score);
        }
      } else {
        setCurrentPiece(nextP);
      }
    }
  }, [currentPiece, isPlaying, isPaused, isGameOver, board, level, score, bestScore, checkCollision, lockPiece, clearLines, spawnPiece, setBestScore]);

  // Loop automático
  useEffect(() => {
    if (isPlaying && !isPaused && !isGameOver) {
      gameLoopRef.current = setInterval(tick, speedRef.current);
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, isPaused, isGameOver, tick]);

  // Atualiza velocidade por nível
  useEffect(() => {
    const newLevel = Math.floor(linesCleared / LINES_PER_LEVEL) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      speedRef.current = Math.max(MIN_SPEED, INITIAL_SPEED - (newLevel - 1) * SPEED_DECREASE);
    }
  }, [linesCleared, level]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTROLES DO JOGO
  // ═══════════════════════════════════════════════════════════════════════════

  const startGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
    setIsGameOver(false);
    setIsPaused(false);
    speedRef.current = INITIAL_SPEED;
    
    const firstPiece = {
      type: randomPiece(),
      x: Math.floor(BOARD_WIDTH / 2) - 1,
      y: 0,
      rotation: 0,
    };
    setCurrentPiece(firstPiece);
    setNextPiece(randomPiece());
    setIsPlaying(true);
  }, []);

  const togglePause = useCallback(() => {
    if (isGameOver) return;
    setIsPaused(prev => !prev);
  }, [isGameOver]);

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPiece(null);
    setNextPiece(randomPiece());
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
    setIsPlaying(false);
    setIsGameOver(false);
    setIsPaused(false);
    speedRef.current = INITIAL_SPEED;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTROLES DE TECLADO
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isGameOver) return;
      
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          e.preventDefault();
          moveLeft();
          break;
        case "ArrowRight":
        case "KeyD":
          e.preventDefault();
          moveRight();
          break;
        case "ArrowUp":
        case "KeyW":
          e.preventDefault();
          rotate();
          break;
        case "ArrowDown":
        case "KeyS":
          e.preventDefault();
          softDrop();
          break;
        case "Space":
          e.preventDefault();
          hardDrop();
          break;
        case "KeyP":
        case "Escape":
          e.preventDefault();
          togglePause();
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isGameOver, moveLeft, moveRight, rotate, softDrop, hardDrop, togglePause]);

  // ═══════════════════════════════════════════════════════════════════════════
  // BOARD COM PEÇA ATUAL
  // ═══════════════════════════════════════════════════════════════════════════

  const getBoardWithPiece = useCallback((): CellValue[][] => {
    const displayBoard = board.map(row => [...row]);
    
    if (currentPiece) {
      const shape = getRotatedShape(currentPiece.type, currentPiece.rotation);
      const color = TETROMINO_COLORS[currentPiece.type];
      
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const y = currentPiece.y + row;
            const x = currentPiece.x + col;
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
              displayBoard[y][x] = color;
            }
          }
        }
      }
    }
    
    return displayBoard;
  }, [board, currentPiece]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RETORNO
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    board: getBoardWithPiece(),
    currentPiece,
    nextPiece,
    isPlaying,
    isGameOver,
    isPaused,
    score,
    level,
    linesCleared,
    bestScore,
    startGame,
    togglePause,
    resetGame,
    moveLeft,
    moveRight,
    rotate,
    softDrop,
    hardDrop,
  };
}
