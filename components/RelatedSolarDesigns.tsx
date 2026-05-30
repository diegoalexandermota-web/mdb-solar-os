import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

interface RelatedSolarDesignsProps {
  leadId?: string;
  proposalId?: string;
}

export default function RelatedSolarDesigns({ leadId, proposalId }: RelatedSolarDesignsProps) {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDesigns() {
      setLoading(true);
      let query = supabase.from('solar_designs').select('id, project_name, panel_count, system_size_kw, updated_at');
      if (leadId) query = query.eq('lead_id', leadId);
      if (proposalId) query = query.eq('proposal_id', proposalId);
      query = query.order('updated_at', { ascending: false });
      const { data, error } = await query;
      setDesigns(error ? [] : data || []);
      setLoading(false);
    }
    if (leadId || proposalId) fetchDesigns();
  }, [leadId, proposalId]);

  if (!leadId && !proposalId) return null;
  return (
    <div className="lead-related-designs card">
      <div className="lead-proposal-title">Related Solar Designs</div>
      {loading ? <div>Loading...</div> : designs.length === 0 ? <div>No designs found.</div> : (
        <table style={{width:'100%',fontSize:'0.97rem',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#f6f8fa'}}>
              <th style={{textAlign:'left',padding:'6px 8px'}}>Project</th>
              <th style={{textAlign:'right',padding:'6px 8px'}}>Panels</th>
              <th style={{textAlign:'right',padding:'6px 8px'}}>Size (kW)</th>
              <th style={{textAlign:'right',padding:'6px 8px'}}>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {designs.map(design => (
              <tr key={design.id} style={{borderBottom:'1px solid #eee'}}>
                <td style={{padding:'6px 8px'}}>{design.project_name}</td>
                <td style={{padding:'6px 8px',textAlign:'right'}}>{design.panel_count}</td>
                <td style={{padding:'6px 8px',textAlign:'right'}}>{design.system_size_kw}</td>
                <td style={{padding:'6px 8px',textAlign:'right'}}>{design.updated_at ? new Date(design.updated_at).toLocaleString() : '-'}</td>
                <td style={{padding:'6px 8px',textAlign:'right'}}>
                  <button className="lead-action-btn" style={{minWidth:70}} onClick={() => window.location.href = `/solar-design-studio?${leadId ? `lead_id=${leadId}` : `proposal_id=${proposalId}`}`}>Open Design</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
