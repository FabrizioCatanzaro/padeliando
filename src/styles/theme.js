export const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; }
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  ::-webkit-scrollbar { width: 6px; background: #0a0e1a; }
  ::-webkit-scrollbar-thumb { background: #2a3040; border-radius: 3px; }
  input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
`;

const S = {
  // ── Layout ──────────────────────────────────────────────────────────────────
  page:    { minHeight: "100vh", background: "#0a0e1a", color: "#ccc", fontFamily: "'Barlow', sans-serif", padding: "0 0 60px" },
  header:  { padding: "24px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, borderBottom: "1px solid #1a1f2e" },
  content: { padding: "24px" },

  // ── Header ──────────────────────────────────────────────────────────────────
  logo:        { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: 2, color: "#fff" },
  tourneyName: { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 28, color: "#fff", marginTop: 4, letterSpacing: 1 },
  meta:        { fontSize: 12, color: "#555", fontFamily: "'Courier New', monospace", marginTop: 4 },

  // ── Buttons ─────────────────────────────────────────────────────────────────
  shareBtn:   { background: "#e8f04a", color: "#0a0e1a", border: "none", padding: "8px 16px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: 1, fontSize: 13, cursor: "pointer", borderRadius: 4 },
  primaryBtn: { background: "#e8f04a", color: "#0a0e1a", border: "none", padding: "10px 20px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: "pointer", borderRadius: 4, whiteSpace: "nowrap" },
  resetBtn:   { background: "transparent", color: "#555", border: "1px solid #2a3040", padding: "8px 12px", fontSize: 12, cursor: "pointer", borderRadius: 4, fontFamily: "'Barlow', sans-serif" },
  actionBtn:  { background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12, fontFamily: "'Barlow', sans-serif", padding: "2px 6px" },
  addBtn:     { background: "none", border: "1px dashed #2a3040", color: "#555", padding: "8px 16px", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, fontSize: 13, borderRadius: 4, width: "100%", marginTop: 8 },
  dangerBtn:  { background: "transparent", border: "1px solid #333", color: "#f04a4a", padding: "9px 16px", fontSize: 13, cursor: "pointer", borderRadius: 4, fontFamily: "'Barlow', sans-serif" },

  // ── Badges ──────────────────────────────────────────────────────────────────
  readonlyBadge: { background: "#1a1f2e", color: "#4af0c8", border: "1px solid #4af0c844", padding: "6px 12px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: 1, fontSize: 12, borderRadius: 4 },
  savedBadge:    { background: "#1a2e1a", color: "#4af07a", padding: "6px 16px", fontSize: 12, fontFamily: "'Courier New', monospace", textAlign: "center" },
  infoBanner:    { background: "#111827", border: "1px solid #2a3040", borderRadius: 6, padding: "10px 14px", fontSize: 12, color: "#aaa", fontFamily: "'Courier New', monospace", lineHeight: 1.5 },

  // ── Tabs ────────────────────────────────────────────────────────────────────
  tabs:      { display: "flex", borderBottom: "1px solid #1a1f2e", padding: "0 16px", gap: 0, alignItems: "center", overflowX: "auto" },
  tab:       { background: "none", border: "none", color: "#555", padding: "14px 14px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, cursor: "pointer", borderBottom: "2px solid transparent", transition: "all 0.2s", whiteSpace: "nowrap" },
  tabActive: { color: "#e8f04a", borderBottom: "2px solid #e8f04a" },

  sectionTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: 3, color: "#555", marginBottom: 16 },

  // ── Standings table ─────────────────────────────────────────────────────────
  table:   { width: "100%", borderCollapse: "collapse", fontFamily: "'Barlow Condensed', sans-serif" },
  th:      { padding: "10px 12px", textAlign: "center", fontSize: 11, letterSpacing: 2, color: "#555", borderBottom: "1px solid #1a1f2e", fontFamily: "'Courier New', monospace" },
  td:      { padding: "12px", textAlign: "center", fontSize: 15, color: "#888" },
  trEven:  { background: "#0d1120" },
  trOdd:   { background: "#0a0e1a" },
  legend:  { marginTop: 12, fontSize: 11, color: "#333", fontFamily: "'Courier New', monospace" },

  // ── Setup ───────────────────────────────────────────────────────────────────
  setupCard: { maxWidth: 500, margin: "0 auto", padding: "40px 28px" },
  subtitle:  { color: "#555", fontFamily: "'Barlow', sans-serif", fontSize: 14, marginTop: 4, marginBottom: 28 },
  label:     { display: "block", fontSize: 11, letterSpacing: 2, color: "#555", fontFamily: "'Courier New', monospace", marginBottom: 8, marginTop: 20 },
  input:     { width: "100%", background: "#0d1120", border: "1px solid #1a2030", color: "#fff", padding: "10px 14px", fontFamily: "'Barlow', sans-serif", fontSize: 14, borderRadius: 4, outline: "none", marginBottom: 8 },
  removeBtn: { background: "#1a1f2e", border: "none", color: "#555", padding: "10px 12px", cursor: "pointer", borderRadius: 4, fontSize: 12, flexShrink: 0 },
  createBtn: { width: "100%", background: "#e8f04a", color: "#0a0e1a", border: "none", padding: "14px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 16, letterSpacing: 2, borderRadius: 4, marginTop: 28, transition: "opacity 0.2s", cursor: "pointer" },

  // ── Match form ──────────────────────────────────────────────────────────────
  form:       { background: "#0d1120", border: "1px solid #1a2030", borderRadius: 8, padding: 20, marginBottom: 24 },
  formTitle:  { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 2, color: "#555", marginBottom: 16 },
  formGrid:   { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "start" },
  teamLabel:  { fontSize: 11, letterSpacing: 2, color: "#e8f04a", fontFamily: "'Courier New', monospace", marginBottom: 8, fontWeight: 700 },
  vsLabel:    { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 32, color: "#2a3040", textAlign: "center" },
  select:     { width: "100%", background: "#0a0e1a", border: "1px solid #1a2030", color: "#ccc", padding: "9px 12px", fontFamily: "'Barlow', sans-serif", fontSize: 13, borderRadius: 4, outline: "none", marginBottom: 8 },
  scoreInput: { width: 60, background: "#0a0e1a", border: "1px solid #2a3040", color: "#fff", padding: "10px 8px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 700, textAlign: "center", borderRadius: 4, outline: "none" },

  // ── Match card ──────────────────────────────────────────────────────────────
  matchCard:      { background: "#0d1120", border: "1px solid #1a2030", borderRadius: 8, padding: "14px 16px" },
  matchDate:      { fontSize: 11, color: "#444", fontFamily: "'Courier New', monospace", marginBottom: 10 },
  matchRow:       { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  matchTeam:      { flex: 1, display: "flex", alignItems: "center", gap: 8, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 16 },
  matchTeamRight: { justifyContent: "flex-end", textAlign: "right" },
  teamBadge:      { background: "#1a2030", padding: "2px 6px", borderRadius: 3, fontSize: 11, color: "#555", fontFamily: "'Courier New', monospace", flexShrink: 0 },
  matchScore:     { display: "flex", alignItems: "center", gap: 8, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, minWidth: 80, justifyContent: "center" },
  scoreDash:      { color: "#2a3040", fontSize: 20 },
  matchActions:   { display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid #1a2030" },

  // ── Stats ───────────────────────────────────────────────────────────────────
  statsGrid:     { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 8 },
  statCard:      { background: "#0d1120", border: "1px solid #1a2030", borderRadius: 8, padding: 16, textAlign: "center" },
  statIcon:      { fontSize: 28, marginBottom: 8 },
  statValue:     { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 26, color: "#fff", marginBottom: 4 },
  statLabel:     { fontSize: 12, color: "#555", fontFamily: "'Barlow', sans-serif" },
  playerStatRow: { display: "flex", alignItems: "center", gap: 12, background: "#0d1120", border: "1px solid #1a2030", borderRadius: 6, padding: "10px 14px" },

  // ── Management ──────────────────────────────────────────────────────────────
  manageSection: { background: "#0d1120", border: "1px solid #1a2030", borderRadius: 8, padding: 16, marginBottom: 16 },
  playerRow:     { display: "flex", alignItems: "center", gap: 8, background: "#0a0e1a", border: "1px solid #1a2030", borderRadius: 6, padding: "8px 12px" },
  dangerZone:    { background: "#0d0a0a", border: "1px solid #f04a4a22", borderRadius: 8, padding: 16, marginTop: 8 },

  // ── Modal ───────────────────────────────────────────────────────────────────
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 },
  modalBox:     { background: "#0d1120", border: "1px solid #2a3040", borderRadius: 10, padding: 24, maxWidth: 420, width: "100%" },
  modalTitle:   { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 10 },
  modalMessage: { fontSize: 14, color: "#888", lineHeight: 1.6, fontFamily: "'Barlow', sans-serif" },

  // ── Empty state ─────────────────────────────────────────────────────────────
  empty: { textAlign: "center", color: "#444", padding: "40px 20px", fontFamily: "'Barlow', sans-serif", lineHeight: 1.8 },

  groupCard: {
    background: '#0d1120', border: '1px solid #1a2030', borderRadius: 8,
    padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.2s',
  },

};

export default S;