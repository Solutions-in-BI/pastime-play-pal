import { useState } from "react";
import MemoryGame from "@/components/game/MemoryGame";
import SnakeGame from "@/components/game/SnakeGame";
import GameMenu from "@/components/game/GameMenu";

type GameType = "menu" | "memory" | "snake";

const Index = () => {
  const [currentGame, setCurrentGame] = useState<GameType>("menu");

  const handleSelectGame = (game: "memory" | "snake") => {
    setCurrentGame(game);
  };

  const handleBackToMenu = () => {
    setCurrentGame("menu");
  };

  if (currentGame === "memory") {
    return <MemoryGame onBack={handleBackToMenu} />;
  }

  if (currentGame === "snake") {
    return <SnakeGame onBack={handleBackToMenu} />;
  }

  return <GameMenu onSelectGame={handleSelectGame} />;
};

export default Index;
