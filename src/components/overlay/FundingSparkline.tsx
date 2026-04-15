import { FundingPoint } from '@/hooks/useFundingHistory';

interface FundingSparklineProps {
  data: FundingPoint[];
  width?: number;
  height?: number;
}

export function FundingSparkline({ data, width = 80, height = 24 }: FundingSparklineProps) {
  if (data.length < 2) return null;

  const rates = data.map(d => d.rate);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const range = max - min || 0.0001;

  const points = rates.map((r, i) => {
    const x = (i / (rates.length - 1)) * width;
    const y = height - ((r - min) / range) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Color based on latest rate
  const latest = rates[rates.length - 1];
  const color = latest > 0 ? 'hsl(160, 100%, 45%)' : latest < 0 ? 'hsl(0, 90%, 55%)' : 'hsl(210, 40%, 70%)';

  return (
    <svg width={width} height={height} className="opacity-70">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dot on latest value */}
      <circle
        cx={width}
        cy={height - ((latest - min) / range) * (height - 2) - 1}
        r="2"
        fill={color}
      />
    </svg>
  );
}
