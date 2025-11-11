import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Coins, 
  BookOpen, 
  Users, 
  ArrowLeftRight,
  Trophy,
  Calendar,
  Settings,
  Gift,
  Vote,
  Bot,
  HelpCircle,
  Package,
  History,
  Award
} from 'lucide-react';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  id: string;
  roles: ('student' | 'teacher' | 'admin')[];
}
const sidebarItems: SidebarItem[] = [
  { icon: Home, label: 'Início', id: 'dashboard', roles: ['student', 'teacher', 'admin'] },
  { icon: Coins, label: 'Dar Moedas', id: 'give-coins', roles: ['teacher', 'admin'] },
  { icon: Gift, label: 'Loja de Cartas', id: 'shop', roles: ['student'] },
  { icon: BookOpen, label: 'Minha Coleção', id: 'collection', roles: ['student'] },
  { icon: ArrowLeftRight, label: 'Trocas', id: 'trades', roles: ['student'] },
  { icon: Coins, label: 'IFBank', id: 'bank', roles: ['student', 'admin'] },
  { icon: Package, label: 'IFMarket', id: 'market', roles: ['student'] },
  { icon: HelpCircle, label: 'Quizzes', id: 'quizzes', roles: ['student', 'teacher', 'admin'] },
  { icon: Vote, label: 'Votações', id: 'polls', roles: ['admin'] },
  { icon: Bot, label: 'IA Tutor', id: 'ai-tutor', roles: ['student', 'teacher', 'admin'] },
  { icon: Trophy, label: 'Rankings', id: 'rankings', roles: ['student', 'teacher', 'admin'] },
  { icon: Calendar, label: 'Eventos', id: 'events', roles: ['student', 'teacher', 'admin'] },
  { icon: Users, label: 'Gerenciar Turmas', id: 'manage-classes', roles: ['teacher', 'admin'] },
  { icon: Trophy, label: 'Conquistas', id: 'achievements', roles: ['student'] },
  { icon: BookOpen, label: 'Histórico de Cartas', id: 'card-history', roles: ['student', 'teacher', 'admin'] },
  { icon: Award, label: 'Ranking de Badges', id: 'badge-ranking', roles: ['student'] },
  { icon: History, label: 'Histórico Multiplayer', id: 'match-history', roles: ['student'] },
  { icon: Users, label: 'Gerenciar Estudantes', id: 'manage-students', roles: ['teacher', 'admin'] },
  { icon: BookOpen, label: 'Gerenciar Cartas', id: 'manage-cards', roles: ['admin'] },
  { icon: Package, label: 'Gerenciar Pacotes', id: 'manage-packs', roles: ['admin'] },
  { icon: ArrowLeftRight, label: 'Gerenciar Trocas', id: 'admin-trades', roles: ['admin'] },
  { icon: Settings, label: 'Configurações', id: 'settings', roles: ['admin'] }
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { profile, loading } = useAuth();

  console.log('Sidebar - profile:', profile);
  console.log('Sidebar - loading:', loading);

  if (loading || !profile) return null;

  const availableItems = sidebarItems.filter(item => 
    item.roles.includes(profile.role as any)
  );

  return (
    <aside className="w-64 bg-sidebar-background border-r border-sidebar-border">
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">IF</span>
            </div>
            <h1 className="text-xl font-bold text-sidebar-foreground">IFCoins</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {availableItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors border",
                      isActive 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-accent" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground border-transparent hover:border-sidebar-border"
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
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-sidebar-border bg-sidebar-accent/20">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">
                {profile.name ? profile.name[0].toUpperCase() : profile.email[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile.name || profile.email}
              </p>
              <p className="text-xs text-sidebar-foreground/70 capitalize">
                {profile.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}