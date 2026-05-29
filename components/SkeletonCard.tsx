export default function SkeletonCard({ height = 120, width = '100%', style = {}, count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'linear-gradient(90deg, #f4f6fa 25%, #e0e3ed 37%, #f4f6fa 63%)',
            backgroundSize: '400% 100%',
            animation: 'skeleton-shimmer 1.2s ease-in-out infinite',
            borderRadius: 12,
            height,
            width,
            marginBottom: 24,
            ...style,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes skeleton-shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
    </>
  );
}
