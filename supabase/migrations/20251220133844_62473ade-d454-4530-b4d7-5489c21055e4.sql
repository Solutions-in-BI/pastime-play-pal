-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Tabela para conquistas desbloqueadas por usuário
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Tabela para estatísticas do jogador
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_games_played INTEGER NOT NULL DEFAULT 0,
  memory_games_played INTEGER NOT NULL DEFAULT 0,
  memory_best_moves JSONB NOT NULL DEFAULT '{}',
  memory_best_time JSONB NOT NULL DEFAULT '{}',
  snake_games_played INTEGER NOT NULL DEFAULT 0,
  snake_best_score INTEGER NOT NULL DEFAULT 0,
  snake_max_length INTEGER NOT NULL DEFAULT 1,
  dino_games_played INTEGER NOT NULL DEFAULT 0,
  dino_best_score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para user_achievements
CREATE POLICY "Usuários podem ver próprias conquistas"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar próprias conquistas"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Políticas para user_stats
CREATE POLICY "Usuários podem ver próprias estatísticas"
ON public.user_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar próprias estatísticas"
ON public.user_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar próprias estatísticas"
ON public.user_stats FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_stats_updated_at
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();