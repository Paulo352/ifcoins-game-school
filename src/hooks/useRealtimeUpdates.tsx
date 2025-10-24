import { useRealtimeProfile } from './useRealtimeProfile';
import { useRealtimeRewards } from './useRealtimeRewards';
import { useRealtimeCards } from './useRealtimeCards';
import { useRealtimeTrades } from './useRealtimeTrades';

/**
 * Hook principal que habilita todas as atualizações em tempo real
 * Usar este hook nos componentes principais para ativar realtime em toda a aplicação
 */
export function useRealtimeUpdates() {
  useRealtimeProfile();
  useRealtimeRewards();
  useRealtimeCards();
  useRealtimeTrades();
}
