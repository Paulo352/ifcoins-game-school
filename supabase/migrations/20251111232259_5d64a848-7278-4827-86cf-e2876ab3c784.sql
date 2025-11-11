-- Fix RLS policy for quiz_rooms to allow room creation
DROP POLICY IF EXISTS "Users can create quiz rooms" ON public.quiz_rooms;
DROP POLICY IF EXISTS "Users can view quiz rooms" ON public.quiz_rooms;
DROP POLICY IF EXISTS "Users can update their own rooms" ON public.quiz_rooms;

-- Allow authenticated users to create quiz rooms
CREATE POLICY "Authenticated users can create quiz rooms"
ON public.quiz_rooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow authenticated users to view all active rooms
CREATE POLICY "Authenticated users can view quiz rooms"
ON public.quiz_rooms
FOR SELECT
TO authenticated
USING (true);

-- Allow room creators to update their rooms
CREATE POLICY "Room creators can update their rooms"
ON public.quiz_rooms
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Ensure quiz_room_players has proper RLS
DROP POLICY IF EXISTS "Users can join quiz rooms" ON public.quiz_room_players;
DROP POLICY IF EXISTS "Users can view room players" ON public.quiz_room_players;

CREATE POLICY "Authenticated users can join quiz rooms"
ON public.quiz_room_players
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view room players"
ON public.quiz_room_players
FOR SELECT
TO authenticated
USING (true);