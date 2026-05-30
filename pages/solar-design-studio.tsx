import React, { useRef, useState } from "react";
import { supabase } from "../utils/supabaseClient";

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
      {/* Left Sidebar */}
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
        {/* Project Name Input */}
        <div className="sds-project-name-row card" style={{marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
          <label htmlFor="projectName" style={{fontWeight:600,color:'#2b3990'}}>Project Name:</label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            style={{fontSize:'1.07rem',padding:'0.4em 1em',borderRadius:7,border:'1px solid #b0b6d1',flex:1,maxWidth:320}}
            placeholder="e.g. Smith Residence"
            disabled={saving}
          />
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
            <button className="sds-toolbar-btn" type="button" onClick={addPanel} disabled={saving}>Add Panel</button>
            <button className="sds-toolbar-btn" type="button" onClick={duplicateRow} disabled={!selectedPanel || saving}>Duplicate Row</button>
            <button className="sds-toolbar-btn" type="button" onClick={clearLayout} disabled={panels.length === 0 || saving}>Clear Layout</button>
            <button className="sds-toolbar-btn" type="button" onClick={handleSaveDesign} disabled={saving}>{saving ? "Saving..." : "Save Design"}</button>
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
