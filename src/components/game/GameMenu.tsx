import { Gamepad2, Brain } from "lucide-react";

type GameType = "memory" | "snake";

interface GameMenuProps {
  onSelectGame: (game: GameType) => void;
}

const GameMenu = ({ onSelectGame }: GameMenuProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8 px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-4 neon-text">
            Game Zone
          </h1>
          <p className="text-muted-foreground text-lg">Escolha um jogo para jogar</p>
        </div>

        {/* Game Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Memory Game Card */}
          <button
            onClick={() => onSelectGame("memory")}
            className="group relative bg-card border-2 border-border rounded-2xl p-8 transition-all duration-300 hover:border-primary/50 hover:scale-105 animate-fade-in"
            style={{ animationDelay: "100ms", boxShadow: "var(--shadow-card)" }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Jogo da Memória
              </h2>
              <p className="text-muted-foreground">
                Encontre todos os pares de cartas. Teste sua memória!
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <span className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">3 dificuldades</span>
                <span className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">Recordes</span>
              </div>
            </div>
          </button>

          {/* Snake Game Card */}
          <button
            onClick={() => onSelectGame("snake")}
            className="group relative bg-card border-2 border-border rounded-2xl p-8 transition-all duration-300 hover:border-secondary/50 hover:scale-105 animate-fade-in"
            style={{ animationDelay: "200ms", boxShadow: "var(--shadow-card)" }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-secondary/20 flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                <Gamepad2 className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Snake
              </h2>
              <p className="text-muted-foreground">
                Controle a cobra e colete comida. Jogo clássico!
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <span className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">Velocidade crescente</span>
                <span className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">Recorde</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
