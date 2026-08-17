import React, { useState, useEffect, useMemo } from "react";

// ---------- Data model ----------
// status: 0 = untouched, 1 = weak/started, 2 = studying, 3 = solid

const STATUS = [
  { label: "Untouched", short: "—", color: "#3a4a52", text: "#9fb4bd" },
  { label: "Weak", short: "W", color: "#8a3b2b", text: "#ffd8c9" },
  { label: "Studying", short: "S", color: "#a4771f", text: "#ffe9b8" },
  { label: "Solid", short: "✓", color: "#1f7a52", text: "#c9ffe4" },
];

const COURSES = [
  {
    id: "me2209",
    code: "ME 2209",
    name: "Mechanics of Solids",
    kind: "Theory · 3.00 credit",
    target: "A+ · Mandatory",
    tier: "Tier 1 — Protect",
    topics: [
      "Simple stress & strain, stress-strain diagram",
      "Hooke's law, Poisson's ratio, biaxial/tri-axial deformation",
      "Statically indeterminate members",
      "Thin-walled pressure vessels",
      "Beams — shear force & bending moment diagrams",
      "Flexure formula, stresses in beams",
      "Deflection of beams (integration & area-moment)",
      "Columns — Euler's formula, Secant formula",
      "Torsion formula & derivation",
      "Shear flow, helical springs",
      "Combined stresses — principal stress, Mohr's circle",
      "Strain energy & failure theories",
    ],
  },
  {
    id: "math2221",
    code: "Math 2221",
    name: "Numerical Analysis & Statistics",
    kind: "Theory · 3.00 credit",
    target: "A+ · Mandatory",
    tier: "Tier 2 — Highest ROI",
    topics: [
      "Interpolation (equal & unequal intervals)",
      "Central difference formulae",
      "Trapezoidal & Simpson's rule",
      "Bisection & Regula falsi method",
      "Newton-Raphson method",
      "Gauss elimination & Gauss Jordan method",
      "Jacobi & Gauss Seidal method",
      "Euler's & Runge-Kutta method",
      "Finite difference method (PDE)",
      "Central tendency, dispersion, moments, skewness, kurtosis",
      "Correlation & regression",
      "Probability distributions (Binomial, Poisson, Normal)",
    ],
  },
  {
    id: "eee2281",
    code: "EEE 2281",
    name: "Electrical Machines & Electronics",
    kind: "Theory · 3.00 credit",
    target: "A+ · Needed",
    tier: "Tier 3 — Modular catch-up",
    topics: [
      "Transformers — single/three phase, OC & SC tests",
      "DC machines — generators, motors, speed control",
      "AC machines — synchronous & asynchronous, speed control",
      "Diode, transistors, MOSFET",
      "Op-Amps, filtering, A/D & D/A converters",
      "Power electronics intro",
      "Logic gates, flip-flops, counters, registers, memory",
    ],
  },
  {
    id: "me2203",
    code: "ME 2203",
    name: "Engineering Mechanics-II",
    kind: "Theory · 3.00 credit",
    target: "A+ · Mandatory",
    tier: "Tier 4 — Slow burn, daily",
    topics: [
      "Kinematics of particles (rectilinear, curvilinear)",
      "Tangential, normal, radial & transverse components",
      "Kinetics — Newton's 2nd law, linear/angular momentum",
      "Central force motion, satellite motion, orbits",
      "Kinematics of rigid bodies (translation, rotation, plane motion)",
      "Coriolis acceleration, mechanism velocity/accel analysis",
      "Gyroscopic motion & couple",
      "Kinetics of rigid bodies, D'Alembert's principle",
      "Work & kinetic energy, conservative forces",
      "Impact (direct & oblique), conservation of momentum",
      "Angular impulse & momentum of rigid bodies",
    ],
  },
  {
    id: "me2207",
    code: "ME 2207",
    name: "Measurement, QC & Materials Handling",
    kind: "Theory · 3.00 credit",
    target: "At least A",
    tier: "Tier 5 — Fast catch-up",
    topics: [
      "Measurement basics, interchangeability, gauging",
      "LASER interferometry, gear/surface finish measurement",
      "Sensors, transducers, NDT methods",
      "Quality control — statistical measures, hypothesis testing",
      "Acceptance sampling plans, control charts (X, R, C)",
      "QA, TQM, TQC concepts",
      "Materials handling — conveyors, AGV/ASRS/robots",
      "Packaging — materials, symbols, load testing",
    ],
  },
  {
    id: "sessionals",
    code: "Sessionals",
    name: "ME2204 · ME2208 · ME2210 · Math2222 · EEE2282",
    kind: "Sessional · 4.25 credit total",
    target: "A+ across the board",
    tier: "Follows theory courses",
    topics: [
      "ME 2204 — Engineering Mechanics reports up to date",
      "ME 2208 — Measurement/QC reports up to date",
      "ME 2210 — Mechanics of Solids reports up to date",
      "Math 2222 — MATLAB numerical problems practiced",
      "EEE 2282 — Machine Lab + Electronics Lab reports up to date",
    ],
  },
];

const STORAGE_KEY = "topic-status-v1";

export default function SemesterTracker() {
  const [status, setStatus] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [activeCourse, setActiveCourse] = useState(COURSES[0].id);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStatus(JSON.parse(raw));
    } catch (e) {
      // no saved data yet — fine, start empty
    }
    setLoaded(true);
  }, []);

  const persist = (next) => {
    setStatus(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      setError("Couldn't save — your changes stay for this session only.");
    }
  };

  const cycle = (key) => {
    const cur = status[key] ?? 0;
    const next = { ...status, [key]: (cur + 1) % STATUS.length };
    persist(next);
  };

  const courseProgress = (course) => {
    const total = course.topics.length;
    let solid = 0,
      touched = 0;
    course.topics.forEach((_, i) => {
      const s = status[`${course.id}:${i}`] ?? 0;
      if (s === 3) solid++;
      if (s > 0) touched++;
    });
    return { total, solid, touched, pct: total ? Math.round((solid / total) * 100) : 0 };
  };

  const overall = useMemo(() => {
    let total = 0,
      solid = 0;
    COURSES.forEach((c) => {
      c.topics.forEach((_, i) => {
        total++;
        if ((status[`${c.id}:${i}`] ?? 0) === 3) solid++;
      });
    });
    return { total, solid, pct: total ? Math.round((solid / total) * 100) : 0 };
  }, [status]);

  const course = COURSES.find((c) => c.id === activeCourse);
  const prog = courseProgress(course);

  if (!loaded) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingText}>loading tracker…</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .topic-row:active { transform: scale(0.98); }
        .course-tab:active { transform: scale(0.97); }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: #2c4048; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.eyebrow}>SEMESTER 3 — SITE PLAN</div>
          <div style={styles.overallPct}>{overall.pct}%</div>
        </div>
        <div style={styles.headerTitle}>Topic Tracker</div>
        <div style={styles.headerSub}>
          {overall.solid} / {overall.total} topics solid across {COURSES.length} courses
        </div>
        <div style={styles.overallBarTrack}>
          <div style={{ ...styles.overallBarFill, width: `${overall.pct}%` }} />
        </div>
      </div>

      {/* Course tabs */}
      <div style={styles.tabRow}>
        {COURSES.map((c) => {
          const p = courseProgress(c);
          const active = c.id === activeCourse;
          return (
            <button
              key={c.id}
              className="course-tab"
              onClick={() => setActiveCourse(c.id)}
              style={{
                ...styles.tab,
                ...(active ? styles.tabActive : {}),
              }}
            >
              <div style={styles.tabCode}>{c.code}</div>
              <div style={styles.tabPct}>{p.pct}%</div>
            </button>
          );
        })}
      </div>

      {/* Active course panel */}
      <div style={styles.panel}>
        <div style={styles.panelHeaderRow}>
          <div>
            <div style={styles.panelName}>{course.name}</div>
            <div style={styles.panelKind}>{course.kind}</div>
          </div>
          <div style={styles.targetBadge}>{course.target}</div>
        </div>
        <div style={styles.tierLine}>{course.tier}</div>

        <div style={styles.panelBarTrack}>
          <div style={{ ...styles.panelBarFill, width: `${prog.pct}%` }} />
        </div>
        <div style={styles.panelStats}>
          {prog.solid} solid · {prog.touched - prog.solid} in progress · {prog.total - prog.touched} untouched
        </div>

        <div style={styles.topicList}>
          {course.topics.map((t, i) => {
            const key = `${course.id}:${i}`;
            const s = status[key] ?? 0;
            const meta = STATUS[s];
            return (
              <button
                key={key}
                className="topic-row"
                onClick={() => cycle(key)}
                style={styles.topicRow}
              >
                <div
                  style={{
                    ...styles.chip,
                    background: meta.color,
                    color: meta.text,
                  }}
                >
                  {meta.short}
                </div>
                <div style={styles.topicText}>{t}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        {STATUS.map((s) => (
          <div key={s.label} style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: s.color }} />
            <span style={styles.legendLabel}>{s.label}</span>
          </div>
        ))}
      </div>
      <div style={styles.hint}>Tap a topic to cycle its status. Saved automatically.</div>
      {error && <div style={styles.errorBanner}>{error}</div>}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0c2733",
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
    backgroundSize: "24px 24px",
    fontFamily: "'IBM Plex Mono', monospace",
    color: "#dce9ec",
    padding: "20px 14px 40px",
    maxWidth: 560,
    margin: "0 auto",
  },
  loadingWrap: {
    minHeight: "100vh",
    background: "#0c2733",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#7fa9b5",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  loadingText: { fontSize: 13, letterSpacing: 1 },
  header: {
    borderBottom: "1px solid #23434e",
    paddingBottom: 16,
    marginBottom: 16,
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    color: "#5fa3b5",
    fontWeight: 600,
  },
  overallPct: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 22,
    fontWeight: 700,
    color: "#7de8b5",
  },
  headerTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 28,
    fontWeight: 700,
    color: "#f2f8f9",
    marginTop: 6,
  },
  headerSub: {
    fontSize: 12.5,
    color: "#8fb4bf",
    marginTop: 4,
  },
  overallBarTrack: {
    height: 6,
    background: "#16323c",
    borderRadius: 3,
    marginTop: 12,
    overflow: "hidden",
  },
  overallBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #2fae7a, #7de8b5)",
    borderRadius: 3,
    transition: "width 0.4s ease",
  },
  tabRow: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 8,
    marginBottom: 6,
  },
  tab: {
    flex: "0 0 auto",
    background: "#132e38",
    border: "1px solid #23434e",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    color: "#9fc0cb",
    textAlign: "left",
    minWidth: 92,
  },
  tabActive: {
    background: "#1a4550",
    border: "1px solid #4fb8a8",
    color: "#eafffa",
  },
  tabCode: { fontSize: 12, fontWeight: 600 },
  tabPct: { fontSize: 15, fontWeight: 700, marginTop: 2, fontFamily: "'Space Grotesk', sans-serif" },
  panel: {
    background: "#0f2b35",
    border: "1px solid #1e3d47",
    borderRadius: 10,
    padding: 16,
  },
  panelHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  panelName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 18,
    fontWeight: 700,
    color: "#f2f8f9",
    lineHeight: 1.25,
  },
  panelKind: { fontSize: 11.5, color: "#6f9aa6", marginTop: 3 },
  targetBadge: {
    fontSize: 10.5,
    color: "#ffd9a8",
    border: "1px solid #6b4a1f",
    background: "#2a1e0c",
    borderRadius: 6,
    padding: "4px 8px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  tierLine: {
    fontSize: 11.5,
    color: "#7de8b5",
    marginTop: 10,
    letterSpacing: 0.3,
  },
  panelBarTrack: {
    height: 5,
    background: "#16323c",
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  panelBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #2fae7a, #7de8b5)",
    borderRadius: 3,
    transition: "width 0.4s ease",
  },
  panelStats: { fontSize: 11, color: "#7fa9b5", marginTop: 6 },
  topicList: {
    marginTop: 14,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  topicRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#0c222b",
    border: "1px solid #1c3a44",
    borderRadius: 8,
    padding: "9px 10px",
    cursor: "pointer",
    textAlign: "left",
  },
  chip: {
    flexShrink: 0,
    width: 24,
    height: 24,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
  },
  topicText: { fontSize: 12.5, color: "#d3e6ea", lineHeight: 1.35 },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 18,
    justifyContent: "center",
  },
  legendItem: { display: "flex", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { fontSize: 11, color: "#8fb4bf" },
  hint: {
    textAlign: "center",
    fontSize: 10.5,
    color: "#4f7783",
    marginTop: 10,
  },
  errorBanner: {
    marginTop: 10,
    fontSize: 11,
    color: "#ffb199",
    textAlign: "center",
  },
};
