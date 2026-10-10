export function Skeleton({ width = '100%', height = 20, borderRadius = 12, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: '#D3E3F0',
        animation: 'shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function CardSkeleton({ height = 130, borderRadius = 20, style = {} }) {
  return (
    <div
      style={{
        width: '100%',
        minHeight: height,
        borderRadius,
        background: '#fff',
        border: '2px solid #D3E3F0',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        animation: 'shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EBF3FC', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ width: '45%', height: 16, borderRadius: 8, background: '#EBF3FC' }} />
          <div style={{ width: '25%', height: 12, borderRadius: 6, background: '#EBF3FC' }} />
        </div>
      </div>
      <div style={{ width: '80%', height: 12, borderRadius: 6, background: '#EBF3FC', marginTop: 4 }} />
    </div>
  );
}
