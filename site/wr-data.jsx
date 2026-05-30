/* ============================================================
   wr-data.jsx — seed data for the War Room
   window.WR = { CATS, VPS, SEED_ITEMS, SHARED, totalPaws, suggestedCap }
   Items are EDITABLE at runtime; this is just the starting set.
   type: 'issue' | 'committee'   parent: issueId (committees only)
   paws: 1–5 tiger-paw weight (load/effort)
   ============================================================ */

const CATS = {
  ops:   { label: 'Operations', color: 'oklch(0.62 0.13 248)' },
  comm:  { label: 'Community',  color: 'oklch(0.64 0.15 45)'  },
  acad:  { label: 'Academic',   color: 'oklch(0.60 0.12 158)' },
  well:  { label: 'Wellness',   color: 'oklch(0.66 0.13 350)' },
  gov:   { label: 'Governance', color: 'oklch(0.58 0.14 288)' },
  comms: { label: 'Comms',      color: 'oklch(0.70 0.12 85)'  },
};

// Day & Evening VPs (co-equal). President holds neutral / veto. 'shared' = unassigned pile.
const VPS = {
  day:    { id: 'day',    short: 'DAY', role: 'Day Vice President',     rep: 'Day Student class',     tint: 'var(--secondary)', on: 'var(--on-secondary)' },
  eve:    { id: 'eve',    short: 'EVE', role: 'Evening Vice President', rep: 'Evening Student class', tint: 'var(--accent)',    on: 'var(--on-accent)' },
  shared: { id: 'shared', short: 'SBA', role: 'Shared / Unassigned',    rep: 'Held jointly',          tint: 'var(--muted)',     on: '#fff' },
  pres:   { id: 'pres',   short: 'PR',  role: 'President',              rep: 'Approve · veto',        tint: 'var(--muted)',     on: '#fff' },
};

const SEED_ITEMS = [
  // ---------- ISSUES / FOCUS AREAS ----------
  { id: 'wellness',    type: 'issue', name: 'Student Wellness & Support',    cat: 'well',  paws: 3, blurb: 'Wellness programming, counseling access, finals care.' },
  { id: 'events',      type: 'issue', name: 'Events & Programming',          cat: 'comm',  paws: 4, blurb: 'Social calendar, signature events, student life.' },
  { id: 'dei',         type: 'issue', name: 'Diversity, Equity & Inclusion', cat: 'comm',  paws: 3, blurb: 'Affinity orgs, inclusive programming, heritage months.' },
  { id: 'alumni',      type: 'issue', name: 'Alumni & Advancement',          cat: 'comm',  paws: 2, blurb: 'Alumni relations, sponsorships, fundraising.' },
  { id: 'sustain',     type: 'issue', name: 'Sustainability & Campus',       cat: 'ops',   paws: 2, blurb: 'Green initiatives, waste, campus environment.' },
  { id: 'commsissue',  type: 'issue', name: 'Communications & Publicity',    cat: 'comms', paws: 3, blurb: 'Newsletter, social, announcements, branding.' },
  { id: 'gov',         type: 'issue', name: 'Governance & Elections',        cat: 'gov',   paws: 3, blurb: 'Bylaws, election administration, parliamentary order.' },
  { id: 'masters',     type: 'issue', name: 'Graduate & Master’s Programs',  cat: 'acad',  paws: 2, blurb: 'LLM / MSL student needs and representation.' },
  { id: 'academic',    type: 'issue', name: 'Academic Affairs',              cat: 'acad',  paws: 4, blurb: 'Exam policy, curriculum feedback, faculty liaison.' },
  { id: 'orgs',        type: 'issue', name: 'Student Org Relations & Funding',cat: 'ops',  paws: 4, blurb: 'Budget asks, charter approvals, org liaison.' },
  { id: 'orientation', type: 'issue', name: '1L Orientation & Mentorship',   cat: 'acad',  paws: 3, blurb: 'Onboarding, mentor matching, 1L socials.' },
  { id: 'facilities',  type: 'issue', name: 'Facilities & Technology',       cat: 'ops',   paws: 2, blurb: 'Lockers, study space, A/V, the SBA site & forms.' },

  // ---------- COMMITTEES (nested under an issue) ----------
  { id: 'c_wellness',  type: 'committee', parent: 'wellness',   name: 'Wellness Committee',                cat: 'well',  paws: 2 },
  { id: 'c_events',    type: 'committee', parent: 'events',     name: 'Events & Coordination Committee',   cat: 'comm',  paws: 3 },
  { id: 'c_ball',      type: 'committee', parent: 'events',     name: 'Barrister’s Ball Committee',        cat: 'comm',  paws: 4 },
  { id: 'c_sports',    type: 'committee', parent: 'events',     name: 'Sports & Activities Committee',      cat: 'comm',  paws: 2 },
  { id: 'c_diversity', type: 'committee', parent: 'dei',        name: 'Diversity Committee',               cat: 'comm',  paws: 2 },
  { id: 'c_alumni',    type: 'committee', parent: 'alumni',     name: 'Alumni Committee',                  cat: 'comm',  paws: 2 },
  { id: 'c_sustain',   type: 'committee', parent: 'sustain',    name: 'Sustainability Committee',          cat: 'ops',   paws: 2 },
  { id: 'c_publicity', type: 'committee', parent: 'commsissue', name: 'Publicity Committee',               cat: 'comms', paws: 2 },
  { id: 'c_elections', type: 'committee', parent: 'gov',        name: 'SBA Elections Committee',            cat: 'gov',   paws: 2 },
  { id: 'c_masters',   type: 'committee', parent: 'masters',    name: 'Master’s Committee',                cat: 'acad',  paws: 2 },
];

// Section 5.02 — shared, never drafted.
const SHARED = {
  cite: 'Bylaws § 5.02 — Vice Presidents',
  intro: 'There shall be a Day Vice President and an Evening Vice President, each enrolled in and representing their respective class at large. The following authority & duties are held JOINTLY and are not part of the draft.',
  duties: [
    { k: 'A', t: 'Place Members on all standing / ad-hoc committees of SBA, and assign positions of authority within them.' },
    { k: 'B', t: 'Monitor all standing & ad-hoc committees of SBA.' },
    { k: 'C', t: 'Act as liaisons between SBA and its committees, as designated by the President and approved by a simple majority of SBA.' },
    { k: 'D', t: 'Present the Chair of each committee with a list of general procedures & duties to help facilitate the committee’s function.' },
    { k: 'E', t: 'Call and preside over a meeting of SBA if the President is unable.' },
  ],
  presiding: [
    'The President may designate either VP to preside and represent the President in a voting capacity in their absence.',
    'If the President does not designate, the Evening VP presides and represents the President.',
    'If the Evening VP is unavailable, the Day VP performs this duty.',
  ],
  alsoShared: ['Assigning faculty-committee roles', 'Appointing committee chairs'],
};

const totalPaws = SEED_ITEMS.reduce((s, i) => s + i.paws, 0);
const suggestedCap = Math.round(totalPaws * 0.45); // < half ⇒ leftovers land in the shared pile

window.WR = { CATS, VPS, SEED_ITEMS, SHARED, totalPaws, suggestedCap };
