import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJoinClassByInvite } from '@/hooks/useClassCommunication';
import { Users } from 'lucide-react';

export function JoinClassByCode() {
  const [code, setCode] = useState('');
  const joinClass = useJoinClassByInvite();

  const handleJoin = () => {
    if (!code.trim()) return;
    joinClass.mutate(code.trim());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Entrar em uma Turma
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="invite-code">Código de Convite</Label>
          <Input
            id="invite-code"
            placeholder="Digite o código da turma"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Digite o código de 8 caracteres fornecido pelo seu professor
          </p>
        </div>

        <Button 
          onClick={handleJoin} 
          disabled={!code.trim() || joinClass.isPending}
          className="w-full"
        >
          {joinClass.isPending ? 'Entrando...' : 'Entrar na Turma'}
        </Button>
      </CardContent>
    </Card>
  );
}
