import { Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 text-primary"
      {...props}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );

export const VehicleIcon = ({ status, className }: { status: string; className?: string }) => {
    const colorClass =
      status === 'Completed'
        ? 'text-success'
        : status === 'Cancelled' || status === 'Device Offline'
        ? 'text-destructive'
        : status.includes('Alert')
        ? 'text-yellow-500' // A specific color for alerts can be an exception if needed for visibility
        : 'text-primary';
  
    const animationClass = status === 'On Route' ? 'animate-pulse' : '';
  
    return <Truck className={cn('h-6 w-6 drop-shadow-lg', colorClass, animationClass, className)} style={{ filter: 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.5))'}} />;
  };
