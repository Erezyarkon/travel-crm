import React from 'react'

// A single shimmering bar. Use width/height to shape it.
export function Skeleton({ width = '100%', height = 14, radius = 6, style }: { width?: number | string; height?: number | string; radius?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width, height, borderRadius: radius,
        background: 'linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%)',
        backgroundSize: '400% 100%',
        animation: 'skeletonShimmer 1.4s ease infinite',
        ...style,
      }}
    />
  )
}

// A list of row-shaped skeletons, for table/list pages.
export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '0.5px solid #f5f5f5' }}>
          <Skeleton width={38} height={38} radius={19} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <Skeleton width={`${40 + (i % 3) * 12}%`} height={13} />
            <Skeleton width={`${24 + (i % 4) * 8}%`} height={10} />
          </div>
          <Skeleton width={60} height={22} radius={20} />
        </div>
      ))}
      <style>{`
        @keyframes skeletonShimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }
      `}</style>
    </div>
  )
}
