export default function ErrorState({ icon = '⚠️', message = 'Something went wrong', error, onRetry }) {
  return (
    <div style={{textAlign:'center',padding:'3rem 1rem',color:'#b00020'}}>
      <div style={{fontSize:'2.5rem',marginBottom:12}}>{icon}</div>
      <div style={{fontSize:'1.2rem',marginBottom:16}}>{message}</div>
      {error && <div style={{marginBottom:16,fontSize:'1rem',color:'#b00020',opacity:0.8}}>{error}</div>}
      {onRetry && <button onClick={onRetry} style={{background:'#2b3990',color:'#fff',border:'none',padding:'0.5em 1.5em',borderRadius:4,fontWeight:600}}>Try Again</button>}
    </div>
  );
}
