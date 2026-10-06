import { useState, useMemo, useCallback, useRef, useEffect, useId, createContext, useContext, Children, cloneElement, isValidElement } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Upload, CheckCircle2, AlertTriangle, Clock, Users, Building2,
  Sparkles, Droplet, Leaf, HeartPulse, GraduationCap, Wrench,
  Trash2, TreePine, Loader2, X, Search, ArrowRight, FileText, Handshake,
  BarChart3, ClipboardList, PlusCircle, Sun, Moon, Landmark,
  ShieldCheck, HandCoins, Sprout, Network, LogOut, ChevronRight, Inbox,
  IndianRupee, BadgeCheck,
} from "lucide-react";

/* ===========================================================================
   ARCHITECTURE NOTE (see section "Ecosystem" tab in-app for the full story)
   ---------------------------------------------------------------------------
   This file is a FRONTEND-ONLY prototype. Classification uses the offline
   keyword engine by default. Optionally set VITE_CLASSIFY_URL to a backend:

       React app  →  POST /api/routing/classify  →  Node/Express backend
                                                       → Anthropic API

   so that no API key ever ships to the browser. Every other "service" in
   this file (aiClassify, localClassify, the challenge/project mutators in
   AppShell) is written as a plain function specifically so it can be lifted
   into real backend routes (/api/challenges, /api/routing, /api/ngos,
   /api/csr, /api/government) without changing the calling code much.
   =========================================================================== */

/* ----------------------------- design tokens ----------------------------- */
const LIGHT = {
  mode: "light",
  bg: "#F4F6F1",
  bgDeep: "#EBEFE5",
  surface: "#FFFFFF",
  ink: "#16241E",
  inkSoft: "#3F4F46",
  primary: "#1F4D3A",
  primaryDeep: "#12332A",
  accent: "#B5502A",
  gold: "#C79A3D",
  line: "#D9DED2",
};

const DARK = {
  mode: "dark",
  bg: "#0F1B15",
  bgDeep: "#16241C",
  surface: "#182720",
  ink: "#EDF1E9",
  inkSoft: "#A7B6AD",
  primary: "#59A282",
  primaryDeep: "#0A1410",
  accent: "#E08A5D",
  gold: "#E0BB6E",
  line: "#2B3D33",
};

const ThemeContext = createContext(LIGHT);
const useTheme = () => useContext(ThemeContext);

const CHART_PALETTE = ["#1F4D3A", "#B5502A", "#C79A3D", "#2B6E8C", "#6B4C9A", "#4B7F3F", "#8C6B2B"];
const CHART_PALETTE_DARK = ["#59A282", "#E08A5D", "#E0BB6E", "#5B9BC0", "#9B7FCB", "#7FB56B", "#C99A54"];

/* ------------------------------- mock data -------------------------------- */
const DISTRICTS = [
  "Ranchi", "Dhanbad", "East Singhbhum", "Bokaro", "Hazaribagh",
  "Deoghar", "Giridih", "Palamu", "Dumka", "West Singhbhum",
  "Ramgarh", "Godda",
];

const DOMAINS = [
  "Healthcare", "Education", "Agriculture", "Water Management",
  "Sanitation", "Environment", "Infrastructure",
];

const DOMAIN_META = {
  Healthcare: { icon: HeartPulse, color: "#B5502A" },
  Education: { icon: GraduationCap, color: "#1F4D3A" },
  Agriculture: { icon: Leaf, color: "#4B7F3F" },
  "Water Management": { icon: Droplet, color: "#2B6E8C" },
  Sanitation: { icon: Trash2, color: "#8C6B2B" },
  Environment: { icon: TreePine, color: "#2F6B4F" },
  Infrastructure: { icon: Wrench, color: "#6B4C9A" },
};

const UNIVERSITIES = [
  { id: "bitm", name: "Birla Institute of Technology, Mesra", short: "BIT Mesra", district: "Ranchi", expertise: ["Infrastructure", "Environment", "Water Management", "Sanitation"] },
  { id: "ism", name: "Indian Institute of Technology (ISM) Dhanbad", short: "IIT (ISM) Dhanbad", district: "Dhanbad", expertise: ["Environment", "Infrastructure", "Water Management"] },
  { id: "nitjsr", name: "National Institute of Technology, Jamshedpur", short: "NIT Jamshedpur", district: "East Singhbhum", expertise: ["Infrastructure", "Agriculture", "Environment"] },
  { id: "cuj", name: "Central University of Jharkhand", short: "CU Jharkhand", district: "Ranchi", expertise: ["Education", "Healthcare", "Agriculture"] },
  { id: "vbu", name: "Vinoba Bhave University", short: "Vinoba Bhave University", district: "Hazaribagh", expertise: ["Agriculture", "Education", "Water Management"] },
  { id: "xiss", name: "Xavier Institute of Social Service", short: "XISS Ranchi", district: "Ranchi", expertise: ["Sanitation", "Healthcare", "Education"] },
  { id: "skmu", name: "Sido Kanhu Murmu University", short: "SKM University, Dumka", district: "Dumka", expertise: ["Agriculture", "Healthcare", "Education"] },
];

const PARTNERS = [
  { id: "tata", name: "Tata Steel Foundation", focus: "Healthcare, Infrastructure" },
  { id: "jspl", name: "JSPL Foundation", focus: "Environment, Skilling" },
  { id: "sail", name: "SAIL Bokaro CSR Cell", focus: "Water, Sanitation" },
  { id: "ccl", name: "CCL Community Development", focus: "Environment, Agriculture" },
  { id: "rsh", name: "Ranchi Startup Hub", focus: "Prototyping, Funding" },
  { id: "usha", name: "Usha Martin CSR", focus: "Education, Infrastructure" },
];

const NGOS = [
  { id: "gvs", name: "Gram Vikas Samiti", districts: ["Ranchi", "Ramgarh", "Hazaribagh"], focus: ["Water Management", "Sanitation"] },
  { id: "ass", name: "Adivasi Seva Sangh", districts: ["West Singhbhum", "Dumka", "Godda"], focus: ["Healthcare", "Education"] },
  { id: "pf", name: "Prakriti Foundation", districts: ["Dhanbad", "Bokaro"], focus: ["Environment", "Sanitation"] },
  { id: "kst", name: "Kisan Sahayog Trust", districts: ["Giridih", "Palamu", "Deoghar"], focus: ["Agriculture"] },
];

const STATUS_FLOW = ["New", "Under Review", "Team Assigned", "In Progress", "Resolved"];

const ROLES = [
  { id: "citizen", label: "Citizen", org: "Public / Citizen", icon: Users, blurb: "Report a local problem and track it to resolution." },
  { id: "government", label: "Government", org: "Government of Jharkhand", icon: Landmark, blurb: "Oversee every challenge, project and partner statewide." },
  { id: "university", label: "University", org: "Research Institution", icon: Building2, blurb: "Review routed challenges and lead the research response." },
  { id: "ngo", label: "NGO", org: "Implementation Partner", icon: Sprout, blurb: "Take university solutions into the field." },
  { id: "csr", label: "Industry & CSR", org: "Funding & Mentorship", icon: HandCoins, blurb: "Fund and resource projects that need support." },
];

const FIRST_NAMES = ["Rakesh", "Sunita", "Amit", "Priya", "Birsa", "Kavita", "Manoj", "Sarita", "Dilip", "Anjali", "Rajesh", "Neha", "Suresh", "Pooja", "Vikas"];
const LAST_NAMES = ["Mahato", "Kumari", "Oraon", "Singh", "Munda", "Devi", "Prasad", "Toppo", "Kachhap", "Verma", "Hansda", "Tirkey", "Yadav", "Soren"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function uid(prefix = "id") {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
function citizenName() { return `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`; }

function hashSeed(value) {
  const text = String(value || "");
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}
function pickFrom(arr, seed) { return arr[seed % arr.length]; }

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function ageInDays(d) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function challengeCode(index) {
  return `SPX-2026-${String(index + 1).padStart(6, "0")}`;
}

const TEAM_ADJ = ["Jal", "Bhoomi", "Prakriti", "Sahyog", "Nirman", "Aarogya", "Vidya", "Urja"];
const TEAM_NOUN = ["Setu", "Spark", "Mission", "Lab", "Collective", "Force"];
function assignTeam(seedSource) {
  const seed = hashSeed(seedSource);
  return {
    name: `Team ${pickFrom(TEAM_ADJ, seed)} ${pickFrom(TEAM_NOUN, seed >> 3)}`,
    lead: `Dr. ${pickFrom(FIRST_NAMES, seed >> 5)} ${pickFrom(LAST_NAMES, seed >> 7)}`,
    students: 3 + (seed % 4),
  };
}
function fundingAsk(seedSource) {
  return 50000 + (hashSeed(seedSource) % 5) * 25000;
}

function emptyProject() {
  return { ngoId: null, ngoStatus: "none", fieldReports: [], csrId: null, fundingStatus: "none", fundingAmount: 0, fundingReleased: 0, govVerified: false };
}

/* ------------------------- SLA, urgency & funding tranches ------------------------- */
// Maximum days a report should realistically sit in a given stage before it
// is considered overdue. Drives the Government escalation panel.
const SLA_DAYS = {
  New: 7,
  "Under Review": 10,
  "Team Assigned": 21,
  "In Progress": 45,
  Resolved: Infinity,
};

const URGENCY_KEYWORDS = {
  Critical: ["death", "died", "dying", "collapse", "collapsed", "fire", "outbreak", "drowned", "life-threatening", "emergency", "unsafe structure"],
  High: ["contaminat", "no water", "no doctor", "disease", "flood", "unsafe", "injury", "injured", "months", "years", "child", "pregnant", "maternal"],
  Medium: ["delay", "shortage", "broken", "damaged", "overflow", "power cut", "pollution"],
};
// Score 0-3+ mapped to a human label; higher = more urgent. Purely a
// heuristic used to prioritise the review queue, not a medical/safety triage tool.
function computeUrgency(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  let score = 0;
  if (URGENCY_KEYWORDS.Critical.some((kw) => text.includes(kw))) score += 3;
  if (URGENCY_KEYWORDS.High.some((kw) => text.includes(kw))) score += 2;
  if (URGENCY_KEYWORDS.Medium.some((kw) => text.includes(kw))) score += 1;
  const label = score >= 3 ? "Critical" : score >= 2 ? "High" : score >= 1 ? "Medium" : "Low";
  return { score, label };
}

// Days spent in the *current* stage (not since original submission), used to
// decide whether a case has breached its SLA and should escalate.
function daysInCurrentStage(challenge) {
  return ageInDays(challenge.statusSince || challenge.submittedOn);
}
function isEscalated(challenge) {
  if (challenge.status === "Resolved") return false;
  const limit = SLA_DAYS[challenge.status] ?? Infinity;
  return daysInCurrentStage(challenge) > limit;
}

// Funding is released in three accountability-linked tranches rather than as
// one lump sum: kickoff once a research team is in place, a field tranche
// once the NGO is actively on the ground, and a final tranche only once
// Government has verified resolution.
const FUNDING_MILESTONES = [
  { key: "kickoff", pct: 0.25, label: "Kickoff (team assigned)" },
  { key: "field", pct: 0.5, label: "Field implementation" },
  { key: "closure", pct: 0.25, label: "Verified closure" },
];
// Lightweight civic-engagement score: rewards submitting, and rewards more
// for getting a case all the way to a government-verified close, so the
// incentive is to follow through rather than just file-and-forget.
function computeCivicScore(reports) {
  const submitted = reports.length;
  const resolved = reports.filter((r) => r.status === "Resolved").length;
  const verified = reports.filter((r) => r.status === "Resolved" && r.project.govVerified).length;
  const score = submitted * 5 + resolved * 15 + verified * 25;
  const level = score >= 150 ? "Gold" : score >= 60 ? "Silver" : score > 0 ? "Bronze" : "Unrated";
  return { score, level };
}
function nextFundingMilestone(challenge) {
  const releasedPct = challenge.project.fundingAmount
    ? challenge.project.fundingReleased / challenge.project.fundingAmount
    : 0;
  let cumulative = 0;
  for (const m of FUNDING_MILESTONES) {
    cumulative += m.pct;
    if (releasedPct < cumulative - 0.001) {
      const eligible =
        (m.key === "kickoff" && !!challenge.team) ||
        (m.key === "field" && ["in-field", "completed"].includes(challenge.project.ngoStatus)) ||
        (m.key === "closure" && challenge.status === "Resolved" && challenge.project.govVerified);
      return { ...m, eligible, amount: Math.round(challenge.project.fundingAmount * m.pct) };
    }
  }
  return null;
}

const DOMAIN_KEYWORDS = {
  Healthcare: ["hospital", "clinic", "doctor", "medicine", "health", "sub-centre", "asha", "disease", "vaccination", "maternal"],
  Education: ["school", "teacher", "classroom", "student", "college", "dropout", "midday meal", "literacy", "anganwadi"],
  Agriculture: ["crop", "farmer", "irrigation", "soil", "seed", "harvest", "pesticide", "mandi", "livestock", "farm"],
  "Water Management": ["water", "borewell", "handpump", "tanker", "pipeline", "drinking water", "well", "river", "flood"],
  Sanitation: ["toilet", "sewage", "garbage", "waste", "drain", "sanitation", "open defecation", "sewer"],
  Environment: ["pollution", "forest", "deforestation", "mining", "air quality", "tree", "dust", "encroachment"],
  Infrastructure: ["road", "bridge", "electricity", "power cut", "streetlight", "culvert", "transport", "building"],
};

// Fallback used whenever the AI service call fails or is unavailable — keeps
// the routing engine (domain, university, duplicate check) working offline.
function localClassify(title, description, existing, district) {
  const text = `${title} ${description}`.toLowerCase();

  // Score every domain (not just the winner) so a report that genuinely spans
  // two areas — "school has no clean water" — can surface a secondary label
  // instead of silently discarding the second signal.
  const scored = DOMAINS.map((domain) => ({
    domain,
    score: DOMAIN_KEYWORDS[domain].reduce((s, kw) => (text.includes(kw) ? s + 1 : s), 0),
  })).sort((a, b) => b.score - a.score);

  const best = scored[0].score > 0 ? scored[0] : { domain: "Infrastructure", score: 0 };
  const secondary = scored[1] && scored[1].score > 0 ? scored[1].domain : null;

  // Load-aware routing: among universities qualified for this domain, prefer
  // the one nearest the district, then break remaining ties by whoever has
  // the fewest currently-open cases, so expertise doesn't collapse onto a
  // single institution.
  const candidates = UNIVERSITIES.filter((u) => u.expertise.includes(best.domain));
  const pool = candidates.length ? candidates : UNIVERSITIES;
  const localMatch = district ? pool.filter((u) => u.district === district) : [];
  const shortlist = localMatch.length ? localMatch : pool;
  const loadOf = (u) => existing.filter((c) => c.universityId === u.id && c.status !== "Resolved").length;
  const uni = [...shortlist].sort((a, b) => loadOf(a) - loadOf(b))[0];

  let dup = null;
  const titleWords = new Set(title.toLowerCase().split(/\W+/).filter(Boolean));
  for (const c of existing) {
    const cWords = new Set(c.title.toLowerCase().split(/\W+/).filter(Boolean));
    const overlap = [...titleWords].filter((w) => cWords.has(w)).length;
    const union = new Set([...titleWords, ...cWords]).size;
    const titleSim = union ? overlap / union : 0;
    // Boost similarity when the two reports also share a district and domain —
    // catches "borewell broken" vs "handpump not working" style duplicates
    // that pure title overlap misses.
    const sameContext = c.district === district && c.domain === best.domain;
    const sim = sameContext ? titleSim + 0.15 : titleSim;
    if (sim > 0.45) { dup = c; break; }
  }

  const urgency = computeUrgency(title, description);

  return {
    domain: best.domain,
    secondaryDomain: secondary,
    confidence: best.score > 0 ? Math.min(0.6 + best.score * 0.08, 0.93) : 0.55,
    universityId: uni.id,
    routingReason: `Matched on keyword overlap with ${best.domain.toLowerCase()}${secondary ? ` (also touches ${secondary.toLowerCase()})` : ""} and routed to ${uni.short}, the qualified institution with the lightest current caseload${district ? ` near ${district}` : ""}.`,
    isDuplicate: !!dup,
    duplicateOfId: dup ? dup.id : null,
    duplicateReason: dup ? "Title and context strongly overlap with an existing open report." : null,
    urgency,
    source: "offline",
  };
}

/* ------------------------------- seed data -------------------------------- */
function buildSeedChallenges() {
  const seeds = [
    { title: "Broken hand pump in Ormanjhi ward", description: "Only community hand pump has been broken for three weeks, women walking 2km for drinking water.", domain: "Water Management", district: "Ranchi", days: 42 },
    { title: "No teacher at primary school for 6 months", description: "Government primary school has 80 students but only one teacher present most days.", domain: "Education", district: "Palamu", days: 55 },
    { title: "Open drain flooding near market", description: "Sewage drain overflows every monsoon and floods the vegetable market area.", domain: "Sanitation", district: "Dhanbad", days: 30 },
    { title: "Coal dust pollution near residential colony", description: "Dust from nearby mining activity is affecting air quality and causing respiratory issues.", domain: "Environment", district: "West Singhbhum", days: 60 },
    { title: "Crop damage due to erratic irrigation canal", description: "Irrigation canal has not been desilted in years, paddy fields flooding unevenly.", domain: "Agriculture", district: "Giridih", days: 25 },
    { title: "Sub-health centre lacks basic medicines", description: "The village sub-health centre frequently runs out of basic medicines and has no doctor visit schedule.", domain: "Healthcare", district: "Hazaribagh", days: 18 },
    { title: "Collapsed culvert cuts off village access", description: "The only culvert connecting the village to the main road collapsed after heavy rain.", domain: "Infrastructure", district: "Ramgarh", days: 12 },
    { title: "Frequent power cuts disrupting exams", description: "Daily 6-hour power cuts are affecting evening study hours for students preparing for board exams.", domain: "Infrastructure", district: "Deoghar", days: 20 },
    { title: "Garbage dumping near river bank", description: "Unregulated waste dumping near the river is contaminating water used downstream.", domain: "Sanitation", district: "East Singhbhum", days: 33 },
    { title: "Handpump water tastes contaminated", description: "Villagers report a metallic taste and discoloration in hand pump water, suspected contamination.", domain: "Water Management", district: "Bokaro", days: 8 },
    { title: "No irrigation support for tribal farmers", description: "Small tribal landholders lack access to affordable irrigation equipment during dry spells.", domain: "Agriculture", district: "Dumka", days: 15 },
    { title: "Deforestation near catchment area", description: "Illegal tree felling near a water catchment area is increasing runoff and soil erosion.", domain: "Environment", district: "Godda", days: 48 },
    { title: "Anganwadi centre building unsafe", description: "The anganwadi building has cracked walls and a leaking roof, unsafe for small children.", domain: "Education", district: "Ranchi", days: 22 },
    { title: "Maternal health checkups inaccessible", description: "Pregnant women in remote hamlets have no easy access to ANC checkups, nearest facility is 15km away.", domain: "Healthcare", district: "West Singhbhum", days: 5 },
  ];

  const statuses = ["Resolved", "Resolved", "In Progress", "In Progress", "Team Assigned", "Team Assigned", "Under Review", "Under Review", "New", "New", "In Progress", "Resolved", "Under Review", "New"];

  return seeds.map((s, i) => {
    const candidates = UNIVERSITIES.filter((u) => u.expertise.includes(s.domain));
    const uni = candidates[i % candidates.length] || UNIVERSITIES[0];
    const status = statuses[i];
    const hasTeam = STATUS_FLOW.indexOf(status) >= STATUS_FLOW.indexOf("Team Assigned");
    const project = emptyProject();
    // Seed a few projects further along the NGO/CSR pipeline so every portal has something to show.
    if (hasTeam && i % 2 === 0) {
      const ngo = NGOS.find((n) => n.focus.includes(s.domain)) || NGOS[0];
      project.ngoId = ngo.id;
      project.ngoStatus = status === "Resolved" ? "completed" : "in-field";
      project.fieldReports = [{ at: daysAgo(s.days - 5), text: `${ngo.name} completed an initial site visit.` }];
    } else if (hasTeam) {
      project.ngoStatus = "requested";
    }
    if (status === "Resolved" || status === "In Progress") {
      project.csrId = PARTNERS[i % PARTNERS.length].id;
      project.fundingStatus = "committed";
      project.fundingAmount = 40000 + (i % 6) * 35000;
    } else if (hasTeam) {
      project.fundingStatus = "requested";
      project.fundingAmount = fundingAsk(`${s.title}-csr-${i}`);
    }
    if (status === "Resolved") project.govVerified = i % 3 !== 0;

    // Seed a partial disbursement so the CSR portal can demonstrate
    // milestone-based release immediately, not just a binary committed flag.
    if (project.fundingStatus === "committed") {
      if (status === "Resolved" && project.govVerified) {
        project.fundingReleased = project.fundingAmount;
      } else if (project.ngoStatus === "in-field" || project.ngoStatus === "completed" || status === "Resolved") {
        project.fundingReleased = Math.round(project.fundingAmount * 0.75);
      } else {
        project.fundingReleased = Math.round(project.fundingAmount * 0.25);
      }
    }

    return {
      id: uid("chl"),
      title: s.title,
      description: s.description,
      domain: s.domain,
      secondaryDomain: null,
      urgency: computeUrgency(s.title, s.description),
      district: s.district,
      citizen: citizenName(),
      submittedOn: daysAgo(s.days),
      // Approximates how long the case has sat in its *current* stage —
      // powers the SLA escalation check without needing a real event log.
      statusSince: daysAgo(Math.max(0, Math.round(s.days * (status === "New" ? 0.15 : status === "Under Review" ? 0.35 : status === "Team Assigned" ? 0.55 : status === "In Progress" ? 0.75 : 1)))),
      status,
      universityId: uni.id,
      confidence: 0.72 + (i % 5) * 0.04,
      routingReason: `Routed to ${uni.short} based on demonstrated expertise in ${s.domain.toLowerCase()}.`,
      isDuplicate: false,
      duplicateOfId: null,
      supporters: 1 + (i % 3 === 0 ? i % 4 : 0),
      mergedReportIds: [],
      code: challengeCode(i),
      team: hasTeam ? assignTeam(`${s.title}-${i}`) : null,
      partners: status === "Resolved" || status === "In Progress" ? [PARTNERS[i % PARTNERS.length].id] : [],
      log: [{ at: daysAgo(s.days), text: "Submitted by citizen." }],
      photo: true,
      project,
    };
  });
}

/* -------------------------------- AI call --------------------------------- */
// Browser apps must not call Anthropic (or any LLM) directly — CORS blocks it
// and API keys must never ship to the client. Set VITE_CLASSIFY_URL to a backend
// that implements POST /api/routing/classify. Otherwise we use localClassify.
function validateClassifierResult(parsed, existing) {
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid classifier response");
  if (!DOMAINS.includes(parsed.domain)) throw new Error("Invalid domain returned");
  if (!UNIVERSITIES.some((u) => u.id === parsed.universityId)) throw new Error("Invalid university returned");
  if (!Number.isFinite(parsed.confidence) || parsed.confidence < 0 || parsed.confidence > 1) {
    throw new Error("Invalid confidence returned");
  }
  if (typeof parsed.isDuplicate !== "boolean") throw new Error("Invalid duplicate flag");
  if (typeof parsed.routingReason !== "string" || !parsed.routingReason.trim()) {
    throw new Error("Invalid routing reason");
  }
  if (
    parsed.isDuplicate &&
    !existing.some((report) => report.id === parsed.duplicateOfId)
  ) {
    throw new Error("Invalid duplicate reference");
  }
  return parsed;
}

async function aiClassify(title, description, existing) {
  const endpoint = String(import.meta.env.VITE_CLASSIFY_URL || "").trim();
  if (!endpoint) throw new Error("Classifier endpoint not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        title,
        description,
        domains: DOMAINS,
        universities: UNIVERSITIES.map((u) => ({
          id: u.id,
          short: u.short,
          expertise: u.expertise,
          district: u.district,
        })),
        existing: existing.slice(0, 12).map((c) => ({
          id: c.id,
          title: c.title,
          domain: c.domain,
          district: c.district,
        })),
      }),
    });

    if (!response.ok) throw new Error("AI service unavailable");
    const parsed = validateClassifierResult(await response.json(), existing);
    return { ...parsed, source: "ai" };
  } finally {
    clearTimeout(timer);
  }
}

async function classifyReport(title, description, existing, district) {
  try {
    const result = await aiClassify(title, description, existing);
    // The backend classifier isn't required to compute urgency or a
    // secondary domain — fill those in locally so downstream UI can rely on
    // them regardless of which classifier path served the request.
    return {
      secondaryDomain: null,
      urgency: computeUrgency(title, description),
      ...result,
    };
  } catch {
    // Small delay so the submit spinner is visible when offline routing is instant.
    await new Promise((resolve) => setTimeout(resolve, 280));
    return localClassify(title, description, existing, district);
  }
}

/* -------------------------------- toasts ----------------------------------- */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef([]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const push = useCallback((text, kind = "info") => {
    const id = uid("toast");
    setToasts((t) => [...t, { id, text, kind }]);
    const timer = setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
      timersRef.current = timersRef.current.filter((x) => x !== timer);
    }, 3400);
    timersRef.current.push(timer);
  }, []);
  return { toasts, push };
}

function ToastStack({ toasts }) {
  const C = useTheme();
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[92%] max-w-sm"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="rounded-md px-4 py-3 text-sm shadow-lg border flex items-start gap-2 animate-[fadein_.2s_ease-out]"
          style={{
            background: t.kind === "error" ? `${C.accent}22` : t.kind === "success" ? `${C.primary}22` : C.surface,
            borderColor: t.kind === "error" ? C.accent : t.kind === "success" ? C.primary : C.line,
            color: C.ink,
          }}
        >
          {t.kind === "error" ? <AlertTriangle size={16} color={C.accent} className="mt-0.5 shrink-0" aria-hidden="true" /> : <CheckCircle2 size={16} color={C.primary} className="mt-0.5 shrink-0" aria-hidden="true" />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- shared UI --------------------------------- */
function SectionCard({ children, className = "", style = {} }) {
  const C = useTheme();

return (
    <div
      className={`rounded-2xl border ${className}`}
      style={{
        background: C.surface,
        borderColor: C.line,
        borderLeftWidth: 3,
        borderLeftColor: C.primary,
        boxShadow:
          C.mode === "dark"
            ? "0 8px 28px rgba(0,0,0,0.12)"
            : "0 8px 28px rgba(22,36,30,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const C = useTheme();
  const idx = Math.max(0, STATUS_FLOW.indexOf(status));
  const colors = [C.mode === "dark" ? "#C99A54" : "#8C6B2B", C.gold, C.mode === "dark" ? "#5B9BC0" : "#2B6E8C", C.primary, C.primary];
  const tone = colors[idx] ?? C.inkSoft;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border"
      style={{ borderColor: tone, color: tone, background: `${tone}10` }}
      role="status"
      aria-label={`Status: ${status}`}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone }} aria-hidden="true" />
      {status}
    </span>
  );
}

function EmptyState({ icon: Icon, title, hint }) {
  const C = useTheme();
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: C.bgDeep }}>
        <Icon size={22} color={C.inkSoft} />
      </div>
      <p className="font-medium" style={{ color: C.ink }}>{title}</p>
      {hint && <p className="text-sm mt-1 max-w-xs" style={{ color: C.inkSoft }}>{hint}</p>}
    </div>
  );
}

function Field({ label, required, children, hint }) {
  const C = useTheme();
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const items = Children.toArray(children);
  const [control, ...rest] = items;
  const labeled = isValidElement(control)
    ? cloneElement(control, {
        id: control.props.id || id,
        "aria-required": required || undefined,
        "aria-describedby":
          [control.props["aria-describedby"], hintId].filter(Boolean).join(" ") || undefined,
      })
    : control;

  return (
    <div className="block mb-4">
      <label htmlFor={labeled?.props?.id || id} className="block text-sm font-medium mb-1.5" style={{ color: C.ink }}>
        {label} {required && <span style={{ color: C.accent }} aria-hidden="true">*</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {labeled}
      {rest}
      {hint && (
        <p id={hintId} className="text-xs mt-1.5" style={{ color: C.inkSoft }}>
          {hint}
        </p>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2";

/* ------------------------------ Role selector (login) ------------------------------ */
function RoleSelector({ onSelect }) {
  const C = useTheme();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: C.primaryDeep }}>
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8 text-white anim-soft-rise">
          <div className="w-12 h-12 rounded-md flex items-center justify-center mx-auto mb-4" style={{ background: C.gold }} aria-hidden="true">
            <Handshake size={22} color={C.primaryDeep} />
          </div>
          <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-3" style={{ color: C.gold }}>
            sparkX
          </p>
          <h1 className="text-3xl mb-2" style={{ fontFamily: "'Fraunces', serif" }}>sparkX prototype</h1>
          <p className="text-sm opacity-75 max-w-md mx-auto">
            One coordinated platform for civic challenges. Choose a role to continue — prototype demo, no real authentication.
          </p>
        </div>
        <div
          className="grid sm:grid-cols-2 gap-3"
          role="list"
          aria-label="Available portals"
        >
          {ROLES.map((r, index) => {
            const Icon = r.icon;
            const delayClass = `anim-delay-${Math.min(index + 1, 5)}`;
            return (
              <button
                key={r.id}
                type="button"
                role="listitem"
                onClick={() => onSelect(r.id)}
                className={`text-left p-4 rounded-md border transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 anim-fade-up anim-hover-lift ${delayClass}`}
                style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.18)", outlineColor: C.gold }}
                aria-label={`Enter ${r.label} portal — ${r.blurb}`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: C.gold }} aria-hidden="true">
                    <Icon size={16} color={C.primaryDeep} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{r.label} Portal</p>
                    <p className="text-white text-xs opacity-60">{r.org}</p>
                  </div>
                </div>
                <p className="text-white text-xs opacity-70 pl-10.5">{r.blurb}</p>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onSelect("architecture")}
            className="text-left p-4 rounded-md border transition hover:brightness-110 sm:col-span-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 anim-fade-up anim-delay-5 anim-hover-lift"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.14)", outlineColor: C.gold }}
            aria-label="See how the sparkX ecosystem works"
          >
            <div className="flex items-center gap-2.5">
              <Network size={16} color={C.gold} aria-hidden="true" />
              <p className="text-white text-sm font-medium">See how the ecosystem works</p>
              <ChevronRight size={14} color={C.gold} className="ml-auto" aria-hidden="true" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- header / nav -------------------------------- */
function Header({ role, onSwitchRole, onOpenArchitecture }) {
  const C = useTheme();
  const roleMeta = ROLES.find((r) => r.id === role);
  const Icon = roleMeta?.icon || Users;
  return (
    <header style={{ background: C.primaryDeep }} className="text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: C.gold }} aria-hidden="true">
              <Handshake size={20} color={C.primaryDeep} />
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-80" style={{ color: C.gold }}>
                sparkX
              </p>
              <h1 className="text-2xl sm:text-3xl leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                sparkX prototype
              </h1>
              <p className="text-sm mt-1 opacity-80 max-w-xl">
                Connect communities. Track action. Create local impact.
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-2" aria-label="Site actions">
            <button
              type="button"
              onClick={onOpenArchitecture}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border transition"
              style={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff", background: "rgba(255,255,255,0.08)" }}
              aria-label="Open ecosystem overview"
            >
              <Network size={14} aria-hidden="true" /> <span className="hidden sm:inline">Ecosystem</span>
            </button>
            <button
              type="button"
              onClick={C.toggleMode}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border transition"
              style={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff", background: "rgba(255,255,255,0.08)" }}
              aria-label={C.mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-pressed={C.mode === "dark"}
            >
              {C.mode === "dark" ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
              <span className="hidden sm:inline">{C.mode === "dark" ? "Light" : "Dark"}</span>
            </button>
            <button
              type="button"
              onClick={onSwitchRole}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border transition"
              style={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff", background: "rgba(255,255,255,0.08)" }}
              aria-label="Switch role and return to portal selection"
            >
              <LogOut size={14} aria-hidden="true" /> <span className="hidden sm:inline">Switch role</span>
            </button>
          </nav>
        </div>
        {roleMeta && (
          <div className="flex items-center gap-2 mt-4 text-sm px-3 py-1.5 rounded-md w-fit" style={{ background: "rgba(255,255,255,0.08)" }} aria-live="polite">
            <Icon size={14} color={C.gold} aria-hidden="true" />
            <span>Signed in as <strong>{roleMeta.label} Portal</strong> · {roleMeta.org}</span>
          </div>
        )}
      </div>
    </header>
  );
}

/* ------------------------------ Ecosystem / architecture page ------------------------------ */
function EcosystemBlock({ icon: Icon, title, sub, color }) {
  const C = useTheme();
  return (
    <div className="rounded-md border px-4 py-3 text-center flex flex-col items-center gap-1.5" style={{ borderColor: C.line, background: C.surface }}>
      <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={16} color={color} />
      </div>
      <p className="text-sm font-medium" style={{ color: C.ink }}>{title}</p>
      {sub && <p className="text-xs" style={{ color: C.inkSoft }}>{sub}</p>}
    </div>
  );
}

function ArchitecturePage() {
  const C = useTheme();
  const coreItems = ["AI Routing", "Duplicate Detection", "Case Management", "Shared Database", "Notifications", "Analytics"];
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="text-xl mb-1" style={{ fontFamily: "'Fraunces', serif", color: C.ink }}>How the ecosystem works</h2>
      <p className="text-sm mb-6 max-w-2xl" style={{ color: C.inkSoft }}>
        One platform. Multiple role-based portals. One shared source of truth. Every portal below reads and writes
        the same challenge/project record — nothing is a separate, disconnected site.
      </p>

      <div className="flex flex-col items-center gap-3 mb-6">
        <EcosystemBlock icon={Landmark} title="Government" sub="Coordinates & oversees" color={C.gold} />
        <div className="text-xs" style={{ color: C.inkSoft }}>▼</div>
        <SectionCard className="p-5 w-full" style={{ borderLeftColor: C.primary }}>
          <p className="text-center text-sm font-medium mb-3" style={{ color: C.ink }}>sparkX prototype — Shared Platform Core</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {coreItems.map((c) => (
              <div key={c} className="text-xs text-center px-2 py-2 rounded" style={{ background: C.bgDeep, color: C.inkSoft }}>{c}</div>
            ))}
          </div>
        </SectionCard>
        <div className="text-xs" style={{ color: C.inkSoft }}>▼</div>
        <div className="grid grid-cols-3 gap-3 w-full">
          <EcosystemBlock icon={Users} title="Citizen" sub="Reports problems" color={CHART_PALETTE[0]} />
          <EcosystemBlock icon={Building2} title="University" sub="Researches solutions" color={CHART_PALETTE[3]} />
          <EcosystemBlock icon={Sprout} title="NGO" sub="Implements on ground" color={CHART_PALETTE[4]} />
        </div>
        <div className="text-xs" style={{ color: C.inkSoft }}>▼</div>
        <EcosystemBlock icon={HandCoins} title="Industry & CSR" sub="Funds & mentors" color={C.accent} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        {[
          { label: "Citizen", text: "Reports a local problem with photo evidence and location." },
          { label: "AI + Government", text: "AI routes by domain; Government gets statewide visibility instantly." },
          { label: "University → NGO → CSR", text: "Research becomes field delivery, backed by mock funding." },
        ].map((s) => (
          <SectionCard key={s.label} className="p-4">
            <p className="text-sm font-medium mb-1" style={{ color: C.ink }}>{s.label}</p>
            <p className="text-xs" style={{ color: C.inkSoft }}>{s.text}</p>
          </SectionCard>
        ))}
      </div>
      <p className="text-xs" style={{ color: C.inkSoft }}>
        This is a sparkX prototype: portals share one in-memory store in this file. In production, each portal calls
        a single backend (e.g. <code>/api/challenges</code>, <code>/api/routing</code>, <code>/api/ngos</code>,
        <code>/api/csr</code>, <code>/api/government</code>) backed by one database — no independent datasets per portal.
      </p>
    </div>
  );
}

/* ------------------------------ Citizen Portal ------------------------------ */
// References remain stable when reports are inserted or reordered.
// For production, generate a unique reference on the backend.
function reportReference(challenge) {
  if (!challenge) return "";
  return (
    challenge.code ||
    `SPX-${challenge.id.replace(/^chl-/, "").toUpperCase()}`
  );
}

function CitizenMetric({ icon: Icon, label, value, hint, color }) {
  const C = useTheme();
  const tone = color || C.primary;

return (
    <SectionCard className="p-4 sm:p-5" style={{ borderLeftColor: tone }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-medium" style={{ color: C.inkSoft }}>
          {label}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `${tone}16`, color: tone }}
        >
          <Icon size={17} />
        </span>
      </div>

<p
        className="text-3xl font-semibold tracking-tight"
        style={{ color: C.ink }}
      >
        {value}
      </p>

<p className="text-xs mt-1.5" style={{ color: C.inkSoft }}>
        {hint}
      </p>
    </SectionCard>
  );
}

function CitizenProcess({ status }) {
  const C = useTheme();
  const current = STATUS_FLOW.indexOf(status);

return (
    <div className="overflow-x-auto pb-2">
      <ol
        aria-label="Report resolution stages"
        className="flex min-w-[480px] pt-2"
      >
        {STATUS_FLOW.map((step, index) => {
          const completed = current >= 0 && index < current;
          const active = index === current;

return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className="relative flex flex-1 flex-col items-center text-center"
            >
              {index < STATUS_FLOW.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-4 h-0.5"
                  style={{
                    left: "50%",
                    width: "100%",
                    background: completed ? C.primary : C.line,
                  }}
                />
              )}

<span
                className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold"
                style={{
                  background: completed || active ? C.primary : C.surface,
                  borderColor: completed || active ? C.primary : C.line,
                  color: completed || active ? C.primaryDeep : C.inkSoft,
                  boxShadow: active ? `0 0 0 5px ${C.primary}18` : "none",
                }}
              >
                {completed ? <CheckCircle2 size={16} /> : index + 1}
              </span>

<span
                className="mt-3 px-1 text-xs font-medium"
                style={{ color: active || completed ? C.ink : C.inkSoft }}
              >
                {step}
              </span>

<span className="mt-1 text-[10px]" style={{ color: C.inkSoft }}>
                {completed ? "Completed" : active ? "Current stage" : "Upcoming"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CitizenCharts({ reports }) {
  const C = useTheme();
  const palette = C.mode === "dark" ? CHART_PALETTE_DARK : CHART_PALETTE;

const statusData = STATUS_FLOW.map((name, index) => ({
    name,
    value: reports.filter((r) => r.status === name).length,
    color: palette[index % palette.length],
  })).filter((entry) => entry.value > 0);

const domainData = DOMAINS.map((name) => ({
    name,
    value: reports.filter((r) => r.domain === name).length,
  })).filter((entry) => entry.value > 0);

const tooltipStyle = {
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 12,
    color: C.ink,
    fontSize: 12,
  };

if (!reports.length) {
    return (
      <SectionCard>
        <EmptyState
          icon={BarChart3}
          title="Your impact dashboard starts here"
          hint="Submit your first report to see live status and domain charts."
        />
      </SectionCard>
    );
  }

return (
    <div className="grid lg:grid-cols-2 gap-4">
      <SectionCard className="p-5 min-w-0">
        <h3 className="text-sm font-semibold" style={{ color: C.ink }}>
          Where your reports stand
        </h3>
        <p className="text-xs mt-1" style={{ color: C.inkSoft }}>
          Current status distribution
        </p>

<div
          role="img"
          aria-label={statusData
            .map((entry) => `${entry.name}: ${entry.value}`)
            .join("; ")}
        >
          <ResponsiveContainer width="100%" height={225}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={statusData.length > 1 ? 5 : 0}
                stroke={C.surface}
                strokeWidth={3}
              >
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={{ color: C.ink }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

<div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {statusData.map((entry) => (
            <span
              key={entry.name}
              className="inline-flex items-center gap-1.5 text-xs"
              style={{ color: C.inkSoft }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: entry.color }}
              />
              {entry.name}
              <strong style={{ color: C.ink }}>{entry.value}</strong>
            </span>
          ))}
        </div>
      </SectionCard>

<SectionCard className="p-5 min-w-0">
        <h3 className="text-sm font-semibold" style={{ color: C.ink }}>
          Issues you have raised
        </h3>
        <p className="text-xs mt-1 mb-3" style={{ color: C.inkSoft }}>
          Reports grouped by domain
        </p>

<div
          role="img"
          aria-label={domainData
            .map((entry) => `${entry.name}: ${entry.value}`)
            .join("; ")}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={domainData}
              layout="vertical"
              margin={{ left: 0, right: 16, top: 10, bottom: 0 }}
            >
              <CartesianGrid
                horizontal={false}
                strokeDasharray="3 3"
                stroke={C.line}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                stroke={C.inkSoft}
                fontSize={11}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={112}
                stroke={C.inkSoft}
                fontSize={10}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: `${C.primary}08` }}
                contentStyle={tooltipStyle}
                itemStyle={{ color: C.ink }}
              />
              <Bar
                name="Reports"
                dataKey="value"
                maxBarSize={24}
                radius={[0, 6, 6, 0]}
              >
                {domainData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={palette[index % palette.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}

function CitizenReportDetail({ report }) {
  const C = useTheme();

if (!report) {
    return (
      <SectionCard>
        <EmptyState
          icon={Search}
          title="Select a report"
          hint="Choose a report to view its current stage, project support, and activity."
        />
      </SectionCard>
    );
  }

const university = UNIVERSITIES.find((u) => u.id === report.universityId);
  const ngo = NGOS.find((n) => n.id === report.project.ngoId);
  const csr = PARTNERS.find((p) => p.id === report.project.csrId);

const updates = [
    ...report.log.map((entry, index) => ({
      ...entry,
      key: `log-${index}`,
      source: "Case update",
    })),
    ...report.project.fieldReports.map((entry, index) => ({
      ...entry,
      key: `field-${index}`,
      source: "Field report",
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

const nextStep = {
    New: "Your report is awaiting review by the assigned institution.",
    "Under Review": "The institution is reviewing the issue before assigning a team.",
    "Team Assigned": "A research team has been assigned to develop the response.",
    "In Progress": "Work is underway. Field and case updates will appear below.",
    Resolved: report.project.govVerified
      ? "The report is resolved and its closure has been verified by Government."
      : "The report is marked resolved. Government verification is pending.",
  }[report.status];

return (
    <SectionCard className="p-5 sm:p-6 min-w-0">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div>
          <p
            className="text-xs font-semibold tracking-wider mb-2"
            style={{ color: C.primary }}
          >
            {reportReference(report)}
          </p>
          <h3 className="text-lg font-semibold" style={{ color: C.ink }}>
            {report.title}
          </h3>
        </div>
        <div className="shrink-0">
          <StatusPill status={report.status} />
        </div>
      </div>

<p className="text-sm leading-relaxed mb-3" style={{ color: C.inkSoft }}>
        {report.description}
      </p>

<p className="text-xs mb-3" style={{ color: C.inkSoft }}>
        {report.district} · {report.domain}{report.secondaryDomain ? ` (also touches ${report.secondaryDomain})` : ""} · Submitted{" "}
        {fmtDate(new Date(report.submittedOn))}
      </p>

<div className="flex flex-wrap items-center gap-1.5 mb-6">
        {report.urgency && report.urgency.label !== "Low" && (
          <span
            className="text-xs px-2.5 py-1 rounded"
            style={{
              background: report.urgency.label === "Critical" ? `${C.accent}18` : `${C.gold}18`,
              color: report.urgency.label === "Critical" ? C.accent : C.gold,
            }}
          >
            {report.urgency.label} urgency
          </span>
        )}
        {report.supporters > 1 && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded" style={{ background: `${C.primary}12`, color: C.primary }}>
            <Users size={11} /> {report.supporters} citizens confirmed this issue
          </span>
        )}
        {report.status !== "Resolved" && isEscalated(report) && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded" style={{ background: `${C.accent}18`, color: C.accent }}>
            <AlertTriangle size={11} /> Taking longer than the usual timeline for this stage
          </span>
        )}
      </div>

<CitizenProcess status={report.status} />

<div
        className="rounded-xl p-4 mt-5 mb-6"
        style={{ background: `${C.primary}10` }}
      >
        <p className="text-xs font-semibold mb-1" style={{ color: C.primary }}>
          CURRENT UPDATE
        </p>
        <p className="text-sm" style={{ color: C.ink }}>
          {nextStep}
        </p>
      </div>

{report.isDuplicate && (
        <div
          className="flex items-start gap-2 rounded-xl p-3 mb-5 text-xs"
          style={{ color: C.accent, background: `${C.accent}12` }}
        >
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>
            This report is flagged as a possible duplicate. It remains logged
            for institutional review.
          </span>
        </div>
      )}

<h4 className="text-sm font-semibold mb-3" style={{ color: C.ink }}>
        People and support
      </h4>

<dl className="grid sm:grid-cols-2 gap-3 mb-6">
        {[
          ["Assigned institution", university?.short || "Not assigned"],
          [
            "Research team",
            report.team
              ? `${report.team.name} · ${report.team.lead}`
              : "Awaiting team assignment",
          ],
          [
            "NGO implementation",
            ngo
              ? `${ngo.name} · ${report.project.ngoStatus}`
              : report.project.ngoStatus === "requested"
                ? "Support requested"
                : "Not requested",
          ],
          [
            "CSR support",
            report.project.fundingStatus === "committed"
              ? `₹${report.project.fundingReleased.toLocaleString("en-IN")} of ₹${report.project.fundingAmount.toLocaleString("en-IN")} released${csr ? ` · ${csr.name}` : ""}`
              : report.project.fundingStatus === "requested"
                ? `₹${report.project.fundingAmount.toLocaleString("en-IN")} requested`
                : "Not requested",
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl p-3 border"
            style={{ background: C.bg, borderColor: C.line }}
          >
            <dt className="text-xs mb-1" style={{ color: C.inkSoft }}>
              {label}
            </dt>
            <dd className="text-xs font-medium leading-relaxed" style={{ color: C.ink }}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

<div
        className="flex items-center justify-between border-t pt-5 mb-4"
        style={{ borderColor: C.line }}
      >
        <h4 className="text-sm font-semibold" style={{ color: C.ink }}>
          Activity timeline
        </h4>
        <span className="text-xs" style={{ color: C.inkSoft }}>
          {updates.length} update{updates.length === 1 ? "" : "s"}
        </span>
      </div>

<ol className="space-y-4">
        {updates.map((entry) => (
          <li key={entry.key} className="flex gap-3">
            <span
              className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${C.primary}15`, color: C.primary }}
            >
              {entry.source === "Field report" ? (
                <Sprout size={13} />
              ) : (
                <Clock size={13} />
              )}
            </span>
            <div>
              <p className="text-xs leading-relaxed" style={{ color: C.ink }}>
                {entry.text}
              </p>
              <p className="text-[11px] mt-1" style={{ color: C.inkSoft }}>
                {entry.source} ·{" "}
                {new Date(entry.at).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

function CitizenPortal({
  challenges,
  addChallenge,
  updateChallenge,
  push,
  mySubmissionIds,
}) {
  const C = useTheme();

const [tab, setTab] = useState("overview");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState("");
  const [citizen, setCitizen] = useState("");
const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(null);

const fileRef = useRef(null);
  const reportFormRef = useRef(null);
  const submittingRef = useRef(false);
  const mountedRef = useRef(true);
  const [reportScrollKey, setReportScrollKey] = useState(0);

useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

const goToReport = () => {
    setTab("report");
    setReportScrollKey((key) => key + 1);
  };

useEffect(() => {
    if (tab !== "report" || reportScrollKey === 0) return undefined;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const timer = window.setTimeout(() => {
      reportFormRef.current?.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });
      const firstField = reportFormRef.current?.querySelector(
        "input, textarea, select"
      );
      if (firstField instanceof HTMLElement) {
        firstField.focus({ preventScroll: true });
      }
    }, 80);

    return () => window.clearTimeout(timer);
  }, [tab, reportScrollKey]);

const photoPreview = useMemo(() => (photo ? URL.createObjectURL(photo) : ""), [photo]);

useEffect(() => {
    if (!photoPreview) return undefined;
    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

const mine = useMemo(() => {
    const ids = new Set(mySubmissionIds);

return challenges
      .filter((challenge) => ids.has(challenge.id))
      .sort(
        (a, b) => new Date(b.submittedOn) - new Date(a.submittedOn)
      );
  }, [challenges, mySubmissionIds]);

const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

return mine.filter((report) => {
      const matchesStatus =
        statusFilter === "All" || report.status === statusFilter;

const searchable =
        `${reportReference(report)} ${report.title} ${report.district} ${report.domain}`
          .toLowerCase();

return matchesStatus && (!term || searchable.includes(term));
    });
  }, [mine, query, statusFilter]);

const selected =
    filtered.find((report) => report.id === selectedId) ||
    filtered[0] ||
    null;

const resolved = useMemo(
    () => mine.filter((report) => report.status === "Resolved").length,
    [mine]
  );
  const verified = useMemo(
    () =>
      mine.filter(
        (report) => report.status === "Resolved" && report.project.govVerified
      ).length,
    [mine]
  );
  const active = useMemo(
    () =>
      mine.filter((report) =>
        ["Team Assigned", "In Progress"].includes(report.status)
      ).length,
    [mine]
  );
  const civic = useMemo(() => computeCivicScore(mine), [mine]);

const controlStyle = {
    background: C.bg,
    borderColor: C.line,
    color: C.ink,
  };

const openReport = (id) => {
    setQuery("");
    setStatusFilter("All");
    setSelectedId(id);
    setTab("tracking");
  };

const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      event.target.value = "";
      return;
    }

if (file.size > 5 * 1024 * 1024) {
      setError("Please select an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }

setError("");
    setPhoto(file);
  };

const onSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

const cleanTitle = title.trim();
    const cleanDescription = description.trim();

if (
      cleanTitle.length < 5 ||
      cleanDescription.length < 11 ||
      !DISTRICTS.includes(district)
    ) {
      setError("Add a title, a fuller description, and a valid district.");
      return;
    }

submittingRef.current = true;
    setLoading(true);
    setError("");

try {
      // Duplicate checking should compare against unresolved reports.
      const openReports = challenges.filter(
        (challenge) => challenge.status !== "Resolved"
      );

      const outcome = await classifyReport(
        cleanTitle,
        cleanDescription,
        openReports,
        district
      );

      const now = new Date();
      const id = uid("chl");

      const newChallenge = {
        id,
        code: `SPX-${id.replace(/^chl-/, "").toUpperCase()}`,
        title: cleanTitle,
        description: cleanDescription,
        district,
        citizen: citizen.trim() || "Anonymous citizen",
        domain: outcome.domain,
        secondaryDomain: outcome.secondaryDomain || null,
        urgency: outcome.urgency || computeUrgency(cleanTitle, cleanDescription),
        submittedOn: now,
        statusSince: now,
        status: "New",
        universityId: outcome.universityId,
        confidence: outcome.confidence,
        routingReason: outcome.routingReason,
        isDuplicate: outcome.isDuplicate,
        duplicateOfId: outcome.isDuplicate ? outcome.duplicateOfId : null,
        supporters: 1,
        mergedReportIds: [],
        team: null,
        partners: [],
        photo: Boolean(photo),
        project: emptyProject(),
        log: [
          { at: now, text: "Submitted by citizen." },
          {
            at: now,
            text: `${outcome.source === "ai" ? "AI" : "Offline classifier"} routed this report. ${outcome.routingReason}`,
          },
        ],
      };

addChallenge(newChallenge);

      // When a near-identical open report already exists, add this citizen's
      // voice as a supporter of that case instead of letting duplicate effort
      // spin up silently in the background — this is what a Government
      // reviewer actually wants to see: "12 citizens confirmed this," not 12
      // disconnected tickets.
      if (outcome.isDuplicate && outcome.duplicateOfId) {
        const original = challenges.find((c) => c.id === outcome.duplicateOfId);
        if (original) {
          updateChallenge(original.id, {
            supporters: (original.supporters || 1) + 1,
            mergedReportIds: [...(original.mergedReportIds || []), id],
            log: [...original.log, { at: now, text: `Additional citizen report merged in (${reportReference(newChallenge)}).` }],
          });
        }
      }

if (mountedRef.current) {
        setTitle("");
        setDescription("");
        setDistrict("");
        setCitizen("");
        setPhoto(null);
        if (fileRef.current) fileRef.current.value = "";
        openReport(id);
      }

push(
        outcome.source === "ai"
          ? "Report submitted and routed. Track its progress here."
          : "Report submitted using offline routing. Track its progress here.",
        "success"
      );
    } catch {
      if (mountedRef.current) {
        setError("The report could not be submitted. Please try again.");
      }
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  };

const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "report", label: "Report a problem", icon: PlusCircle },
    { id: "tracking", label: "Track reports", icon: Search },
  ];

return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Dashboard header */}
      <section
        className="rounded-2xl p-6 sm:p-8 mb-6 overflow-hidden anim-soft-rise"
        style={{
          background: `linear-gradient(125deg, ${C.primaryDeep}, ${
            C.mode === "dark" ? "#234B39" : C.primary
          })`,
          color: "#fff",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs mb-4"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <Sparkles size={13} />
              sparkX prototype · Citizen workspace
            </span>

<h2
              className="text-2xl sm:text-3xl leading-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Your voice. Local action.
              <br />
              Progress you can follow.
            </h2>

<p className="text-sm leading-relaxed mt-3 opacity-80 max-w-lg">
              Report community challenges, follow the response, and see how
              institutions and partners work toward a resolution.
            </p>
          </div>

<button
            type="button"
            onClick={goToReport}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shrink-0 transition hover:brightness-105 active:scale-[0.98]"
            style={{ background: C.gold, color: C.primaryDeep }}
          >
            <PlusCircle size={17} />
            New Report
          </button>
        </div>
      </section>

{/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <div className="anim-fade-up anim-delay-1">
          <CitizenMetric
            icon={FileText}
            label="My reports"
            value={mine.length}
            hint="Submitted this session"
          />
        </div>
        <div className="anim-fade-up anim-delay-2">
          <CitizenMetric
            icon={Wrench}
            label="Active projects"
            value={active}
            hint="Team assigned or in progress"
            color={C.mode === "dark" ? "#5B9BC0" : "#2B6E8C"}
          />
        </div>
        <div className="anim-fade-up anim-delay-3">
          <CitizenMetric
            icon={CheckCircle2}
            label="Resolved"
            value={resolved}
            hint="Marked resolved by institution"
            color={C.gold}
          />
        </div>
        <div className="anim-fade-up anim-delay-4">
          <CitizenMetric
            icon={ShieldCheck}
            label="Verified closures"
            value={verified}
            hint="Confirmed by Government"
            color={C.primary}
          />
        </div>
        <div className="anim-fade-up anim-delay-5">
          <CitizenMetric
            icon={BadgeCheck}
            label="Civic score"
            value={`${civic.level}${civic.score ? ` · ${civic.score}` : ""}`}
            hint="Earned by submitting and following through"
            color={C.gold}
          />
        </div>
      </div>

{/* View navigation */}
      <nav
        aria-label="Citizen workspace views"
        className="flex gap-1 p-1.5 rounded-2xl border mb-6 overflow-x-auto"
        style={{ background: C.surface, borderColor: C.line }}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? "page" : undefined}
            onClick={() => setTab(id)}
            className="flex items-center justify-center gap-2 flex-1 whitespace-nowrap px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition"
            style={{
              background: tab === id ? `${C.primary}15` : "transparent",
              color: tab === id ? C.primary : C.inkSoft,
            }}
          >
            <Icon size={16} />
            {label}
            {id === "tracking" && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px]"
                style={{ background: C.bgDeep, color: C.ink }}
              >
                {mine.length}
              </span>
            )}
          </button>
        ))}
      </nav>

{/* Overview */}
      {tab === "overview" && (
        <div key="overview" className="space-y-6 anim-tab-panel">
          <CitizenCharts reports={mine} />

<SectionCard className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <h3 className="text-base font-semibold" style={{ color: C.ink }}>
                  Recent reports
                </h3>
                <p className="text-xs mt-1" style={{ color: C.inkSoft }}>
                  Open a report to see its complete journey.
                </p>
              </div>
              {mine.length > 0 && (
                <button
                  onClick={() => setTab("tracking")}
                  className="text-xs font-semibold inline-flex items-center gap-1 shrink-0"
                  style={{ color: C.primary }}
                >
                  View all <ArrowRight size={14} />
                </button>
              )}
            </div>

{mine.length === 0 ? (
              <div className="text-center py-6">
                <EmptyState
                  icon={Inbox}
                  title="No reports yet"
                  hint="Start with an issue in your neighbourhood. Every submitted report gets its own tracking reference."
                />
                <button
                  type="button"
                  onClick={goToReport}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition hover:brightness-105 active:scale-[0.98]"
                  style={{
  background: C.primary,
  color: C.mode === "dark" ? C.primaryDeep : "#FFFFFF",
}}

                >
                  Submit your first report
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {mine.slice(0, 4).map((report) => (
                  <button
                    key={report.id}
                    onClick={() => openReport(report.id)}
                    className="w-full text-left p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition hover:brightness-95"
                    style={{ background: C.bg, borderColor: C.line }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: C.ink }}>
                        {report.title}
                      </p>
                      <p
                        className="text-xs mt-1 break-all"
                        style={{ color: C.inkSoft }}
                      >
                        {reportReference(report)} · {report.district}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={report.status} />
                      <ChevronRight size={16} color={C.inkSoft} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>

<SectionCard className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold mb-2" style={{ color: C.ink }}>
              How your report moves forward
            </h3>
            <p className="text-xs mb-4" style={{ color: C.inkSoft }}>
              The standard workflow is shown below. Open an individual report
              to see its actual current stage.
            </p>
            <CitizenProcess status={null} />
            <p className="text-xs mt-4 leading-relaxed" style={{ color: C.inkSoft }}>
              University teams coordinate the response. NGOs and CSR partners
              can support implementation and funding. Government verification
              is tracked separately after resolution.
            </p>
          </SectionCard>
        </div>
      )}

{/* Report form */}
      {tab === "report" && (
        <div
          key="report"
          ref={reportFormRef}
          id="citizen-report-form"
          className="grid lg:grid-cols-3 gap-5 items-start anim-tab-panel scroll-mt-6"
        >
          <SectionCard className="p-5 sm:p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-1" style={{ color: C.ink }}>
              What needs attention?
            </h3>
            <p className="text-sm mb-6" style={{ color: C.inkSoft }}>
              Share a clear description so the issue reaches the right team.
            </p>

<form onSubmit={onSubmit} aria-busy={loading}>
              <fieldset disabled={loading} className="min-w-0">
                <Field label="Report title" required>
                  <input
                    required
                    minLength={5}
                    maxLength={100}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className={inputCls}
                    style={controlStyle}
                    placeholder="e.g. Broken hand pump near the village school"
                  />
                </Field>

<Field label="Describe the problem" required>
                  <textarea
                    required
                    minLength={11}
                    maxLength={600}
                    rows={5}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className={inputCls}
                    style={{ ...controlStyle, resize: "vertical" }}
                    placeholder="Where is it happening? Since when? Who is affected?"
                  />
                  <span
                    className="block text-right text-xs mt-1"
                    style={{ color: C.inkSoft }}
                  >
                    {description.length}/600
                  </span>
                </Field>

<div className="grid sm:grid-cols-2 gap-x-4">
                  <Field label="District" required>
                    <select
                      required
                      value={district}
                      onChange={(event) => setDistrict(event.target.value)}
                      className={`${inputCls} pr-8`}
                      style={controlStyle}
                    >
                      <option value="">Select district</option>
                      {DISTRICTS.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </Field>

<Field label="Your name (optional)">
                    <input
                      value={citizen}
                      maxLength={100}
                      onChange={(event) => setCitizen(event.target.value)}
                      className={inputCls}
                      style={controlStyle}
                      placeholder="Leave blank to report anonymously"
                    />
                  </Field>
                </div>

<div className="mb-5">
                  <p className="text-sm font-medium mb-2" style={{ color: C.ink }}>
                    Photo evidence (optional)
                  </p>

<input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    aria-label="Choose photo evidence"
                    className="hidden"
                    onChange={handlePhoto}
                  />

{photo ? (
                    <div
                      className="flex items-center gap-3 rounded-xl border p-3"
                      style={controlStyle}
                    >
                      {photoPreview && (
                        <img
                          src={photoPreview}
                          alt="Selected report evidence"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: C.ink }}>
                          {photo.name}
                        </p>
                        <p className="text-xs mt-1" style={{ color: C.inkSoft }}>
                          Local preview only · up to 5 MB
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove selected photo"
                        onClick={() => {
                          setPhoto(null);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="p-2 rounded-lg"
                        style={{ color: C.inkSoft }}
                      >
                        <X size={17} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full border border-dashed rounded-xl p-6 flex flex-col items-center gap-2"
                      style={controlStyle}
                    >
                      <Upload size={22} color={C.primary} />
                      <span className="text-sm">Choose a photo</span>
                      <span className="text-xs" style={{ color: C.inkSoft }}>
                        Image files up to 5 MB · prototype preview
                      </span>
                    </button>
                  )}
                </div>

{error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 text-sm rounded-xl p-3 mb-4"
                    style={{ background: `${C.accent}15`, color: C.accent }}
                  >
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

<button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-60"
                  style={{
  background: C.primary,
  color: C.mode === "dark" ? C.primaryDeep : "#FFFFFF",
}}

                >
                  {loading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Sparkles size={17} />
                  )}
                  {loading ? "Classifying your report…" : "Submit and track report"}
                </button>
              </fieldset>
            </form>
          </SectionCard>

<SectionCard className="p-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: `${C.gold}18`, color: C.gold }}
            >
              <ShieldCheck size={21} />
            </div>

<h3 className="font-semibold mb-3" style={{ color: C.ink }}>
              A clearer report helps
            </h3>

<div className="space-y-4">
              {[
                ["Be specific", "Include a locality or nearby landmark in your description."],
                ["Explain the impact", "Mention how long it has persisted and who is affected."],
                ["Protect your privacy", "Avoid including identity documents or sensitive personal information."],
                ["Track what happens", "Your report appears in Track reports immediately after submission."],
              ].map(([heading, text]) => (
                <div key={heading}>
                  <p className="text-sm font-medium" style={{ color: C.ink }}>
                    {heading}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: C.inkSoft }}>
                    {text}
                  </p>
                </div>
              ))}
            </div>

<p
              className="border-t pt-4 mt-5 text-xs leading-relaxed"
              style={{ borderColor: C.line, color: C.inkSoft }}
            >
              Prototype only. Reports are stored in memory and reset on page
              refresh. Selected photos are not uploaded.
            </p>
          </SectionCard>
        </div>
      )}

{/* Tracking workspace */}
      {tab === "tracking" && (
        <div key="tracking" className="anim-tab-panel">
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search
                size={16}
                color={C.inkSoft}
                className="absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                aria-label="Search your reports"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by reference, title, district, or domain"
                className={`${inputCls} pl-10`}
                style={controlStyle}
              />
            </div>

<select
              aria-label="Filter reports by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border px-3 py-2.5 pr-8 text-sm"
              style={controlStyle}
            >
              <option value="All">All statuses</option>
              {STATUS_FLOW.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

<p className="text-xs mb-4" style={{ color: C.inkSoft }}>
            Showing {filtered.length} of {mine.length} report(s) submitted this session
          </p>

{filtered.length === 0 ? (
            <SectionCard>
              <EmptyState
                icon={mine.length ? Search : Inbox}
                title={mine.length ? "No matching reports" : "Nothing to track yet"}
                hint={
                  mine.length
                    ? "Try another search or select All statuses."
                    : "Submit a report to follow its review, team assignment, implementation, and closure."
                }
              />
            </SectionCard>
          ) : (
            <div className="grid lg:grid-cols-3 gap-5 items-start">
              <div className="space-y-3">
                {filtered.map((report) => {
                  const isSelected = selected?.id === report.id;

return (
                    <button
                      key={report.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedId(report.id)}
                      className="w-full text-left rounded-2xl border p-4 transition"
                      style={{
                        background: isSelected ? `${C.primary}10` : C.surface,
                        borderColor: isSelected ? C.primary : C.line,
                        boxShadow: isSelected
                          ? `0 0 0 1px ${C.primary}15`
                          : "none",
                      }}
                    >
                      <p
                        className="text-[10px] font-semibold mb-2 break-all"
                        style={{ color: C.primary }}
                      >
                        {reportReference(report)}
                      </p>
                      <p
                        className="text-sm font-semibold leading-relaxed mb-2"
                        style={{ color: C.ink }}
                      >
                        {report.title}
                      </p>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                        {report.district} · {fmtDate(new Date(report.submittedOn))}
                      </p>
                      <StatusPill status={report.status} />
                    </button>
                  );
                })}
              </div>

<div className="lg:col-span-2 min-w-0">
                <CitizenReportDetail report={selected} />
              </div>
            </div>
          )}
        </div>
      )}

<p className="text-xs mt-6 text-center" style={{ color: C.inkSoft }}>
        Session-only prototype · Charts reflect your reports · Funding is simulated
      </p>
    </div>
  );
}

/* ------------------------------ University Portal ------------------------------ */
function UniversityPortal({ challenges, updateChallenge, push }) {
  const C = useTheme();
  const [uniId, setUniId] = useState(UNIVERSITIES[0].id);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const uni = UNIVERSITIES.find((u) => u.id === uniId);
  const list = challenges
    .filter((c) => c.universityId === uniId)
    .filter((c) => (statusFilter === "All" ? true : c.status === statusFilter))
    .filter((c) => (query ? (c.title + c.description).toLowerCase().includes(query.toLowerCase()) : true))
    .sort((a, b) => new Date(b.submittedOn) - new Date(a.submittedOn));

  const advance = (c) => {
    const idx = STATUS_FLOW.indexOf(c.status);
    if (idx >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[idx + 1];
    const now = new Date();
    const patch = {
      status: nextStatus,
      statusSince: now,
      log: [...c.log, { at: now, text: `Marked as ${nextStatus}.` }],
    };
    if (nextStatus === "Team Assigned" && !c.team) {
      patch.team = assignTeam(c.id);
    }
    updateChallenge(c.id, patch);
    push(`"${c.title.slice(0, 32)}${c.title.length > 32 ? "…" : ""}" moved to ${nextStatus}.`, "success");
  };

  const togglePartner = (c, partnerId) => {
    const has = c.partners.includes(partnerId);
    const partners = has ? c.partners.filter((p) => p !== partnerId) : [...c.partners, partnerId];
    updateChallenge(c.id, { partners, log: [...c.log, { at: new Date(), text: has ? "Partner removed." : "Partner invited to co-develop." }] });
    push(has ? "Partner removed from project." : "Partner invited.", "success");
  };

  const requestNgo = (c) => {
    updateChallenge(c.id, { project: { ...c.project, ngoStatus: "requested" }, log: [...c.log, { at: new Date(), text: "Requested NGO implementation support." }] });
    push("NGO support requested — visible on the NGO portal now.", "success");
  };
  const requestCsr = (c) => {
    const amount = fundingAsk(c.id);
    updateChallenge(c.id, { project: { ...c.project, fundingStatus: "requested", fundingAmount: amount }, log: [...c.log, { at: new Date(), text: `Requested CSR funding (₹${amount.toLocaleString("en-IN")}).` }] });
    push("CSR funding requested — visible on the CSR portal now.", "success");
  };

  const counts = STATUS_FLOW.reduce((acc, s) => ({ ...acc, [s]: challenges.filter((c) => c.universityId === uniId && c.status === s).length }), {});

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl mb-1" style={{ fontFamily: "'Fraunces', serif", color: C.ink }}>University portal</h2>
          <p className="text-sm" style={{ color: C.inkSoft }}>Review challenges routed to your institution and move them toward resolution.</p>
        </div>
        <div className="relative">
          <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.inkSoft} aria-hidden="true" />
          <label className="sr-only" htmlFor="university-select">Select university</label>
          <select
            id="university-select"
            className="pl-8 pr-3 py-2.5 rounded-md border text-sm appearance-none min-w-[240px]"
            style={{ borderColor: C.line, color: C.ink, background: C.bg }}
            value={uniId}
            onChange={(e) => setUniId(e.target.value)}
          >
            {UNIVERSITIES.map((u) => <option key={u.id} value={u.id}>{u.short}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6" role="group" aria-label="Filter by status">
        {STATUS_FLOW.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={statusFilter === s}
            onClick={() => setStatusFilter(statusFilter === s ? "All" : s)}
            className="text-left rounded-md border px-3 py-3 transition"
            style={{
              borderColor: statusFilter === s ? C.primary : C.line,
              background: statusFilter === s ? `${C.primary}14` : C.surface,
            }}
          >
            <p className="text-2xl font-medium" style={{ color: C.ink, fontFamily: "'Fraunces', serif" }}>{counts[s]}</p>
            <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>{s}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.inkSoft} aria-hidden="true" />
          <label className="sr-only" htmlFor="uni-search">Search challenges</label>
          <input
            id="uni-search"
            className={`${inputCls} pl-8`}
            style={{ borderColor: C.line, background: C.bg, color: C.ink }}
            placeholder="Search challenges..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {statusFilter !== "All" && (
          <button type="button" onClick={() => setStatusFilter("All")} className="text-sm px-3 py-2 rounded-md border flex items-center gap-1.5" style={{ borderColor: C.line, color: C.inkSoft }}>
            <X size={14} aria-hidden="true" /> Clear filter: {statusFilter}
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={ClipboardList}
            title={challenges.filter((c) => c.universityId === uniId).length === 0 ? `No challenges routed to ${uni.short} yet` : "No challenges match this filter"}
            hint="Challenges appear here automatically once the AI classifier routes a matching citizen report to this institution."
          />
        </SectionCard>
      ) : (
        <div className="space-y-3">
          {list.map((c) => {
            const meta = DOMAIN_META[c.domain];
            const Icon = meta.icon;
            const nextIdx = STATUS_FLOW.indexOf(c.status) + 1;
            const nextStatus = STATUS_FLOW[nextIdx];
            const canRequestSupport = ["Team Assigned", "In Progress"].includes(c.status);
            return (
              <SectionCard key={c.id} className="p-4 sm:p-5" style={{ borderLeftColor: meta.color }}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${meta.color}18` }}>
                      <Icon size={15} color={meta.color} />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm" style={{ color: C.ink }}>{c.title}</h4>
                      <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                        {c.citizen} · {c.district} · {fmtDate(c.submittedOn)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusPill status={c.status} />
                    {isEscalated(c) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${C.accent}22`, color: C.accent }}>
                        <AlertTriangle size={10} /> SLA overdue
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm mb-3" style={{ color: C.inkSoft }}>{c.description}</p>

                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {c.urgency && c.urgency.label !== "Low" && (
                    <span
                      className="text-xs px-2.5 py-1 rounded"
                      style={{
                        background: c.urgency.label === "Critical" ? `${C.accent}22` : `${C.gold}22`,
                        color: c.urgency.label === "Critical" ? C.accent : C.gold,
                      }}
                    >
                      {c.urgency.label} urgency
                    </span>
                  )}
                  {c.secondaryDomain && (
                    <span className="text-xs px-2.5 py-1 rounded" style={{ background: C.bgDeep, color: C.inkSoft }}>
                      Also touches {c.secondaryDomain}
                    </span>
                  )}
                  {c.supporters > 1 && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded" style={{ background: `${C.primary}14`, color: C.primary }}>
                      <Users size={11} /> {c.supporters} citizens confirmed this
                    </span>
                  )}
                </div>

                {c.isDuplicate && (
                  <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded mb-3 w-fit" style={{ background: `${C.accent}22`, color: C.accent }}>
                    <AlertTriangle size={13} /> Flagged as a possible duplicate
                  </div>
                )}

                {c.team && (
                  <div className="text-xs mb-3 flex items-center gap-1.5" style={{ color: C.inkSoft }}>
                    <Users size={13} /> {c.team.name} · led by {c.team.lead} · {c.team.students} students
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: C.line }}>
                  {nextStatus && (
                    <button
                      onClick={() => advance(c)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md text-white"
                      style={{ background: C.primary }}
                    >
                      {nextStatus === "Team Assigned" ? <Users size={13} /> : <Clock size={13} />}
                      Mark as {nextStatus}
                    </button>
                  )}
                  {c.status === "Resolved" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md" style={{ background: `${C.primary}20`, color: C.primary }}>
                      <CheckCircle2 size={13} /> Resolved
                    </span>
                  )}
                  {canRequestSupport && c.project.ngoStatus === "none" && (
                    <button onClick={() => requestNgo(c)} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border" style={{ borderColor: C.line, color: C.ink }}>
                      <Sprout size={13} /> Request NGO support
                    </button>
                  )}
                  {canRequestSupport && c.project.fundingStatus === "none" && (
                    <button onClick={() => requestCsr(c)} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border" style={{ borderColor: C.line, color: C.ink }}>
                      <HandCoins size={13} /> Request CSR funding
                    </button>
                  )}
                  <div className="flex flex-wrap gap-1.5 ml-0 sm:ml-2">
                    {PARTNERS.slice(0, 4).map((p) => {
                      const active = c.partners.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePartner(c, p.id)}
                          title={p.focus}
                          className="text-xs px-2.5 py-1.5 rounded-md border transition"
                          style={{
                            borderColor: active ? C.gold : C.line,
                            background: active ? `${C.gold}22` : C.surface,
                            color: active ? C.gold : C.inkSoft,
                          }}
                        >
                          {active ? "✓ " : "+ "}{p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {(c.project.ngoStatus !== "none" || c.project.fundingStatus !== "none") && (
                  <p className="text-xs mt-2 pt-2 border-t" style={{ color: C.inkSoft, borderColor: C.line }}>
                    {c.project.ngoStatus !== "none" && <>NGO status: <strong>{c.project.ngoStatus}</strong>{c.project.ngoId ? ` (${NGOS.find((n) => n.id === c.project.ngoId)?.name})` : ""} · </>}
                    {c.project.fundingStatus !== "none" && <>CSR status: <strong>{c.project.fundingStatus}</strong> (₹{c.project.fundingReleased.toLocaleString("en-IN")}/₹{c.project.fundingAmount.toLocaleString("en-IN")} released)</>}
                  </p>
                )}
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ NGO Portal ------------------------------ */
function NgoPortal({ challenges, updateChallenge, push }) {
  const C = useTheme();
  const [ngoId, setNgoId] = useState(NGOS[0].id);
  const [note, setNote] = useState({});
  const ngo = NGOS.find((n) => n.id === ngoId);

  const available = challenges
    .filter((c) => c.project.ngoStatus === "requested" && !c.project.ngoId)
    .sort((a, b) => (b.urgency?.score || 0) - (a.urgency?.score || 0));
  const mine = challenges.filter((c) => c.project.ngoId === ngoId);

  const accept = (c) => {
    updateChallenge(c.id, { project: { ...c.project, ngoId, ngoStatus: "assigned" }, log: [...c.log, { at: new Date(), text: `${ngo.name} accepted the implementation project.` }] });
    push(`Accepted "${c.title.slice(0, 30)}…"`, "success");
  };
  const logUpdate = (c) => {
    const text = note[c.id]?.trim();
    if (!text) return;
    updateChallenge(c.id, {
      project: { ...c.project, ngoStatus: "in-field", fieldReports: [...c.project.fieldReports, { at: new Date(), text }] },
    });
    setNote((n) => ({ ...n, [c.id]: "" }));
    push("Field update logged.", "success");
  };
  const complete = (c) => {
    updateChallenge(c.id, { project: { ...c.project, ngoStatus: "completed" }, log: [...c.log, { at: new Date(), text: `${ngo.name} marked field implementation complete.` }] });
    push("Implementation marked complete.", "success");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl mb-1" style={{ fontFamily: "'Fraunces', serif", color: C.ink }}>NGO portal</h2>
          <p className="text-sm" style={{ color: C.inkSoft }}>Take university-designed solutions into the field and report progress.</p>
        </div>
        <label className="sr-only" htmlFor="ngo-select">Select NGO organisation</label>
        <select
          id="ngo-select"
          className="px-3 py-2.5 rounded-md border text-sm min-w-[220px]"
          style={{ borderColor: C.line, color: C.ink, background: C.bg }}
          value={ngoId}
          onChange={(e) => setNgoId(e.target.value)}
        >
          {NGOS.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
      </div>

      <h3 className="text-sm font-medium mb-3" style={{ color: C.ink }}>Available for implementation ({available.length})</h3>
      {available.length === 0 ? (
        <SectionCard className="mb-8"><EmptyState icon={Inbox} title="No open requests right now" hint="Universities request NGO support once a research team is assigned to a challenge." /></SectionCard>
      ) : (
        <div className="space-y-3 mb-8">
          {available.map((c) => {
            const meta = DOMAIN_META[c.domain];
            return (
              <SectionCard key={c.id} className="p-4" style={{ borderLeftColor: meta.color }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.ink }}>
                      {c.title}
                      {c.urgency?.label !== "Low" && (
                        <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full align-middle" style={{ background: c.urgency?.label === "Critical" ? `${C.accent}22` : `${C.gold}22`, color: c.urgency?.label === "Critical" ? C.accent : C.gold }}>
                          {c.urgency?.label}
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>{c.district} · {c.domain} · via {UNIVERSITIES.find((u) => u.id === c.universityId)?.short}</p>
                  </div>
                  <button onClick={() => accept(c)} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md text-white shrink-0" style={{ background: C.primary }}>
                    <CheckCircle2 size={13} /> Accept project
                  </button>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      <h3 className="text-sm font-medium mb-3" style={{ color: C.ink }}>My projects ({mine.length})</h3>
      {mine.length === 0 ? (
        <SectionCard><EmptyState icon={Sprout} title={`${ngo.name} has no assigned projects yet`} hint="Accept an available project above to start field implementation." /></SectionCard>
      ) : (
        <div className="space-y-3">
          {mine.map((c) => (
            <SectionCard key={c.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-medium" style={{ color: C.ink }}>{c.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>{c.district} · status: {c.project.ngoStatus}</p>
                </div>
                {c.project.ngoStatus !== "completed" && (
                  <button onClick={() => complete(c)} className="text-xs font-medium px-3 py-1.5 rounded-md border shrink-0" style={{ borderColor: C.line, color: C.ink }}>
                    Mark complete
                  </button>
                )}
              </div>
              {c.project.fieldReports.length > 0 && (
                <div className="text-xs mb-2 space-y-1" style={{ color: C.inkSoft }}>
                  {c.project.fieldReports.map((r, i) => <p key={i}>• {fmtDate(r.at)} — {r.text}</p>)}
                </div>
              )}
              {c.project.ngoStatus !== "completed" && (
                <div className="flex gap-2 pt-2 border-t" style={{ borderColor: C.line }}>
                  <input
                    className={`${inputCls} flex-1`}
                    style={{ borderColor: C.line, background: C.bg, color: C.ink }}
                    placeholder="Log a field update..."
                    value={note[c.id] || ""}
                    onChange={(e) => setNote((n) => ({ ...n, [c.id]: e.target.value }))}
                  />
                  <button onClick={() => logUpdate(c)} className="text-xs font-medium px-3 py-2 rounded-md text-white shrink-0" style={{ background: C.primary }}>Add</button>
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ CSR / Industry Portal ------------------------------ */
function CsrPortal({ challenges, updateChallenge, push }) {
  const C = useTheme();
  const [csrId, setCsrId] = useState(PARTNERS[0].id);
  const partner = PARTNERS.find((p) => p.id === csrId);

  const available = challenges.filter((c) => c.project.fundingStatus === "requested" && !c.project.csrId);
  const mine = challenges.filter((c) => c.project.csrId === csrId);
  const funded = mine.filter((c) => c.project.fundingStatus === "committed");
  const totalCommitted = funded.reduce((s, c) => s + c.project.fundingAmount, 0);
  const totalReleased = funded.reduce((s, c) => s + c.project.fundingReleased, 0);

  const commit = (c) => {
    updateChallenge(c.id, { project: { ...c.project, csrId, fundingStatus: "committed" }, log: [...c.log, { at: new Date(), text: `${partner.name} committed ₹${c.project.fundingAmount.toLocaleString("en-IN")} in funding, released in three accountability-linked tranches.` }] });
    push("Funding committed. Tranches unlock as milestones are met.", "success");
  };

  // Releases only the next eligible tranche (kickoff → field → closure) and
  // refuses to skip ahead — funding accountability is the whole point.
  const releaseTranche = (c) => {
    const milestone = nextFundingMilestone(c);
    if (!milestone || !milestone.eligible) return;
    const released = c.project.fundingReleased + milestone.amount;
    updateChallenge(c.id, {
      project: { ...c.project, fundingReleased: released },
      log: [...c.log, { at: new Date(), text: `${partner.name} released the ${milestone.label} tranche (₹${milestone.amount.toLocaleString("en-IN")}).` }],
    });
    push(`Released ₹${milestone.amount.toLocaleString("en-IN")} for ${milestone.label}.`, "success");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl mb-1" style={{ fontFamily: "'Fraunces', serif", color: C.ink }}>Industry & CSR portal</h2>
          <p className="text-sm" style={{ color: C.inkSoft }}>Fund and resource projects that need support. Mock funding data — no real transactions.</p>
        </div>
        <label className="sr-only" htmlFor="csr-select">Select CSR partner</label>
        <select
          id="csr-select"
          className="px-3 py-2.5 rounded-md border text-sm min-w-[220px]"
          style={{ borderColor: C.line, color: C.ink, background: C.bg }}
          value={csrId}
          onChange={(e) => setCsrId(e.target.value)}
        >
          {PARTNERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <SectionCard className="p-4 mb-6" style={{ borderLeftColor: C.gold }}>
        <div className="flex items-center gap-2">
          <IndianRupee size={16} color={C.gold} />
          <p className="text-sm" style={{ color: C.ink }}>
            {partner.name} has committed <strong>₹{totalCommitted.toLocaleString("en-IN")}</strong> across {funded.length} project(s) ·
            {" "}<strong>₹{totalReleased.toLocaleString("en-IN")}</strong> released so far
          </p>
        </div>
      </SectionCard>

      <h3 className="text-sm font-medium mb-3" style={{ color: C.ink }}>Seeking funding ({available.length})</h3>
      {available.length === 0 ? (
        <SectionCard className="mb-8"><EmptyState icon={HandCoins} title="No open funding requests" hint="Universities request CSR funding once a project is underway." /></SectionCard>
      ) : (
        <div className="space-y-3 mb-8">
          {available.map((c) => {
            const meta = DOMAIN_META[c.domain];
            return (
              <SectionCard key={c.id} className="p-4" style={{ borderLeftColor: meta.color }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.ink }}>{c.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                      {c.district} · {c.domain} · via {UNIVERSITIES.find((u) => u.id === c.universityId)?.short} · requested ₹{c.project.fundingAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <button onClick={() => commit(c)} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md text-white shrink-0" style={{ background: C.primary }}>
                    <HandCoins size={13} /> Commit funding
                  </button>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      <h3 className="text-sm font-medium mb-3" style={{ color: C.ink }}>Funded projects ({funded.length})</h3>
      {funded.length === 0 ? (
        <SectionCard><EmptyState icon={BadgeCheck} title="No funded projects yet" hint="Commit funding above to see it tracked here." /></SectionCard>
      ) : (
        <div className="space-y-3">
          {funded.map((c) => {
            const pct = c.project.fundingAmount ? Math.round((c.project.fundingReleased / c.project.fundingAmount) * 100) : 0;
            const milestone = nextFundingMilestone(c);
            return (
              <SectionCard key={c.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.ink }}>{c.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                      ₹{c.project.fundingReleased.toLocaleString("en-IN")} of ₹{c.project.fundingAmount.toLocaleString("en-IN")} released · {c.district}
                    </p>
                  </div>
                  <StatusPill status={c.status} />
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: C.bgDeep }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.primary }} />
                </div>
                {milestone ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t" style={{ borderColor: C.line }}>
                    <span style={{ color: C.inkSoft }}>
                      Next tranche: <strong style={{ color: C.ink }}>{milestone.label}</strong> · ₹{milestone.amount.toLocaleString("en-IN")}
                      {!milestone.eligible && " · waiting on progress"}
                    </span>
                    <button
                      type="button"
                      disabled={!milestone.eligible}
                      onClick={() => releaseTranche(c)}
                      className="font-medium px-2.5 py-1.5 rounded-md text-white disabled:opacity-40"
                      style={{ background: C.primary }}
                    >
                      Release ₹{milestone.amount.toLocaleString("en-IN")}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs pt-2 border-t" style={{ borderColor: C.line, color: C.primary }}>All tranches fully released.</p>
                )}
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Government Portal ------------------------------ */
function AnalyticsCharts({ challenges }) {
  const C = useTheme();
  const palette = C.mode === "dark" ? CHART_PALETTE_DARK : CHART_PALETTE;
  const tooltipStyle = { borderRadius: 8, borderColor: C.line, fontSize: 12, background: C.surface, color: C.ink };
  const byDomain = useMemo(() => DOMAINS.map((d) => ({ name: d, value: challenges.filter((c) => c.domain === d).length })), [challenges]);
  const byDistrict = useMemo(() => {
    const map = {};
    challenges.forEach((c) => { map[c.district] = (map[c.district] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [challenges]);
  const byUniversity = useMemo(() => UNIVERSITIES.map((u) => {
    const own = challenges.filter((c) => c.universityId === u.id);
    return {
      name: u.short,
      New: own.filter((c) => c.status === "New").length,
      "In progress": own.filter((c) => ["Under Review", "Team Assigned", "In Progress"].includes(c.status)).length,
      Resolved: own.filter((c) => c.status === "Resolved").length,
    };
  }), [challenges]);
  const pieLabel = ({ cx, cy, midAngle, outerRadius, name, value }) => {
    const RAD = Math.PI / 180;
    const r = outerRadius + 14;
    const x = cx + r * Math.cos(-midAngle * RAD);
    const y = cy + r * Math.sin(-midAngle * RAD);
    return <text x={x} y={y} fill={C.inkSoft} fontSize={10} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">{`${name} (${value})`}</text>;
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5 mb-8">
      <SectionCard className="p-5">
        <h3 className="text-sm font-medium mb-4" style={{ color: C.ink }}>Challenges by domain</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={byDomain} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
            <XAxis type="number" allowDecimals={false} stroke={C.inkSoft} fontSize={12} />
            <YAxis dataKey="name" type="category" width={110} stroke={C.inkSoft} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {byDomain.map((d, i) => <Cell key={d.name} fill={palette[i % palette.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
      <SectionCard className="p-5">
        <h3 className="text-sm font-medium mb-4" style={{ color: C.ink }}>Challenges by district</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={byDistrict} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={pieLabel} labelLine={false}>
              {byDistrict.map((d, i) => <Cell key={d.name} fill={palette[i % palette.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </SectionCard>
      <SectionCard className="p-5 lg:col-span-2">
        <h3 className="text-sm font-medium mb-4" style={{ color: C.ink }}>Institutional participation by status</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byUniversity} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
            <XAxis dataKey="name" stroke={C.inkSoft} fontSize={9} interval={0} angle={-20} textAnchor="end" height={70} />
            <YAxis allowDecimals={false} stroke={C.inkSoft} fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: C.ink }} />
            <Bar dataKey="New" stackId="a" fill={C.gold} />
            <Bar dataKey="In progress" stackId="a" fill={palette[3]} />
            <Bar dataKey="Resolved" stackId="a" fill={C.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  );
}

function GovernmentPortal({ challenges, updateChallenge, push }) {
  const C = useTheme();
  const [district, setDistrict] = useState("All");
  const [domain, setDomain] = useState("All");
  const [status, setStatus] = useState("All");
  const [inst, setInst] = useState("All");

  const filtered = challenges.filter((c) =>
    (district === "All" || c.district === district) &&
    (domain === "All" || c.domain === domain) &&
    (status === "All" || c.status === status) &&
    (inst === "All" || c.universityId === inst)
  );

  const total = challenges.length;
  const resolved = challenges.filter((c) => c.status === "Resolved").length;
  const active = challenges.filter((c) => ["Team Assigned", "In Progress"].includes(c.status)).length;
  const underReview = challenges.filter((c) => c.status === "Under Review").length;
  const escalatedList = challenges
    .filter(isEscalated)
    .sort((a, b) => (b.urgency?.score || 0) - (a.urgency?.score || 0) || daysInCurrentStage(b) - daysInCurrentStage(a));
  const overdue = escalatedList.length;
  const criticalOpen = challenges.filter((c) => c.status !== "Resolved" && c.urgency?.label === "Critical").length;
  const ngoActive = new Set(challenges.filter((c) => c.project.ngoId).map((c) => c.project.ngoId)).size;
  const csrActive = new Set(challenges.filter((c) => c.project.csrId).map((c) => c.project.csrId)).size;
  const totalFunding = challenges.reduce((s, c) => s + (c.project.fundingStatus === "committed" ? c.project.fundingAmount : 0), 0);
  const totalReleased = challenges.reduce((s, c) => s + (c.project.fundingStatus === "committed" ? c.project.fundingReleased : 0), 0);
  const duplicatesFlagged = challenges.filter((c) => c.isDuplicate).length;
  const totalSupporters = challenges.reduce((s, c) => s + Math.max(0, (c.supporters || 1) - 1), 0);

  const verify = (c) => {
    const project = { ...c.project, govVerified: true };
    // Verification is also what unlocks the final CSR funding tranche, so the
    // last release is tied to an independent government check, not just the
    // NGO or CSR partner's own say-so.
    if (project.fundingStatus === "committed" && project.fundingReleased < project.fundingAmount) {
      project.fundingReleased = project.fundingAmount;
    }
    updateChallenge(c.id, { project, log: [...c.log, { at: new Date(), text: "Verified and closed by Government. Final funding tranche released." }] });
    push("Marked verified and closed. Final funding tranche released.", "success");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="text-xl mb-1" style={{ fontFamily: "'Fraunces', serif", color: C.ink }}>Government oversight dashboard</h2>
      <p className="text-sm mb-6" style={{ color: C.inkSoft }}>Statewide visibility across every citizen report, institution, NGO and CSR partner.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total challenges", value: total },
          { label: "Under review", value: underReview },
          { label: "Active projects", value: active },
          { label: "Resolved", value: resolved },
          { label: "SLA breached", value: overdue },
          { label: "Critical urgency open", value: criticalOpen },
          { label: "Institutions active", value: new Set(challenges.map((c) => c.universityId)).size },
          { label: "NGOs engaged", value: ngoActive },
          { label: "CSR partners engaged", value: csrActive },
          { label: "Funding committed", value: `₹${totalFunding.toLocaleString("en-IN")}` },
          { label: "Funding released", value: `₹${totalReleased.toLocaleString("en-IN")}` },
          { label: "Duplicates flagged", value: duplicatesFlagged },
          { label: "Citizen co-signatures", value: totalSupporters },
        ].map((s) => (
          <SectionCard key={s.label} className="p-4" style={{ borderLeftColor: (s.label === "SLA breached" && overdue > 0) || (s.label === "Critical urgency open" && criticalOpen > 0) ? C.accent : C.gold }}>
            <p className="text-2xl" style={{ color: C.ink, fontFamily: "'Fraunces', serif" }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: C.inkSoft }}>{s.label}</p>
          </SectionCard>
        ))}
      </div>

      {escalatedList.length > 0 && (
        <SectionCard className="p-4 mb-6" style={{ borderLeftColor: C.accent }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} color={C.accent} aria-hidden="true" />
            <p className="text-sm font-semibold" style={{ color: C.ink }}>
              {escalatedList.length} case{escalatedList.length === 1 ? "" : "s"} have breached their stage SLA
            </p>
          </div>
          <div className="space-y-2">
            {escalatedList.slice(0, 5).map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-xs rounded-lg px-3 py-2" style={{ background: C.bg }}>
                <span style={{ color: C.ink }}>
                  <strong>{c.title}</strong> · {UNIVERSITIES.find((u) => u.id === c.universityId)?.short} · {daysInCurrentStage(c)} days in "{c.status}" (limit {SLA_DAYS[c.status]})
                </span>
                <span className="flex items-center gap-2">
                  {c.urgency?.label !== "Low" && (
                    <span className="px-2 py-0.5 rounded-full" style={{ background: `${C.accent}22`, color: C.accent }}>{c.urgency.label}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => push(`Escalation notice sent to ${UNIVERSITIES.find((u) => u.id === c.universityId)?.short}.`, "success")}
                    className="font-medium px-2.5 py-1 rounded-md border"
                    style={{ borderColor: C.accent, color: C.accent }}
                  >
                    Notify institution
                  </button>
                </span>
              </div>
            ))}
          </div>
          {escalatedList.length > 5 && (
            <p className="text-xs mt-2" style={{ color: C.inkSoft }}>+ {escalatedList.length - 5} more overdue case(s) below.</p>
          )}
        </SectionCard>
      )}

      {duplicatesFlagged > 0 && (
        <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-md mb-6" style={{ background: `${C.accent}18`, color: C.accent }} role="status">
          <AlertTriangle size={15} aria-hidden="true" /> {duplicatesFlagged} duplicate report(s) flagged this season — no redundant institutional effort.
        </div>
      )}

      <AnalyticsCharts challenges={challenges} />

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg" style={{ fontFamily: "'Fraunces', serif", color: C.ink }}>All challenges & projects</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4" role="group" aria-label="Challenge filters">
        <label className="sr-only" htmlFor="gov-district">Filter by district</label>
        <select id="gov-district" className="px-2 py-2 rounded-md border text-xs" style={{ borderColor: C.line, background: C.bg, color: C.ink }} value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="All">All districts</option>
          {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <label className="sr-only" htmlFor="gov-domain">Filter by domain</label>
        <select id="gov-domain" className="px-2 py-2 rounded-md border text-xs" style={{ borderColor: C.line, background: C.bg, color: C.ink }} value={domain} onChange={(e) => setDomain(e.target.value)}>
          <option value="All">All domains</option>
          {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <label className="sr-only" htmlFor="gov-status">Filter by status</label>
        <select id="gov-status" className="px-2 py-2 rounded-md border text-xs" style={{ borderColor: C.line, background: C.bg, color: C.ink }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="All">All statuses</option>
          {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="sr-only" htmlFor="gov-inst">Filter by institution</label>
        <select id="gov-inst" className="px-2 py-2 rounded-md border text-xs" style={{ borderColor: C.line, background: C.bg, color: C.ink }} value={inst} onChange={(e) => setInst(e.target.value)}>
          <option value="All">All institutions</option>
          {UNIVERSITIES.map((u) => <option key={u.id} value={u.id}>{u.short}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <SectionCard><EmptyState icon={ClipboardList} title="No challenges match these filters" /></SectionCard>
        ) : filtered.map((c) => (
          <SectionCard key={c.id} className="p-3.5" style={{ borderLeftColor: DOMAIN_META[c.domain].color }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium" style={{ color: C.ink }}>
                  {c.title}
                  {c.supporters > 1 && (
                    <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full align-middle" style={{ background: `${C.primary}18`, color: C.primary }}>
                      {c.supporters} citizens
                    </span>
                  )}
                </p>
                <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                  {c.district} · {c.domain}{c.secondaryDomain ? ` +${c.secondaryDomain}` : ""} · {UNIVERSITIES.find((u) => u.id === c.universityId)?.short}
                  {c.project.ngoId && <> · NGO: {NGOS.find((n) => n.id === c.project.ngoId)?.name}</>}
                  {c.project.fundingStatus === "committed" && <> · ₹{c.project.fundingReleased.toLocaleString("en-IN")}/₹{c.project.fundingAmount.toLocaleString("en-IN")} released</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isEscalated(c) && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full" style={{ background: `${C.accent}18`, color: C.accent }}>
                    <AlertTriangle size={10} /> Overdue
                  </span>
                )}
                <StatusPill status={c.status} />
                {c.status === "Resolved" && !c.project.govVerified && (
                  <button onClick={() => verify(c)} className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md text-white" style={{ background: C.primary }}>
                    <ShieldCheck size={12} /> Verify & close
                  </button>
                )}
                {c.project.govVerified && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: `${C.primary}18`, color: C.primary }}>
                    <BadgeCheck size={12} /> Verified
                  </span>
                )}
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------- App ----------------------------------- */
function AppShell() {
  const C = useTheme();
  const [challenges, setChallenges] = useState(buildSeedChallenges);
  const [role, setRole] = useState(null);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [mySubmissionIds, setMySubmissionIds] = useState([]);
  const { toasts, push } = useToasts();
  const mainRef = useRef(null);

  const addChallenge = useCallback((c) => {
    setChallenges((prev) => [c, ...prev]);
    setMySubmissionIds((prev) => [c.id, ...prev]);
  }, []);
  const updateChallenge = useCallback((id, patch) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, ...patch };
        if (patch.project) next.project = { ...c.project, ...patch.project };
        return next;
      })
    );
  }, []);

  useEffect(() => {
    if (role || showArchitecture) {
      mainRef.current?.focus({ preventScroll: true });
    }
  }, [role, showArchitecture]);

  if (!role && !showArchitecture) {
    return (
      <RoleSelector
        onSelect={(r) => {
          if (r === "architecture") setShowArchitecture(true);
          else setRole(r);
        }}
      />
    );
  }

  const leaveArchitecture = () => {
    setShowArchitecture(false);
    if (!role) setRole(null);
  };

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif",
        color: C.ink,
        "--focus": C.primary,
        "--arrow": C.inkSoft,
        transition: "background .2s ease, color .2s ease",
      }}
    >
      <style>{`
        @keyframes fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        select { background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2'><polyline points='6 9 12 15 18 9'></polyline></svg>"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 2rem; }
        input:focus-visible, textarea:focus-visible, select:focus-visible, button:focus-visible { border-color: var(--focus) !important; box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus) 18%, transparent); }
        ::selection { background: color-mix(in srgb, var(--focus) 30%, transparent); }
        header { animation: fadein 0.45s ease-out both; }
      `}</style>

      {role && (
        <Header
          role={role}
          onSwitchRole={() => {
            setShowArchitecture(false);
            setRole(null);
          }}
          onOpenArchitecture={() => setShowArchitecture(true)}
        />
      )}

      {!role && showArchitecture && (
        <header style={{ background: C.primaryDeep }} className="text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-3">
            <h1 className="text-xl" style={{ fontFamily: "'Fraunces', serif" }}>sparkX prototype</h1>
            <button
              type="button"
              onClick={leaveArchitecture}
              className="text-xs font-medium px-3 py-2 rounded-full border"
              style={{ borderColor: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)" }}
            >
              Back to role selection
            </button>
          </div>
        </header>
      )}

      <main id="main-content" ref={mainRef} tabIndex={-1} className="outline-none anim-fade-in">
        {showArchitecture ? (
          <div>
            {role && (
              <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
                <button
                  type="button"
                  onClick={() => setShowArchitecture(false)}
                  className="text-xs font-medium px-3 py-1.5 rounded-md border"
                  style={{ borderColor: C.line, color: C.inkSoft }}
                >
                  ← Back to {ROLES.find((r) => r.id === role)?.label} portal
                </button>
              </div>
            )}
            <ArchitecturePage />
          </div>
        ) : (
          <>
            {role === "citizen" && (
              <CitizenPortal challenges={challenges} addChallenge={addChallenge} updateChallenge={updateChallenge} push={push} mySubmissionIds={mySubmissionIds} />
            )}
            {role === "university" && (
              <UniversityPortal challenges={challenges} updateChallenge={updateChallenge} push={push} />
            )}
            {role === "ngo" && <NgoPortal challenges={challenges} updateChallenge={updateChallenge} push={push} />}
            {role === "csr" && <CsrPortal challenges={challenges} updateChallenge={updateChallenge} push={push} />}
            {role === "government" && <GovernmentPortal challenges={challenges} updateChallenge={updateChallenge} push={push} />}
          </>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-xs" style={{ color: C.inkSoft }}>
        sparkX prototype · Societal Innovation Collaboration Portal · Demo data only
      </footer>

      <ToastStack toasts={toasts} />
    </div>
  );
}

function readStoredTheme() {
  try {
    const stored = localStorage.getItem("sparkx-theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export default function App() {
  const [mode, setMode] = useState(readStoredTheme);

  const toggleMode = useCallback(() => {
    setMode((m) => {
      const next = m === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("sparkx-theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const themeValue = useMemo(
    () => ({ ...(mode === "dark" ? DARK : LIGHT), mode, toggleMode }),
    [mode, toggleMode]
  );

  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
    document.title = "sparkX prototype";
  }, [mode]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <AppShell />
    </ThemeContext.Provider>
  );
}
