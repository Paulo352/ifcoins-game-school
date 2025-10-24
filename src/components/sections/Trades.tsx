
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CoinBalance } from '@/components/ui/coin-balance';
import { Plus, Send, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTrades, useCreateTrade, useUpdateTradeStatus, useStudents } from '@/hooks/trades/useTrades';
import { useUserCards } from '@/hooks/cards/useCards';
import { CardSelector } from '@/components/trades/CardSelector';
import { TradeCard } from '@/components/trades/TradeCard';
import { useRealtimeTrades } from '@/hooks/useRealtimeTrades';

export function Trades() {
  const { profile, user } = useAuth();
  useRealtimeTrades();
  const [isCreating, setIsCreating] = useState(false);
  const [newTrade, setNewTrade] = useState({
    to_user_id: '',
    offeredCards: {} as Record<string, number>,
    offeredCoins: 0,
    requestedCards: {} as Record<string, number>,
    requestedCoins: 0
  });

  const { data: trades = [], isLoading: tradesLoading } = useTrades();
  const { data: userCards = [] } = useUserCards(user?.id);
  const { data: targetUserCards = [] } = useUserCards(newTrade.to_user_id || undefined);
  const { data: students = [] } = useStudents();
  const createTradeMutation = useCreateTrade();
  const updateTradeStatusMutation = useUpdateTradeStatus();

  if (!profile || profile.role !== 'student') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-gray-600">Apenas estudantes podem acessar o sistema de trocas.</p>
      </div>
    );
  }

  const handleCreateTrade = async () => {
    if (!newTrade.to_user_id) {
      toast({
        title: "Erro",
        description: "Selecione um estudante para trocar",
        variant: "destructive",
      });
      return;
    }

    // Verificar se há algo para trocar
    const hasOfferedCards = Object.values(newTrade.offeredCards).some(q => q > 0);
    const hasRequestedCards = Object.values(newTrade.requestedCards).some(q => q > 0);
    
    if (!hasOfferedCards && !hasRequestedCards && newTrade.offeredCoins === 0 && newTrade.requestedCoins === 0) {
      toast({
        title: "Erro",
        description: "Você deve oferecer ou solicitar algo na troca",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTradeMutation.mutateAsync({
        to_user_id: newTrade.to_user_id,
        offered_cards: newTrade.offeredCards,
        offered_coins: newTrade.offeredCoins,
        requested_cards: newTrade.requestedCards,
        requested_coins: newTrade.requestedCoins,
      });

      setNewTrade({
        to_user_id: '',
        offeredCards: {},
        offeredCoins: 0,
        requestedCards: {},
        requestedCoins: 0
      });
      setIsCreating(false);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleAcceptTrade = (tradeId: string) => {
    updateTradeStatusMutation.mutate({ tradeId, status: 'accepted' });
  };

  const handleRejectTrade = (tradeId: string) => {
    updateTradeStatusMutation.mutate({ tradeId, status: 'rejected' });
  };

  const handleCardChange = (type: 'offered' | 'requested', cardId: string, quantity: number) => {
    if (type === 'offered') {
      setNewTrade(prev => ({
        ...prev,
        offeredCards: {
          ...prev.offeredCards,
          [cardId]: quantity
        }
      }));
    } else {
      setNewTrade(prev => ({
        ...prev,
        requestedCards: {
          ...prev.requestedCards,
          [cardId]: quantity
        }
      }));
    }
  };

  // Criar mapa de profiles para exibição
  const profilesMap = students.reduce((map, student) => {
    map[student.id] = { name: student.name, email: student.email };
    return map;
  }, {} as Record<string, { name: string; email: string }>);

  const myTrades = trades.filter(trade => trade.from_user_id === user?.id);
  const receivedTrades = trades.filter(trade => trade.to_user_id === user?.id);

  if (tradesLoading) {
    return (
      <div className="text-center py-12">
        <p>Carregando trocas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Trocas</h1>
          <p className="text-gray-600 mt-1">Troque cartas e moedas com outros estudantes</p>
        </div>
        <div className="flex items-center gap-4">
          <CoinBalance balance={profile.coins} />
          <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Troca
          </Button>
        </div>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Nova Proposta de Troca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="tradeTo">Trocar com</Label>
              <Select value={newTrade.to_user_id} onValueChange={(value) => setNewTrade({...newTrade, to_user_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um estudante" />
                </SelectTrigger>
                <SelectContent>
                  {students.filter(student => student.id !== user?.id).map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="offeredCoins">Moedas que você oferece</Label>
                  <Input
                    id="offeredCoins"
                    type="number"
                    min="0"
                    max={profile?.coins || 0}
                    value={newTrade.offeredCoins}
                    onChange={(e) => setNewTrade({...newTrade, offeredCoins: Math.min(parseInt(e.target.value) || 0, profile?.coins || 0)})}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Você possui: {profile?.coins || 0} moedas
                  </p>
                </div>
                
                <CardSelector
                  userCards={userCards}
                  selectedCards={newTrade.offeredCards}
                  onCardChange={(cardId, quantity) => handleCardChange('offered', cardId, quantity)}
                  title="Cartas que você oferece"
                  variant="offer"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="requestedCoins">Moedas que você solicita</Label>
                  <Input
                    id="requestedCoins"
                    type="number"
                    min="0"
                    value={newTrade.requestedCoins}
                    onChange={(e) => setNewTrade({...newTrade, requestedCoins: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                
                {newTrade.to_user_id ? (
                  <CardSelector
                    userCards={targetUserCards}
                    selectedCards={newTrade.requestedCards}
                    onCardChange={(cardId, quantity) => handleCardChange('requested', cardId, quantity)}
                    title="Cartas que você solicita"
                    variant="request"
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Selecione um estudante para ver suas cartas disponíveis
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateTrade}
                disabled={createTradeMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {createTradeMutation.isPending ? 'Enviando...' : 'Enviar Proposta'}
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              Minhas Propostas ({myTrades.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myTrades.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma proposta enviada</p>
              ) : (
                myTrades.map((trade) => (
                  <TradeCard
                    key={trade.id}
                    trade={trade}
                    isReceived={false}
                    userCards={userCards}
                    profilesMap={profilesMap}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Propostas Recebidas ({receivedTrades.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {receivedTrades.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma proposta recebida</p>
              ) : (
                receivedTrades.map((trade) => (
                  <TradeCard
                    key={trade.id}
                    trade={trade}
                    isReceived={true}
                    userCards={userCards}
                    onAccept={handleAcceptTrade}
                    onReject={handleRejectTrade}
                    profilesMap={profilesMap}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
