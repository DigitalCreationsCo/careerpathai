'use client';

import { cn } from "@/lib/utils";

export function Browser({ className, ...props }: any) {
  return (
    <div className={cn(`w-full rounded-lg shadow-lg overflow-hidden bg-secondary text-foreground font-mono text-sm relative p-1`, className)}>
      <div className="flex justify-between items-center p-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>
      <div className="bg-gradient-card rounded-b-lg p-8">
        {props.children}
      </div>
    </div>
  );
}
