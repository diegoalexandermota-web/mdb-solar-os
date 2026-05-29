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
    <div style={{maxWidth:600,margin:'0 auto',padding:24}}>
      <h1>Customer Portal</h1>
      {toast && <div style={{position:'fixed',top:10,right:10,background:'#2b3990',color:'#fff',padding:'0.5rem 1rem',borderRadius:4}}>{toast}</div>}
      {/* Customer Info */}
      <section style={{marginBottom:32}}>
        <h2>Customer Information</h2>
        <div>Name: {lead?.name}</div>
        <div>Address: {project.address}</div>
        <div>Assigned Rep: {project.assigned_rep || 'TBD'}</div>
        <div>Support: <a href="tel:18001234567">Call MDB</a> | <a href="mailto:support@mdbsolar.com">Email MDB</a> | <a href="#" onClick={handleNotify}>WhatsApp MDB</a></div>
      </section>
      {/* Project Status Timeline */}
      <section style={{marginBottom:32}}>
        <h2>Project Status</h2>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {TIMELINE.map((stage, idx) => (
            <div key={stage} style={{display:'flex',alignItems:'center'}}>
              <span style={{width:20,display:'inline-block',color:idx<getCurrentStage()?'#2b3990':idx===getCurrentStage()?'#fbb040':'#ccc'}}>
                {idx<getCurrentStage()?'✔':idx===getCurrentStage()?'●':'○'}
              </span>
              <span style={{color:idx===getCurrentStage()?'#fbb040':'#222'}}>{stage}</span>
            </div>
          ))}
        </div>
      </section>
      {/* Proposal Section */}
      <section style={{marginBottom:32}}>
        <h2>Proposal</h2>
        {proposal ? (
          <div style={{background:'#f4f6fa',padding:16,borderRadius:8}}>
            <div>Status: {proposal.status}</div>
            <div>Estimated Savings: ${scenarios[0]?.estimated_25_year_savings || 'N/A'}</div>
            <div>Recommended Financing: {scenarios.find((s:any)=>s.is_recommended)?.provider || 'N/A'}</div>
            <div>System Size: {solarEstimate.system_size || 'N/A'} kW</div>
            <div>Panel Count: {solarEstimate.panel_count || 'N/A'}</div>
          </div>
        ) : <EmptyState icon="📄" message="No proposal yet." />}
      </section>
      {/* Documents Section */}
      <section style={{marginBottom:32}}>
        <h2>Documents</h2>
        <div>
          <input type="file" onChange={handleUpload} disabled={uploading} />
          {uploading && <div className="upload-spinner">Uploading...</div>}
          <ul>
            {documents.map((doc, idx) => <li key={idx}>{doc.name}</li>)}
          </ul>
        </div>
        <style jsx>{`
          .upload-spinner {
            color: #2b3990;
            margin-top: 0.5em;
            font-weight: 500;
          }
        `}</style>
        <div>Upload: Utility Bill, Driver License, HOA Docs, Signed Agreement</div>
      </section>
      {/* Next Steps */}
      <section style={{marginBottom:32}}>
        <h2>Next Steps</h2>
        <div>Next step: upload utility bill and HOA approval.</div>
      </section>
      {/* Support Actions */}
      <section style={{marginBottom:32}}>
        <h2>Support</h2>
        <button onClick={()=>window.open('tel:18001234567')}>Call MDB</button>
        <button onClick={()=>window.open('mailto:support@mdbsolar.com')}>Email MDB</button>
        <button onClick={handleNotify}>WhatsApp MDB</button>
        <button onClick={handleNotify}>Message Rep</button>
      </section>
      {/* MDB AI Assistant */}
      <section style={{marginBottom:32}}>
        <h2>MDB AI Assistant</h2>
        <button onClick={handleAskAI}>Ask MDB AI</button>
        <div style={{marginTop:8,background:'#f4f6fa',padding:16,borderRadius:8}}>{aiAnswer}</div>
      </section>
    </div>
  );
}
