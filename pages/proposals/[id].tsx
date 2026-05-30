import RelatedSolarDesigns from '../../components/RelatedSolarDesigns';
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
    <div className="proposal-root">
      {/* Command Center Header */}
      <div className="proposal-header card">
        <div className="proposal-header-main">
          <div className="proposal-header-title-row">
            <svg width="32" height="32" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="19" cy="19" r="19" fill="#2b3990"/>
              <path d="M19 8L24.5 28H13.5L19 8Z" fill="#fbb040"/>
            </svg>
            <span className="proposal-header-title">Proposal Builder</span>
          </div>
        </div>
      </div>
      {toast && <div className="dashboard-toast" style={{position:'fixed',top:10,right:10,zIndex:1000}}>{toast}</div>}

      {/* Customer Summary Card */}
      <div className="proposal-customer-summary card">
        <div className="proposal-customer-title">Customer Summary</div>
        <div className="proposal-customer-fields">
          <div><b>Name:</b> {lead?.name || proposal.customer_name}</div>
          <div><b>Phone:</b> {lead?.phone}</div>
          <div><b>Email:</b> {lead?.email}</div>
          <div><b>Address:</b> {lead?.address || proposal.address}</div>
          <div><b>City:</b> {lead?.city}</div>
          <div><b>Utility Company:</b> {lead?.utility_company || proposal.utility_company}</div>
          <div><b>Monthly Bill:</b> {lead?.monthly_bill}</div>
          <div><b>Service Type:</b> {lead?.service_type}</div>
        </div>
      </div>

      {/* Solar Estimate Card */}
      <div className="proposal-estimate-card card">
        <div className="proposal-estimate-title">Solar Estimate</div>
        <div className="proposal-estimate-fields">
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
        <button className="proposal-action-btn" onClick={saveSolarEstimate}>Save Solar Estimate</button>
      </div>

      {/* Financing Scenario Cards */}
      <div className="proposal-scenarios-section card">
        <div className="proposal-scenarios-title-row">
          <span className="proposal-scenarios-title">Financing Scenarios</span>
          <button className="proposal-action-btn" onClick={addScenario}>+ Add Scenario</button>
        </div>
        {scenarios.map((sc, idx) => (
          <div key={idx} className={`financing-scenario-card${sc.is_recommended ? ' recommended' : ''}`}>
            <div className="scenario-fields">
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
            </div>
            <button className="proposal-action-btn" onClick={() => saveScenario(idx, sc)}>Save Scenario</button>
          </div>
        ))}
      </div>

      {/* Side-by-Side Comparison */}
      <div className="proposal-comparison-section card">
        <div className="proposal-comparison-title">Financing Comparison</div>
        <div className="comparison-cards">
          {scenarios.map((sc, idx) => (
            <div key={idx} className={`comparison-card${sc.is_recommended ? ' recommended' : ''}`}>
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
      </div>

      {/* AI Proposal Assistant Panel */}
      <div className="proposal-ai-panel card">

        <div className="proposal-ai-title-row">
          <span className="proposal-ai-title">MDB AI Proposal Summary</span>
          <button className="proposal-action-btn" onClick={handleAISummary}>Generate AI Summary</button>
        </div>
        <div className="proposal-ai-summary">{aiSummary}</div>
      </div>

      {/* Solar Design Actions */}
      <div className="proposal-solar-design-actions card">
        <div className="proposal-customer-title">Solar Designs</div>
        <div style={{marginBottom:8}}>Attach or create a solar design for this proposal.</div>
        <button className="proposal-action-btn" onClick={() => router.push(`/solar-design-studio?proposal_id=${id}`)}>Attach/Create Solar Design</button>
      </div>

      {/* Related Solar Designs */}
      <RelatedSolarDesigns proposalId={Array.isArray(id) ? id[0] : id} />

      {/* Proposal Actions Bar */}
      <div className="proposal-actions-bar card">
        <div className="proposal-actions-row">
          <button className="proposal-action-btn" onClick={saveProposal}>Save Proposal</button>
          <button className="proposal-action-btn" onClick={() => setToast('Coming soon.')}>Duplicate Proposal</button>
          <button className="proposal-action-btn" onClick={() => setToast('Coming soon.')}>Mark as Sent</button>
          <button className="proposal-action-btn" onClick={() => setToast('Coming soon.')}>Send via Email</button>
          <button className="proposal-action-btn" onClick={() => setToast('Coming soon.')}>Send via WhatsApp</button>
          <button className="proposal-action-btn" onClick={() => setToast('Coming soon.')}>Add to Customer Portal</button>
          <button className="proposal-action-btn" onClick={() => setToast('PDF export coming soon.')}>Export PDF</button>
        </div>
      </div>



      <style jsx>{`
        .proposal-root {
          max-width: 900px;
          margin: 0 auto;
          padding: 2.5rem 1rem 3rem 1rem;
        }
        .card {
          margin-bottom: 1.7rem;
        }
        .proposal-header {
          background: #fff;
          box-shadow: 0 2px 12px rgba(43,57,144,0.07);
          border-radius: 0 0 18px 18px;
          padding: 2.2rem 2.2rem 1.2rem 2.2rem;
          margin-bottom: 1.5rem;
        }
        .proposal-header-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .proposal-header-title-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .proposal-header-title {
          font-size: 1.45rem;
          font-weight: 700;
          color: #2b3990;
          letter-spacing: -0.5px;
        }
        .proposal-customer-summary {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .proposal-customer-title {
          font-weight: 700;
          color: #2b3990;
        }
        .proposal-customer-fields > div {
          margin-bottom: 0.2em;
        }
        .proposal-estimate-card {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .proposal-estimate-title {
          font-weight: 700;
          color: #2b3990;
        }
        .proposal-estimate-fields {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .proposal-estimate-fields input {
          min-width: 180px;
          flex: 1 1 180px;
        }
        .proposal-scenarios-section {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }
        .proposal-scenarios-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .proposal-scenarios-title {
          font-size: 1.13rem;
          font-weight: 700;
          color: #2b3990;
        }
        .financing-scenario-card {
          background: #f4f6fa;
          border-radius: 8px;
          padding: 1.1rem 1rem;
          box-shadow: 0 1px 4px rgba(43,57,144,0.04);
          margin-bottom: 1.1rem;
        }
        .financing-scenario-card.recommended {
          border-left: 6px solid #fbb040;
          background: #fffbe6;
        }
        .scenario-fields {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .proposal-comparison-section {
          margin-top: 2.2rem;
        }
        .proposal-comparison-title {
          font-size: 1.13rem;
          font-weight: 700;
          color: #2b3990;
          margin-bottom: 0.7rem;
        }
        .comparison-cards {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .comparison-card {
          min-width: 260px;
          max-width: 98vw;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 1px 4px rgba(43,57,144,0.04);
          padding: 16px;
          border: 2px solid #ccc;
        }
        .comparison-card.recommended {
          border: 2px solid #2b3990;
          background: #fbb040;
        }
        .proposal-ai-panel {
          margin-top: 2.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .proposal-ai-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .proposal-ai-title {
          font-size: 1.13rem;
          font-weight: 700;
          color: #2b3990;
        }
        .proposal-ai-summary {
          margin-top: 8px;
          background: #f4f6fa;
          padding: 16px;
          border-radius: 8px;
          word-break: break-word;
        }
        .proposal-actions-bar {
          margin-top: 2.2rem;
        }
        .proposal-actions-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
        }
        .proposal-action-btn {
          border-radius: 7px;
          font-weight: 600;
          font-size: 0.97rem;
          padding: 0.5em 1em;
          border: none;
          box-shadow: 0 1px 4px rgba(43,57,144,0.04);
          transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.13s;
        }
        .proposal-action-btn:active {
          background: #1a1d2e;
          color: #fff;
          transform: scale(0.97);
        }
        @media (max-width: 900px) {
          .proposal-root {
            padding: 1.2rem 0.2rem 2rem 0.2rem;
          }
          .card {
            padding: 1.1rem;
          }
          .proposal-estimate-fields input {
            min-width: 90vw;
            flex: 1 1 90vw;
          }
          .comparison-cards {
            flex-direction: column;
            gap: 12px;
          }
          .comparison-card {
            min-width: 90vw;
            max-width: 99vw;
            padding: 10px !important;
          }
          .proposal-actions-row {
            flex-direction: column;
            gap: 8px;
          }
        }
        @media (max-width: 600px) {
          .proposal-root {
            padding: 0.7rem 0.1rem 1.2rem 0.1rem;
          }
          .card {
            padding: 0.7rem 0.3rem;
          }
        }
      `}</style>
    </div>
  );
}
