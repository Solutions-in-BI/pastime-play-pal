import { useState, useEffect, useCallback, useRef } from "react";
import { RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;
const MIN_SPEED = 50;

const SnakeGame = ({ onBack }: { onBack: () => void }) => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  
  const directionRef = useRef<Direction>("RIGHT");
  const gameLoopRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const saved = localStorage.getItem("snakeBestScore");
    if (saved) setBestScore(parseInt(saved));
  }, []);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some((seg) => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setIsGameOver(false);
    setIsPlaying(false);
  }, [generateFood]);

  const gameOver = useCallback(() => {
    setIsGameOver(true);
    setIsPlaying(false);
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem("snakeBestScore", score.toString());
    }
  }, [score, bestScore]);

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const dir = directionRef.current;
      
      let newHead: Position;
      switch (dir) {
        case "UP":
          newHead = { x: head.x, y: head.y - 1 };
          break;
        case "DOWN":
          newHead = { x: head.x, y: head.y + 1 };
          break;
        case "LEFT":
          newHead = { x: head.x - 1, y: head.y };
          break;
        case "RIGHT":
          newHead = { x: head.x + 1, y: head.y };
          break;
      }

      // Check wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setTimeout(gameOver, 0);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
        setTimeout(gameOver, 0);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 10);
        setFood(generateFood(newSnake));
        setSpeed((s) => Math.max(MIN_SPEED, s - SPEED_INCREMENT));
        return newSnake;
      }

      newSnake.pop();
      return newSnake;
    });
  }, [food, generateFood, gameOver]);

  useEffect(() => {
    if (isPlaying && !isGameOver) {
      gameLoopRef.current = setInterval(moveSnake, speed);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, isGameOver, speed, moveSnake]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isPlaying && !isGameOver && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      setIsPlaying(true);
    }

    const currentDir = directionRef.current;
    let newDir: Direction | null = null;

    switch (e.key) {
      case "ArrowUp":
      case "w":
      case "W":
        if (currentDir !== "DOWN") newDir = "UP";
        break;
      case "ArrowDown":
      case "s":
      case "S":
        if (currentDir !== "UP") newDir = "DOWN";
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        if (currentDir !== "RIGHT") newDir = "LEFT";
        break;
      case "ArrowRight":
      case "d":
      case "D":
        if (currentDir !== "LEFT") newDir = "RIGHT";
        break;
    }

    if (newDir) {
      directionRef.current = newDir;
      setDirection(newDir);
    }
  }, [isPlaying, isGameOver]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleDirectionButton = (dir: Direction) => {
    const currentDir = directionRef.current;
    let canChange = false;

    switch (dir) {
      case "UP": canChange = currentDir !== "DOWN"; break;
      case "DOWN": canChange = currentDir !== "UP"; break;
      case "LEFT": canChange = currentDir !== "RIGHT"; break;
      case "RIGHT": canChange = currentDir !== "LEFT"; break;
    }

    if (canChange) {
      directionRef.current = dir;
      setDirection(dir);
      if (!isPlaying && !isGameOver) {
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2 neon-text">
            Snake
          </h1>
          <p className="text-muted-foreground">Use as setas ou WASD para mover</p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-6">
          <div className="stat-card text-center">
            <p className="text-muted-foreground text-sm">Pontos</p>
            <p className="text-2xl font-display font-bold text-primary">{score}</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-muted-foreground text-sm">Recorde</p>
            <p className="text-2xl font-display font-bold text-secondary">{bestScore}</p>
          </div>
        </div>

        {/* Game Board */}
        <div className="relative mx-auto mb-6" style={{ width: "min(100%, 400px)" }}>
          <div 
            className="grid bg-card border-2 border-border rounded-xl overflow-hidden"
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              aspectRatio: "1",
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const x = index % GRID_SIZE;
              const y = Math.floor(index / GRID_SIZE);
              const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
              const isSnakeBody = snake.slice(1).some((seg) => seg.x === x && seg.y === y);
              const isFood = food.x === x && food.y === y;

              return (
                <div
                  key={index}
                  className={`
                    aspect-square transition-all duration-75
                    ${isSnakeHead ? "bg-primary rounded-sm scale-110 shadow-[0_0_10px_hsl(var(--primary)/0.8)]" : ""}
                    ${isSnakeBody ? "bg-primary/70 rounded-sm" : ""}
                    ${isFood ? "bg-secondary rounded-full animate-pulse-glow" : ""}
                    ${!isSnakeHead && !isSnakeBody && !isFood ? "bg-muted/20" : ""}
                  `}
                />
              );
            })}
          </div>

          {/* Overlay messages */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
              <p className="text-xl font-display text-foreground animate-pulse-glow">
                Pressione uma seta para começar
              </p>
            </div>
          )}

          {isGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 rounded-xl animate-fade-in">
              <p className="text-3xl font-display font-bold text-destructive mb-2">Game Over!</p>
              <p className="text-xl text-foreground mb-4">Pontuação: {score}</p>
              {score >= bestScore && score > 0 && (
                <p className="text-lg text-primary mb-4 animate-celebrate">Novo Recorde!</p>
              )}
              <button onClick={resetGame} className="btn-primary-game">
                Jogar Novamente
              </button>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="md:hidden flex flex-col items-center gap-2 mb-6">
          <button
            onClick={() => handleDirectionButton("UP")}
            className="btn-game bg-card border border-border p-4"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleDirectionButton("LEFT")}
              className="btn-game bg-card border border-border p-4"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleDirectionButton("DOWN")}
              className="btn-game bg-card border border-border p-4"
            >
              <ArrowDown className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleDirectionButton("RIGHT")}
              className="btn-game bg-card border border-border p-4"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button onClick={resetGame} className="btn-secondary-game flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Reiniciar
          </button>
          <button onClick={onBack} className="btn-game bg-muted text-foreground">
            Voltar ao Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
