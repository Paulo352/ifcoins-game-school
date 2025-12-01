import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/contexts/ThemeContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAvatarUpload } from '@/hooks/storage/useAvatarUpload';
import { toast } from 'sonner';
import { 
  User, 
  Lock, 
  Palette, 
  Accessibility, 
  Bell, 
  Save,
  Moon,
  Sun,
  Monitor,
  Eye,
  Type,
  MousePointer,
  Keyboard,
  Volume2,
  Upload,
  Trash2
} from 'lucide-react';

export function UserSettings() {
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings: a11ySettings, updateSetting } = useAccessibility();
  const { uploadAvatar, deleteAvatar, isUploading } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [profileData, setProfileData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    ra: profile?.ra || '',
    class: profile?.class || ''
  });

  const [saving, setSaving] = useState(false);

  const handleAvatarUpload = async (file: File) => {
    if (!profile) return;
    const result = await uploadAvatar(file, profile.id);
    if (result) {
      window.location.reload();
    }
  };

  const handleAvatarDelete = async () => {
    if (!profile) return;
    const success = await deleteAvatar(profile.id, profile.avatar_url || undefined);
    if (success) {
      window.location.reload();
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('Nova senha e confirmação não coincidem');
      return;
    }

    if (passwords.new.length < 6) {
      toast.error('Nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      toast.success('Senha alterada com sucesso');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast.error('Erro ao alterar senha: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleProfileUpdate = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          ra: profileData.ra,
          class: profileData.class
        })
        .eq('id', profile?.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso');
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor }
  ];

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-gray-600">Você precisa estar logado para acessar as configurações.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas preferências pessoais e configurações de conta
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2 p-2 text-sm">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 p-2 text-sm">
            <Lock className="h-4 w-4" />
            <span className="hidden md:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2 p-2 text-sm">
            <Palette className="h-4 w-4" />
            <span className="hidden md:inline">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2 p-2 text-sm">
            <Accessibility className="h-4 w-4" />
            <span className="hidden md:inline">Acessibilidade</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 p-2 text-sm">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Notificações</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4 pb-6 border-b">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-4xl">
                    {profile?.name[0]?.toUpperCase() || profile?.email[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {profile?.avatar_url ? 'Alterar Foto' : 'Adicionar Foto'}
                  </Button>
                  {profile?.avatar_url && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleAvatarDelete}
                      disabled={isUploading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Seu nome completo"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O email não pode ser alterado
                  </p>
                </div>

                {profile.role === 'student' && (
                  <>
                    <div>
                      <Label htmlFor="ra">RA (Registro Acadêmico)</Label>
                      <Input
                        id="ra"
                        value={profileData.ra}
                        onChange={(e) => setProfileData(prev => ({ ...prev, ra: e.target.value }))}
                        placeholder="Seu RA"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="class">Turma</Label>
                      <Input
                        id="class"
                        value={profileData.class}
                        onChange={(e) => setProfileData(prev => ({ ...prev, class: e.target.value }))}
                        placeholder="Sua turma"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileUpdate} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                  placeholder="Digite sua senha atual"
                />
              </div>
              
              <div>
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                  placeholder="Digite sua nova senha"
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                  placeholder="Confirme sua nova senha"
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handlePasswordChange} 
                  disabled={saving || !passwords.current || !passwords.new || !passwords.confirm}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Alterar Senha
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Tema da Interface</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value as any)}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        theme === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Acessibilidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5" />
                    <div>
                      <Label>Alto Contraste</Label>
                      <p className="text-sm text-muted-foreground">
                        Aumenta o contraste das cores para melhor visibilidade
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={a11ySettings.highContrast}
                    onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Type className="h-5 w-5" />
                    <div>
                      <Label>Texto Grande</Label>
                      <p className="text-sm text-muted-foreground">
                        Aumenta o tamanho do texto em toda a aplicação
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={a11ySettings.largeText}
                    onCheckedChange={(checked) => updateSetting('largeText', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MousePointer className="h-5 w-5" />
                    <div>
                      <Label>Reduzir Animações</Label>
                      <p className="text-sm text-muted-foreground">
                        Reduz animações e transições para evitar enjoos
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={a11ySettings.reducedMotion}
                    onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-5 w-5" />
                    <div>
                      <Label>Leitor de Tela</Label>
                      <p className="text-sm text-muted-foreground">
                        Otimizações para leitores de tela
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={a11ySettings.screenReader}
                    onCheckedChange={(checked) => updateSetting('screenReader', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Keyboard className="h-5 w-5" />
                    <div>
                      <Label>Navegação por Teclado</Label>
                      <p className="text-sm text-muted-foreground">
                        Melhora a navegação usando apenas o teclado
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={a11ySettings.keyboardNavigation}
                    onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                As configurações de notificação serão implementadas em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}