import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActiveQuizzes } from '@/hooks/quizzes/useQuizManagement';
import { useCreateRoom, useActiveRooms } from '@/hooks/quizzes/useMultiplayerQuiz';
import { useClasses } from '@/hooks/useClasses';
import { useCards } from '@/hooks/cards/useCards';
import { TeacherQuizLobby } from './TeacherQuizLobby';
import { TeacherQuizControl } from './TeacherQuizControl';
import { MultiplayerMatchHistory } from './MultiplayerMatchHistory';
import { Gamepad2, Plus, ArrowLeft, History, Coins, CreditCard, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export function TeacherMultiplayer() {
  const [view, setView] = useState<'list' | 'create' | 'lobby' | 'game' | 'history'>('list');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  
  // Form state
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [maxPlayers, setMaxPlayers] = useState<number>(30);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [timePerQuestion, setTimePerQuestion] = useState<number>(30);
  
  // Reward state
  const [rewardType, setRewardType] = useState<'coins' | 'card' | 'external' | 'none'>('coins');
  const [rewardCoins1st, setRewardCoins1st] = useState<number>(100);
  const [rewardCoins2nd, setRewardCoins2nd] = useState<number>(50);
  const [rewardCoins3rd, setRewardCoins3rd] = useState<number>(25);
  const [rewardCardId, setRewardCardId] = useState<string>('');
  const [rewardExternalDescription, setRewardExternalDescription] = useState<string>('');

  const { data: quizzes } = useActiveQuizzes();
  const { data: classes } = useClasses();
  const { data: cards } = useCards();
  const { data: activeRooms, isLoading } = useActiveRooms();
  const createRoomMutation = useCreateRoom();

  const handleCreateRoom = async () => {
    if (!selectedQuizId) return;

    const result = await createRoomMutation.mutateAsync({
      quizId: selectedQuizId,
      maxPlayers,
      classId: selectedClassId !== 'all' ? selectedClassId : undefined,
      rewardType,
      rewardCoins1st,
      rewardCoins2nd,
      rewardCoins3rd,
      rewardCardId: rewardCardId || undefined,
      rewardExternalDescription: rewardExternalDescription || undefined,
      timePerQuestion
    });

    if (result) {
      setSelectedRoomId(result.id);
      setView('lobby');
    }
  };

  const handleManageRoom = (roomId: string) => {
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
      <TeacherQuizControl
        roomId={selectedRoomId}
        onFinish={handleLeaveRoom}
      />
    );
  }

  if (view === 'lobby' && selectedRoomId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleLeaveRoom}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <TeacherQuizLobby
          roomId={selectedRoomId}
          onGameStart={handleGameStart}
          onLeave={handleLeaveRoom}
        />
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setView('list')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <MultiplayerMatchHistory />
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => setView('list')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Criar Sala Multiplayer</CardTitle>
            <CardDescription>Configure uma sala de quiz em tempo real</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quiz Selection */}
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

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPlayers">Máximo de Jogadores</Label>
                <Input
                  id="maxPlayers"
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  min={2}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timePerQuestion">Tempo por Questão (seg)</Label>
                <Input
                  id="timePerQuestion"
                  type="number"
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                  min={10}
                  max={300}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classId">Turma (Opcional)</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="classId">
                  <SelectValue placeholder="Aberto para todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Aberto para todos</SelectItem>
                  {classes?.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reward Configuration */}
            <div className="space-y-4">
              <Label>Tipo de Prêmio</Label>
              <Tabs value={rewardType} onValueChange={(v) => setRewardType(v as typeof rewardType)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="coins" className="flex items-center gap-1">
                    <Coins className="w-4 h-4" />
                    Moedas
                  </TabsTrigger>
                  <TabsTrigger value="card" className="flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    Carta
                  </TabsTrigger>
                  <TabsTrigger value="external" className="flex items-center gap-1">
                    <Gift className="w-4 h-4" />
                    Externo
                  </TabsTrigger>
                  <TabsTrigger value="none">Nenhum</TabsTrigger>
                </TabsList>

                <TabsContent value="coins" className="space-y-3 mt-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>1º Lugar</Label>
                      <Input
                        type="number"
                        value={rewardCoins1st}
                        onChange={(e) => setRewardCoins1st(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>2º Lugar</Label>
                      <Input
                        type="number"
                        value={rewardCoins2nd}
                        onChange={(e) => setRewardCoins2nd(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>3º Lugar</Label>
                      <Input
                        type="number"
                        value={rewardCoins3rd}
                        onChange={(e) => setRewardCoins3rd(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="card" className="mt-4">
                  <div className="space-y-2">
                    <Label>Carta para o 1º Lugar</Label>
                    <Select value={rewardCardId} onValueChange={setRewardCardId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma carta" />
                      </SelectTrigger>
                      <SelectContent>
                        {cards?.map((card) => (
                          <SelectItem key={card.id} value={card.id}>
                            {card.name} ({card.rarity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="external" className="mt-4">
                  <div className="space-y-2">
                    <Label>Descrição do Prêmio</Label>
                    <Textarea
                      value={rewardExternalDescription}
                      onChange={(e) => setRewardExternalDescription(e.target.value)}
                      placeholder="Ex: Ponto extra na prova, Chocolates, etc."
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="none" className="mt-4">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum prêmio será distribuído automaticamente.
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            <Button
              onClick={handleCreateRoom}
              disabled={!selectedQuizId || createRoomMutation.isPending}
              className="w-full"
              size="lg"
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
            Crie salas de quiz em tempo real para seus alunos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView('history')}>
            <History className="w-4 h-4 mr-2" />
            Histórico
          </Button>
          <Button onClick={() => setView('create')}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Sala
          </Button>
        </div>
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
                <CardDescription>{room.quizzes?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Código:</span>
                  <span className="font-mono font-bold text-lg">{room.room_code}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Máx. {room.max_players} jogadores • {room.time_per_question_seconds || 30}s por questão
                </div>
                <Button
                  onClick={() => handleManageRoom(room.id)}
                  className="w-full"
                >
                  Gerenciar Sala
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
              Crie uma nova sala para começar um quiz multiplayer
            </p>
            <Button onClick={() => setView('create')}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Sala
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}