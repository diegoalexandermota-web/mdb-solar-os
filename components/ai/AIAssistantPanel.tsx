import { Bot, Sparkles, MessageSquare, PhoneCall, Wand2, ArrowRight } from 'lucide-react';

export default function AIAssistantPanel() {
  return (
    <aside className="ai-rail">
      <div className="ai-head">
        <div className="ai-icon"><Sparkles size={14} /></div>
        <div>
          <div className="ai-title">MDB AI Assistant</div>
          <div className="ai-subtitle">Contextual CRM guidance</div>
        </div>
      </div>

      <div className="ai-card">
        <div className="ai-card-title"><Bot size={13} /> Daily Brief</div>
        <p>13 leads need touchpoints before EOD. 4 high-priority accounts stalled in Proposal Sent.</p>
        <button type="button" className="ai-action">Generate brief <ArrowRight size={12} /></button>
      </div>

      <div className="ai-card">
        <div className="ai-card-title"><Wand2 size={13} /> Next Best Action</div>
        <p>Move hot Proposal Sent leads to credit authorization this afternoon for faster close rate.</p>
        <button type="button" className="ai-action">Show actions <ArrowRight size={12} /></button>
      </div>

      <div className="ai-list">
        <div className="mini-row"><MessageSquare size={13} /> Generate follow-up</div>
        <div className="mini-row"><PhoneCall size={13} /> Build call script</div>
      </div>

      <style jsx>{`
        .ai-rail {
          width: 320px;
          border-left: 1px solid var(--mdb-border);
          background: color-mix(in srgb, var(--mdb-card) 85%, white);
          padding: 14px;
          display: none;
          flex-direction: column;
          gap: 10px;
        }
        .ai-head {
          border: 1px solid var(--mdb-border);
          border-radius: var(--mdb-radius);
          background: linear-gradient(135deg, color-mix(in srgb, var(--mdb-primary) 8%, white), color-mix(in srgb, var(--mdb-navy) 8%, white));
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ai-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: color-mix(in srgb, var(--mdb-gold) 25%, white);
          color: var(--mdb-navy);
        }
        .ai-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--mdb-foreground);
        }
        .ai-subtitle {
          font-size: 0.7rem;
          color: var(--mdb-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .ai-card {
          border: 1px solid var(--mdb-border);
          border-radius: var(--mdb-radius);
          background: var(--mdb-card);
          padding: 10px;
          box-shadow: var(--mdb-shadow-card);
        }
        .ai-card-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--mdb-muted);
          margin-bottom: 6px;
        }
        p {
          margin: 0;
          color: var(--mdb-foreground);
          font-size: 0.82rem;
          line-height: 1.45;
        }
        .ai-action {
          margin-top: 8px;
          width: 100%;
          border-radius: 8px;
          border: 1px solid color-mix(in srgb, var(--mdb-primary) 35%, var(--mdb-border));
          background: color-mix(in srgb, var(--mdb-primary) 10%, white);
          color: var(--mdb-primary);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          padding: 8px;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 5px;
        }
        .ai-list {
          border: 1px solid var(--mdb-border);
          border-radius: var(--mdb-radius);
          overflow: hidden;
          background: var(--mdb-card);
        }
        .mini-row {
          display: flex;
          align-items: center;
          gap: 7px;
          color: var(--mdb-muted);
          font-size: 0.78rem;
          padding: 10px;
          border-bottom: 1px solid var(--mdb-border);
        }
        .mini-row:last-child {
          border-bottom: none;
        }
        @media (min-width: 1280px) {
          .ai-rail {
            display: flex;
          }
        }
      `}</style>
    </aside>
  );
}
