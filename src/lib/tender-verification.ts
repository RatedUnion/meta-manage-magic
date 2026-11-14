/**
 * DUAA Tender Verification & Manual Intake Engine
 * Path: src/lib/tender-verification.ts
 * 
 * Verifies procurement notices labeled "Open" against actual closing dates,
 * mandatory pre-bid site visits, and DUAA commercial margin thresholds.
 */

export type PortalStatus = "Open" | "Active" | "Closed" | "Unspecified";

export type VerificationState =
  | "VERIFIED_ACTIVE"        // Safe to bid: Valid future date and margins met
  | "EXPIRED_CONFLICT"      // Document marked open on portal, but deadline has passed
  | "SITE_VISIT_DISQUALIFIED"// Submission is open, but mandatory site visit was missed
  | "CRITICAL_WINDOW"       // Valid tender, but closes within 72 hours
  | "MARGIN_DISQUALIFIED"   // Submissions under DUAA commercial floor (TTD $1,200)
  | "UNPRICED_RFP";         // Value unknown / bill of quantities required

export interface ManualTenderInput {
  title: string;
  issuingAgency: string;
  portalSource: string;
  portalStatusLabel: PortalStatus;
  submissionDeadline: string; // ISO date 'YYYY-MM-DD' or full ISO string
  mandatorySiteVisitDate?: string; // Optional pre-bid meeting or site visit date
  estimatedValueTTD: number;
  scopeSummary: string;
  scoutedByBotId?: "volt" | "wrench" | "transit" | "flora" | "nexus" | "auditor";
  scoutedByBotName?: string;
}

export interface VerifiedTenderRecord extends ManualTenderInput {
  id: string;
  verifiedAt: string;
  verificationState: VerificationState;
  daysRemaining: number;
  siteVisitDaysRemaining: number | null;
  nexusCommercialScore: number;
  nexusDirective: string;
  canProceedToBid: boolean;
}

/**
 * Validates raw portal information against real deadlines and DUAA rules:
 * - Domestic services start from TTD $400
 * - Commercial contract baseline is minimum TTD $1,200 (1-2 crew members)
 */
export function verifyAndCreateTender(input: ManualTenderInput): VerifiedTenderRecord {
  const now = new Date();
  const deadline = new Date(input.submissionDeadline);
  const siteVisit = input.mandatorySiteVisitDate ? new Date(input.mandatorySiteVisitDate) : null;

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / msPerDay);
  const siteVisitDaysRemaining = siteVisit ? Math.ceil((siteVisit.getTime() - now.getTime()) / msPerDay) : null;

  let verificationState: VerificationState = "VERIFIED_ACTIVE";
  let canProceed = true;
  let score = 85;
  let directive = "";

  // 1. Conflict: Portal states "Open", but deadline timestamp is in the past
  if (!isNaN(deadline.getTime()) && deadline.getTime() < now.getTime()) {
    verificationState = "EXPIRED_CONFLICT";
    canProceed = false;
    score = 0;
    directive = `DISQUALIFIED (EXPIRED): Portal lists notice as "${input.portalStatusLabel}", but closing date passed on ${deadline.toISOString().slice(0, 10)}. Do not submit bid bond.`;
  }
  // 2. Conflict: Tender is open, but mandatory site visit / pre-bid conference was missed
  else if (siteVisit && !isNaN(siteVisit.getTime()) && siteVisit.getTime() < now.getTime()) {
    verificationState = "SITE_VISIT_DISQUALIFIED";
    canProceed = false;
    score = 15;
    directive = `DISQUALIFIED: Mandatory site inspection took place on ${siteVisit.toISOString().slice(0, 10)}. OPR / Procurement Act regulations prohibit submission without mandatory attendance.`;
  }
  // 3. Commercial Margin Floor: Minimum TTD $1,200
  else if (input.estimatedValueTTD > 0 && input.estimatedValueTTD < 1200) {
    verificationState = "MARGIN_DISQUALIFIED";
    canProceed = false;
    score = 25;
    directive = `MARGIN REJECTED: Valued at TTD $${input.estimatedValueTTD.toLocaleString()}, which falls below DUAA's commercial floor of TTD $1,200 (1-2 crew members).`;
  }
  // 4. Critical Window: Tender closes within 3 days
  else if (daysRemaining >= 0 && daysRemaining <= 3) {
    verificationState = "CRITICAL_WINDOW";
    score = 90;
    directive = `EXPEDITE BID: Only ${daysRemaining} day(s) remain until closing. Fast-track BIR/NIS clearances, insurance binders, and schedule supervisor dispatch.`;
  }
  // 5. Unpriced RFP / Tender
  else if (input.estimatedValueTTD === 0) {
    verificationState = "UNPRICED_RFP";
    score = 65;
    directive = `UNPRICED SCOPE: Requires Bill of Quantities (BOQ) takeoff. Pricing valued by volume and materials agenda.`;
  } else {
    directive = `APPROVED: Scope verified. ${daysRemaining} days remaining before submission. Fits commercial fleet & technical criteria.`;
  }

  return {
    ...input,
    id: `tender-${Date.now()}`,
    verifiedAt: now.toISOString(),
    verificationState,
    daysRemaining,
    siteVisitDaysRemaining,
    nexusCommercialScore: score,
    nexusDirective: directive,
    canProceedToBid: canProceed,
  };
}
