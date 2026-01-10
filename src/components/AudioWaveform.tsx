import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioWaveformProps {
  isActive: boolean;
  className?: string;
  barCount?: number;
}

const AudioWaveform = ({ isActive, className, barCount = 5 }: AudioWaveformProps) => {
  const [heights, setHeights] = useState<number[]>(Array(barCount).fill(20));

  useEffect(() => {
    if (!isActive) {
      setHeights(Array(barCount).fill(20));
      return;
    }

    const interval = setInterval(() => {
      setHeights(prev => 
        prev.map(() => Math.random() * 80 + 20) // Random height between 20% and 100%
      );
    }, 150);

    return () => clearInterval(interval);
  }, [isActive, barCount]);

  return (
    <div className={cn('flex items-center justify-center gap-0.5 h-6', className)}>
      {heights.map((height, index) => (
        <div
          key={index}
          className={cn(
            'w-1 rounded-full transition-all duration-150 ease-in-out',
            isActive ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
          style={{
            height: `${height}%`,
            animationDelay: `${index * 50}ms`,
          }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;
