  // Add Design to Proposal

import React, { useRef, useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from 'next/router';


const DEFAULT_PANEL = {
  width: 80,
  height: 40,
  rotation: 0,
  model: "SunPower SPR-X22-360",
  wattage: 400,
};
const PANEL_MODELS = [
  { label: "SunPower SPR-X22-360", wattage: 400 },
  { label: "REC Alpha Pure-R", wattage: 410 },
  { label: "QCells Q.PEAK DUO", wattage: 395 },
];
const INVERTERS = ["Enphase IQ8", "SolarEdge SE7600H", "Tesla Powerwall Inverter"];
const BATTERIES = ["None", "Tesla Powerwall", "Enphase IQ Battery", "LG Chem RESU"];

function getSystemSizeKw(panels, wattage) {
  return ((panels * wattage) / 1000).toFixed(2);
}

export default function SolarDesignStudio() {
  const router = useRouter();
  // Lead/Proposal selectors
  const [leadId, setLeadId] = useState("");
  const [proposalId, setProposalId] = useState("");
  const [leads, setLeads] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingProposals, setLoadingProposals] = useState(false);
  // Load state
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [loadingDesignId, setLoadingDesignId] = useState(null);
  const [loadError, setLoadError] = useState(null);
  // Add Design to Proposal
  const [addingToProposal, setAddingToProposal] = useState(false);
  async function handleAddDesignToProposal() {
    if (!proposalId) {
      setToast("Select or create a proposal first.");
      setTimeout(() => setToast(null), 2500);
      return;
    }
    setAddingToProposal(true);
    setToast(null);
    // Find the current design (if saved)
    const design = {
      system_size_kw: systemSize,
      panel_count: panelCount,
      estimated_production: estimatedProduction,
      estimated_offset: estimatedOffset,
    };
    // Update proposal with design values and link
    const { error } = await supabase.from('proposals').update({
      system_size_kw: design.system_size_kw,
      panel_count: design.panel_count,
      estimated_production: design.estimated_production,
      estimated_offset: design.estimated_offset,
      solar_design_id: null // Optionally set to the current design's id if available
    }).eq('id', proposalId);
    setAddingToProposal(false);
    if (error) {
      setToast('Error updating proposal: ' + error.message);
    } else {
      setToast('Proposal updated with design values!');
    }
    setTimeout(() => setToast(null), 2500);
  }

  // Fetch saved designs on mount
  useEffect(() => {
    async function fetchDesigns() {
      setLoadingDesigns(true);
      setLoadError(null);
      const { data, error } = await supabase
        .from("solar_designs")
        .select("id, project_name, panel_count, system_size_kw, updated_at, layout_json")
        .order("updated_at", { ascending: false });
      if (error) {
        setLoadError("Error loading designs: " + error.message);
        setSavedDesigns([]);
      } else {
        setSavedDesigns(data || []);
      }
      setLoadingDesigns(false);
    }
    fetchDesigns();
  }, []);

  // Load a saved design
  async function handleLoadDesign(design) {
    setLoadingDesignId(design.id);
    setToast(null);
    setLoadError(null);
    try {
      // Defensive: parse layout_json
      const layout = typeof design.layout_json === "string" ? JSON.parse(design.layout_json) : design.layout_json;
      setPanels(layout.panels || []);
      setBgImage(layout.bgImage || "");
      setShowPanels(layout.showPanels ?? true);
      setShowObstructions(layout.showObstructions ?? true);
      setShowIrradiance(layout.showIrradiance ?? false);
      setShowSetbacks(layout.showSetbacks ?? false);
      setPanelModel(layout.panelModel || PANEL_MODELS[0].label);
      setPanelWattage(layout.panelWattage || PANEL_MODELS[0].wattage);
      setInverter(layout.inverter || INVERTERS[0]);
      setBattery(layout.battery || BATTERIES[0]);
      // Restore selected panel if valid
      if (layout.selectedPanel && (layout.panels || []).some((p) => p.id === layout.selectedPanel)) {
        setSelectedPanel(layout.selectedPanel);
      } else {
        setSelectedPanel(null);
      }
      // Show linked lead/proposal if present
      if (design.lead_id) setLeadId(design.lead_id);
      if (design.proposal_id) setProposalId(design.proposal_id);
      setToast("Design loaded!");
    } catch (e) {
      setLoadError("Failed to load design: " + (e.message || e));
    }
    setLoadingDesignId(null);
    setTimeout(() => setToast(null), 2000);
  }
  // Save state
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  // Canvas state
  const [bgImage, setBgImage] = useState(null);
  const [panels, setPanels] = useState([]);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [panelModel, setPanelModel] = useState(PANEL_MODELS[0].label);
  const [panelWattage, setPanelWattage] = useState(PANEL_MODELS[0].wattage);
  const [inverter, setInverter] = useState(INVERTERS[0]);
  const [battery, setBattery] = useState(BATTERIES[0]);
  const [showPanels, setShowPanels] = useState(true);
  const [showObstructions, setShowObstructions] = useState(false);
  const [showIrradiance, setShowIrradiance] = useState(false);
  const [showSetbacks, setShowSetbacks] = useState(false);
  const canvasRef = useRef(null);

  // Upload image
  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBgImage(ev.target.result);
    reader.readAsDataURL(file);
  }

  // Add panel
  function addPanel() {
    setPanels([
      ...panels,
      {
        ...DEFAULT_PANEL,
        model: panelModel,
        wattage: panelWattage,
        x: 120 + panels.length * 90,
        y: 120,
        id: Date.now() + Math.random(),
      },
    ]);
  }

  // Select panel
  function selectPanel(id) {
    setSelectedPanel(id);
  }

  // Move panel
  function movePanel(dx, dy) {
    setPanels((prev) =>
      prev.map((p) =>
        p.id === selectedPanel ? { ...p, x: p.x + dx, y: p.y + dy } : p
      )
    );
  }

  // Rotate panel
  function rotatePanel() {
    setPanels((prev) =>
      prev.map((p) =>
        p.id === selectedPanel ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  }

  // Delete panel
  function deletePanel() {
    setPanels((prev) => prev.filter((p) => p.id !== selectedPanel));
    setSelectedPanel(null);
  }

  // Duplicate row
  function duplicateRow() {
    if (!selectedPanel) return;
    const base = panels.find((p) => p.id === selectedPanel);
    if (!base) return;
    const rowPanels = panels.filter((p) =>
      Math.abs(p.y - base.y) < 10 && p.model === base.model && p.wattage === base.wattage
    );
    const newPanels = rowPanels.map((p) => ({
      ...p,
      y: p.y + base.height + 20,
      id: Date.now() + Math.random(),
    }));
    setPanels([...panels, ...newPanels]);
  }

  // Clear layout
  function clearLayout() {
    setPanels([]);
    setSelectedPanel(null);
  }

  // Change panel model
  function handlePanelModel(e) {
    const model = e.target.value;
    setPanelModel(model);
    const found = PANEL_MODELS.find((m) => m.label === model);
    setPanelWattage(found ? found.wattage : 400);
  }

  // Layer toggles
  function handleLayerToggle(layer) {
    if (layer === "panels") setShowPanels((v) => !v);
    if (layer === "obstructions") setShowObstructions((v) => !v);
    if (layer === "irradiance") setShowIrradiance((v) => !v);
    if (layer === "setbacks") setShowSetbacks((v) => !v);
  }

  // Canvas mouse events
  const dragData = useRef({ dragging: false, offsetX: 0, offsetY: 0, id: null });
  function onCanvasMouseDown(e) {
    if (!showPanels) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Find topmost panel
    for (let i = panels.length - 1; i >= 0; i--) {
      const p = panels[i];
      const dx = x - p.x;
      const dy = y - p.y;
      const w = p.rotation % 180 === 0 ? p.width : p.height;
      const h = p.rotation % 180 === 0 ? p.height : p.width;
      if (dx >= 0 && dx <= w && dy >= 0 && dy <= h) {
        setSelectedPanel(p.id);
        dragData.current = { dragging: true, offsetX: dx, offsetY: dy, id: p.id };
        return;
      }
    }
    setSelectedPanel(null);
  }
  function onCanvasMouseMove(e) {
    if (!dragData.current.dragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPanels((prev) =>
      prev.map((p) =>
        p.id === dragData.current.id
          ? {
              ...p,
              x: x - dragData.current.offsetX,
              y: y - dragData.current.offsetY,
            }
          : p
      )
    );
  }
  function onCanvasMouseUp() {
    dragData.current = { dragging: false, offsetX: 0, offsetY: 0, id: null };
  }


  // Calculations
  const panelCount = panels.length;
  const systemSize = getSystemSizeKw(panelCount, panelWattage);
  const estimatedProduction = "(placeholder)";
  const estimatedOffset = "(placeholder)";

  // Save to Supabase
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
      panel_count: panelCount,
      system_size_kw: systemSize,
      estimated_production: estimatedProduction,
      estimated_offset: estimatedOffset,
      layout_json,
      lead_id: leadId || null,
      proposal_id: proposalId || null,
    };
    const { error } = await supabase.from("solar_designs").insert([payload]);
    setSaving(false);
    if (error) {
      setToast("Error saving design: " + error.message);
    } else {
      setToast("Design saved!");
    }
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="sds-root">
      {toast && <div className="dashboard-toast" style={{position:'fixed',top:10,right:10,zIndex:1000}}>{toast}</div>}
      {/* Saved Designs Panel */}
      <div className="sds-saved-designs card" style={{marginBottom:20,padding:16,maxWidth:600}}>
        <div style={{fontWeight:700,fontSize:'1.1rem',color:'#2b3990',marginBottom:8}}>Saved Designs</div>
        {loadingDesigns ? (
          <div>Loading designs...</div>
        ) : loadError ? (
          <div style={{color:'#c00'}}>{loadError}</div>
        ) : savedDesigns.length === 0 ? (
          <div>No saved designs found.</div>
        ) : (
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
              {savedDesigns.map(design => (
                <tr key={design.id} style={{borderBottom:'1px solid #eee'}}>
                  <td style={{padding:'6px 8px'}}>{design.project_name}</td>
                  <td style={{padding:'6px 8px',textAlign:'right'}}>{design.panel_count}</td>
                  <td style={{padding:'6px 8px',textAlign:'right'}}>{design.system_size_kw}</td>
                  <td style={{padding:'6px 8px',textAlign:'right'}}>{design.updated_at ? new Date(design.updated_at).toLocaleString() : "-"}</td>
                  <td style={{padding:'6px 8px',textAlign:'right'}}>
                    <button
                      className="sds-toolbar-btn"
                      type="button"
                      style={{minWidth:70,marginRight:6}}
                      onClick={() => handleLoadDesign(design)}
                      disabled={!!loadingDesignId}
                    >
                      {loadingDesignId === design.id ? "Loading..." : "Load"}
                    </button>
                    {design.lead_id && (
                      <button className="sds-toolbar-btn" type="button" style={{minWidth:70,marginRight:6}} onClick={() => router.push(`/leads/${design.lead_id}`)}>Open Lead</button>
                    )}
                    {design.proposal_id && (
                      <button className="sds-toolbar-btn" type="button" style={{minWidth:70}} onClick={() => router.push(`/proposals/${design.proposal_id}`)}>Open Proposal</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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

      {/* Main Workspace */}
      <main className="sds-main">
        {/* Project Name & Lead/Proposal Selectors */}
        <div className="sds-project-name-row card" style={{marginBottom:16,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <label htmlFor="projectName" style={{fontWeight:600,color:'#2b3990'}}>Project Name:</label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            style={{fontSize:'1.07rem',padding:'0.4em 1em',borderRadius:7,border:'1px solid #b0b6d1',flex:1,maxWidth:220}}
            placeholder="e.g. Smith Residence"
            disabled={saving || !!loadingDesignId}
          />
          <label htmlFor="leadSelect" style={{fontWeight:600,color:'#2b3990'}}>Lead:</label>
          <select
            id="leadSelect"
            value={leadId}
            onChange={e => setLeadId(e.target.value)}
            disabled={loadingLeads || !!loadingDesignId}
            style={{minWidth:120,maxWidth:180}}
          >
            <option value="">None</option>
            {leads.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <label htmlFor="proposalSelect" style={{fontWeight:600,color:'#2b3990'}}>Proposal:</label>
          <select
            id="proposalSelect"
            value={proposalId}
            onChange={e => setProposalId(e.target.value)}
            disabled={loadingProposals || !!loadingDesignId}
            style={{minWidth:120,maxWidth:180}}
          >
            <option value="">None</option>
            {proposals.map(p => (
              <option key={p.id} value={p.id}>{p.title || p.id}</option>
            ))}
          </select>
        </div>
        {/* Header/Toolbar */}
        <header className="sds-toolbar card">
          <div className="sds-toolbar-title-row">
            <svg width="32" height="32" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="19" cy="19" r="19" fill="#2b3990"/>
              <path d="M19 8L24.5 28H13.5L19 8Z" fill="#fbb040"/>
            </svg>
            <span className="sds-toolbar-title">Solar Design Studio</span>
          </div>
          <div className="sds-toolbar-actions">
            <button className="sds-toolbar-btn" type="button" onClick={addPanel} disabled={saving || !!loadingDesignId}>Add Panel</button>
            <button className="sds-toolbar-btn" type="button" onClick={duplicateRow} disabled={!selectedPanel || saving || !!loadingDesignId}>Duplicate Row</button>
            <button className="sds-toolbar-btn" type="button" onClick={clearLayout} disabled={panels.length === 0 || saving || !!loadingDesignId}>Clear Layout</button>
            <button className="sds-toolbar-btn" type="button" onClick={handleSaveDesign} disabled={saving || !!loadingDesignId}>{saving ? "Saving..." : "Save Design"}</button>
            <button className="sds-toolbar-btn" type="button" disabled>Export</button>
          </div>
        </header>

        <div className="sds-workspace">
          {/* Left Info Panels */}
          <section className="sds-info-panels">
            <div className="sds-info-card card">
              <div className="sds-info-title">Project Information</div>
              <div className="sds-info-content">Address, Owner, Project #, etc.</div>
            </div>
            <div className="sds-info-card card">
              <div className="sds-info-title">Utility & Consumption</div>
              <div className="sds-info-content">Utility, Rate, Usage, Bill, etc.</div>
            </div>
            <div className="sds-info-card card">
              <div className="sds-info-title">Proposal Quick Stats</div>
              <div className="sds-info-content">
                <div><b>Panels:</b> {panelCount}</div>
                <div><b>Panel Wattage:</b> {panelWattage} W</div>
                <div><b>System Size:</b> {systemSize} kW</div>
                <div><b>Est. Annual Production:</b> <span className="sds-placeholder">(placeholder)</span></div>
                <div><b>Est. Offset:</b> <span className="sds-placeholder">(placeholder)</span></div>
              </div>
            </div>
            <div className="sds-info-card card">
              <div className="sds-info-title">AI Solar Assistant</div>
              <div className="sds-info-content">Ask MDB AI about your design.</div>
            </div>
          </section>

          {/* Main Canvas Area */}
          <section className="sds-canvas-section">
            <div className="sds-canvas-placeholder">
              <div className="sds-canvas-label">Map / Design Canvas</div>
              <div className="sds-canvas-controls-row">
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                <span className="sds-canvas-control-label">Upload Roof/Satellite Image</span>
                <span className="sds-canvas-control-label">Compass: <span className="sds-compass">N E S W</span></span>
              </div>
              <div
                className="sds-canvas-box"
                ref={canvasRef}
                tabIndex={0}
                style={{ position: "relative", cursor: showPanels ? "pointer" : "default", background: bgImage ? `url(${bgImage}) center/cover no-repeat` : "#e9ecf5" }}
                onMouseDown={onCanvasMouseDown}
                onMouseMove={onCanvasMouseMove}
                onMouseUp={onCanvasMouseUp}
              >
                {/* Panels */}
                {showPanels && panels.map((p) => (
                  <div
                    key={p.id}
                    className={"sds-panel" + (selectedPanel === p.id ? " selected" : "")}
                    style={{
                      position: "absolute",
                      left: p.x,
                      top: p.y,
                      width: p.width,
                      height: p.height,
                      background: selectedPanel === p.id ? "#fbb040" : "#2b3990",
                      opacity: 0.92,
                      border: selectedPanel === p.id ? "2px solid #fbb040" : "2px solid #fff",
                      borderRadius: 6,
                      transform: `rotate(${p.rotation}deg)`
                    }}
                    onClick={e => { e.stopPropagation(); selectPanel(p.id); }}
                  >
                    <span className="sds-panel-label">{p.model.split(" ")[0]}</span>
                  </div>
                ))}
                {/* Layer Placeholders */}
                {showIrradiance && <div className="sds-layer-placeholder">Irradiance Layer (placeholder)</div>}
                {showObstructions && <div className="sds-layer-placeholder">Obstructions (placeholder)</div>}
                {showSetbacks && <div className="sds-layer-placeholder">Setbacks (placeholder)</div>}
              </div>
              {/* Panel Actions */}
              {selectedPanel && (
                <div className="sds-panel-actions">
                  <button type="button" onClick={() => movePanel(-10, 0)}>←</button>
                  <button type="button" onClick={() => movePanel(10, 0)}>→</button>
                  <button type="button" onClick={() => movePanel(0, -10)}>↑</button>
                  <button type="button" onClick={() => movePanel(0, 10)}>↓</button>
                  <button type="button" onClick={rotatePanel}>Rotate</button>
                  <button type="button" onClick={deletePanel}>Delete</button>
                </div>
              )}
            </div>
          </section>

          {/* Right Panels */}
          <section className="sds-right-panels">
            <div className="sds-info-card card">
              <div className="sds-info-title">Equipment Selection</div>
              <div className="sds-info-content">
                <div>
                  <label>Panel Model: </label>
                  <select value={panelModel} onChange={handlePanelModel}>
                    {PANEL_MODELS.map((m) => (
                      <option key={m.label} value={m.label}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Wattage: </label>
                  <input type="number" value={panelWattage} min={100} max={700} step={5} onChange={e => setPanelWattage(Number(e.target.value))} style={{width:60}} />
                </div>
                <div>
                  <label>Inverter: </label>
                  <select value={inverter} onChange={e => setInverter(e.target.value)}>
                    {INVERTERS.map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Battery: </label>
                  <select value={battery} onChange={e => setBattery(e.target.value)}>
                    {BATTERIES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="sds-info-card card">
              <div className="sds-info-title">Financing Summary</div>
              <div className="sds-info-content">Loan, Lease, Cash, etc.</div>
              <button
                className="sds-toolbar-btn"
                type="button"
                style={{marginTop:10}}
                onClick={handleAddDesignToProposal}
                disabled={addingToProposal || saving || !!loadingDesignId}
              >
                {addingToProposal ? "Adding..." : "Add Design to Proposal"}
              </button>
            </div>
          </section>
        </div>
      </main>

      <style jsx>{`
        .sds-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          user-select: none;
        }
        .sds-panel.selected {
          box-shadow: 0 0 0 3px #fbb04055;
        }
        .sds-panel-label {
          pointer-events: none;
        }
        .sds-panel-actions {
          display: flex;
          gap: 0.4em;
          margin-top: 0.7em;
        }
        .sds-canvas-controls-row {
          display: flex;
          align-items: center;
          gap: 1.1em;
          margin-bottom: 0.7em;
        }
        .sds-canvas-control-label {
          color: #2b3990;
          font-size: 0.98rem;
        }
        .sds-compass {
          background: #e9ecf5;
          border-radius: 7px;
          padding: 0.1em 0.7em;
          font-weight: 600;
          color: #2b3990;
        }
        .sds-layer-placeholder {
          position: absolute;
          left: 10px;
          top: 10px;
          background: #fbb040;
          color: #232a47;
          padding: 0.3em 1em;
          border-radius: 7px;
          font-weight: 700;
          font-size: 1.01rem;
          opacity: 0.93;
        }
        .sds-placeholder {
          color: #b0b6d1;
        }
      `}</style>
    </div>
  );
}
