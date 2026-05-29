type EmptyStateProps = {
  icon?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: any;
};

export default function EmptyState({ icon = '📄', title, message = 'No data found', action, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div style={{textAlign:'center',padding:'3rem 1rem',color:'#888'}}>
      {icon && <div style={{fontSize:'2.5rem',marginBottom:12}}>{icon}</div>}
      {title && <div style={{fontSize:'1.2rem',fontWeight:600,marginBottom:8}}>{title}</div>}
      {message && <div style={{fontSize:'1.2rem',marginBottom:16}}>{message}</div>}
      {actionLabel && onAction && (
        <button onClick={onAction} style={{background:'#2b3990',color:'#fff',border:'none',padding:'0.5em 1.5em',borderRadius:4,fontWeight:600}}>{actionLabel}</button>
      )}
      {action}
    </div>
  );
}
