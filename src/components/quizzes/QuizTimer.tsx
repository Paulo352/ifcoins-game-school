import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface QuizTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
}

export function QuizTimer({ totalSeconds, onTimeUp }: QuizTimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = (timeLeft / totalSeconds) * 100;
  const isWarning = timeLeft <= 60; // Último minuto
  const isCritical = timeLeft <= 30; // Últimos 30 segundos

  const getTimerColor = () => {
    if (isCritical) return 'text-red-600 dark:text-red-400';
    if (isWarning) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-primary';
  };

  const getProgressColor = () => {
    if (isCritical) return 'bg-red-500';
    if (isWarning) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge 
          variant={isCritical ? 'destructive' : isWarning ? 'outline' : 'secondary'}
          className={`text-lg font-mono ${getTimerColor()} ${isCritical || isWarning ? 'animate-pulse' : ''}`}
        >
          <Clock className="w-4 h-4 mr-1" />
          {formatTime(timeLeft)}
        </Badge>
        
        {isWarning && (
          <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {isCritical ? 'Tempo crítico!' : 'Atenção ao tempo!'}
          </Badge>
        )}
      </div>
      
      <div className="relative">
        <Progress 
          value={percentage} 
          className="h-2"
        />
        <div 
          className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
