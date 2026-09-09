import React, { useState, useMemo, useCallback, useRef, useEffect, createContext, useContext } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  MapPin, Upload, CheckCircle2, AlertTriangle, Clock, Users, Building2,
  Sparkles, TrendingUp, Droplet, Leaf, HeartPulse, GraduationCap, Wrench,
  Trash2, TreePine, Loader2, X, Search, ArrowRight, FileText, Handshake,
  BarChart3, ClipboardList, PlusCircle, Camera, Sun, Moon,
} from "lucide-react";

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

const STATUS_FLOW = ["New", "Under Review", "Team Assigned", "In Progress", "Resolved"];

const FIRST_NAMES = ["Rakesh", "Sunita", "Amit", "Priya", "Birsa", "Kavita", "Manoj", "Sarita", "Dilip", "Anjali", "Rajesh", "Neha", "Suresh", "Pooja", "Vikas"];
const LAST_NAMES = ["Mahato", "Kumari", "Oraon", "Singh", "Munda", "Devi", "Prasad", "Toppo", "Kachhap", "Verma", "Hansda", "Tirkey", "Yadav", "Soren"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function uid(prefix = "id") { return `${prefix}-${Math.random().toString(36).slice(2, 9)}`; }
function citizenName() { return `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`; }

function daysAgo(n) {
  const d = new Date(2026, 8, 8);
  d.setDate(d.getDate() - n);
  return d;
}
function fmtDate(d) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const TEAM_ADJ = ["Jal", "Bhoomi", "Prakriti", "Sahyog", "Nirman", "Aarogya", "Vidya", "Urja"];
const TEAM_NOUN = ["Setu", "Spark", "Mission", "Lab", "Collective", "Force"];
function teamName() { return `Team ${rand(TEAM_ADJ)} ${rand(TEAM_NOUN)}`; }
function facultyLead() { return `Dr. ${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`; }

const DOMAIN_KEYWORDS = {
  Healthcare: ["hospital", "clinic", "doctor", "medicine", "health", "sub-centre", "asha", "disease", "vaccination", "maternal"],
  Education: ["school", "teacher", "classroom", "student", "college", "dropout", "midday meal", "literacy", "anganwadi"],
  Agriculture: ["crop", "farmer", "irrigation", "soil", "seed", "harvest", "pesticide", "mandi", "livestock", "farm"],
  "Water Management": ["water", "borewell", "handpump", "tanker", "pipeline", "drinking water", "well", "river", "flood"],
  Sanitation: ["toilet", "sewage", "garbage", "waste", "drain", "sanitation", "open defecation", "sewer"],
  Environment: ["pollution", "forest", "deforestation", "mining", "air quality", "tree", "dust", "encroachment"],
  Infrastructure: ["road", "bridge", "electricity", "power cut", "streetlight", "culvert", "transport", "building"],
};

function localClassify(title, description, existing) {
  const text = `${title} ${description}`.toLowerCase();
  let best = { domain: "Infrastructure", score: 0 };
  for (const domain of DOMAINS) {
    const score = DOMAIN_KEYWORDS[domain].reduce((s, kw) => (text.includes(kw) ? s + 1 : s), 0);
    if (score > best.score) best = { domain, score };
  }
  const candidates = UNIVERSITIES.filter((u) => u.expertise.includes(best.domain));
  const pool = candidates.length ? candidates : UNIVERSITIES;
  const uni = pool[0];

  let dup = null;
  const titleWords = new Set(title.toLowerCase().split(/\W+/).filter(Boolean));
  for (const c of existing) {
    const cWords = new Set(c.title.toLowerCase().split(/\W+/).filter(Boolean));
    const overlap = [...titleWords].filter((w) => cWords.has(w)).length;
    const union = new Set([...titleWords, ...cWords]).size;
    const sim = union ? overlap / union : 0;
    if (sim > 0.45 && c.district === undefined ? false : sim > 0.45) { dup = c; break; }
  }

  return {
    domain: best.domain,
    confidence: best.score > 0 ? Math.min(0.6 + best.score * 0.08, 0.93) : 0.55,
    universityId: uni.id,
    routingReason: `Matched on keyword overlap with ${best.domain.toLowerCase()} and ${uni.short}'s stated expertise.`,
    isDuplicate: !!dup,
    duplicateOfId: dup ? dup.id : null,
    duplicateReason: dup ? "Title strongly overlaps with an existing open report." : null,
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
    return {
      id: uid("chl"),
      title: s.title,
      description: s.description,
      domain: s.domain,
      district: s.district,
      citizen: citizenName(),
      submittedOn: daysAgo(s.days),
      status,
      universityId: uni.id,
      confidence: 0.72 + (i % 5) * 0.04,
      routingReason: `Routed to ${uni.short} based on demonstrated expertise in ${s.domain.toLowerCase()}.`,
      isDuplicate: false,
      duplicateOfId: null,
      team: hasTeam ? { name: teamName(), lead: facultyLead(), students: 3 + (i % 4) } : null,
      partners: status === "Resolved" || status === "In Progress" ? [rand(PARTNERS).id] : [],
      log: [{ at: daysAgo(s.days), text: "Submitted by citizen." }],
      photo: true,
    };
  });
}

/* -------------------------------- AI call --------------------------------- */
async function aiClassify(title, description, existing) {
  const uniList = UNIVERSITIES.map((u) => `${u.id}: ${u.short} — expertise in ${u.expertise.join(", ")}`).join("\n");
  const existingList = existing.slice(0, 12).map((c) => `${c.id}: "${c.title}" (${c.domain}, ${c.district})`).join("\n") || "none";

  const prompt = `You are the AI classification engine for a Jharkhand government civic-innovation portal. Classify the citizen report below.

Report title: "${title}"
Report description: "${description}"

Valid domains (choose exactly one): ${DOMAINS.join(", ")}

Universities available for routing (choose the single best id):
${uniList}

Existing open reports (check if the new report is a likely duplicate of any of these):
${existingList}

Respond with ONLY a raw JSON object, no markdown fences, no preamble, matching exactly this shape:
{"domain": "<one of the valid domains>", "confidence": <number 0 to 1>, "universityId": "<id from the list>", "routingReason": "<one short sentence explaining the match>", "isDuplicate": <true or false>, "duplicateOfId": "<id from existing reports or null>", "duplicateReason": "<one short sentence or null>"}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) throw new Error("AI service unavailable");
  const data = await response.json();
  const text = (data.content || []).map((b) => b.text || "").join("").trim();
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  if (!DOMAINS.includes(parsed.domain)) throw new Error("Invalid domain returned");
  if (!UNIVERSITIES.find((u) => u.id === parsed.universityId)) throw new Error("Invalid university returned");

  return { ...parsed, source: "ai" };
}

/* -------------------------------- toasts ----------------------------------- */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((text, kind = "info") => {
    const id = uid("toast");
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);
  return { toasts, push };
}

function ToastStack({ toasts }) {
  const C = useTheme();
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[92%] max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-md px-4 py-3 text-sm shadow-lg border flex items-start gap-2 animate-[fadein_.2s_ease-out]"
          style={{
            background: t.kind === "error" ? `${C.accent}22` : t.kind === "success" ? `${C.primary}22` : C.surface,
            borderColor: t.kind === "error" ? C.accent : t.kind === "success" ? C.primary : C.line,
            color: C.ink,
          }}
        >
          {t.kind === "error" ? <AlertTriangle size={16} color={C.accent} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} color={C.primary} className="mt-0.5 shrink-0" />}
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
      className={`border rounded-md ${className}`}
      style={{ background: C.surface, borderColor: C.line, borderLeftWidth: 4, borderLeftColor: C.primary, ...style }}
    >
      {children}
    </div>
  );
}

function Chip({ children, color, subtle = false }) {
  const C = useTheme();
  color = color || C.primary;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded"
      style={{ background: subtle ? `${color}14` : color, color: subtle ? color : "#fff" }}
    >
      {children}
    </span>
  );
}

function StatusPill({ status }) {
  const C = useTheme();
  const idx = STATUS_FLOW.indexOf(status);
  const colors = [C.mode === "dark" ? "#C99A54" : "#8C6B2B", C.gold, C.mode === "dark" ? "#5B9BC0" : "#2B6E8C", C.primary, C.primary];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border"
      style={{ borderColor: colors[idx], color: colors[idx], background: `${colors[idx]}10` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors[idx] }} />
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

function Field({ label, required, children }) {
  const C = useTheme();
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1.5" style={{ color: C.ink }}>
        {label} {required && <span style={{ color: C.accent }}>*</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls = "w-full rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2";

/* -------------------------------- header / nav -------------------------------- */
const TABS = [
  { id: "submit", label: "Submit Challenge", icon: PlusCircle },
  { id: "university", label: "University Dashboard", icon: Building2 },
  { id: "analytics", label: "Analytics Dashboard", icon: BarChart3 },
];

function Header({ tab, setTab }) {
  const C = useTheme();
  return (
    <div style={{ background: C.primaryDeep }} className="text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: C.gold }}>
              <Handshake size={20} color={C.primaryDeep} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                Jharkhand Sahyog Setu
              </h1>
              <p className="text-sm mt-1 opacity-80 max-w-xl">
                Bridging citizens, campuses and industry to solve Jharkhand's local challenges together.
              </p>
            </div>
          </div>
          <button
            onClick={C.toggleMode}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border transition"
            style={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff", background: "rgba(255,255,255,0.08)" }}
            title={C.mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {C.mode === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            <span className="hidden sm:inline">{C.mode === "dark" ? "Light" : "Dark"}</span>
          </button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-2 sm:px-6 overflow-x-auto">
        <div className="flex gap-1 sm:gap-2">
          {TABS.map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
                style={{
                  borderColor: active ? C.gold : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.62)",
                }}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Submit Challenge ------------------------------ */
function SubmitChallenge({ challenges, addChallenge, push, goToUniversity }) {
  const C = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState("");
  const [citizen, setCitizen] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const canSubmit = title.trim().length > 4 && description.trim().length > 10 && district;

  const reset = () => {
    setTitle(""); setDescription(""); setDistrict(""); setCitizen(""); setPhotoName(""); setResult(null); setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setError("Please add a title, a fuller description, and select a district.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    let outcome;
    try {
      outcome = await aiClassify(title, description, challenges);
    } catch (err) {
      outcome = localClassify(title, description, challenges);
    }
    const uni = UNIVERSITIES.find((u) => u.id === outcome.universityId);
    const newChallenge = {
      id: uid("chl"),
      title: title.trim(),
      description: description.trim(),
      domain: outcome.domain,
      district,
      citizen: citizen.trim() || "Anonymous citizen",
      submittedOn: new Date(2026, 8, 8),
      status: "New",
      universityId: uni.id,
      confidence: outcome.confidence,
      routingReason: outcome.routingReason,
      isDuplicate: outcome.isDuplicate,
      duplicateOfId: outcome.duplicateOfId,
      team: null,
      partners: [],
      log: [{ at: new Date(2026, 8, 8), text: "Submitted by citizen." }],
      photo: !!photoName,
    };
    addChallenge(newChallenge);
    setResult({ ...outcome, uni, challengeId: newChallenge.id });
    setLoading(false);
    push(outcome.source === "ai" ? "Challenge classified by AI and routed." : "Challenge routed using offline classifier.", "success");
  };

  const duplicateOf = result?.duplicateOfId ? challenges.find((c) => c.id === result.duplicateOfId) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="text-xl mb-1" style={{ fontFamily: "'Fraunces', serif", color: C.ink }}>Report a local challenge</h2>
      <p className="text-sm mb-6" style={{ color: C.inkSoft }}>
        Describe the problem in your own words. Our classification engine will identify the domain, route it to the best-matched institution, and check for duplicate reports — instantly.
      </p>

      <SectionCard className="p-5 sm:p-6">
        <form onSubmit={onSubmit}>
          <Field label="Title" required>
            <input
              className={inputCls}
              style={{ borderColor: C.line, background: C.bg, color: C.ink }}
              placeholder="e.g. Broken hand pump in Ormanjhi ward"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field label="Description" required>
            <textarea
              className={inputCls}
              style={{ borderColor: C.line, minHeight: 110, background: C.bg, color: C.ink }}
              placeholder="What is the problem? How long has it been going on? Who is affected?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={600}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="District" required>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.inkSoft} />
                <select
                  className={`${inputCls} pl-8 appearance-none`}
                  style={{ borderColor: C.line, background: C.bg, color: C.ink }}
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  <option value="">Select district</option>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </Field>
            <Field label="Your name (optional)">
              <input
                className={inputCls}
                style={{ borderColor: C.line, background: C.bg, color: C.ink }}
                placeholder="e.g. Sunita Devi"
                value={citizen}
                onChange={(e) => setCitizen(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Photo evidence (optional)">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoName(e.target.files?.[0]?.name || "")} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-md border border-dashed px-3 py-4 text-sm flex items-center justify-center gap-2 transition hover:brightness-95"
              style={{ borderColor: C.line, color: C.inkSoft, background: C.bg }}
            >
              {photoName ? <Camera size={16} color={C.primary} /> : <Upload size={16} />}
              {photoName ? `Attached: ${photoName}` : "Tap to attach a photo"}
            </button>
          </Field>

          {error && (
            <div className="flex items-center gap-2 text-sm mb-4 px-3 py-2 rounded-md" style={{ background: `${C.accent}22`, color: C.accent }}>
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-white transition disabled:opacity-70"
            style={{ background: C.primary }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? "Classifying with AI…" : "Submit and classify"}
          </button>
        </form>
      </SectionCard>

      {result && (
        <div className="mt-6 animate-[fadein_.25s_ease-out]">
          <SectionCard className="p-5 sm:p-6" style={{ borderLeftColor: C.gold }}>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} color={C.primary} />
              <h3 className="font-medium" style={{ color: C.ink }}>Challenge logged and routed</h3>
              {result.source === "offline" && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: C.bgDeep, color: C.inkSoft }}>offline classifier</span>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs mb-1" style={{ color: C.inkSoft }}>Predicted domain</p>
                <Chip color={DOMAIN_META[result.domain]?.color}>{result.domain} · {Math.round(result.confidence * 100)}% confidence</Chip>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: C.inkSoft }}>Routed to</p>
                <p className="text-sm font-medium" style={{ color: C.ink }}>{result.uni.short}</p>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: C.inkSoft }}>{result.routingReason}</p>

            {result.isDuplicate && (
              <div className="flex items-start gap-2 text-sm px-3 py-2.5 rounded-md mb-4" style={{ background: `${C.accent}22`, color: C.accent }}>
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>
                  Possible duplicate of an existing report{duplicateOf ? ` — "${duplicateOf.title}"` : ""}. It has been logged, but the university will see it flagged to avoid redundant effort.
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button onClick={() => goToUniversity(result.uni.id)} className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md text-white" style={{ background: C.accent }}>
                View on university dashboard <ArrowRight size={14} />
              </button>
              <button onClick={reset} className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md border" style={{ borderColor: C.line, color: C.ink }}>
                Report another challenge
              </button>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ University Dashboard ------------------------------ */
function UniversityDashboard({ challenges, updateChallenge, push, jumpUniId, setJumpUniId }) {
  const C = useTheme();
  const [uniId, setUniId] = useState(jumpUniId || UNIVERSITIES[0].id);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (jumpUniId) { setUniId(jumpUniId); setJumpUniId(null); }
  }, [jumpUniId, setJumpUniId]);

  const uni = UNIVERSITIES.find((u) => u.id === uniId);
  const list = challenges
    .filter((c) => c.universityId === uniId)
    .filter((c) => (statusFilter === "All" ? true : c.status === statusFilter))
    .filter((c) => (query ? (c.title + c.description).toLowerCase().includes(query.toLowerCase()) : true))
    .sort((a, b) => b.submittedOn - a.submittedOn);

  const advance = (c) => {
    const idx = STATUS_FLOW.indexOf(c.status);
    if (idx >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[idx + 1];
    const patch = { status: nextStatus, log: [...c.log, { at: new Date(2026, 8, 8), text: `Marked as ${nextStatus}.` }] };
    if (nextStatus === "Team Assigned" && !c.team) {
      patch.team = { name: teamName(), lead: facultyLead(), students: 3 + Math.floor(Math.random() * 4) };
    }
    updateChallenge(c.id, patch);
    push(`"${c.title.slice(0, 32)}${c.title.length > 32 ? "…" : ""}" moved to ${nextStatus}.`, "success");
  };

  const togglePartner = (c, partnerId) => {
    const has = c.partners.includes(partnerId);
    const partners = has ? c.partners.filter((p) => p !== partnerId) : [...c.partners, partnerId];
    updateChallenge(c.id, { partners, log: [...c.log, { at: new Date(2026, 8, 8), text: has ? "Partner removed." : "Partner invited to co-develop." }] });
    push(has ? "Partner removed from project." : "Partner invited.", "success");
  };

  const counts = STATUS_FLOW.reduce((acc, s) => ({ ...acc, [s]: challenges.filter((c) => c.universityId === uniId && c.status === s).length }), {});

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl mb-1" style={{ fontFamily: "'Fraunces', serif", color: C.ink }}>University dashboard</h2>
          <p className="text-sm" style={{ color: C.inkSoft }}>Review challenges routed to your institution and move them toward resolution.</p>
        </div>
        <div className="relative">
          <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.inkSoft} />
          <select
            className="pl-8 pr-3 py-2.5 rounded-md border text-sm appearance-none min-w-[240px]"
            style={{ borderColor: C.line, color: C.ink, background: C.bg }}
            value={uniId}
            onChange={(e) => setUniId(e.target.value)}
          >
            {UNIVERSITIES.map((u) => <option key={u.id} value={u.id}>{u.short}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {STATUS_FLOW.map((s, i) => (
          <button
            key={s}
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
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.inkSoft} />
          <input
            className={`${inputCls} pl-8`}
            style={{ borderColor: C.line, background: C.bg, color: C.ink }}
            placeholder="Search challenges..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {statusFilter !== "All" && (
          <button onClick={() => setStatusFilter("All")} className="text-sm px-3 py-2 rounded-md border flex items-center gap-1.5" style={{ borderColor: C.line, color: C.inkSoft }}>
            <X size={14} /> Clear filter: {statusFilter}
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
                  <StatusPill status={c.status} />
                </div>
                <p className="text-sm mb-3" style={{ color: C.inkSoft }}>{c.description}</p>

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
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Analytics Dashboard ------------------------------ */
function AnalyticsDashboard({ challenges }) {
  const C = useTheme();
  const palette = C.mode === "dark" ? CHART_PALETTE_DARK : CHART_PALETTE;
  const tooltipStyle = { borderRadius: 8, borderColor: C.line, fontSize: 12, background: C.surface, color: C.ink };
  const pieLabel = ({ cx, cy, midAngle, outerRadius, name, value }) => {
    const RAD = Math.PI / 180;
    const r = outerRadius + 14;
    const x = cx + r * Math.cos(-midAngle * RAD);
    const y = cy + r * Math.sin(-midAngle * RAD);
    return (
      <text x={x} y={y} fill={C.inkSoft} fontSize={10} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
        {`${name} (${value})`}
      </text>
    );
  };
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

  const trend = useMemo(() => {
    const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
    const now = new Date(2026, 8, 8);
    return months.map((m, i) => {
      const monthIdx = 3 + i;
      const count = challenges.filter((c) => {
        const diffMonths = (now.getFullYear() - c.submittedOn.getFullYear()) * 12 + (now.getMonth() - c.submittedOn.getMonth());
        return 8 - diffMonths === monthIdx;
      }).length;
      return { name: m, submissions: count };
    });
  }, [challenges]);

  const total = challenges.length;
  const resolved = challenges.filter((c) => c.status === "Resolved").length;
  const duplicatesFlagged = challenges.filter((c) => c.isDuplicate).length;
  const activeInstitutions = new Set(challenges.map((c) => c.universityId)).size;
  const avgConfidence = total ? Math.round((challenges.reduce((s, c) => s + c.confidence, 0) / total) * 100) : 0;

  if (total === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <SectionCard><EmptyState icon={BarChart3} title="No data yet" hint="Analytics will populate once citizens start submitting challenges." /></SectionCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="text-xl mb-1" style={{ fontFamily: "'Fraunces', serif", color: C.ink }}>Analytics dashboard</h2>
      <p className="text-sm mb-6" style={{ color: C.inkSoft }}>State-wide visibility into challenge volume, domain trends, and institutional participation.</p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          { label: "Total challenges", value: total },
          { label: "Resolved", value: resolved },
          { label: "Institutions active", value: activeInstitutions },
          { label: "Duplicates flagged", value: duplicatesFlagged },
          { label: "Avg. routing confidence", value: `${avgConfidence}%` },
        ].map((s) => (
          <SectionCard key={s.label} className="p-4" style={{ borderLeftColor: C.gold }}>
            <p className="text-2xl" style={{ color: C.ink, fontFamily: "'Fraunces', serif" }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: C.inkSoft }}>{s.label}</p>
          </SectionCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <SectionCard className="p-5">
          <h3 className="text-sm font-medium mb-4" style={{ color: C.ink }}>Submissions by domain</h3>
          <ResponsiveContainer width="100%" height={260}>
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
          <h3 className="text-sm font-medium mb-4" style={{ color: C.ink }}>Submissions by district</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byDistrict} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={pieLabel} labelLine={false}>
                {byDistrict.map((d, i) => <Cell key={d.name} fill={palette[i % palette.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-8">
        <SectionCard className="p-5">
          <h3 className="text-sm font-medium mb-4" style={{ color: C.ink }}>Institutional participation by status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byUniversity} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="name" stroke={C.inkSoft} fontSize={9} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} stroke={C.inkSoft} fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: C.ink }} />
              <Bar dataKey="New" stackId="a" fill={C.gold} radius={[0, 0, 0, 0]} />
              <Bar dataKey="In progress" stackId="a" fill={palette[3]} />
              <Bar dataKey="Resolved" stackId="a" fill={C.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard className="p-5">
          <h3 className="text-sm font-medium mb-4" style={{ color: C.ink }}>Submissions over time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="name" stroke={C.inkSoft} fontSize={12} />
              <YAxis allowDecimals={false} stroke={C.inkSoft} fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="submissions" stroke={C.accent} strokeWidth={2.5} dot={{ r: 4, fill: C.accent }} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Impact section */}
      <div className="mb-2">
        <h3 className="text-lg mb-1" style={{ fontFamily: "'Fraunces', serif", color: C.ink }}>Impact: before and after</h3>
        <p className="text-sm mb-4" style={{ color: C.inkSoft }}>What changes when citizen problems are routed systematically instead of logged and forgotten.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { label: "Time for a report to reach a capable institution", before: "Weeks to months, if at all — ad hoc and informal", after: "Under 2 minutes, auto-routed by domain match" },
          { label: "Duplicate effort across reports", before: "Untracked; multiple parties often unknowingly work the same issue", after: `${duplicatesFlagged} duplicates flagged automatically this season` },
          { label: "Citizen visibility after reporting", before: "None — grievance closed the moment it is logged", after: "Full status tracking through to resolution" },
          { label: "Institution-community research linkage", before: "Project-specific, dependent on individual faculty contacts", after: `${activeInstitutions} institutions actively engaged across ${DISTRICTS.length} districts` },
        ].map((row) => (
          <SectionCard key={row.label} className="p-5" style={{ borderLeftColor: C.accent }}>
            <p className="text-sm font-medium mb-3" style={{ color: C.ink }}>{row.label}</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded shrink-0 mt-0.5" style={{ background: `${C.accent}22`, color: C.accent }}>Before</span>
                <span className="text-sm" style={{ color: C.inkSoft }}>{row.before}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded shrink-0 mt-0.5" style={{ background: `${C.primary}20`, color: C.primary }}>After</span>
                <span className="text-sm" style={{ color: C.ink }}>{row.after}</span>
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
  const [tab, setTab] = useState("submit");
  const [jumpUniId, setJumpUniId] = useState(null);
  const { toasts, push } = useToasts();

  const addChallenge = useCallback((c) => setChallenges((prev) => [c, ...prev]), []);
  const updateChallenge = useCallback((id, patch) => {
    setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const goToUniversity = (uniId) => { setJumpUniId(uniId); setTab("university"); };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: C.ink, "--focus": C.primary, "--arrow": C.inkSoft, transition: "background .2s ease, color .2s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
        @keyframes fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        select { background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2'><polyline points='6 9 12 15 18 9'></polyline></svg>"); background-repeat: no-repeat; background-position: right 10px center; }
        input:focus, textarea:focus, select:focus { border-color: var(--focus) !important; box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus) 18%, transparent); }
        ::selection { background: color-mix(in srgb, var(--focus) 30%, transparent); }
      `}</style>

      <Header tab={tab} setTab={setTab} />

      {tab === "submit" && (
        <SubmitChallenge challenges={challenges} addChallenge={addChallenge} push={push} goToUniversity={goToUniversity} />
      )}
      {tab === "university" && (
        <UniversityDashboard challenges={challenges} updateChallenge={updateChallenge} push={push} jumpUniId={jumpUniId} setJumpUniId={setJumpUniId} />
      )}
      {tab === "analytics" && <AnalyticsDashboard challenges={challenges} />}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-xs" style={{ color: C.inkSoft }}>
        Prototype for SIH26043 · Government of Jharkhand · Societal Innovation Collaboration Portal
      </div>

      <ToastStack toasts={toasts} />
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("light");
  const theme = mode === "dark" ? DARK : LIGHT;
  const toggleMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));
  return (
    <ThemeContext.Provider value={{ ...theme, mode, toggleMode }}>
      <AppShell />
    </ThemeContext.Provider>
  );
}
