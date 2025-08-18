-- Fix ambiguous column references by disambiguating parameters and qualifying table names in update_user_coins
CREATE OR REPLACE FUNCTION public.update_user_coins(user_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := user_id;
  v_amount integer := amount;
BEGIN
  UPDATE public.profiles 
  SET coins = coins + v_amount,
      updated_at = now()
  WHERE public.profiles.id = v_user_id;
END;
$function$;