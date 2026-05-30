export default function CustomerPortal() {
  return (
    <div className="customer-portal-root">
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
      <div className="customer-portal-placeholder card">
        <div className="customer-portal-placeholder-icon">🔒</div>
        <div className="customer-portal-placeholder-title">Coming soon</div>
        <div className="customer-portal-placeholder-desc">Customer portal for project tracking, proposal, documents, and support.</div>
      </div>
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
        .customer-portal-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.1rem;
          padding: 2.5rem 1.5rem;
        }
        .customer-portal-placeholder-icon {
          font-size: 2.7rem;
        }
        .customer-portal-placeholder-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #2b3990;
        }
        .customer-portal-placeholder-desc {
          color: #444;
          font-size: 1.07rem;
          text-align: center;
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
