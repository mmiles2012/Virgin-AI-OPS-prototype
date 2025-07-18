interface AviationGaugeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  color: string;
  dangerZone?: { min: number; max: number };
}

export default function AviationGauge({ 
  label, 
  value, 
  min, 
  max, 
  unit, 
  color,
  dangerZone 
}: AviationGaugeProps) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const isDangerous = dangerZone && value >= dangerZone.min && value <= dangerZone.max;

  return (
    <div className="bg-card rounded-lg p-3 border border-border text-center">
      <div className="text-blue-300 text-xs font-medium mb-1">{label}</div>
      
      {/* Circular gauge */}
      <div className="relative w-16 h-16 mx-auto mb-2">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
          {/* Background circle */}
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="#374151"
            strokeWidth="4"
          />
          
          {/* Value arc */}
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={isDangerous ? "#ef4444" : color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 175.93} 175.93`}
            opacity="0.8"
          />
        </svg>
        
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-mono ${isDangerous ? 'text-red-400' : 'text-white'}`}>
            {value.toFixed(0)}
          </span>
        </div>
      </div>
      
      <div className="text-blue-200 text-xs">{unit}</div>
      
      {/* Range indicator */}
      <div className="flex justify-between text-xs text-blue-300 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      
      {isDangerous && (
        <div className="text-red-400 text-xs mt-1 font-bold">CAUTION</div>
      )}
    </div>
  );
}
