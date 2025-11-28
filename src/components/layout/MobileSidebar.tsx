import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu,
  X,
  Home, 
  Coins, 
  BookOpen, 
  Users, 
  Trophy,
  Calendar,
  Settings,
  Gift,
  Vote,
  Bot,
  HelpCircle,
  Package
} from 'lucide-react';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  id: string;
  roles: ('student' | 'teacher' | 'admin')[];
}

const sidebarItems: SidebarItem[] = [
  { icon: Home, label: 'Início', id: 'dashboard', roles: ['student', 'teacher', 'admin'] },
  { icon: HelpCircle, label: 'Quizzes', id: 'quizzes', roles: ['student', 'teacher', 'admin'] },
  { icon: Gift, label: 'Loja de Cartas', id: 'shop', roles: ['student'] },
  { icon: BookOpen, label: 'Minha Coleção', id: 'collection', roles: ['student'] },
  { icon: Trophy, label: 'Rankings', id: 'rankings', roles: ['student', 'teacher', 'admin'] },
  { icon: Calendar, label: 'Eventos', id: 'events', roles: ['student', 'admin'] },
  { icon: Vote, label: 'Votações', id: 'polls', roles: ['student', 'admin'] },
  { icon: Bot, label: 'Tutor IA', id: 'ai-tutor', roles: ['student', 'teacher', 'admin'] },
  { icon: Users, label: 'Turmas', id: 'manage-classes', roles: ['teacher', 'admin'] },
  { icon: Coins, label: 'Dar Moedas', id: 'give-coins', roles: ['teacher', 'admin'] },
  { icon: Users, label: 'Gerenciar Alunos', id: 'manage-students', roles: ['admin'] },
  { icon: BookOpen, label: 'Gerenciar Cartas', id: 'manage-cards', roles: ['admin'] },
  { icon: Package, label: 'Gerenciar Pacotes', id: 'manage-packs', roles: ['admin'] },
  { icon: Package, label: 'Dashboard Mentoria', id: 'mentorship-dashboard', roles: ['admin'] },
  { icon: Package, label: 'Analytics', id: 'analytics', roles: ['admin'] },
  { icon: Settings, label: 'Configurações', id: 'settings', roles: ['student', 'teacher', 'admin'] },
];

interface MobileSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function MobileSidebar({ activeSection, onSectionChange }: MobileSidebarProps) {
  const { profile, loading } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading || !profile) return null;

  const availableItems = sidebarItems.filter(item => 
    item.roles.includes(profile.role as any)
  );

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="lg:hidden p-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 bg-background border-border">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">IF</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">IFCoins</h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setOpen(false)}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* User Info */}
          <div className="p-4 border-b border-border bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {profile.name ? profile.name[0].toUpperCase() : profile.email[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile.name || profile.email}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile.role}
                </p>
                <p className="text-xs text-primary font-medium">
                  {profile.coins} IFCoins
                </p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {availableItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleSectionChange(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}