import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useJoinRoomByCode, useRoom } from '@/hooks/quizzes/useMultiplayerQuiz';
import { useAuth } from '@/contexts/AuthContext';
import { Gamepad2, LogIn, ArrowLeft } from 'lucide-react';
import { MultiplayerQuizLobby } from './MultiplayerQuizLobby';
import { MultiplayerQuizGame } from './MultiplayerQuizGame';

export function StudentMultiplayer() {
  const { user } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);
  const [view, setView] = useState<'join' | 'lobby' | 'game'>('join');
  
  const joinByCodeMutation = useJoinRoomByCode();
  const { data: room } = useRoom(joinedRoomId);

  const handleJoinByCode = async () => {
    if (!roomCode.trim()) return;
    
    try {
      const result = await joinByCodeMutation.mutateAsync({ 
        roomCode: roomCode.trim().toUpperCase() 
      });
      if (result) {
        setJoinedRoomId(result.id);
        setView('lobby');
      }
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleLeave = () => {
    setJoinedRoomId(null);
    setRoomCode('');
    setView('join');
  };

  const handleGameStart = () => {
    setView('game');
  };

  if (view === 'game' && joinedRoomId) {
    return (
      <MultiplayerQuizGame
        roomId={joinedRoomId}
        onFinish={handleLeave}
      />
    );
  }

  if (view === 'lobby' && joinedRoomId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleLeave}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <MultiplayerQuizLobby
          roomId={joinedRoomId}
          onGameStart={handleGameStart}
          onLeave={handleLeave}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <Gamepad2 className="w-12 h-12 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold">Quiz Multiplayer</h2>
        <p className="text-muted-foreground mt-2">
          Digite o código da sala fornecido pelo professor
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5" />
            Entrar na Sala
          </CardTitle>
          <CardDescription>
            Insira o código de 6 letras para participar do quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ABCDEF"
            maxLength={6}
            className="text-center text-2xl font-mono tracking-widest uppercase"
          />
          <Button
            onClick={handleJoinByCode}
            disabled={roomCode.length !== 6 || joinByCodeMutation.isPending}
            className="w-full"
            size="lg"
          >
            {joinByCodeMutation.isPending ? 'Entrando...' : 'Entrar na Sala'}
          </Button>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>Aguarde o professor iniciar o quiz após todos entrarem na sala.</p>
      </div>
    </div>
  );
}