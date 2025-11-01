-- Adicionar coluna de imagem às opções de votação
ALTER TABLE poll_options 
ADD COLUMN IF NOT EXISTS image_url text;

-- Adicionar comentário para documentação
COMMENT ON COLUMN poll_options.image_url IS 'URL da imagem associada à opção (opcional, para votações visuais como escolha de mascotes)';