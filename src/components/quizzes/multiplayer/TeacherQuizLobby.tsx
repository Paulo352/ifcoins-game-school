import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRoom, useRoomPlayers, useStartRoom, useFinishRoom } from '@/hooks/quizzes/useMultiplayerQuiz';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Clock, Play, Copy, Check, Trophy, Coins, CreditCard, Gift, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TeacherQuizLobbyProps {
  roomId: string;
  onGameStart: () => void;
  onLeave: () => void;
  onDelete?: () => void;
}

export function TeacherQuizLobby({ roomId, onGameStart, onLeave, onDelete }: TeacherQuizLobbyProps) {
  const { user } = useAuth();
  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const { players, isLoading: playersLoading } = useRoomPlayers(roomId);
  const startRoomMutation = useStartRoom();
  const finishRoomMutation = useFinishRoom();
  const [copied, setCopied] = useState(false);

  const isCreator = room?.created_by === user?.id;
  const canStart = isCreator && players.length >= 1;

  // Listen for room status changes
  useEffect(() => {
    if (room?.status === 'active') {
      onGameStart();
    }
  }, [room?.status, onGameStart]);

  const handleStart = () => {
    if (!canStart) {
      toast.error('Aguarde pelo menos 1 jogador entrar');
      return;
    }
    startRoomMutation.mutate(roomId);
  };

  const handleCancelRoom = async () => {
    await finishRoomMutation.mutateAsync(roomId);
    onLeave();
  };

  const handleCopyCode = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code);
      setCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRewardDisplay = () => {
    if (!room) return null;
    
    switch (room.reward_type) {
      case 'coins':
        return (
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span>1º: {room.reward_coins_1st} | 2º: {room.reward_coins_2nd} | 3º: {room.reward_coins_3rd} moedas</span>
          </div>
        );
      case 'card':
        return (
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-500" />
            <span>Carta exclusiva para o 1º lugar</span>
          </div>
        );
      case 'external':
        return (
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-green-500" />
            <span>{room.reward_external_description || 'Prêmio externo'}</span>
          </div>
        );
      default:
        return <span className="text-muted-foreground">Nenhum prêmio</span>;
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
          {/* Room Code - Prominent Display */}
          <div className="flex items-center gap-4 p-6 bg-primary/10 rounded-lg border-2 border-primary/20">
            <div className="flex-1 text-center">
              <p className="text-sm text-muted-foreground mb-2">Código da Sala</p>
              <p className="text-4xl font-bold tracking-[0.3em] font-mono">{room.room_code}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Compartilhe este código com os alunos
              </p>
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={handleCopyCode}
              className="h-16 w-16"
            >
              {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="font-semibold">{players.length}</p>
              <p className="text-xs text-muted-foreground">Jogadores</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="font-semibold">{room.time_per_question_seconds || 30}s</p>
              <p className="text-xs text-muted-foreground">Por questão</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <Trophy className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="font-semibold capitalize">{room.reward_type || 'Nenhum'}</p>
              <p className="text-xs text-muted-foreground">Prêmio</p>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            {getRewardDisplay()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              Jogadores na Sala 
              <Badge variant="outline">{players.length}</Badge>
            </span>
            {playersLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
            {players.length === 0 && !playersLoading && (
              <Badge variant="outline" className="animate-pulse">
                Aguardando jogadores...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum jogador entrou ainda.</p>
              <p className="text-sm">Compartilhe o código <strong>{room.room_code}</strong> com os alunos.</p>
            </div>
          ) : (
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <span className="w-6 text-center font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <Avatar>
                    <AvatarFallback>
                      {player.profiles?.name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{player.profiles?.name || 'Jogador'}</p>
                    <p className="text-sm text-muted-foreground">{player.profiles?.email || ''}</p>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    Pronto
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={onLeave}
          className="sm:flex-1"
        >
          Voltar
        </Button>
        
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Sala
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir sala?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Todos os jogadores serão removidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-orange-600 hover:text-orange-600">
              <XCircle className="w-4 h-4 mr-2" />
              Encerrar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Encerrar sala?</AlertDialogTitle>
              <AlertDialogDescription>
                A sala será marcada como finalizada. Não será possível iniciar o quiz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelRoom}>
                Encerrar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Button
          onClick={handleStart}
          disabled={!canStart || startRoomMutation.isPending}
          className="sm:flex-1"
          size="lg"
        >
          <Play className="w-4 h-4 mr-2" />
          {startRoomMutation.isPending ? 'Iniciando...' : `Iniciar Quiz (${players.length} jogadores)`}
        </Button>
      </div>

      {!canStart && (
        <p className="text-center text-sm text-muted-foreground">
          Aguarde pelo menos 1 jogador para iniciar
        </p>
      )}
    </div>
  );
}