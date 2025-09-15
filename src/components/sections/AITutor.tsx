import React from 'react';
import { AITutorChat } from '@/components/ai-tutor/AITutorChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Brain, Target, MessageSquare, Lightbulb } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AITutor() {
  const { profile } = useAuth();

  // Create context based on user profile
  const getUserContext = () => {
    if (!profile) return '';
    
    return `
Perfil do estudante:
- Nível de moedas IFCoins: ${profile.coins} (${profile.coins < 50 ? 'Iniciante' : profile.coins < 200 ? 'Intermediário' : 'Avançado'})
- Turma: ${profile.class || 'Não informada'}
- RA: ${profile.ra || 'Não informado'}
- Tempo na plataforma: Desde ${new Date(profile.created_at).toLocaleDateString('pt-BR')}
    `;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            IA Tutor
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Seu assistente educacional inteligente para feedback personalizado, 
          sugestões de aprendizado e respostas automáticas às suas dúvidas.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Feature Cards */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-blue-500" />
                Recursos da IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Feedback Personalizado</h4>
                  <p className="text-xs text-muted-foreground">
                    Análise do seu desempenho com sugestões específicas
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Sugestões de Aprendizado</h4>
                  <p className="text-xs text-muted-foreground">
                    Caminhos de estudo baseados em suas necessidades
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Respostas Automáticas</h4>
                  <p className="text-xs text-muted-foreground">
                    Tire dúvidas a qualquer momento do dia
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Dicas de Uso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                <p className="text-blue-700 dark:text-blue-300">
                  💡 <strong>Seja específico:</strong> Quanto mais detalhes você fornecer, 
                  melhor será a resposta da IA.
                </p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                <p className="text-green-700 dark:text-green-300">
                  🎯 <strong>Pergunte sobre:</strong> Estratégias de estudo, 
                  esclarecimentos de conceitos, dicas para ganhar mais IFCoins.
                </p>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg">
                <p className="text-purple-700 dark:text-purple-300">
                  🚀 <strong>Use regularmente:</strong> A IA aprende com suas 
                  interações para oferecer sugestões cada vez melhores.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <AITutorChat context={getUserContext()} />
        </div>
      </div>
    </div>
  );
}