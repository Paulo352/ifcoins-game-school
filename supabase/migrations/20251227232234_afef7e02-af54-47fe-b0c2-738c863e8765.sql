-- Adicionar colunas para prêmios e tempo sincronizado nas salas
ALTER TABLE quiz_rooms 
ADD COLUMN IF NOT EXISTS reward_type TEXT DEFAULT 'coins',
ADD COLUMN IF NOT EXISTS reward_coins_1st INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS reward_coins_2nd INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS reward_coins_3rd INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS reward_card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reward_external_description TEXT,
ADD COLUMN IF NOT EXISTS time_per_question_seconds INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS question_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rewards_distributed BOOLEAN DEFAULT false;

-- Adicionar constraint após adicionar a coluna
ALTER TABLE quiz_rooms DROP CONSTRAINT IF EXISTS quiz_rooms_reward_type_check;
ALTER TABLE quiz_rooms ADD CONSTRAINT quiz_rooms_reward_type_check CHECK (reward_type IN ('coins', 'card', 'external', 'none'));

-- Adicionar pontuação total no quiz_room_players
ALTER TABLE quiz_room_players 
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS correct_answers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0;

-- Adicionar informações de prêmios no histórico de partidas
ALTER TABLE multiplayer_match_history
ADD COLUMN IF NOT EXISTS reward_type TEXT,
ADD COLUMN IF NOT EXISTS reward_description TEXT,
ADD COLUMN IF NOT EXISTS players_ranking JSONB DEFAULT '[]'::jsonb;