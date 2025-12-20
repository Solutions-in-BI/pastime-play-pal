import { useRef, useEffect } from "react";
import {
  DINO_CANVAS_WIDTH,
  DINO_CANVAS_HEIGHT,
  GROUND_Y,
  DINO_X,
  DINO_WIDTH,
  DINO_HEIGHT,
  DINO_DUCK_HEIGHT,
  Obstacle,
} from "@/constants/dino";

/**
 * ===========================================
 * COMPONENTE: DinoCanvas
 * ===========================================
 * 
 * Canvas que renderiza o jogo do dinossauro.
 * Inclui renderização de pássaros voadores.
 */

interface DinoCanvasProps {
  dinoY: number;
  isJumping: boolean;
  isDucking: boolean;
  obstacles: Obstacle[];
  isPlaying: boolean;
  isGameOver: boolean;
}

export function DinoCanvas({ 
  dinoY, 
  isJumping,
  isDucking,
  obstacles, 
  isPlaying,
  isGameOver 
}: DinoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Limpa o canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, DINO_CANVAS_WIDTH, DINO_CANVAS_HEIGHT);

    // Desenha o chão
    ctx.strokeStyle = "#4a4a6a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(DINO_CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    // Desenha linhas decorativas no chão
    ctx.strokeStyle = "#3a3a5a";
    ctx.lineWidth = 1;
    for (let i = 0; i < DINO_CANVAS_WIDTH; i += 20) {
      const offset = (frameRef.current * 3) % 20;
      ctx.beginPath();
      ctx.moveTo(i - offset, GROUND_Y + 5);
      ctx.lineTo(i - offset + 10, GROUND_Y + 5);
      ctx.stroke();
    }

    // Desenha o dinossauro
    if (isDucking) {
      drawDinoDucking(ctx, DINO_X, dinoY, frameRef.current);
    } else {
      drawDino(ctx, DINO_X, dinoY, isJumping, frameRef.current);
    }

    // Desenha obstáculos
    obstacles.forEach(obstacle => {
      if (obstacle.type === "bird_low" || obstacle.type === "bird_high") {
        drawBird(ctx, obstacle, frameRef.current);
      } else {
        drawObstacle(ctx, obstacle);
      }
    });

    // Incrementa frame para animação
    if (isPlaying && !isGameOver) {
      frameRef.current++;
    }
  }, [dinoY, isJumping, isDucking, obstacles, isPlaying, isGameOver]);

  return (
    <canvas
      ref={canvasRef}
      width={DINO_CANVAS_WIDTH}
      height={DINO_CANVAS_HEIGHT}
      className="w-full max-w-full rounded-xl border-2 border-border bg-background"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

/**
 * Desenha o dinossauro normal
 */
function drawDino(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  isJumping: boolean,
  frame: number
) {
  ctx.fillStyle = "#10b981";
  
  // Corpo principal
  ctx.fillRect(x + 10, y + 5, 25, 30);
  
  // Cabeça
  ctx.fillRect(x + 20, y, 20, 20);
  
  // Olho
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(x + 32, y + 5, 4, 4);
  
  // Boca
  ctx.fillRect(x + 35, y + 12, 8, 2);
  
  ctx.fillStyle = "#10b981";
  
  // Bracinhos
  ctx.fillRect(x + 5, y + 15, 8, 4);
  
  // Cauda
  ctx.fillRect(x, y + 10, 12, 8);
  ctx.fillRect(x - 5, y + 12, 8, 4);
  
  // Pernas (animadas)
  if (isJumping) {
    ctx.fillRect(x + 12, y + 35, 6, 12);
    ctx.fillRect(x + 24, y + 35, 6, 12);
  } else {
    const legOffset = Math.floor(frame / 5) % 2 === 0;
    if (legOffset) {
      ctx.fillRect(x + 12, y + 35, 6, 12);
      ctx.fillRect(x + 24, y + 38, 6, 9);
    } else {
      ctx.fillRect(x + 12, y + 38, 6, 9);
      ctx.fillRect(x + 24, y + 35, 6, 12);
    }
  }
}

/**
 * Desenha o dinossauro agachado
 */
function drawDinoDucking(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  frame: number
) {
  ctx.fillStyle = "#10b981";
  
  // Corpo achatado (mais largo e baixo)
  ctx.fillRect(x, y, 44, 18);
  
  // Cabeça na frente
  ctx.fillRect(x + 30, y - 5, 18, 15);
  
  // Olho
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(x + 40, y - 2, 4, 4);
  
  // Boca
  ctx.fillRect(x + 44, y + 5, 6, 2);
  
  ctx.fillStyle = "#10b981";
  
  // Cauda
  ctx.fillRect(x - 8, y + 3, 12, 6);
  
  // Perninhas curtas
  const legOffset = Math.floor(frame / 5) % 2 === 0;
  if (legOffset) {
    ctx.fillRect(x + 8, y + 18, 6, 7);
    ctx.fillRect(x + 28, y + 18, 6, 7);
  } else {
    ctx.fillRect(x + 8, y + 18, 6, 7);
    ctx.fillRect(x + 28, y + 18, 6, 7);
  }
}

/**
 * Desenha um pássaro voador
 */
function drawBird(ctx: CanvasRenderingContext2D, obstacle: Obstacle, frame: number) {
  const x = obstacle.x;
  const y = obstacle.y!;
  
  ctx.fillStyle = "#f59e0b"; // Amarelo/laranja
  
  // Corpo do pássaro
  ctx.fillRect(x + 10, y + 10, 26, 12);
  
  // Cabeça
  ctx.fillRect(x + 32, y + 8, 12, 14);
  
  // Bico
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(x + 44, y + 12, 6, 4);
  
  // Olho
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(x + 38, y + 10, 3, 3);
  
  ctx.fillStyle = "#f59e0b";
  
  // Asas animadas (bate asas)
  const wingUp = Math.floor(frame / 8) % 2 === 0;
  if (wingUp) {
    // Asa para cima
    ctx.fillRect(x + 15, y, 16, 10);
    ctx.fillRect(x + 18, y - 5, 10, 6);
  } else {
    // Asa para baixo
    ctx.fillRect(x + 15, y + 22, 16, 8);
    ctx.fillRect(x + 18, y + 28, 10, 5);
  }
  
  // Cauda
  ctx.fillRect(x, y + 12, 12, 6);
  ctx.fillRect(x - 4, y + 10, 6, 4);
  ctx.fillRect(x - 4, y + 16, 6, 4);
}

/**
 * Desenha um obstáculo (cacto)
 */
function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
  const y = GROUND_Y - obstacle.height;
  
  ctx.fillStyle = "#ef4444";
  
  if (obstacle.type === "small") {
    ctx.fillRect(obstacle.x + 8, y, 9, obstacle.height);
    ctx.fillRect(obstacle.x, y + 15, 8, 6);
    ctx.fillRect(obstacle.x + 17, y + 10, 8, 6);
  } else if (obstacle.type === "large") {
    ctx.fillRect(obstacle.x + 12, y, 11, obstacle.height);
    ctx.fillRect(obstacle.x, y + 20, 12, 8);
    ctx.fillRect(obstacle.x + 23, y + 15, 12, 8);
    ctx.fillRect(obstacle.x + 5, y + 35, 8, 6);
  } else if (obstacle.type === "double") {
    ctx.fillRect(obstacle.x + 8, y, 9, obstacle.height);
    ctx.fillRect(obstacle.x, y + 15, 8, 6);
    ctx.fillRect(obstacle.x + 43, y, 9, obstacle.height);
    ctx.fillRect(obstacle.x + 52, y + 12, 8, 6);
  }
}
