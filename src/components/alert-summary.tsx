'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { summarizeAlerts } from '@/ai/flows/summarize-alerts';
import type { FleetEvent } from '@/lib/types';
import { Bot, Sparkles } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface AlertSummaryProps {
  alerts: FleetEvent[];
}

export function AlertSummary({ alerts }: AlertSummaryProps) {
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSummarize = () => {
    startTransition(async () => {
      if (alerts.length === 0) {
        setSummary('No alerts to summarize.');
        return;
      }
      const result = await summarizeAlerts({ events: JSON.stringify(alerts) });
      setSummary(result.summary);
    });
  };

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if(open) {
      setSummary(''); // Reset summary when opening
      handleSummarize();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Summary
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI-Powered Alert Summary
          </DialogTitle>
          <DialogDescription>
            An aggregated summary of all alerts from the current simulation time.
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm prose-p:text-foreground prose-strong:text-foreground dark:prose-invert max-w-none">
          {isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            summary.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
