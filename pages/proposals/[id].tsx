import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';

const PROVIDERS = [
  { name: 'GoodLeap', types: ['Loan', 'Lease / PPA'] },
  { name: 'EnFin', types: ['Loan', 'Lease / PPA'] },
  { name: 'Dividend', types: ['Loan'] },
  { name: 'Concert', types: ['Loan'] },
  { name: 'LightReach', types: ['Lease / PPA'] },
  { name: 'Sunrun', types: ['Lease / PPA'] },
  { name: 'Skylight', types: ['Loan', 'Lease / PPA'] },
  { name: 'Climate First Bank', types: ['Loan'] },
  { name: 'Home Run Financing', types: ['PACE'] },
  { name: 'Renew Financial', types: ['PACE'] },
  { name: 'Other', types: ['Loan', 'Lease / PPA', 'PACE', 'Cash'] },
];

function getProviderTypes(provider) {
  const found = PROVIDERS.find(p => p.name === provider);
  return found ? found.types : [];
}

export default function ProposalBuilder() {
  const router = useRouter();
  const { id } = router.query;
  const [proposal, setProposal] = useState<any>(null);
  const [lead, setLead] = useState<any>(null);
  const [solarEstimate, setSolarEstimate] = useState<any>({});
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [toast, setToast] = useState<string|null>(null);
  const [aiSummary, setAiSummary] = useState('');

  useEffect(() => {
    if (id) fetchProposal();
    // eslint-disable-next-line
  }, [id]);

  async function fetchProposal() {
    const { data: prop } = await supabase.from('proposals').select('*').eq('id', id).single();
    setProposal(prop);
    if (prop?.lead_id) {
      const { data: l } = await supabase.from('leads').select('*').eq('id', prop.lead_id).single();
      setLead(l);
    }
    // Fetch solar estimate
    if (prop?.solar_estimate_id) {
      const { data: est } = await supabase.from('solar_design_estimates').select('*').eq('id', prop.solar_estimate_id).single();
      setSolarEstimate(est || {});
    }
    // Fetch financing scenarios
    const { data: scs } = await supabase.from('financing_scenarios').select('*').eq('proposal_id', id);
    setScenarios(scs || []);
    setAiSummary(prop?.ai_summary || '');
  }

  async function saveProposal() {
    await supabase.from('proposals').update({ ...proposal, solar_estimate_id: solarEstimate.id, ai_summary: aiSummary }).eq('id', id);
    setToast('Proposal saved');
  }

  async function saveSolarEstimate() {
    let estId = solarEstimate.id;
    if (estId) {
      await supabase.from('solar_design_estimates').update(solarEstimate).eq('id', estId);
    } else {
      const { data, error } = await supabase.from('solar_design_estimates').insert([solarEstimate]).select();
      if (data && data[0]) {
        estId = data[0].id;
        setSolarEstimate(data[0]);
        setProposal((p: any) => ({ ...p, solar_estimate_id: estId }));
      }
    }
    setToast('Solar estimate saved');
  }

  async function saveScenario(idx: number, scenario: any) {
    let sc = scenarios[idx];
    if (sc && sc.id) {
      await supabase.from('financing_scenarios').update(scenario).eq('id', sc.id);
    } else {
      const { data } = await supabase.from('financing_scenarios').insert([{ ...scenario, proposal_id: id }]).select();
      if (data && data[0]) {
        setScenarios((prev: any[]) => prev.map((s, i) => i === idx ? data[0] : s));
      }
    }
    setToast('Scenario saved');
  }

  function addScenario() {
    setScenarios([...scenarios, { provider: '', program_type: '', is_recommended: false }]);
  }

  function handleScenarioChange(idx: number, field: string, value: any) {
    setScenarios(scenarios.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  function handleRecommend(idx: number) {
    setScenarios(scenarios.map((s, i) => ({ ...s, is_recommended: i === idx })));
  }

  function handleAISummary() {
    setAiSummary('MDB AI Proposal Summary: This is a professional placeholder summary. Your proposal is optimized for customer savings, clarity, and conversion. Financing options are compared for best fit.');
  }

  if (!proposal) return <div>Loading...</div>;

  return (
    <div className="proposal-root" style={{maxWidth:900,margin:'0 auto',padding:24}}>
      <h1>Proposal Builder</h1>
      {toast && <div style={{position:'fixed',top:10,right:10,background:'#2b3990',color:'#fff',padding:'0.5rem 1rem',borderRadius:4}}>{toast}</div>}
      {/* Customer Information */}
      <section style={{marginBottom:32}}>
        <h2>Customer Information</h2>
        <div>Name: {lead?.name || proposal.customer_name}</div>
        <div>Phone: {lead?.phone}</div>
        <div>Email: {lead?.email}</div>
        <div>Address: {lead?.address || proposal.address}</div>
        <div>City: {lead?.city}</div>
        <div>Utility Company: {lead?.utility_company || proposal.utility_company}</div>
        <div>Monthly Bill: {lead?.monthly_bill}</div>
        <div>Service Type: {lead?.service_type}</div>
      </section>
      {/* Solar Estimate */}
      <section style={{marginBottom:32}}>
        <h2>Solar Estimate</h2>
        <div className="proposal-estimate-fields" style={{display:'flex',flexWrap:'wrap',gap:12}}>
          <input placeholder="Annual Usage (kWh)" value={solarEstimate.annual_usage || ''} onChange={e => setSolarEstimate({ ...solarEstimate, annual_usage: e.target.value })} />
          <input placeholder="Monthly Usage (kWh)" value={solarEstimate.monthly_usage || ''} onChange={e => setSolarEstimate({ ...solarEstimate, monthly_usage: e.target.value })} />
          <input placeholder="System Size (kW)" value={solarEstimate.system_size || ''} onChange={e => setSolarEstimate({ ...solarEstimate, system_size: e.target.value })} />
          <input placeholder="Panel Count" value={solarEstimate.panel_count || ''} onChange={e => setSolarEstimate({ ...solarEstimate, panel_count: e.target.value })} />
          <input placeholder="Panel Wattage" value={solarEstimate.panel_wattage || ''} onChange={e => setSolarEstimate({ ...solarEstimate, panel_wattage: e.target.value })} />
          <input placeholder="Annual Production (kWh)" value={solarEstimate.annual_production || ''} onChange={e => setSolarEstimate({ ...solarEstimate, annual_production: e.target.value })} />
          <input placeholder="Monthly Production (kWh)" value={solarEstimate.monthly_production || ''} onChange={e => setSolarEstimate({ ...solarEstimate, monthly_production: e.target.value })} />
          <input placeholder="Offset %" value={solarEstimate.offset || ''} onChange={e => setSolarEstimate({ ...solarEstimate, offset: e.target.value })} />
          <input placeholder="Roof Usage %" value={solarEstimate.roof_usage || ''} onChange={e => setSolarEstimate({ ...solarEstimate, roof_usage: e.target.value })} />
          <input placeholder="TSRF / Sun Score" value={solarEstimate.sun_score || ''} onChange={e => setSolarEstimate({ ...solarEstimate, sun_score: e.target.value })} />
        </div>
        <button className="touch-target" onClick={saveSolarEstimate}>Save Solar Estimate</button>
      </section>
      {/* Financing Scenarios */}
      <section style={{marginBottom:32}}>
        <h2>Financing Scenarios</h2>
        {scenarios.map((sc, idx) => (
          <div key={idx} className="financing-scenario-card" style={{border:'1px solid #ccc',padding:16,marginBottom:16,borderRadius:8}}>
            <label>Provider:
              <select value={sc.provider} onChange={e => handleScenarioChange(idx, 'provider', e.target.value)}>
                <option value="">Select</option>
                {PROVIDERS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </label>
            <label>Program Type:
              <select value={sc.program_type} onChange={e => handleScenarioChange(idx, 'program_type', e.target.value)}>
                <option value="">Select</option>
                {getProviderTypes(sc.provider).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <input placeholder="Monthly Payment" value={sc.monthly_payment || ''} onChange={e => handleScenarioChange(idx, 'monthly_payment', e.target.value)} />
            <input placeholder="Down Payment" value={sc.down_payment || ''} onChange={e => handleScenarioChange(idx, 'down_payment', e.target.value)} />
            <input placeholder="Term (years)" value={sc.term_years || ''} onChange={e => handleScenarioChange(idx, 'term_years', e.target.value)} />
            <input placeholder="APR" value={sc.APR || ''} onChange={e => handleScenarioChange(idx, 'APR', e.target.value)} />
            <input placeholder="Dealer Fee" value={sc.dealer_fee || ''} onChange={e => handleScenarioChange(idx, 'dealer_fee', e.target.value)} />
            <input placeholder="Escalator" value={sc.escalator || ''} onChange={e => handleScenarioChange(idx, 'escalator', e.target.value)} />
            <input placeholder="Ownership Type" value={sc.ownership_type || ''} onChange={e => handleScenarioChange(idx, 'ownership_type', e.target.value)} />
            <label>Maintenance Included:
              <select value={sc.maintenance_included || ''} onChange={e => handleScenarioChange(idx, 'maintenance_included', e.target.value)}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>
            <label>Tax Credit Eligible:
              <select value={sc.tax_credit_eligible || ''} onChange={e => handleScenarioChange(idx, 'tax_credit_eligible', e.target.value)}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>
            <input placeholder="Est. Monthly Savings" value={sc.estimated_monthly_savings || ''} onChange={e => handleScenarioChange(idx, 'estimated_monthly_savings', e.target.value)} />
            <input placeholder="Est. 25-Year Cost" value={sc.estimated_25_year_cost || ''} onChange={e => handleScenarioChange(idx, 'estimated_25_year_cost', e.target.value)} />
            <input placeholder="Est. 25-Year Savings" value={sc.estimated_25_year_savings || ''} onChange={e => handleScenarioChange(idx, 'estimated_25_year_savings', e.target.value)} />
            <label>Recommended:
              <input type="checkbox" checked={!!sc.is_recommended} onChange={() => handleRecommend(idx)} />
            </label>
            <button className="touch-target" onClick={() => saveScenario(idx, sc)}>Save Scenario</button>
          </div>
        ))}
        <button className="touch-target" onClick={addScenario}>Add Financing Scenario</button>
      </section>
      {/* Comparison Cards */}
      <section style={{marginBottom:32}}>
        <h2>Financing Comparison</h2>
        <div className="comparison-cards" style={{display:'flex',gap:16,flexWrap:'wrap'}}>
          {scenarios.map((sc, idx) => (
            <div key={idx} className="comparison-card" style={{border:'2px solid '+(sc.is_recommended?'#2b3990':'#ccc'),padding:16,borderRadius:8,minWidth:260,background:sc.is_recommended?'#fbb040':'#fff'}}>
              <b>{sc.provider}</b> <span>({sc.program_type})</span><br/>
              <div>Monthly Payment: ${sc.monthly_payment}</div>
              <div>Down Payment: ${sc.down_payment}</div>
              <div>Term: {sc.term_years} yrs</div>
              <div>APR: {sc.APR}%</div>
              <div>Escalator: {sc.escalator}%</div>
              <div>Ownership: {sc.ownership_type}</div>
              <div>Maintenance: {sc.maintenance_included}</div>
              <div>Tax Credit: {sc.tax_credit_eligible}</div>
              <div>Est. Savings: ${sc.estimated_monthly_savings}</div>
              <div>25-Year Cost: ${sc.estimated_25_year_cost}</div>
              <div>25-Year Savings: ${sc.estimated_25_year_savings}</div>
              <div>Recommended: {sc.is_recommended ? 'Yes' : 'No'}</div>
            </div>
          ))}
        </div>
      </section>
      {/* MDB AI Proposal Summary */}
      <section style={{marginBottom:32}}>
        <h2>MDB AI Proposal Summary</h2>
        <button className="touch-target" onClick={handleAISummary}>Generate AI Summary</button>
        <div style={{marginTop:8,background:'#f4f6fa',padding:16,borderRadius:8,wordBreak:'break-word'}}>{aiSummary}</div>
      </section>
      {/* Proposal Actions */}
      <section style={{marginBottom:32}}>
        <h2>Proposal Actions</h2>
        <div className="proposal-actions-row" style={{display:'flex',flexWrap:'wrap',gap:8}}>
          <button className="touch-target" onClick={saveProposal}>Save Proposal</button>
          <button className="touch-target" onClick={() => setToast('Coming soon.')}>Duplicate Proposal</button>
          <button className="touch-target" onClick={() => setToast('Coming soon.')}>Mark as Sent</button>
          <button className="touch-target" onClick={() => setToast('Coming soon.')}>Send via Email</button>
          <button className="touch-target" onClick={() => setToast('Coming soon.')}>Send via WhatsApp</button>
          <button className="touch-target" onClick={() => setToast('Coming soon.')}>Add to Customer Portal</button>
          <button className="touch-target" onClick={() => setToast('PDF export coming soon.')}>Export PDF</button>
        </div>
      </section>
      <style jsx>{`
        .proposal-estimate-fields input {
          min-width: 180px;
          flex: 1 1 180px;
        }
        .financing-scenario-card {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .comparison-cards {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .comparison-card {
          min-width: 260px;
          max-width: 98vw;
        }
        .proposal-actions-row button {
          min-width: 44px;
          min-height: 44px;
          font-size: 1rem;
        }
        @media (max-width: 900px) {
          .proposal-root {
            padding: 8px !important;
          }
          .comparison-cards {
            flex-direction: column;
            gap: 12px;
          }
          .comparison-card {
            min-width: 90vw;
            max-width: 99vw;
          }
          .proposal-actions-row {
            flex-direction: column;
            gap: 8px;
          }
        }
        @media (max-width: 600px) {
          .proposal-root {
            padding: 2vw !important;
          }
          .proposal-estimate-fields input {
            min-width: 90vw;
            flex: 1 1 90vw;
          }
          .comparison-card {
            min-width: 96vw;
            max-width: 99vw;
            padding: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
