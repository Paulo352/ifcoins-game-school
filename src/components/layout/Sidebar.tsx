import React, { useState } from 'react';
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
  Award,
  TrendingUp,
  FileText,
  Building2,
  ShoppingBag,
  BarChart2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  id: string;
  roles: ('student' | 'teacher' | 'admin')[];
  maintenance?: boolean;
}

interface SidebarGroup {
  label: string;
  icon: React.ElementType;
  roles: ('student' | 'teacher' | 'admin')[];
  items: SidebarItem[];
}

const sidebarGroups: SidebarGroup[] = [
  // Grupo principal - sempre visível
  {
    label: 'Principal',
    icon: Home,
    roles: ['student', 'teacher', 'admin'],
    items: [
      { icon: Home, label: 'Início', id: 'dashboard', roles: ['student', 'teacher', 'admin'] },
    ]
  },
  // Grupo Quizzes & Badges (Estudantes)
  {
    label: 'Quizzes & Badges',
    icon: HelpCircle,
    roles: ['student', 'teacher', 'admin'],
    items: [
      { icon: HelpCircle, label: 'Quizzes', id: 'quizzes', roles: ['student', 'teacher', 'admin'] },
      { icon: Award, label: 'Ranking Badges', id: 'badge-ranking', roles: ['student'] },
      { icon: History, label: 'Histórico Multiplayer', id: 'match-history', roles: ['student'] },
    ]
  },
  // Grupo Cartas & Coleção (Estudantes)
  {
    label: 'Cartas & Coleção',
    icon: Gift,
    roles: ['student'],
    items: [
      { icon: Gift, label: 'Loja de Cartas', id: 'shop', roles: ['student'] },
      { icon: BookOpen, label: 'Minha Coleção', id: 'collection', roles: ['student'] },
      { icon: Trophy, label: 'Conquistas', id: 'achievements', roles: ['student'], maintenance: true },
      { icon: BookOpen, label: 'Histórico Cartas', id: 'card-history', roles: ['student'], maintenance: true },
    ]
  },
  // Grupo Atividades (Estudantes)
  {
    label: 'Atividades',
    icon: ArrowLeftRight,
    roles: ['student'],
    items: [
      { icon: ArrowLeftRight, label: 'Trocas', id: 'trades', roles: ['student'] },
      { icon: Building2, label: 'IFBank', id: 'bank', roles: ['student'], maintenance: true },
      { icon: ShoppingBag, label: 'IFMarket', id: 'market', roles: ['student'], maintenance: true },
      { icon: Trophy, label: 'Rankings', id: 'rankings', roles: ['student', 'teacher', 'admin'] },
    ]
  },
  // Grupo Suporte (Estudantes)
  {
    label: 'Suporte',
    icon: Bot,
    roles: ['student'],
    items: [
      { icon: Bot, label: 'Tutor IA', id: 'ai-tutor', roles: ['student'] },
      { icon: Users, label: 'Mentoria', id: 'mentorship', roles: ['student'] },
    ]
  },
  // Grupo Gestão de Turmas (Professores/Admins)
  {
    label: 'Gestão de Turmas',
    icon: Users,
    roles: ['teacher', 'admin'],
    items: [
      { icon: Users, label: 'Turmas', id: 'manage-classes', roles: ['teacher', 'admin'] },
      { icon: Coins, label: 'Dar Moedas', id: 'give-coins', roles: ['teacher', 'admin'] },
      { icon: FileText, label: 'Relatórios', id: 'class-reports', roles: ['admin'] },
    ]
  },
  // Grupo Gestão de Conteúdo (Admins)
  {
    label: 'Gestão de Conteúdo',
    icon: Package,
    roles: ['admin'],
    items: [
      { icon: Users, label: 'Gerenciar Alunos', id: 'manage-students', roles: ['admin'] },
      { icon: BookOpen, label: 'Gerenciar Cartas', id: 'manage-cards', roles: ['admin'] },
      { icon: Package, label: 'Gerenciar Pacotes', id: 'manage-packs', roles: ['admin'] },
      { icon: ArrowLeftRight, label: 'Gerenciar Trocas', id: 'admin-trades', roles: ['admin'] },
      { icon: Calendar, label: 'Eventos', id: 'events', roles: ['admin'] },
      { icon: Vote, label: 'Enquetes', id: 'polls', roles: ['admin'] },
    ]
  },
  // Grupo Relatórios (Admins)
  {
    label: 'Relatórios & Analytics',
    icon: TrendingUp,
    roles: ['admin'],
    items: [
      { icon: TrendingUp, label: 'Dashboard Mentoria', id: 'mentorship-dashboard', roles: ['admin'] },
      { icon: BarChart2, label: 'Analytics', id: 'analytics', roles: ['admin'] },
    ]
  },
  // Configurações - sempre no final
  {
    label: 'Sistema',
    icon: Settings,
    roles: ['student', 'teacher', 'admin'],
    items: [
      { icon: Settings, label: 'Configurações', id: 'settings', roles: ['admin', 'teacher', 'student'] },
    ]
  },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { profile, loading } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Principal']);

  if (loading || !profile) return null;

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupLabel) 
        ? prev.filter(g => g !== groupLabel)
        : [...prev, groupLabel]
    );
  };

  const availableGroups = sidebarGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.includes(profile.role as any))
    }))
    .filter(group => group.roles.includes(profile.role as any) && group.items.length > 0);

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
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {availableGroups.map((group) => {
              const isExpanded = expandedGroups.includes(group.label);
              const GroupIcon = group.icon;
              
              return (
                <div key={group.label}>
                  {/* Grupo sempre expandido para "Principal" */}
                  {group.label === 'Principal' ? (
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        
                        return (
                          <button
                            key={item.id}
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
                        );
                      })}
                    </div>
                  ) : (
                    <>
                      {/* Header do grupo colapsável */}
                      <button
                        onClick={() => toggleGroup(group.label)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <GroupIcon className="h-4 w-4" />
                          <span>{group.label}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      
                      {/* Items do grupo */}
                      {isExpanded && (
                        <div className="space-y-1 mt-1">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeSection === item.id;
                            const isInMaintenance = item.maintenance;
                            
                            return (
                              <button
                                key={item.id}
                                onClick={() => !isInMaintenance && onSectionChange(item.id)}
                                disabled={isInMaintenance}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors border text-sm",
                                  isInMaintenance
                                    ? "text-muted-foreground/40 bg-muted/20 border-transparent cursor-not-allowed opacity-60"
                                    : isActive 
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-accent" 
                                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground border-transparent hover:border-sidebar-border"
                                )}
                              >
                                <Icon className="h-4 w-4 flex-shrink-0 ml-2" />
                                <span>{item.label}</span>
                                {isInMaintenance && (
                                  <span className="ml-auto text-xs text-muted-foreground/40">Em manutenção</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
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