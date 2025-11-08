'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pause, Play, FastForward } from 'lucide-react';

interface SimulationControlsProps {
  isRunning: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
}

export function SimulationControls({ isRunning, speed, play, pause, setSpeed }: SimulationControlsProps) {
  const speeds = [1, 5, 10, 50, 100];

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={isRunning ? pause : play}>
        {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        <span className="sr-only">{isRunning ? 'Pause' : 'Play'}</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-24">
            <FastForward className="mr-2 h-4 w-4" /> {speed}x
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {speeds.map((s) => (
            <DropdownMenuItem key={s} onSelect={() => setSpeed(s)}>
              {s}x Speed
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
