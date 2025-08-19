
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CardDisplay } from '@/components/cards/CardDisplay';
import { CoinBalance } from '@/components/ui/coin-balance';
import { Plus, Send, Check, X, Clock, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Trade } from '@/types';
import { mockTrades, mockCards } from '@/data/mockData';

export function Trades() {
  const { profile } = useAuth();
  const [trades, setTrades] = useState(mockTrades);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTrade, setNewTrade] = useState({
    to: '',
    offeredCards: {} as Record<string, number>,
    offeredCoins: 0,
    requestedCards: {} as Record<string, number>,
    requestedCoins: 0
  });

  if (!profile || profile.role !== 'student') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-gray-600">Apenas estudantes podem acessar o sistema de trocas.</p>
      </div>
    );
  }

  const handleCreateTrade = () => {
    if (!newTrade.to) {
      toast({
        title: "Erro",
        description: "Selecione um estudante para trocar",
        variant: "destructive",
      });
      return;
    }

    const trade: Trade = {
      id: Date.now().toString(),
      from: profile.id,
      to: newTrade.to,
      offered: {
        cards: newTrade.offeredCards,
        coins: newTrade.offeredCoins
      },
      requested: {
        cards: newTrade.requestedCards,
        coins: newTrade.requestedCoins
      },
      status: 'pending',
      timestamp: Date.now()
    };

    setTrades([...trades, trade]);
    setNewTrade({
      to: '',
      offeredCards: {},
      offeredCoins: 0,
      requestedCards: {},
      requestedCoins: 0
    });
    setIsCreating(false);
    
    toast({
      title: "Sucesso",
      description: "Proposta de troca enviada!",
    });
  };

  const handleAcceptTrade = (tradeId: string) => {
    setTrades(trades.map(trade => 
      trade.id === tradeId 
        ? { ...trade, status: 'accepted' as const }
        : trade
    ));
    toast({
      title: "Sucesso",
      description: "Troca aceita com sucesso!",
    });
  };

  const handleRejectTrade = (tradeId: string) => {
    setTrades(trades.map(trade => 
      trade.id === tradeId 
        ? { ...trade, status: 'rejected' as const }
        : trade
    ));
    toast({
      title: "Troca rejeitada",
      description: "A proposta de troca foi recusada.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceita';
      case 'rejected': return 'Rejeitada';
      default: return status;
    }
  };

  const filteredTrades = trades.filter(trade =>
    trade.from === profile.id || trade.to === profile.id
  );

  const myTrades = filteredTrades.filter(trade => trade.from === profile.id);
  const receivedTrades = filteredTrades.filter(trade => trade.to === profile.id);

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
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tradeTo">Trocar com (Email do estudante)</Label>
              <Input
                id="tradeTo"
                value={newTrade.to}
                onChange={(e) => setNewTrade({...newTrade, to: e.target.value})}
                placeholder="estudante@estudantes.ifpr.edu.br"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-green-600">Você Oferece</h3>
                <div>
                  <Label htmlFor="offeredCoins">Moedas</Label>
                  <Input
                    id="offeredCoins"
                    type="number"
                    min="0"
                    value={newTrade.offeredCoins}
                    onChange={(e) => setNewTrade({...newTrade, offeredCoins: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Cartas (formato: card1:2, card2:1)</Label>
                  <Input
                    placeholder="Ex: card1:2, card2:1"
                    onChange={(e) => {
                      const cards: Record<string, number> = {};
                      e.target.value.split(',').forEach(item => {
                        const [cardId, quantity] = item.trim().split(':');
                        if (cardId && quantity) {
                          cards[cardId] = parseInt(quantity) || 1;
                        }
                      });
                      setNewTrade({...newTrade, offeredCards: cards});
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-lg text-blue-600">Você Solicita</h3>
                <div>
                  <Label htmlFor="requestedCoins">Moedas</Label>
                  <Input
                    id="requestedCoins"
                    type="number"
                    min="0"
                    value={newTrade.requestedCoins}
                    onChange={(e) => setNewTrade({...newTrade, requestedCoins: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Cartas (formato: card1:2, card2:1)</Label>
                  <Input
                    placeholder="Ex: card1:2, card2:1"
                    onChange={(e) => {
                      const cards: Record<string, number> = {};
                      e.target.value.split(',').forEach(item => {
                        const [cardId, quantity] = item.trim().split(':');
                        if (cardId && quantity) {
                          cards[cardId] = parseInt(quantity) || 1;
                        }
                      });
                      setNewTrade({...newTrade, requestedCards: cards});
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateTrade}>
                <Send className="h-4 w-4 mr-2" />
                Enviar Proposta
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
              Minhas Propostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myTrades.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma proposta enviada</p>
              ) : (
                myTrades.map((trade) => (
                  <div key={trade.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm">
                        <p className="font-medium">Para: {trade.to}</p>
                        <p className="text-gray-500">
                          {new Date(trade.timestamp).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                        {getStatusText(trade.status)}
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p><strong>Ofereci:</strong> {trade.offered.coins} moedas</p>
                      <p><strong>Solicitei:</strong> {trade.requested.coins} moedas</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Propostas Recebidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {receivedTrades.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma proposta recebida</p>
              ) : (
                receivedTrades.map((trade) => (
                  <div key={trade.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm">
                        <p className="font-medium">De: {trade.from}</p>
                        <p className="text-gray-500">
                          {new Date(trade.timestamp).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                        {getStatusText(trade.status)}
                      </span>
                    </div>
                    <div className="text-xs space-y-1 mb-3">
                      <p><strong>Oferece:</strong> {trade.offered.coins} moedas</p>
                      <p><strong>Solicita:</strong> {trade.requested.coins} moedas</p>
                    </div>
                    {trade.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleAcceptTrade(trade.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Aceitar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRejectTrade(trade.id)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
