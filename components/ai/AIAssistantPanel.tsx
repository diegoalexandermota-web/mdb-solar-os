type AIAssistantPanelProps = {
  title?: string;
  description?: string;
  bullets?: string[];
  actionLabel?: string;
};

export default function AIAssistantPanel({
  title = 'MDB AI Assistant',
  description = 'AI-powered recommendations for sales, follow-up strategy, and pipeline prioritization.',
  bullets = [],
  actionLabel = 'Open AI Assistant',
}: AIAssistantPanelProps) {
  return (
    <aside className="ai-panel">
      <div className="ai-panel-badge">AI</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {bullets.length > 0 && (
        <ul>
          {bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      <button type="button">{actionLabel}</button>

      <style jsx>{`
        .ai-panel {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 8px 30px -20px rgba(15, 23, 42, 0.45);
        }
        .ai-panel-badge {
          width: 34px;
          height: 22px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 0.7rem;
          font-weight: 700;
          color: #1d4ed8;
          background: rgba(37, 99, 235, 0.12);
          margin-bottom: 8px;
        }
        .ai-panel h3 {
          margin: 0 0 8px;
          color: #0f172a;
          font-size: 1.03rem;
        }
        .ai-panel p {
          margin: 0 0 10px;
          color: #334155;
          line-height: 1.45;
          font-size: 0.92rem;
        }
        .ai-panel ul {
          margin: 0 0 12px;
          padding-left: 18px;
          color: #334155;
          font-size: 0.88rem;
        }
        .ai-panel button {
          border: none;
          border-radius: 10px;
          padding: 9px 12px;
          font-weight: 600;
          color: #0f172a;
          background: #e2e8f0;
          cursor: pointer;
        }
      `}</style>
    </aside>
  );
}
