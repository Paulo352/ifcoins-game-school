-- Criar nova função RPC para criar votação com opções e imagens
CREATE OR REPLACE FUNCTION create_poll_with_options_and_images(
  poll_title text,
  poll_description text,
  poll_event_id uuid,
  allow_multiple boolean,
  end_date timestamptz,
  options jsonb -- Mudou de text[] para jsonb para suportar objetos com image_url
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_poll_id uuid;
  option_item jsonb;
BEGIN
  -- Criar a votação
  INSERT INTO polls (title, description, event_id, allow_multiple_votes, end_date, created_by)
  VALUES (poll_title, poll_description, poll_event_id, allow_multiple, end_date, auth.uid())
  RETURNING id INTO new_poll_id;
  
  -- Criar as opções
  FOR option_item IN SELECT * FROM jsonb_array_elements(options)
  LOOP
    INSERT INTO poll_options (poll_id, option_text, option_order, image_url)
    VALUES (
      new_poll_id,
      option_item->>'option_text',
      (option_item->>'option_order')::integer,
      option_item->>'image_url'
    );
  END LOOP;
  
  RETURN new_poll_id;
END;
$$;