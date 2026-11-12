// Offline answers for Kimi AI when the AI service is unavailable (e.g. out of credits).
export function kimiFallbackAnswer(question: string): string {
  const q = question.toLowerCase();
  const close = " Book at /book or call/WhatsApp +1 868-763-1106.";
  if (/price|cost|rate|how much|fee|quote|\$/.test(q))
    return "Current rates: Domestic from TTD 400, Commercial minimum TTD 1,200 (includes 1–2 crew), plus a non-negotiable TTD 110 appointment fee. Transport & towing is sold separately (flatbed from TTD 450, cross-island from TTD 750)." + close;
  if (/tow|transport|flatbed|wrecker/.test(q))
    return "Transport & towing is sold separately from repairs: flatbed wrecker from TTD 450, cross-island haulage from TTD 750. Combos with mechanic service come with perks." + close;
  if (/electric|breaker|wiring|generator|power|surge/.test(q))
    return "Our electrician handles breaker panels, surge protection, generator tie-ins and automotive electrical, following T&TEC safety practice." + close;
  if (/car|engine|mechanic|brake|battery|obd|start|a\/c|suspension/.test(q))
    return "Our mobile mechanic covers OBD-II diagnostics, no-start, brakes, suspension, A/C, batteries and alternators on-site, with OEM parts." + close;
  if (/garden|lawn|landscap|floral|decor|grass|tree/.test(q))
    return "Reservations cover landscaping, exterior decor, garden and floral maintenance. Domestic from TTD 400, Commercial minimum TTD 1,200." + close;
  if (/class|course|learn|lesson/.test(q))
    return "We offer live and on-demand practical online classes for automotive and electrical skills." + close;
  if (/hour|open|when|area|where|location/.test(q))
    return "We work Mon–Sat 9:00–17:00 (closed Sundays) across Port of Spain, Chaguanas, San Fernando and nearby areas, on-site or virtual." + close;
  if (/pay|bank|wire|paypal|card/.test(q))
    return "Pay by bank transfer to First Citizens (account 003108954, SWIFT FCTTTTPS) or PayPal via the /pay page. Staff confirm transfers before approval." + close;
  return "Hi, I'm Kimi from DUAA. We do mobile mechanic, electrician, towing & transport, landscaping and online classes across Trinidad & Tobago." + close;
}
