interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export default function Skeleton({ className = '', width, height, rounded = 'md' }: SkeletonProps) {
  const radiusMap = {
    sm: 'rounded-[var(--radius-sm)]',
    md: 'rounded-[var(--radius-md)]',
    lg: 'rounded-[var(--radius-lg)]',
    full: 'rounded-full',
  };

  return (
    <div
      className={`skeleton ${radiusMap[rounded]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonLine({ width = '100%', className = '' }: { width?: string | number; className?: string }) {
  return <Skeleton width={width} height={14} className={className} />;
}

export function SkeletonEmailCard({ index = 0 }: { index?: number }) {
  return (
    <div
      className="p-4 border-b border-[var(--border-primary)] space-y-2.5 fade-in-up"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton width={8} height={8} rounded="full" />
          <Skeleton width={140} height={14} />
        </div>
        <Skeleton width={60} height={12} />
      </div>
      <Skeleton width="80%" height={14} />
      <Skeleton width="55%" height={12} />
      <Skeleton width={64} height={20} rounded="full" />
    </div>
  );
}

export function SkeletonMetricCard() {
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-lg)] p-5 space-y-3">
      <Skeleton width={80} height={12} />
      <Skeleton width={60} height={28} />
      <Skeleton width="40%" height={10} />
    </div>
  );
}
