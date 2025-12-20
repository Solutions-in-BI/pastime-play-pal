import { useState, useCallback, useEffect, useRef } from "react";
import {
  GROUND_Y,
  DINO_X,
  DINO_WIDTH,
  DINO_HEIGHT,
  DINO_DUCK_HEIGHT,
  JUMP_FORCE,
  GRAVITY,
  INITIAL_SPEED,
  SPEED_INCREMENT,
  MAX_SPEED,
  GAME_LOOP_INTERVAL,
  POINTS_PER_FRAME,
  MIN_OBSTACLE_GAP,
  MAX_OBSTACLE_GAP,
  CACTUS_WIDTH,
  CACTUS_HEIGHT,
  CACTUS_LARGE_WIDTH,
  CACTUS_LARGE_HEIGHT,
  BIRD_WIDTH,
  BIRD_HEIGHT,
  BIRD_LOW_Y,
  BIRD_HIGH_Y,
  BIRD_MIN_SCORE,
  DINO_CANVAS_WIDTH,
  DINO_STORAGE_KEY,
  Obstacle,
  ObstacleType,
} from "@/constants/dino";
import { useLocalStorage } from "./useLocalStorage";

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                           useDinoGame                                      ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ Hook que encapsula TODA a lógica do Dino Runner.                          ║
 * ║                                                                           ║
 * ║ NOVIDADES:                                                                ║
 * ║ - Pássaros voando em diferentes alturas                                   ║
 * ║ - Mecânica de abaixar (precisa para pássaros altos)                      ║
 * ║ - Pássaros aparecem após 100 pontos                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

export function useDinoGame() {
  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADO DO JOGO
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADO DO DINOSSAURO
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [dinoY, setDinoY] = useState(GROUND_Y - DINO_HEIGHT);
  const [isJumping, setIsJumping] = useState(false);
  const [isDucking, setIsDucking] = useState(false);
  const velocityRef = useRef(0);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // OBSTÁCULOS E PERSISTÊNCIA
  // ═══════════════════════════════════════════════════════════════════════════
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [bestScore, setBestScore] = useLocalStorage(DINO_STORAGE_KEY, 0);
  const gameLoopRef = useRef<number | null>(null);
  const lastScoreCheckRef = useRef(0);
  const currentScoreRef = useRef(0);

  // ═══════════════════════════════════════════════════════════════════════════
  // GERAÇÃO DE OBSTÁCULOS
  // ═══════════════════════════════════════════════════════════════════════════

  const generateObstacle = useCallback((startX: number): Obstacle => {
    const currentScore = currentScoreRef.current;
    
    // Tipos disponíveis baseado na pontuação
    let types: ObstacleType[] = ["small", "large", "double"];
    
    // Adiciona pássaros após certa pontuação
    if (currentScore >= BIRD_MIN_SCORE) {
      types = ["small", "large", "double", "bird_low", "bird_high"];
    }
    
    const type = types[Math.floor(Math.random() * types.length)];
    
    let width: number;
    let height: number;
    let y: number | undefined;
    
    switch (type) {
      case "small":
        width = CACTUS_WIDTH;
        height = CACTUS_HEIGHT;
        break;
      case "large":
        width = CACTUS_LARGE_WIDTH;
        height = CACTUS_LARGE_HEIGHT;
        break;
      case "double":
        width = CACTUS_WIDTH * 2 + 10;
        height = CACTUS_HEIGHT;
        break;
      case "bird_low":
        width = BIRD_WIDTH;
        height = BIRD_HEIGHT;
        y = BIRD_LOW_Y;
        break;
      case "bird_high":
        width = BIRD_WIDTH;
        height = BIRD_HEIGHT;
        y = BIRD_HIGH_Y;
        break;
    }
    
    return { x: startX, type, width, height, y };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTROLES DO JOGO
  // ═══════════════════════════════════════════════════════════════════════════

  const startGame = useCallback(() => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    currentScoreRef.current = 0;
    setSpeed(INITIAL_SPEED);
    setDinoY(GROUND_Y - DINO_HEIGHT);
    setIsJumping(false);
    setIsDucking(false);
    velocityRef.current = 0;
    lastScoreCheckRef.current = 0;
    
    const initialObstacles: Obstacle[] = [];
    let x = DINO_CANVAS_WIDTH + 100;
    for (let i = 0; i < 3; i++) {
      initialObstacles.push(generateObstacle(x));
      x += MIN_OBSTACLE_GAP + Math.random() * (MAX_OBSTACLE_GAP - MIN_OBSTACLE_GAP);
    }
    setObstacles(initialObstacles);
  }, [isPlaying, generateObstacle]);

  const jump = useCallback(() => {
    if (!isPlaying && !isGameOver) {
      startGame();
      return;
    }
    
    if (isGameOver) return;
    
    // Não pode pular enquanto abaixado
    if (isDucking) return;
    
    if (!isJumping && dinoY >= GROUND_Y - DINO_HEIGHT - 1) {
      setIsJumping(true);
      velocityRef.current = -JUMP_FORCE;
    }
  }, [isPlaying, isGameOver, isJumping, isDucking, dinoY, startGame]);

  const duck = useCallback((isDuckingNow: boolean) => {
    if (!isPlaying || isGameOver) return;
    
    // Não pode abaixar no ar
    if (isJumping) return;
    
    setIsDucking(isDuckingNow);
    
    // Ajusta posição Y quando abaixa/levanta
    if (isDuckingNow) {
      setDinoY(GROUND_Y - DINO_DUCK_HEIGHT);
    } else {
      setDinoY(GROUND_Y - DINO_HEIGHT);
    }
  }, [isPlaying, isGameOver, isJumping]);

  const endGame = useCallback(() => {
    setIsGameOver(true);
    setIsPlaying(false);
    
    const finalScore = Math.floor(score);
    if (finalScore > bestScore) {
      setBestScore(finalScore);
    }
  }, [score, bestScore, setBestScore]);

  const resetGame = useCallback(() => {
    setIsPlaying(false);
    setIsGameOver(false);
    setScore(0);
    currentScoreRef.current = 0;
    setSpeed(INITIAL_SPEED);
    setDinoY(GROUND_Y - DINO_HEIGHT);
    setIsJumping(false);
    setIsDucking(false);
    velocityRef.current = 0;
    setObstacles([]);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // DETECÇÃO DE COLISÃO
  // ═══════════════════════════════════════════════════════════════════════════

  const checkCollision = useCallback((obstacle: Obstacle, currentDinoY: number, currentDucking: boolean): boolean => {
    const currentDinoHeight = currentDucking ? DINO_DUCK_HEIGHT : DINO_HEIGHT;
    
    // Hitbox do dino (reduzida para ser mais justo)
    const dinoLeft = DINO_X + 5;
    const dinoRight = DINO_X + DINO_WIDTH - 10;
    const dinoTop = currentDinoY + 5;
    const dinoBottom = currentDinoY + currentDinoHeight;
    
    // Hitbox do obstáculo
    const obstacleLeft = obstacle.x;
    const obstacleRight = obstacle.x + obstacle.width;
    
    let obstacleTop: number;
    let obstacleBottom: number;
    
    // Pássaros têm posição Y fixa
    if (obstacle.type === "bird_low" || obstacle.type === "bird_high") {
      obstacleTop = obstacle.y!;
      obstacleBottom = obstacle.y! + obstacle.height;
    } else {
      obstacleTop = GROUND_Y - obstacle.height;
      obstacleBottom = GROUND_Y;
    }
    
    // Verifica sobreposição
    return (
      dinoRight > obstacleLeft &&
      dinoLeft < obstacleRight &&
      dinoBottom > obstacleTop &&
      dinoTop < obstacleBottom
    );
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME LOOP PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!isPlaying || isGameOver) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    let lastTime = performance.now();
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= GAME_LOOP_INTERVAL) {
        lastTime = currentTime;
        
        // ═══ FÍSICA DO DINOSSAURO ═══
        if (!isDucking) {
          setDinoY(prevY => {
            let newY = prevY + velocityRef.current;
            velocityRef.current += GRAVITY;
            
            if (newY >= GROUND_Y - DINO_HEIGHT) {
              newY = GROUND_Y - DINO_HEIGHT;
              velocityRef.current = 0;
              setIsJumping(false);
            }
            
            return newY;
          });
        }
        
        // ═══ MOVIMENTO DOS OBSTÁCULOS ═══
        setObstacles(prevObstacles => {
          const currentSpeed = speed;
          
          let newObstacles = prevObstacles.map(obs => ({
            ...obs,
            x: obs.x - currentSpeed,
          }));
          
          newObstacles = newObstacles.filter(obs => obs.x + obs.width > -50);
          
          const lastObstacle = newObstacles[newObstacles.length - 1];
          if (!lastObstacle || lastObstacle.x < DINO_CANVAS_WIDTH - 100) {
            const gap = MIN_OBSTACLE_GAP + Math.random() * (MAX_OBSTACLE_GAP - MIN_OBSTACLE_GAP);
            const newX = lastObstacle 
              ? lastObstacle.x + lastObstacle.width + gap 
              : DINO_CANVAS_WIDTH + 100;
            newObstacles.push(generateObstacle(newX));
          }
          
          return newObstacles;
        });
        
        // ═══ PONTUAÇÃO ═══
        setScore(prev => {
          const newScore = prev + POINTS_PER_FRAME;
          currentScoreRef.current = newScore;
          return newScore;
        });
        
        // ═══ AUMENTO DE VELOCIDADE ═══
        setScore(prev => {
          const currentScore = Math.floor(prev);
          if (currentScore > 0 && currentScore % 100 === 0 && currentScore !== lastScoreCheckRef.current) {
            lastScoreCheckRef.current = currentScore;
            setSpeed(s => Math.min(MAX_SPEED, s + SPEED_INCREMENT));
          }
          return prev;
        });
      }
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isPlaying, isGameOver, speed, isDucking, generateObstacle]);

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICAÇÃO DE COLISÕES
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    
    for (const obstacle of obstacles) {
      if (checkCollision(obstacle, dinoY, isDucking)) {
        endGame();
        break;
      }
    }
  }, [obstacles, dinoY, isDucking, isPlaying, isGameOver, checkCollision, endGame]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTROLES DE TECLADO
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        jump();
      }
      if (e.code === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        duck(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown" || e.key === "s" || e.key === "S") {
        duck(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [jump, duck]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RETORNO DO HOOK
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    isPlaying,
    isGameOver,
    score: Math.floor(score),
    bestScore,
    dinoY,
    isJumping,
    isDucking,
    obstacles,
    speed,
    jump,
    duck,
    startGame,
    resetGame,
  };
}
