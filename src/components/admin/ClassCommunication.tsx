import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClasses } from '@/hooks/useClasses';
import { useClassMessages, useSendMessage } from '@/hooks/useClassCommunication';
import { MessageSquare, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ClassCommunication() {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [message, setMessage] = useState('');
  
  const { data: classes } = useClasses();
  const { data: messages } = useClassMessages(selectedClassId);
  const sendMessage = useSendMessage();

  const handleSend = () => {
    if (!selectedClassId || !message.trim()) return;
    
    sendMessage.mutate(
      { classId: selectedClassId, message: message.trim() },
      {
        onSuccess: () => {
          setMessage('');
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Mensagens para Turmas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma turma" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedClassId && (
            <>
              <div className="space-y-2">
                <Textarea
                  placeholder="Digite sua mensagem para a turma..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!message.trim() || sendMessage.isPending}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                <h3 className="font-medium text-sm">Histórico de Mensagens</h3>
                {messages && messages.length > 0 ? (
                  messages.map((msg: any) => (
                    <Card key={msg.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">{msg.sender?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma mensagem ainda
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
