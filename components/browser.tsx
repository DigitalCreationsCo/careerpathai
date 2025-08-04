'use client';

export function Browser(props:any) {
  return (
    <div className="w-full rounded-lg shadow-lg overflow-hidden bg-secondary text-foreground font-mono text-sm relative">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
          {props.children}
      </div>
    </div>
  );
}
