-- Demo Data for MDB Solar OS

-- Leads
insert into leads (id, name, email, phone, pipeline_stage, archived) values
  ('demo-lead-1', 'Jane Doe', 'jane@example.com', '+15555550123', 'New Lead', false),
  ('demo-lead-2', 'John Smith', 'john@example.com', '+15555550124', 'Proposal Sent', false);

-- Proposals
insert into proposals (id, customer_name, lead_id, status, archived) values
  ('demo-prop-1', 'Jane Doe', 'demo-lead-1', 'Draft', false),
  ('demo-prop-2', 'John Smith', 'demo-lead-2', 'Sent', false);

-- Financing Scenarios
insert into financing_scenarios (proposal_id, provider, program_type, monthly_payment, is_recommended) values
  ('demo-prop-1', 'GoodLeap', 'Loan', 120, true),
  ('demo-prop-2', 'Sunrun', 'Lease / PPA', 95, true);

-- Tasks
insert into tasks (id, lead_id, title, type, due_date, priority, completed) values
  ('demo-task-1', 'demo-lead-1', 'Call Jane', 'Call', '2026-06-01', 'High', false),
  ('demo-task-2', 'demo-lead-2', 'Send Proposal', 'Email', '2026-06-02', 'Medium', false);

-- AI Summaries
insert into ai_recommendations (lead_id, proposal_id, recommendation, type) values
  ('demo-lead-1', 'demo-prop-1', 'Jane Doe is a high-priority lead. Recommend follow-up call and GoodLeap loan.', 'summary');

-- Customer Portal Example
insert into projects (id, lead_id, address, assigned_rep, status) values
  ('demo-project-1', 'demo-lead-1', '123 Solar Ave', 'Rep A', 'Proposal Sent');
