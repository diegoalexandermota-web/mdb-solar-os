// utils/generateProposalPDF.ts
// Lightweight client-side PDF generator for MDB Solar OS proposals
import jsPDF from 'jspdf';

export interface ProposalPDFData {
  customer_name: string;
  address: string;
  utility_company: string;
  system_size_kw: string | number;
  panel_count: string | number;
  estimated_production: string;
  estimated_offset: string;
  financing_summary: string;
  ai_executive_summary: string;
  homeowner_benefit: string;
  next_step: string;
  proposal_date: string;
}

export function generateProposalPDF(data: ProposalPDFData): jsPDF {
  const doc = new jsPDF();
  // MDB Solar branding
  doc.setFillColor(10, 35, 66); // Navy
  doc.rect(0, 0, 210, 30, 'F');
  doc.setFontSize(22);
  doc.setTextColor(251, 176, 64); // Yellow
  doc.text('MDB Solar Proposal', 14, 20);
  doc.setFontSize(12);
  doc.setTextColor(0,0,0);
  doc.text(`Date: ${data.proposal_date}`, 160, 20);

  // Customer Info
  doc.setFontSize(14);
  doc.setTextColor(10, 35, 66);
  doc.text('Customer Information', 14, 40);
  doc.setFontSize(12);
  doc.setTextColor(0,0,0);
  doc.text(`Name: ${data.customer_name}`, 14, 48);
  doc.text(`Address: ${data.address}`, 14, 54);
  doc.text(`Utility Company: ${data.utility_company}`, 14, 60);

  // System Info
  doc.setFontSize(14);
  doc.setTextColor(10, 35, 66);
  doc.text('System Details', 14, 72);
  doc.setFontSize(12);
  doc.setTextColor(0,0,0);
  doc.text(`System Size: ${data.system_size_kw} kW`, 14, 80);
  doc.text(`Panel Count: ${data.panel_count}`, 14, 86);
  doc.text(`Estimated Production: ${data.estimated_production}`, 14, 92);
  doc.text(`Estimated Offset: ${data.estimated_offset}`, 14, 98);

  // Financing
  doc.setFontSize(14);
  doc.setTextColor(10, 35, 66);
  doc.text('Financing Summary', 14, 110);
  doc.setFontSize(12);
  doc.setTextColor(0,0,0);
  doc.text(data.financing_summary, 14, 116, { maxWidth: 180 });

  // AI Executive Summary
  doc.setFontSize(14);
  doc.setTextColor(10, 35, 66);
  doc.text('Executive Summary', 14, 128);
  doc.setFontSize(12);
  doc.setTextColor(0,0,0);
  doc.text(data.ai_executive_summary, 14, 134, { maxWidth: 180 });

  // Homeowner Benefit
  doc.setFontSize(14);
  doc.setTextColor(10, 35, 66);
  doc.text('Homeowner Benefit', 14, 146);
  doc.setFontSize(12);
  doc.setTextColor(0,0,0);
  doc.text(data.homeowner_benefit, 14, 152, { maxWidth: 180 });

  // Next Steps
  doc.setFontSize(14);
  doc.setTextColor(10, 35, 66);
  doc.text('Next Steps', 14, 164);
  doc.setFontSize(12);
  doc.setTextColor(0,0,0);
  doc.text(data.next_step, 14, 170, { maxWidth: 180 });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(120,120,120);
  doc.text('MDB Solar | www.mdbsolar.com | info@mdbsolar.com', 14, 285);

  return doc;
}
