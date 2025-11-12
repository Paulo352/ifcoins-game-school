import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClasses } from '@/hooks/useClasses';
import { useClassInvites, useCreateInvite, useDeactivateInvite } from '@/hooks/useClassCommunication';
import { Copy, Plus, XCircle, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function ClassInviteManagement() {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [maxUses, setMaxUses] = useState<string>('');
  const [expiresInDays, setExpiresInDays] = useState<string>('7');
  
  const { data: classes } = useClasses();
  const { data: invites } = useClassInvites(selectedClassId);
  const createInvite = useCreateInvite();
  const deactivateInvite = useDeactivateInvite();

  const handleCreate = () => {
    if (!selectedClassId) return;
    
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000).toISOString()
      : undefined;
    
    createInvite.mutate({
      classId: selectedClassId,
      expiresAt,
      maxUses: maxUses ? parseInt(maxUses) : undefined,
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Gerenciar Convites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label>Turma</Label>
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
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Válido por (dias)</Label>
                <Input
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  placeholder="7"
                />
              </div>
              <div>
                <Label>Limite de usos</Label>
                <Input
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Ilimitado"
                />
              </div>
            </div>

            <Button 
              onClick={handleCreate} 
              disabled={!selectedClassId || createInvite.isPending}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Gerar Novo Convite
            </Button>
          </div>

          {selectedClassId && invites && invites.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Convites Ativos</h3>
              {invites
                .filter((inv: any) => inv.is_active)
                .map((invite: any) => (
                  <Card key={invite.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-lg font-bold bg-muted px-2 py-1 rounded">
                              {invite.invite_code}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(invite.invite_code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            {invite.max_uses && (
                              <Badge variant="secondary">
                                {invite.uses_count}/{invite.max_uses} usos
                              </Badge>
                            )}
                            {invite.expires_at && (
                              <Badge variant="secondary">
                                Expira: {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deactivateInvite.mutate(invite.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
