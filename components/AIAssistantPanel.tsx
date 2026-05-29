import { useState } from 'react';
import { useAI } from '../utils/aiHooks';
import { supabase } from '../utils/supabaseClient';

export default function AIAssistantPanel({ context }: { context: any }) {
  const [message, setMessage] = useState('');
  const [aiOutput, setAiOutput] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [preferredChannel, setPreferredChannel] = useState<'WhatsApp'|'SMS'|'Email'>('WhatsApp');
  const { loading: followupLoading, runAI: runFollowup, error: followupError } = useAI('generate-followup');
  const { loading: summarizeLoading, runAI: runSummarize, error: summarizeError } = useAI('summarize-lead');
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleGenerateFollowup() {
    setShowEditor(false);
    setAiOutput(null);
    const lead = context.lead || {};
    const payload = {
      lead_id: lead.id,
      customer_name: lead.name,
      phone: lead.phone,
      email: lead.email,
      service_type: lead.service_type,
      pipeline_stage: lead.pipeline_stage,
      monthly_bill: lead.monthly_bill,
      utility_company: lead.utility_company,
      notes: lead.notes,
      preferred_channel: preferredChannel,
    };
    const res = await runFollowup(payload);
    let output = res;
    if (!output || output.error || !output.message_text) {
      output = {
        message_text: `Hi ${lead.name}, just checking in regarding your solar project. Let us know if you have any questions or want to move forward!`,
        channel: preferredChannel,
        tone: 'Professional',
        suggested_next_action: 'Follow up with customer',
      };
    }
    setAiOutput(output);
    setMessage(output.message_text);
    setShowEditor(true);
    setSaving(true);
    await supabase.from('ai_logs').insert([{
      user_id: lead.owner_id,
      action: 'generate-followup',
      context: payload,
    }]);
    await supabase.from('ai_messages').insert([{
      user_id: lead.owner_id,
      role: 'assistant',
      message: output.message_text,
      context: payload,
    }]);
    setSaving(false);
  }

  async function handleSummarizeLead() {
    setSummaryLoading(true);
    setSummary(null);
    const lead = context.lead || {};
    const proposal = context.proposal || {};
    const payload = {
      lead_id: lead.id,
      customer_name: lead.name,
      service_type: lead.service_type,
      pipeline_stage: lead.pipeline_stage,
      monthly_bill: lead.monthly_bill,
      utility_company: lead.utility_company,
      notes: lead.notes,
      related_tasks: context.tasks || [],
      proposal_status: proposal.status,
      financing_scenarios: proposal.financing_scenarios || [],
      follow_up_history: context.follow_up_history || [],
    };
    const res = await runSummarize(payload);
    let output = res;
    if (!output || output.error || !output.lead_summary) {
      output = {
        lead_summary: `Customer ${lead.name} is interested in ${lead.service_type || 'solar'} and is currently at stage: ${lead.pipeline_stage}.`,
        customer_intent: 'Interested',
        current_status: lead.pipeline_stage,
        missing_information: ['Utility bill'],
        risk_flags: ['No recent follow-up'],
        recommended_next_action: 'Schedule a call',
        urgency_level: 'Medium',
        financing_recommendation: 'Recommend loan with GoodLeap',
        follow_up_priority: 'High',
      };
    }
    setSummary(output);
    setSummaryLoading(false);
    // Save to ai_logs and ai_recommendations
    setSaving(true);
    await supabase.from('ai_logs').insert([{
      user_id: lead.owner_id,
      action: 'summarize-lead',
      context: payload,
    }]);
    await supabase.from('ai_recommendations').insert([{
      user_id: lead.owner_id,
      lead_id: lead.id,
      proposal_id: proposal.id,
      recommendation: output.lead_summary,
      type: 'summary',
    }]);
    setSaving(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(message);
  }

  function handleSend() {
    // Placeholder for notification integration
    alert('Notification system coming soon.');
  }

  return (
    <div style={{background:'#f4f6fa',padding:16,borderRadius:8,marginTop:16}}>
      <h3>MDB AI Assistant</h3>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
        <button onClick={handleGenerateFollowup} disabled={followupLoading || saving}>Generate Follow-Up</button>
        <select value={preferredChannel} onChange={e=>setPreferredChannel(e.target.value as any)}>
          <option value="WhatsApp">WhatsApp</option>
          <option value="SMS">SMS</option>
          <option value="Email">Email</option>
        </select>
        <button onClick={handleSummarizeLead} disabled={summarizeLoading || saving}>Summarize Lead</button>
      </div>
      {followupLoading && <div>Generating follow-up...</div>}
      {summarizeLoading && <div>Summarizing lead...</div>}
      {followupError && <div style={{color:'red'}}>{followupError}</div>}
      {summarizeError && <div style={{color:'red'}}>{summarizeError}</div>}
      {showEditor && aiOutput && (
        <div style={{marginTop:16}}>
          <textarea style={{width:'100%',minHeight:80}} value={message} onChange={e=>setMessage(e.target.value)} />
          <div style={{marginTop:8,display:'flex',gap:8}}>
            <button onClick={handleCopy}>Copy</button>
            {aiOutput.channel === 'WhatsApp' && <button onClick={handleSend}>Send via WhatsApp</button>}
            {aiOutput.channel === 'SMS' && <button onClick={handleSend}>Send SMS</button>}
            {aiOutput.channel === 'Email' && <button onClick={handleSend}>Send Email</button>}
          </div>
          <div style={{marginTop:8}}>
            <b>Tone:</b> {aiOutput.tone} <b>Next Action:</b> {aiOutput.suggested_next_action}
          </div>
        </div>
      )}
      {summary && (
        <div style={{marginTop:24,background:'#fff',padding:16,borderRadius:8,border:'1px solid #2b3990'}}>
          <h4>Lead Summary</h4>
          <div><b>Summary:</b> {summary.lead_summary}</div>
          <div><b>Risks:</b> {Array.isArray(summary.risk_flags) ? summary.risk_flags.join(', ') : summary.risk_flags}</div>
          <div><b>Missing Items:</b> {Array.isArray(summary.missing_information) ? summary.missing_information.join(', ') : summary.missing_information}</div>
          <div><b>Recommended Action:</b> {summary.recommended_next_action}</div>
          <div><b>Suggested Financing:</b> {summary.financing_recommendation}</div>
          <div><b>Follow-Up Priority:</b> {summary.follow_up_priority}</div>
        </div>
      )}
    </div>
  );
}
