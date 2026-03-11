import { Car as CarIcon } from 'lucide-react';

interface TaxDiskProps {
  shortcode: string | null;
  registration?: string | null;
  vin?: string | null;
}

export function TaxDisk({ shortcode, registration, vin }: TaxDiskProps) {
  // Get last 4 chars of registration or VIN if available
  const displayReg = registration 
    ? registration.slice(-4).toUpperCase() 
    : vin 
      ? vin.slice(-4).toUpperCase() 
      : null;

  if (!shortcode) return null;

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      {/* Tax disk container - circular badge style */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 border-4 border-emerald-400 shadow-lg flex flex-col items-center justify-center overflow-hidden">
        {/* VSP branding at top */}
        <div className="absolute top-1 text-[8px] font-bold text-emerald-200 tracking-wider">
          VSP
        </div>
        
        {/* Main shortcode - large and bold */}
        <span className="text-2xl font-black text-white tracking-tight drop-shadow-md">
          {shortcode}
        </span>
        
        {/* Registration/VIN last 4 at bottom */}
        {displayReg && (
          <span className="text-xs font-bold text-emerald-100 mt-0.5 tracking-widest">
            {displayReg}
          </span>
        )}

        {/* Decorative inner ring */}
        <div className="absolute inset-1.5 rounded-full border border-emerald-500/30 pointer-events-none" />
      </div>
      
      {/* Subtle shadow/depth effect */}
      <div className="absolute inset-0 rounded-full bg-black/20 translate-y-1 -z-10" />
    </div>
  );
}