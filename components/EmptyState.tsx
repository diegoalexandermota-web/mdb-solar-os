export default function EmptyState({ icon = '📄', message = 'No data found', action, actionLabel, onAction }) {
  return (
    <div style={{textAlign:'center',padding:'3rem 1rem',color:'#888'}}>
      <div style={{fontSize:'2.5rem',marginBottom:12}}>{icon}</div>
      <div style={{fontSize:'1.2rem',marginBottom:16}}>{message}</div>
      {action && <button onClick={onAction} style={{background:'#2b3990',color:'#fff',border:'none',padding:'0.5em 1.5em',borderRadius:4,fontWeight:600}}>{actionLabel}</button>}
    </div>
  );
}
