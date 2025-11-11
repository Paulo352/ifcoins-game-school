import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveQuizzes } from '@/hooks/quizzes/useQuizManagement';
import { useCreateRoom, useActiveRooms } from '@/hooks/quizzes/useMultiplayerQuiz';
import { MultiplayerQuizLobby } from './MultiplayerQuizLobby';
import { MultiplayerQuizGame } from './MultiplayerQuizGame';
import { useAuth } from '@/contexts/AuthContext';
import { Gamepad2, Users, Plus, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function MultiplayerQuizRoom() {
  const { profile } = useAuth();
  const [view, setView] = useState<'list' | 'create' | 'lobby' | 'game'>('list');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [maxPlayers, setMaxPlayers] = useState<number>(10);
  const [roomCode, setRoomCode] = useState<string>('');

  const { data: quizzes } = useActiveQuizzes();
  const { data: activeRooms, isLoading } = useActiveRooms();
  const createRoomMutation = useCreateRoom();

  const isTeacherOrAdmin = profile?.role === 'teacher' || profile?.role === 'admin';

  const handleCreateRoom = async () => {
    if (!selectedQuizId) return;

    const result = await createRoomMutation.mutateAsync({
      quizId: selectedQuizId,
      maxPlayers
    });

    if (result) {
      setSelectedRoomId(result.id);
      setView('lobby');
    }
  };

  const handleJoinRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setView('lobby');
  };

  const handleLeaveRoom = () => {
    setSelectedRoomId(null);
    setView('list');
  };

  const handleGameStart = () => {
    setView('game');
  };

  if (view === 'game' && selectedRoomId) {
    return (
      <MultiplayerQuizGame
        roomId={selectedRoomId}
        onFinish={handleLeaveRoom}
      />
    );
  }

  if (view === 'lobby' && selectedRoomId) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={handleLeaveRoom}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <MultiplayerQuizLobby
          roomId={selectedRoomId}
          onGameStart={handleGameStart}
          onLeave={handleLeaveRoom}
        />
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Button
          variant="ghost"
          onClick={() => setView('list')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Criar Sala Multiplayer</CardTitle>
            <CardDescription>Configure uma nova sala de quiz em tempo real</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quiz">Quiz</Label>
              <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                <SelectTrigger id="quiz">
                  <SelectValue placeholder="Selecione um quiz" />
                </SelectTrigger>
                <SelectContent>
                  {quizzes?.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPlayers">Máximo de Jogadores</Label>
              <Select 
                value={maxPlayers.toString()} 
                onValueChange={(val) => setMaxPlayers(parseInt(val))}
              >
                <SelectTrigger id="maxPlayers">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 30].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} jogadores
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreateRoom}
              disabled={!selectedQuizId || createRoomMutation.isPending}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Sala
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gamepad2 className="w-6 h-6" />
            Quiz Multiplayer
          </h2>
          <p className="text-muted-foreground mt-1">
            Compete em tempo real com outros estudantes
          </p>
        </div>
        {isTeacherOrAdmin && (
          <Button onClick={() => setView('create')}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Sala
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : activeRooms && activeRooms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeRooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="truncate">{room.quizzes?.title}</span>
                  <Badge variant={room.status === 'waiting' ? 'secondary' : 'default'}>
                    {room.status === 'waiting' ? 'Aguardando' : 'Em andamento'}
                  </Badge>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {room.quizzes?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Código:</span>
                  <span className="font-mono font-bold">{room.room_code}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Máx. {room.max_players} jogadores</span>
                </div>
                <Button
                  onClick={() => handleJoinRoom(room.id)}
                  className="w-full"
                  disabled={room.status !== 'waiting'}
                >
                  {room.status === 'waiting' ? 'Entrar na Sala' : 'Em andamento'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Gamepad2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma sala ativa</h3>
            <p className="text-muted-foreground mb-4">
              {isTeacherOrAdmin
                ? 'Crie uma nova sala para começar um quiz multiplayer'
                : 'Aguarde um professor criar uma sala'}
            </p>
            {isTeacherOrAdmin && (
              <Button onClick={() => setView('create')}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Sala
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
