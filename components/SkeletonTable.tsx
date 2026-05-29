export default function SkeletonTable({ rows = 5, cols = 3, style = {} }) {
  return (
    <div style={{width:'100%',...style}}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{display:'flex',gap:16,marginBottom:12}}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} style={{flex:1,height:24,borderRadius:6,background:'linear-gradient(90deg, #f4f6fa 25%, #e0e3ed 37%, #f4f6fa 63%)',backgroundSize:'400% 100%',animation:'skeleton-shimmer 1.2s ease-in-out infinite'}} />
          ))}
        </div>
      ))}
      <style jsx>{`
        @keyframes skeleton-shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
    </div>
  );
}
