-- Create function to return real poll results aggregated by option
CREATE OR REPLACE FUNCTION public.get_poll_results(poll_id uuid)
RETURNS TABLE (
  option_id uuid,
  option_text text,
  option_order integer,
  vote_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Allow any authenticated user to see aggregated results for a poll.
  -- We don't expose user identities; only counts by option.
  RETURN QUERY
  SELECT 
    po.id AS option_id,
    po.option_text,
    po.option_order,
    COALESCE(COUNT(v.id), 0) AS vote_count
  FROM public.poll_options po
  LEFT JOIN public.poll_votes v ON v.option_id = po.id
  WHERE po.poll_id = get_poll_results.poll_id
  GROUP BY po.id, po.option_text, po.option_order
  ORDER BY po.option_order ASC;
END;
$$;