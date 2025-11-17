import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { CoinBalance } from '@/components/ui/coin-balance';
import { MobileSidebar } from './MobileSidebar';
import { 
  Settings, 
  LogOut, 
  User,
  HelpCircle,
  Shield,
  Bell
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface HeaderProps {
  onSectionChange?: (section: string) => void;
  currentSection?: string;
  activeSection?: string;
}

export function Header({ onSectionChange, currentSection, activeSection }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const { addNotification } = useNotifications();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleTestNotification = () => {
    addNotification({
      title: 'Notificação de Teste',
      message: 'Esta é uma notificação de exemplo para testar o sistema.',
      type: 'info'
    });
  };

  if (!profile) return null;

  const userInitials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email[0].toUpperCase();

  const isSettingsActive = currentSection === 'settings';

  return (
    <header className="border-b bg-card border-border">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo e título */}
        <div className="flex items-center gap-3">
          <MobileSidebar 
            activeSection={activeSection || currentSection || 'dashboard'} 
            onSectionChange={onSectionChange || (() => {})} 
          />
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-primary rounded-lg flex items-center justify-center lg:hidden">
              <span className="text-primary-foreground font-bold text-xs lg:text-sm">IF</span>
            </div>
            <h1 className="text-lg lg:text-xl font-bold text-primary">
              IFCoins
            </h1>
          </div>
          
          {profile.role !== 'student' && (
            <span className="hidden lg:block text-sm text-muted-foreground">
              • Painel {profile.role === 'admin' ? 'Administrativo' : 'do Professor'}
            </span>
          )}
        </div>

        {/* Ações do usuário */}
        <div className="flex items-center gap-3">
          {/* Moedas - mostrar sempre em mobile, esconder em telas muito pequenas */}
          <div className="hidden sm:block">
            <CoinBalance balance={profile.coins} />
          </div>
          
          <NotificationPanel />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-56 bg-popover border-border z-50 shadow-lg" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-popover-foreground">
                    {profile.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {profile.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator className="bg-border" />
              
              <DropdownMenuItem 
                onClick={() => onSectionChange?.('settings')}
                className={`${isSettingsActive ? 'bg-accent' : ''} text-popover-foreground hover:bg-accent`}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações {profile.role === 'admin' ? 'Admin' : ''}</span>
              </DropdownMenuItem>
              
              {profile.role !== 'student' && (
                <>
                  <DropdownMenuItem 
                    onClick={() => onSectionChange?.('profile')}
                    className="text-popover-foreground hover:bg-accent"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>

                  {profile.role === 'admin' && (
                    <DropdownMenuItem 
                      onClick={() => onSectionChange?.('analytics')}
                      className="text-popover-foreground hover:bg-accent"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Relatórios e Analytics</span>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem 
                    onClick={handleTestNotification}
                    className="text-popover-foreground hover:bg-accent"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Testar Notificação</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => onSectionChange?.('help')}
                    className="text-popover-foreground hover:bg-accent"
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Ajuda</span>
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator className="bg-border" />
              
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-popover-foreground hover:bg-accent"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}