import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';

export default function Pipeline() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  // Example pipeline data for mobile audit
  const [data, setData] = useState<any[]>([
    { stage: 'New Lead', leads: [
      { id: 1, name: 'Jane Doe', phone: '+15555550123', email: 'jane@example.com', actions: ['call','sms','whatsapp','open'] },
      { id: 2, name: 'John Smith', phone: '+15555550124', email: 'john@example.com', actions: ['call','sms','open'] },
    ] },
    { stage: 'Proposal Sent', leads: [
      { id: 3, name: 'Alice Solar', phone: '+15555550125', email: 'alice@example.com', actions: ['call','sms','whatsapp','open'] },
    ] },
    { stage: 'Installed', leads: [] },
  ]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const STAGES = data.map(col => col.stage);

  return (
    <div style={{overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:16}}>
      <h1 style={{position:'sticky',top:0,zIndex:10,background:'#f4f6fa',padding:'1rem 0 0.5rem 0',margin:0}}>Pipeline</h1>
      {loading ? (
        <SkeletonCard count={3} />
      ) : error ? (
        <EmptyState icon="⚠️" message="Unable to load pipeline." />
      ) : data.length === 0 ? (
        <EmptyState icon="📈" message="No pipeline data yet. Create your first lead to begin." />
      ) : (
        <div className="pipeline-board" style={{display:'flex',gap:16,minWidth:STAGES.length*260,maxWidth:'100vw',overflowX:'auto'}}>
          {data.map((col, idx) => (
            <div key={col.stage} className="pipeline-column" style={{flex:'0 0 260px',background:'#fff',borderRadius:12,padding:8,boxShadow:'0 2px 8px rgba(43,57,144,0.06)',minHeight:320,display:'flex',flexDirection:'column'}}>
              <div className="pipeline-stage-header" style={{position:'sticky',top:48,zIndex:2,background:'#fff',padding:'0.5rem 0',fontWeight:700,color:'#2b3990',fontSize:'1.1rem',borderBottom:'1px solid #eee'}}>{col.stage}</div>
              <div className="card-stack" style={{marginTop:8,display:'flex',flexDirection:'column',gap:12}}>
                {col.leads.length === 0 ? (
                  <div style={{color:'#aaa',fontSize:'0.98rem',padding:'1.5rem 0',textAlign:'center'}}>No leads</div>
                ) : col.leads.map(lead => (
                  <div key={lead.id} className="pipeline-card" style={{background:'#f4f6fa',borderRadius:8,padding:'1rem',boxShadow:'0 1px 4px rgba(43,57,144,0.04)',display:'flex',flexDirection:'column',gap:8}}>
                    <div style={{fontWeight:600,fontSize:'1.08rem',marginBottom:2}}>{lead.name}</div>
                    <div style={{fontSize:'0.97rem',color:'#444'}}>{lead.email}</div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:4}}>
                      {lead.actions.includes('call') && <button className="touch-target" style={{background:'#2b3990',color:'#fff',border:'none',borderRadius:6,padding:'0.5em 1em',fontWeight:600}} onClick={()=>window.open(`tel:${lead.phone}`)}>Call</button>}
                      {lead.actions.includes('sms') && <button className="touch-target" style={{background:'#2b3990',color:'#fff',border:'none',borderRadius:6,padding:'0.5em 1em',fontWeight:600}} onClick={()=>window.open(`sms:${lead.phone}`)}>SMS</button>}
                      {lead.actions.includes('whatsapp') && <button className="touch-target" style={{background:'#25d366',color:'#fff',border:'none',borderRadius:6,padding:'0.5em 1em',fontWeight:600}} onClick={()=>window.open(`https://wa.me/${lead.phone.replace(/\D/g,'')}`)}>WhatsApp</button>}
                      {lead.actions.includes('open') && <button className="touch-target" style={{background:'#fbb040',color:'#2b3990',border:'none',borderRadius:6,padding:'0.5em 1em',fontWeight:600}} onClick={()=>window.open(`/leads/${lead.id}`)}>Open Lead</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        .pipeline-board {
          scrollbar-width: thin;
        }
        @media (max-width: 900px) {
          .pipeline-board {
            min-width: 600px;
            max-width: 100vw;
            overflow-x: auto;
          }
          .pipeline-column {
            min-width: 90vw;
            max-width: 98vw;
          }
        }
        @media (max-width: 600px) {
          .pipeline-board {
            min-width: 400px;
          }
          .pipeline-column {
            min-width: 96vw;
            max-width: 99vw;
            padding: 4px !important;
          }
          .pipeline-card {
            padding: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}
