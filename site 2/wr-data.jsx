/* ============================================================
   wr-data.jsx — seed data for the War Room
   window.WR = { CATS, VPS, SEED_ITEMS, SHARED, totalPaws, suggestedCap }
   Items are EDITABLE at runtime; this is just the starting set.
   type: 'issue' | 'committee'   parent: issueId (committees only)
   paws: 1-5 workload weight (effort / load), shown as paw pips.
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
  // ---------- ISSUES / FOCUS AREAS (weights = VPs' agreed values) ----------
  { id: 'wellness',    type: 'issue', name: 'Student Health & Wellness',     cat: 'well',  paws: 2,   blurb: 'Mental-health and wellness programming, counseling access, finals-season care, and student support services.' },
  { id: 'events',      type: 'issue', name: 'Events & Programming',          cat: 'comm',  paws: 3,   blurb: 'The social calendar end to end: signature events, mixers, and the rhythm of student life across both divisions.' },
  { id: 'dei',         type: 'issue', name: 'Diversity, Equity & Inclusion', cat: 'comm',  paws: 3,   blurb: 'Affinity-org support, inclusive programming, heritage-month events, and an inclusive student community.' },
  { id: 'alumni',      type: 'issue', name: 'Alumni & Advancement',          cat: 'comm',  paws: 2.5, blurb: 'Alumni relations, networking pipelines, sponsorships, and fundraising for SBA initiatives.' },
  { id: 'sustain',     type: 'issue', name: 'Sustainability & Campus',       cat: 'ops',   paws: 3,   blurb: 'Recycling and waste reduction, green initiatives, and the day-to-day campus environment.' },
  { id: 'commsissue',  type: 'issue', name: 'Communications & Publicity',    cat: 'comms', paws: 2,   blurb: 'Newsletter, social media, official announcements, and SBA branding and voice.' },
  { id: 'gov',         type: 'issue', name: 'Governance & Elections',        cat: 'gov',   paws: 4,   blurb: 'Bylaws and amendments, election administration, and parliamentary order at SBA meetings.' },
  { id: 'masters',     type: 'issue', name: 'Graduate & Master’s Programs',  cat: 'acad',  paws: 1.5, blurb: 'Representation and programming for LLM and MSL students, whose needs differ from the JD track.' },
  { id: 'academic',    type: 'issue', name: 'Academic Affairs',              cat: 'acad',  paws: 3.5, blurb: 'Exam policy, curriculum feedback, grading concerns, and serving as liaison to faculty and the Deans.' },
  { id: 'orgs',        type: 'issue', name: 'Student Org Relations & Funding',cat: 'ops',  paws: 3,   blurb: 'Budget requests, charter approvals, funding allocations, and acting as liaison to student organizations.' },
  { id: 'orientation', type: 'issue', name: '1L Orientation & Mentorship',   cat: 'acad',  paws: 4,   blurb: 'Onboarding for new students, mentor matching, and early-semester socials for the incoming class.' },
  { id: 'facilities',  type: 'issue', name: 'Facilities & Technology',       cat: 'ops',   paws: 3,   blurb: 'Lockers, study space, A/V and classroom tech, and the SBA website and digital forms.' },
  { id: 'safety',      type: 'issue', name: 'Campus & Student Safety',       cat: 'ops',   paws: 3,   blurb: 'Carries student, staff, and faculty safety concerns; presses for Public Safety accountability and for the equipment, training, and response that give the campus the best chance at staying safe.' },
  { id: 'housing',     type: 'issue', name: 'Student Housing & Habitability', cat: 'ops',  paws: 3,   blurb: 'Conditions in student apartments: ADA and ramp access, dated units and amenities, and pest and mold remediation. Liaison to housing and facilities.' },
  { id: 'ptcaucus',    type: 'issue', name: 'Part-Time Student Caucus',      cat: 'gov',   paws: 2.5, blurb: 'A standing voice for evening and part-time students. Gathers concerns about the part-time program returning to a hybrid format, gives the incoming 1E class an early channel to be heard, holds periodic listening sessions, and carries findings to SBA and the administration.' },
  { id: 'accom',       type: 'issue', name: 'Disability Services & Accommodations', cat: 'well', paws: 2.5, blurb: 'Liaison to Disability Services; tracks accommodations access and accessibility across campus.' },
  { id: 'library',     type: 'issue', name: 'Library Operations',           cat: 'ops',   paws: 2,   blurb: 'Study-room access, library hours, renovations and upgrades, and accessibility.' },

  // ---------- COMMITTEES (nested under a related issue) ----------
  { id: 'c_wellness',  type: 'committee', parent: 'wellness',   name: 'Wellness Committee',                cat: 'well',  paws: 1.5, blurb: 'Plans wellness programming and finals-season care.' },
  { id: 'c_events',    type: 'committee', parent: 'events',     name: 'Events & Coordination Committee',   cat: 'comm',  paws: 3.5, blurb: 'Runs the day-to-day events calendar and logistics.' },
  { id: 'c_ball',      type: 'committee', parent: 'events',     name: 'Barrister’s Ball Committee',        cat: 'comm',  paws: 4.5, blurb: 'Plans and runs the annual Barrister’s Ball.' },
  { id: 'c_sports',    type: 'committee', parent: 'events',     name: 'Sports & Activities Committee',      cat: 'comm',  paws: 1.5, blurb: 'Intramurals, tournaments, and active social events.' },
  { id: 'c_diversity', type: 'committee', parent: 'dei',        name: 'Diversity Committee',               cat: 'comm',  paws: 3,   blurb: 'Inclusive programming and heritage-month events.' },
  { id: 'c_alumni',    type: 'committee', parent: 'alumni',     name: 'Alumni Committee',                  cat: 'comm',  paws: 3,   blurb: 'Alumni relations, networking, and sponsorships.' },
  { id: 'c_sustain',   type: 'committee', parent: 'sustain',    name: 'Sustainability Committee',          cat: 'ops',   paws: 3,   blurb: 'Recycling, waste reduction, and green initiatives.' },
  { id: 'c_publicity', type: 'committee', parent: 'commsissue', name: 'Publicity Committee',               cat: 'comms', paws: 1,   blurb: 'Newsletter, social media, and announcements.' },
  { id: 'c_elections', type: 'committee', parent: 'gov',        name: 'SBA Elections Committee',            cat: 'gov',   paws: 4,   blurb: 'Administers SBA elections and the election timeline.' },
  { id: 'c_masters',   type: 'committee', parent: 'masters',    name: 'Master’s Committee',                cat: 'acad',  paws: 2,   blurb: 'Represents LLM and MSL student needs.' },
];

// Section 5.02 — shared, never drafted.
const SHARED = {
  cite: 'Bylaws § 5.02 — Vice Presidents',
  intro: 'There shall be a Day Vice President and an Evening Vice President, each enrolled in and representing their respective class at large. The following authority and duties are held JOINTLY and are not part of the draft.',
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

// ============================================================
// ROSTER — preloaded leadership directory (EDITABLE in Curator).
// Pulled from public McGeorge & University of the Pacific
// directories; holders/titles change, so VERIFY & UPDATE in
// Curator Mode. Not assigned to any issue — these feed the
// "add from existing contacts" dropdown.  scope: 'mcgeorge' | 'uop'
// ============================================================
const ROSTER = [
  // ---- McGeorge School of Law ----
  { name: 'Michael Colatrella',   title: 'Dean, McGeorge School of Law',                          scope: 'mcgeorge' },
  { name: 'Jeffrey Proske',       title: 'Associate Dean for Academic Affairs & Experiential Learning', scope: 'mcgeorge' },
  { name: 'Mary-Beth Moylan',     title: 'Associate Dean, Academic Affairs',                      scope: 'mcgeorge' },
  { name: 'Rachael Salcido',      title: 'Associate Dean for Diversity Initiatives',              scope: 'mcgeorge' },
  { name: 'Larry Levine',         title: 'Associate Dean for Diversity, Equity & Inclusion',      scope: 'mcgeorge' },
  { name: 'Daniel Croxall',       title: 'Associate Dean of Admissions',                          scope: 'mcgeorge' },
  { name: 'J. Wirrell',           title: 'Associate Dean of Library Services',                    scope: 'mcgeorge' },
  { name: 'Clemence Kucera',      title: 'Assistant Dean of Graduate, Online & International Programs', scope: 'mcgeorge' },
  { name: 'Adriana Aguena',       title: 'Assistant Director of Graduate & International Programs', scope: 'mcgeorge' },
  { name: 'Erin O’Neal',          title: 'Director, Capital Center for Law & Policy',             scope: 'mcgeorge' },
  { name: 'Reza Rezvani',         title: 'Director of Trial Advocacy',                            scope: 'mcgeorge' },
  { name: 'Mike Mireles',         title: 'Director, IP Certificate of Concentration',             scope: 'mcgeorge' },
  // ---- Greater University of the Pacific ----
  { name: 'Christopher Callahan', title: 'President, University of the Pacific',                   scope: 'uop' },
  { name: '(add name)',           title: 'Provost & Executive Vice President for Academic Affairs', scope: 'uop' },
  { name: '(add name)',           title: 'Vice President for Student Life',                        scope: 'uop' },
  { name: '(add name)',           title: 'Vice President for Enrollment Strategy',                 scope: 'uop' },
  { name: '(add name)',           title: 'Vice President for University Development & Alumni Relations', scope: 'uop' },
  { name: '(add name)',           title: 'Vice President & Chief Technology Officer',              scope: 'uop' },
  { name: '(add name)',           title: 'Vice President for Diversity, Equity & Inclusion',       scope: 'uop' },
  { name: '(add name)',           title: 'CFO & Executive Vice President for Finance & Operations', scope: 'uop' },
];

const totalPaws = SEED_ITEMS.reduce((s, i) => s + i.paws, 0);
const suggestedCap = Math.round(totalPaws * 0.45); // < half ⇒ leftovers land in the shared pile

window.WR = { CATS, VPS, SEED_ITEMS, SHARED, ROSTER, totalPaws, suggestedCap };
