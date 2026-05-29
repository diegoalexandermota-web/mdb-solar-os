export default function SkeletonMetric({ width = 80, height = 40, style = {}, count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'linear-gradient(90deg, #e0e3ed 25%, #fbb040 37%, #e0e3ed 63%)',
            backgroundSize: '400% 100%',
            animation: 'skeleton-shimmer 1.2s ease-in-out infinite',
            borderRadius: 8,
            height,
            width,
            marginBottom: 12,
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
