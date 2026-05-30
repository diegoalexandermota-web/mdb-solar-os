export default function SolarDesignStudio() {
  return (
    <div className="sds-root">
      {/* Left Sidebar */}
      <aside className="sds-sidebar">
        <div className="sds-sidebar-header">Tools</div>
        <nav className="sds-sidebar-nav">
          <button className="sds-sidebar-btn">Roof View</button>
          <button className="sds-sidebar-btn">Satellite View</button>
          <button className="sds-sidebar-btn">Irradiance Layer</button>
          <button className="sds-sidebar-btn">Panel Placement</button>
          <button className="sds-sidebar-btn">Battery Placement</button>
          <button className="sds-sidebar-btn">Shading Analysis</button>
          <button className="sds-sidebar-btn">Production Estimate</button>
        </nav>
      </aside>

      {/* Main Workspace */}
      <main className="sds-main">
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
            <button className="sds-toolbar-btn">Undo</button>
            <button className="sds-toolbar-btn">Redo</button>
            <button className="sds-toolbar-btn">Save Design</button>
            <button className="sds-toolbar-btn">Export</button>
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
              <div className="sds-info-content">kW, Panels, Est. Savings, Payback, etc.</div>
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
              <div className="sds-canvas-tabs">
                <span className="sds-canvas-tab">Roof View</span>
                <span className="sds-canvas-tab">Satellite View</span>
                <span className="sds-canvas-tab">Irradiance Layer</span>
                <span className="sds-canvas-tab">Panel Placement</span>
                <span className="sds-canvas-tab">Battery Placement</span>
                <span className="sds-canvas-tab">Shading Analysis</span>
                <span className="sds-canvas-tab">Production Estimate</span>
              </div>
              <div className="sds-canvas-box">Design canvas placeholder</div>
            </div>
          </section>

          {/* Right Panels */}
          <section className="sds-right-panels">
            <div className="sds-info-card card">
              <div className="sds-info-title">Equipment Selection</div>
              <div className="sds-info-content">Panels, Inverters, Batteries, etc.</div>
            </div>
            <div className="sds-info-card card">
              <div className="sds-info-title">Financing Summary</div>
              <div className="sds-info-content">Loan, Lease, Cash, etc.</div>
            </div>
          </section>
        </div>
      </main>

      <style jsx>{`
        .sds-root {
          display: flex;
          min-height: 100vh;
          background: #f4f6fa;
        }
        .sds-sidebar {
          width: 80px;
          background: #232a47;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2.2rem 0.5rem 1.2rem 0.5rem;
          gap: 1.5rem;
        }
        .sds-sidebar-header {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fbb040;
          margin-bottom: 0.7rem;
        }
        .sds-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .sds-sidebar-btn {
          background: none;
          border: none;
          color: #fff;
          font-size: 1.05rem;
          padding: 0.6em 0.2em;
          border-radius: 7px;
          transition: background 0.18s, color 0.18s;
        }
        .sds-sidebar-btn:hover {
          background: #2b3990;
          color: #fbb040;
        }
        .sds-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .sds-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.2rem 2.2rem;
          margin-bottom: 1.2rem;
        }
        .sds-toolbar-title-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .sds-toolbar-title {
          font-size: 1.45rem;
          font-weight: 700;
          color: #2b3990;
        }
        .sds-toolbar-actions {
          display: flex;
          gap: 0.7rem;
        }
        .sds-toolbar-btn {
          border-radius: 7px;
          font-weight: 600;
          font-size: 0.97rem;
          padding: 0.5em 1em;
          border: none;
          background: #2b3990;
          color: #fff;
          box-shadow: 0 1px 4px rgba(43,57,144,0.04);
          transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.13s;
        }
        .sds-toolbar-btn:active {
          background: #1a1d2e;
          color: #fff;
          transform: scale(0.97);
        }
        .sds-workspace {
          display: flex;
          flex: 1;
          min-width: 0;
          gap: 1.2rem;
        }
        .sds-info-panels {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          min-width: 220px;
          max-width: 260px;
        }
        .sds-info-card {
          padding: 1.1rem 1.1rem 0.7rem 1.1rem;
        }
        .sds-info-title {
          font-size: 1.07rem;
          font-weight: 700;
          color: #2b3990;
          margin-bottom: 0.3em;
        }
        .sds-info-content {
          color: #222;
          font-size: 0.98rem;
        }
        .sds-canvas-section {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .sds-canvas-placeholder {
          width: 100%;
          max-width: 600px;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 2px 12px rgba(43,57,144,0.07);
          padding: 2.2rem 1.2rem 2.2rem 1.2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .sds-canvas-label {
          font-size: 1.13rem;
          font-weight: 700;
          color: #2b3990;
          margin-bottom: 0.7em;
        }
        .sds-canvas-tabs {
          display: flex;
          gap: 0.7rem;
          margin-bottom: 1.1em;
          flex-wrap: wrap;
        }
        .sds-canvas-tab {
          background: #fbb040;
          color: #232a47;
          border-radius: 7px;
          padding: 0.3em 0.9em;
          font-weight: 600;
          font-size: 0.97rem;
        }
        .sds-canvas-box {
          width: 100%;
          min-height: 220px;
          background: #e9ecf5;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #888;
          font-size: 1.13rem;
          font-weight: 500;
        }
        .sds-right-panels {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          min-width: 220px;
          max-width: 260px;
        }
        @media (max-width: 1200px) {
          .sds-info-panels, .sds-right-panels {
            min-width: 160px;
            max-width: 200px;
          }
        }
        @media (max-width: 900px) {
          .sds-root {
            flex-direction: column;
          }
          .sds-sidebar {
            flex-direction: row;
            width: 100vw;
            height: 60px;
            padding: 0.5rem 0.5rem;
            gap: 1.2rem;
            justify-content: center;
            align-items: center;
          }
          .sds-sidebar-header {
            display: none;
          }
          .sds-main {
            padding: 0.5rem 0.2rem;
          }
          .sds-workspace {
            flex-direction: column;
            gap: 0.7rem;
          }
          .sds-info-panels, .sds-right-panels {
            flex-direction: row;
            min-width: 0;
            max-width: 100vw;
            gap: 0.7rem;
          }
          .sds-info-card {
            flex: 1;
            min-width: 0;
          }
        }
        @media (max-width: 600px) {
          .sds-canvas-placeholder {
            padding: 1.1rem 0.3rem 1.1rem 0.3rem;
          }
          .card {
            padding: 1.1rem 0.7rem 1.1rem 0.7rem;
          }
        }
      `}</style>
    </div>
  );
}
