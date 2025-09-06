
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
  Vote
} from 'lucide-react';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  id: string;
  roles: ('student' | 'teacher' | 'admin')[];
}

const sidebarItems: SidebarItem[] = [
  { icon: Home, label: 'Início', id: 'dashboard', roles: ['student', 'teacher', 'admin'] },
  { icon: Coins, label: 'Dar Moedas', id: 'give-coins', roles: ['admin'] },
  { icon: Gift, label: 'Loja de Cartas', id: 'shop', roles: ['student'] },
  { icon: BookOpen, label: 'Minha Coleção', id: 'collection', roles: ['student'] },
  { icon: Vote, label: 'Votações', id: 'polls', roles: ['student', 'teacher', 'admin'] },
  { icon: Trophy, label: 'Rankings', id: 'rankings', roles: ['student', 'teacher', 'admin'] },
  { icon: Calendar, label: 'Eventos', id: 'events', roles: ['student', 'teacher', 'admin'] },
  { icon: Users, label: 'Gerenciar Estudantes', id: 'manage-students', roles: ['teacher', 'admin'] },
  { icon: BookOpen, label: 'Gerenciar Cartas', id: 'manage-cards', roles: ['admin'] },
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

  const filteredItems = sidebarItems.filter(item => 
    item.roles.includes(profile.role)
  );

  console.log('Sidebar - filtered items for role', profile.role, ':', filteredItems.map(item => item.label));

  return (
    <aside className="bg-gray-50 border-r border-gray-200 w-64 min-h-screen">
      <div className="p-6">
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm font-medium text-green-800">
            {profile.name}
          </div>
          <div className="text-xs text-green-600 capitalize">
            {profile.role} - {profile.email}
          </div>
        </div>
        <nav className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                  isActive 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
