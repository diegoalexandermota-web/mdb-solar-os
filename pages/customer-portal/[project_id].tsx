import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';

const TIMELINE = [
  'Lead Created',
  'Proposal Sent',
  'Contract Signed',
  'Documents Uploaded',
  'Site Survey',
  'Design',
  'Permitting',
  'Installation Scheduled',
  'Installed',
  'Inspection',
  'PTO',
  'Completed',
];

export default function CustomerPortal() {
  const router = useRouter();
  const { project_id } = router.query;
  const [project, setProject] = useState<any>(null);
  const [lead, setLead] = useState<any>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [solarEstimate, setSolarEstimate] = useState<any>({});
  const [documents, setDocuments] = useState<any[]>([]);
  const [aiAnswer, setAiAnswer] = useState('');
  const [toast, setToast] = useState<string|null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    if (project_id) fetchData();
    // eslint-disable-next-line
  }, [project_id]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const { data: proj, error: projErr } = await supabase.from('projects').select('*').eq('id', project_id).single();
      if (projErr) throw projErr;
      setProject(proj);
      if (proj?.lead_id) {
        const { data: l, error: lErr } = await supabase.from('leads').select('*').eq('id', proj.lead_id).single();
        if (lErr) throw lErr;
        setLead(l);
        const { data: prop, error: propErr } = await supabase.from('proposals').select('*').eq('lead_id', proj.lead_id).order('created_at', { ascending: false }).limit(1).single();
        if (propErr) throw propErr;
        setProposal(prop);
        if (prop?.solar_estimate_id) {
          const { data: est, error: estErr } = await supabase.from('solar_design_estimates').select('*').eq('id', prop.solar_estimate_id).single();
          if (estErr) throw estErr;
          setSolarEstimate(est || {});
        }
        const { data: scs, error: scsErr } = await supabase.from('financing_scenarios').select('*').eq('proposal_id', prop?.id);
        if (scsErr) throw scsErr;
        setScenarios(scs || []);
      }
      // TODO: fetch documents from Supabase Storage if configured
      setDocuments([]);
    } catch (err: any) {
      setError(err.message || 'Unable to load project');
    }
    setLoading(false);
  }

  function getCurrentStage() {
    if (!project) return 0;
    // Example: map pipeline_stage or status to timeline index
    const stage = project.status || 'Lead Created';
    return TIMELINE.indexOf(stage);
  }

  function handleUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) {
      setToast('Please select a file to upload');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setUploading(true);
    // Simulate upload
    setTimeout(() => {
      setUploading(false);
      setToast('Document upload coming soon.');
      setTimeout(() => setToast(null), 2000);
    }, 1000);
  }

  function handleAskAI() {
    setAiAnswer('MDB AI: This is a placeholder answer. I can explain your proposal, financing, next steps, and more.');
  }

  function handleNotify() {
    setToast('Notification system coming soon.');
  }

  if (loading) return <SkeletonLoader />;
  if (error) return <ErrorState message="Unable to load project." error={error} onRetry={fetchData} />;
  if (!project) return <EmptyState icon="🏠" message="Project not found." />;

  return (
    <div className="customer-portal-root">
      {/* Command Center Header */}
      <div className="customer-portal-header card">
        <div className="customer-portal-header-main">
          <div className="customer-portal-header-title-row">
            <svg width="32" height="32" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="19" cy="19" r="19" fill="#2b3990"/>
              <path d="M19 8L24.5 28H13.5L19 8Z" fill="#fbb040"/>
            </svg>
            <span className="customer-portal-header-title">Customer Portal</span>
          </div>
        </div>
      </div>
      {toast && <div className="dashboard-toast" style={{position:'fixed',top:10,right:10,zIndex:1000}}>{toast}</div>}
      {/* Customer Info */}
      <section className="customer-portal-section card">
        <div className="customer-portal-section-title">Customer Information</div>
        <div className="customer-portal-section-content">
          <div><b>Name:</b> {lead?.name}</div>
          <div><b>Address:</b> {project.address}</div>
          <div><b>Assigned Rep:</b> {project.assigned_rep || 'TBD'}</div>
          <div><b>Support:</b> <a href="tel:18001234567">Call MDB</a> | <a href="mailto:support@mdbsolar.com">Email MDB</a> | <a href="#" onClick={handleNotify}>WhatsApp MDB</a></div>
        </div>
      </section>
      {/* Project Status Timeline */}
      <section className="customer-portal-section card">
        <div className="customer-portal-section-title">Project Status</div>
        <div className="customer-portal-timeline">
          {TIMELINE.map((stage, idx) => (
            <div key={stage} className="customer-portal-timeline-row">
              <span className={`customer-portal-timeline-dot ${idx<getCurrentStage()?"complete":idx===getCurrentStage()?"current":"upcoming"}`}>{idx<getCurrentStage()?"✔":idx===getCurrentStage()?"●":"○"}</span>
              <span className={`customer-portal-timeline-label ${idx===getCurrentStage()?"current":""}`}>{stage}</span>
            </div>
          ))}
        </div>
      </section>
      {/* Proposal Section */}
      <section className="customer-portal-section card">
        <div className="customer-portal-section-title">Proposal</div>
        <div className="customer-portal-section-content">
          {proposal ? (
            <div className="customer-portal-proposal-card">
              <div><b>Status:</b> {proposal.status}</div>
              <div><b>Estimated Savings:</b> ${scenarios[0]?.estimated_25_year_savings || 'N/A'}</div>
              <div><b>Recommended Financing:</b> {scenarios.find((s:any)=>s.is_recommended)?.provider || 'N/A'}</div>
              <div><b>System Size:</b> {solarEstimate.system_size || 'N/A'} kW</div>
              <div><b>Panel Count:</b> {solarEstimate.panel_count || 'N/A'}</div>
            </div>
          ) : <EmptyState icon="📄" message="No proposal yet." />}
        </div>
      </section>
      {/* Documents Section */}
      <section className="customer-portal-section card">
        <div className="customer-portal-section-title">Documents</div>
        <div className="customer-portal-section-content">
          <input type="file" onChange={handleUpload} disabled={uploading} />
          {uploading && <div className="upload-spinner">Uploading...</div>}
          <ul className="customer-portal-doc-list">
            {documents.map((doc, idx) => <li key={idx}>{doc.name}</li>)}
          </ul>
          <div className="customer-portal-doc-upload-desc">Upload: Utility Bill, Driver License, HOA Docs, Signed Agreement</div>
        </div>
      </section>
      {/* Next Steps */}
      <section className="customer-portal-section card">
        <div className="customer-portal-section-title">Next Steps</div>
        <div className="customer-portal-section-content">Next step: upload utility bill and HOA approval.</div>
      </section>
      {/* Support Actions */}
      <section className="customer-portal-section card">
        <div className="customer-portal-section-title">Support</div>
        <div className="customer-portal-section-content customer-portal-support-actions">
          <button className="customer-portal-action-btn" onClick={()=>window.open('tel:18001234567')}>Call MDB</button>
          <button className="customer-portal-action-btn" onClick={()=>window.open('mailto:support@mdbsolar.com')}>Email MDB</button>
          <button className="customer-portal-action-btn" onClick={handleNotify}>WhatsApp MDB</button>
          <button className="customer-portal-action-btn" onClick={handleNotify}>Message Rep</button>
        </div>
      </section>
      {/* MDB AI Assistant */}
      <section className="customer-portal-section card">
        <div className="customer-portal-section-title">MDB AI Assistant</div>
        <div className="customer-portal-section-content">
          <button className="customer-portal-action-btn" onClick={handleAskAI}>Ask MDB AI</button>
          <div className="customer-portal-ai-answer">{aiAnswer}</div>
        </div>
      </section>
      <style jsx>{`
        .customer-portal-root {
          max-width: 600px;
          margin: 0 auto;
          padding: 2.5rem 1rem 3rem 1rem;
        }
        .card {
          background: #fff;
          box-shadow: 0 2px 12px rgba(43,57,144,0.07);
          border-radius: 18px;
          margin-bottom: 1.7rem;
          padding: 2.2rem 2.2rem 1.2rem 2.2rem;
        }
        .customer-portal-header-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .customer-portal-header-title-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .customer-portal-header-title {
          font-size: 1.45rem;
          font-weight: 700;
          color: #2b3990;
          letter-spacing: -0.5px;
        }
        .customer-portal-section {
          margin-bottom: 1.2rem;
        }
        .customer-portal-section-title {
          font-size: 1.13rem;
          font-weight: 700;
          color: #2b3990;
          margin-bottom: 0.5rem;
        }
        .customer-portal-section-content {
          font-size: 1.07rem;
          color: #222;
        }
        .customer-portal-timeline {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .customer-portal-timeline-row {
          display: flex;
          align-items: center;
        }
        .customer-portal-timeline-dot {
          width: 20px;
          display: inline-block;
          text-align: center;
          font-size: 1.2em;
        }
        .customer-portal-timeline-dot.complete {
          color: #2b3990;
        }
        .customer-portal-timeline-dot.current {
          color: #fbb040;
        }
        .customer-portal-timeline-dot.upcoming {
          color: #ccc;
        }
        .customer-portal-timeline-label.current {
          color: #fbb040;
        }
        .customer-portal-proposal-card {
          background: #f4f6fa;
          padding: 16px;
          border-radius: 8px;
        }
        .customer-portal-doc-list {
          margin: 0.7em 0 0.2em 0;
          padding: 0;
          list-style: none;
        }
        .customer-portal-doc-upload-desc {
          color: #888;
          font-size: 0.97rem;
        }
        .upload-spinner {
          color: #2b3990;
          margin-top: 0.5em;
          font-weight: 500;
        }
        .customer-portal-support-actions {
          display: flex;
          gap: 0.7rem;
          flex-wrap: wrap;
        }
        .customer-portal-action-btn {
          border-radius: 7px;
          font-weight: 600;
          font-size: 0.97rem;
          padding: 0.5em 1em;
          border: none;
          box-shadow: 0 1px 4px rgba(43,57,144,0.04);
          transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.13s;
          margin-bottom: 0.3em;
        }
        .customer-portal-action-btn:active {
          background: #1a1d2e;
          color: #fff;
          transform: scale(0.97);
        }
        .customer-portal-ai-answer {
          margin-top: 8px;
          background: #f4f6fa;
          padding: 16px;
          border-radius: 8px;
        }
        @media (max-width: 700px) {
          .customer-portal-root {
            padding: 1.2rem 0.2rem 2rem 0.2rem;
          }
          .card {
            padding: 1.1rem;
          }
        }
        @media (max-width: 500px) {
          .customer-portal-root {
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
