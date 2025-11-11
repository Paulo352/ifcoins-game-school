import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRoom, useRoomPlayers, useStartRoom, useJoinRoom } from '@/hooks/quizzes/useMultiplayerQuiz';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Clock, Play, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface MultiplayerQuizLobbyProps {
  roomId: string;
  onGameStart: () => void;
  onLeave: () => void;
}

export function MultiplayerQuizLobby({ roomId, onGameStart, onLeave }: MultiplayerQuizLobbyProps) {
  const { profile, user } = useAuth();
  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const { players } = useRoomPlayers(roomId);
  const startRoomMutation = useStartRoom();
  const joinRoomMutation = useJoinRoom();
  const [copied, setCopied] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const isCreator = room?.created_by === user?.id;
  const canStart = isCreator && players.length >= 2;

  // Auto-join room if not already joined
  useEffect(() => {
    if (!user || !roomId || hasJoined) return;

    const isPlayerInRoom = players.some(p => p.user_id === user.id);
    if (!isPlayerInRoom) {
      joinRoomMutation.mutate({ roomId, userId: user.id });
      setHasJoined(true);
    }
  }, [user, roomId, players, hasJoined]);

  // Listen for room status changes
  useEffect(() => {
    if (room?.status === 'active') {
      onGameStart();
    }
  }, [room?.status, onGameStart]);

  const handleStart = () => {
    if (!canStart) {
      toast.error('Aguarde mais jogadores entrarem');
      return;
    }
    startRoomMutation.mutate(roomId);
  };

  const handleCopyCode = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code);
      setCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (roomLoading || !room) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{room.quizzes?.title}</span>
            <Badge variant={room.status === 'waiting' ? 'secondary' : 'default'}>
              {room.status === 'waiting' ? 'Aguardando' : 'Ativo'}
            </Badge>
          </CardTitle>
          <CardDescription>{room.quizzes?.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Código da Sala</p>
              <p className="text-2xl font-bold tracking-wider">{room.room_code}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{players.length}/{room.max_players} jogadores</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Aguardando início</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jogadores na Sala</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <Avatar>
                  <AvatarFallback>
                    {player.profiles?.name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{player.profiles?.name}</p>
                  <p className="text-sm text-muted-foreground">{player.profiles?.email}</p>
                </div>
                {room.created_by === player.user_id && (
                  <Badge variant="secondary">Criador</Badge>
                )}
                {player.user_id === user?.id && (
                  <Badge variant="outline">Você</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onLeave}
          className="flex-1"
        >
          Sair da Sala
        </Button>
        {isCreator && (
          <Button
            onClick={handleStart}
            disabled={!canStart || startRoomMutation.isPending}
            className="flex-1"
          >
            <Play className="w-4 h-4 mr-2" />
            Iniciar Quiz
          </Button>
        )}
      </div>

      {isCreator && !canStart && (
        <p className="text-center text-sm text-muted-foreground">
          Aguarde pelo menos 2 jogadores para iniciar
        </p>
      )}
    </div>
  );
}
