
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminStats } from '../admin/AdminStats';

export function AdminDashboard() {
  const { profile } = useAuth();

  if (!profile || profile.role !== 'admin') return null;

  return <AdminStats users={[]} recentRewards={[]} />;
}
