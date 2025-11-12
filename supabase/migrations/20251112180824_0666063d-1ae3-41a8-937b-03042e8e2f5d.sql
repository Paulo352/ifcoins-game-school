-- Atualizar a carta "O Filósofo Jedi" com a URL correta da imagem
UPDATE cards 
SET image_url = 'https://bcopgknrpjenixejhlfz.supabase.co/storage/v1/object/public/card-images/1762969827837-omj7h.jpg',
    updated_at = now()
WHERE name = 'O Filósofo Jedi' AND image_url IS NULL;