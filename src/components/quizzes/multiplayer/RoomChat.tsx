import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRoomChat, useSendMessage } from '@/hooks/quizzes/useMultiplayerChat';
import { MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RoomChatProps {
  roomId: string;
}

export function RoomChat({ roomId }: RoomChatProps) {
  const { user } = useAuth();
  const { data: messages } = useRoomChat(roomId);
  const sendMessageMutation = useSendMessage();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate(
      { roomId, message: message.trim() },
      {
        onSuccess: () => setMessage('')
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Chat da Sala
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-96 pr-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages?.map((msg: any) => {
              const isOwn = msg.user_id === user?.id;
              
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-lg p-3 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-xs font-medium mb-1">{msg.profiles.name}</p>
                    <p className="text-sm break-words">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua mensagem..."
            maxLength={200}
          />
          <Button onClick={handleSend} disabled={!message.trim() || sendMessageMutation.isPending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
