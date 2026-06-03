import React, { useRef, useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { supabase } from "../utils/supabaseClient";
import { generateSolarProposalSummary } from '../utils/generateSolarProposalSummary';
import { generateProposalPDF } from '../utils/generateProposalPDF';

const PANEL_MODELS = [
  { label: "SunPower SPR-X22-360", wattage: 400 },
  { label: "REC Alpha Pure-R", wattage: 410 },
  { label: "QCells Q.PEAK DUO", wattage: 395 },
];
const INVERTERS = ["Enphase IQ8", "SolarEdge SE7600H", "Tesla Powerwall Inverter"];
const BATTERIES = ["None", "Tesla Powerwall", "Enphase IQ Battery", "LG Chem RESU"];

function getSystemSizeKw(panelCount: number, wattage: number) {
  return ((panelCount * wattage) / 1000).toFixed(2);
}

function buildAiSummaryText(summary: any) {
  return (
    `${summary.executive_summary || ''}\n` +
    `${summary.homeowner_benefit || ''}\n` +
    `${summary.financing_summary || ''}`
  ).trim();
}

export default function SolarDesignStudio() {
  const [pdfLoading, setPdfLoading] = useState(false);
  // --- All React hooks and state at the top ---
  const router = useRouter();
  const dragData = useRef<{ dragging: boolean; offsetX: number; offsetY: number; id: number | null }>({ dragging: false, offsetX: 0, offsetY: 0, id: null });
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<number | null>(null);
  const [showPanels, setShowPanels] = useState(true);
  const [showObstructions, setShowObstructions] = useState(false);
  const [showIrradiance, setShowIrradiance] = useState(false);
  const [showSetbacks, setShowSetbacks] = useState(false);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);





  // PDF Generation Handler (must be after all hooks)
  function handleGeneratePDF() {
    setPdfLoading(true);
    try {
      const data = {
        customer_name: "", // Not available in studio
        address: "", // Not available in studio
        utility_company: "", // Not available in studio
        system_size_kw: getSystemSizeKw(panels.length, panelWattage),
        panel_count: panels.length,
        estimated_production: "(placeholder)",
        estimated_offset: "(placeholder)",
        financing_summary: aiSummary?.split('Financing options are available')[0]?.trim() || '',
        ai_executive_summary: aiSummary?.split('\n')[0] || '',
        homeowner_benefit: aiSummary?.split('\n')[1] || '',
        next_step: 'Contact your MDB Solar advisor to review your proposal and finalize your solar journey.',
        proposal_date: new Date().toLocaleDateString(),
      };
      const doc = generateProposalPDF(data);
      doc.save(`MDB_Solar_Proposal.pdf`);
      setToast('Proposal PDF generated!');
    } catch (e) {
      setToast('Error generating PDF.');
    }
    setPdfLoading(false);
    setTimeout(() => setToast(null), 2500);
  }
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [proposalId, setProposalId] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [loadingDesignId, setLoadingDesignId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [addingToProposal, setAddingToProposal] = useState(false);
  const [panels, setPanels] = useState<any[]>([]);
  const [panelModel, setPanelModel] = useState(PANEL_MODELS[0].label);
  const [panelWattage, setPanelWattage] = useState(PANEL_MODELS[0].wattage);
  const [inverter, setInverter] = useState(INVERTERS[0]);
  const [battery, setBattery] = useState(BATTERIES[0]);

  // Layer toggles
  function handleLayerToggle(layer: string) {
    switch (layer) {
      case "irradiance": setShowIrradiance(v => !v); break;
      case "panels": setShowPanels(v => !v); break;
      case "obstructions": setShowObstructions(v => !v); break;
      case "setbacks": setShowSetbacks(v => !v); break;
      default: break;
    }
  }

  // Example: Save Design Handler (preserved logic)
  async function handleSaveDesign() {
    if (!projectName) {
      setToast("Please enter a project name.");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setSaving(true);
    setToast(null);
    const layout_json = {
      panels,
      selectedPanel,
      bgImage: !bgImage?.startsWith("http") ? bgImage : undefined,
      showPanels,
      showObstructions,
      showIrradiance,
      showSetbacks,
      panelModel,
      panelWattage,
      inverter,
      battery,
    };
    const payload = {
      project_name: projectName,
      roof_image_url: bgImage?.startsWith("http") ? bgImage : null,
      panel_model: panelModel,
      panel_wattage: panelWattage,
      inverter_model: inverter,
      battery_model: battery,
      panel_count: panels.length,
      system_size_kw: getSystemSizeKw(panels.length, panelWattage),
      estimated_production: "(placeholder)",
      estimated_offset: "(placeholder)",
      layout_json,
      lead_id: leadId || null,
      proposal_id: proposalId || null,
    };
    await supabase.from("solar_designs").insert([payload]);
    setSaving(false);
    setToast("Design saved!");
    setTimeout(() => setToast(null), 2000);
  }

  // AI Summary Handler
  async function handleGenerateAISummary() {
    setAiLoading(true);
    setAiSummary(null);
    const input = {
      lead_id: leadId || null,
      proposal_id: proposalId || null,
      customer_name: '',
      service_address: '',
      utility_company: '',
      panel_count: panels.length,
      system_size_kw: Number(getSystemSizeKw(panels.length, panelWattage)),
      estimated_production: "(placeholder)",
      estimated_offset: "(placeholder)",
      panel_model: panelModel,
      inverter_model: inverter,
      battery_model: battery,
      financing_type: '',
      monthly_payment: '',
      proposal_value: '',
      notes: '',
    };

    try {
      const response = await fetch('/api/ai/solar-proposal-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const apiSummary = await response.json();
      setAiSummary(buildAiSummaryText(apiSummary));
    } catch {
      const summary = generateSolarProposalSummary(input);
      setAiSummary(buildAiSummaryText(summary));
      setToast('OpenAI unavailable. Local AI summary generated.');
      setTimeout(() => setToast(null), 2500);
    }

    setAiLoading(false);
  }

  // Save AI Summary Handler
  async function handleSaveAISummary() {
    if (!aiSummary) {
      setToast("Generate an AI summary first.");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    if (!proposalId) {
      setToast("Link a proposal to save this summary.");
      setTimeout(() => setToast(null), 2500);
      return;
    }
    setToast("Saving AI summary...");
    try {
      // Save to proposals
      await supabase.from("proposals").update({ ai_summary: aiSummary }).eq("id", proposalId);
      // Save to ai_logs
      const input = {
        panel_count: panels.length,
        system_size_kw: Number(getSystemSizeKw(panels.length, panelWattage)),
        estimated_production: "(placeholder)",
        estimated_offset: "(placeholder)",
        panel_model: panelModel,
        inverter_model: inverter,
        battery_model: battery,
      };
      await supabase.from("ai_logs").insert([
        {
          proposal_id: proposalId,
          action: "solar_proposal_summary",
          context: null,
          user_id: null,
          input_json: input,
          output_json: { ai_summary: aiSummary },
        },
      ]);
      setToast("AI summary saved to proposal!");
    } catch (e) {
      setToast("Error saving AI summary.");
    }
    setTimeout(() => setToast(null), 2500);
  }

  // UI: Main Render
  return (
    <div className="sds-layout">
      <aside className="sds-sidebar">
        <div className="sds-sidebar-header">Tools</div>
        <nav className="sds-sidebar-nav">
          <button className="sds-sidebar-btn" type="button">Roof View</button>
          <button className="sds-sidebar-btn" type="button">Satellite View</button>
          <button className="sds-sidebar-btn" type="button" onClick={() => handleLayerToggle("irradiance")}>Irradiance Layer</button>
          <button className="sds-sidebar-btn" type="button" onClick={() => handleLayerToggle("panels")}>Panels</button>
          <button className="sds-sidebar-btn" type="button" onClick={() => handleLayerToggle("obstructions")}>Obstructions</button>
          <button className="sds-sidebar-btn" type="button" onClick={() => handleLayerToggle("setbacks")}>Setbacks</button>
        </nav>
      </aside>
      <main className="sds-main">
        <div className="sds-header">
          <input
            className="sds-project-input"
            placeholder="Project Name"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
          />
          <button className="sds-save-btn" onClick={handleSaveDesign} disabled={saving}>
            {saving ? "Saving..." : "Save Design"}
          </button>
        </div>
        <div className="sds-controls">
          <select value={panelModel} onChange={e => {
            const model = PANEL_MODELS.find(m => m.label === e.target.value);
            setPanelModel(model?.label || PANEL_MODELS[0].label);
            setPanelWattage(model?.wattage || PANEL_MODELS[0].wattage);
          }}>
            {PANEL_MODELS.map(m => (
              <option key={m.label} value={m.label}>{m.label} ({m.wattage}W)</option>
            ))}
          </select>
          <select value={inverter} onChange={e => setInverter(e.target.value)}>
            {INVERTERS.map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          <select value={battery} onChange={e => setBattery(e.target.value)}>
            {BATTERIES.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="sds-canvas" ref={canvasRef}>
          {/* Canvas and panel layout would go here */}
          <div style={{ padding: 24, color: '#888' }}>
            [Solar Design Canvas Placeholder]
          </div>
        </div>
        <div className="sds-summary-panel">
          <button className="sds-ai-btn" onClick={handleGenerateAISummary} disabled={aiLoading}>
            {aiLoading ? "Generating..." : "Generate AI Proposal Summary"}
          </button>
          <button className="sds-ai-btn" onClick={handleSaveAISummary} disabled={!aiSummary} style={{marginLeft:8}}>
            Save AI Summary
          </button>
          <button className="sds-ai-btn" onClick={handleGeneratePDF} disabled={pdfLoading || !aiSummary} style={{marginLeft:8}}>
            {pdfLoading ? 'Generating PDF...' : 'Generate Proposal PDF'}
          </button>
          {aiSummary && (
            <div className="sds-ai-summary">
              <strong>AI Proposal Summary:</strong>
              <div>{aiSummary}</div>
            </div>
          )}
        </div>
        {toast && <div className="sds-toast">{toast}</div>}
      </main>
      <style jsx>{`
        .sds-layout {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
        }
        .sds-sidebar {
          width: 220px;
          background: #0a2342;
          color: #fff;
          padding: 24px 0;
          display: flex;
          flex-direction: column;
        }
        .sds-sidebar-header {
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 16px;
          padding-left: 24px;
        }
        .sds-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sds-sidebar-btn {
          background: none;
          border: none;
          color: #fff;
          text-align: left;
          padding: 12px 24px;
          font-size: 1rem;
          cursor: pointer;
          border-radius: 6px 0 0 6px;
          transition: background 0.2s;
        }
        .sds-sidebar-btn:hover {
          background: #19376d;
        }
        .sds-main {
          flex: 1;
          padding: 32px 40px;
          display: flex;
          flex-direction: column;
        }
        .sds-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .sds-project-input {
          flex: 1;
          padding: 10px 16px;
          font-size: 1.1rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }
        .sds-save-btn {
          background: #ffd600;
          color: #0a2342;
          border: none;
          padding: 10px 20px;
          font-weight: bold;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .sds-save-btn:disabled {
          background: #ffe066;
          cursor: not-allowed;
        }
        .sds-controls {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }
        .sds-canvas {
          flex: 1;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 24px;
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sds-summary-panel {
          margin-bottom: 24px;
        }
        .sds-ai-btn {
          background: #19376d;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          margin-bottom: 12px;
        }
        .sds-ai-btn:disabled {
          background: #b0b8c1;
          cursor: not-allowed;
        }
        .sds-ai-summary {
          background: #f1f5f9;
          border-radius: 8px;
          padding: 16px;
          margin-top: 8px;
        }
        .sds-toast {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          background: #ffd600;
          color: #0a2342;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: bold;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        @media (max-width: 900px) {
          .sds-layout {
            flex-direction: column;
          }
          .sds-sidebar {
            width: 100%;
            flex-direction: row;
            padding: 0;
            justify-content: space-between;
          }
          .sds-sidebar-header {
            padding-left: 16px;
          }
          .sds-main {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
