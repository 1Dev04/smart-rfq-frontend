import { defineStore } from "pinia";
import { ref, watch } from "vue";

/* ══════════════════════════════════════
   THEME DEFINITIONS
══════════════════════════════════════ */
export const themes = [
  {
    id: "classic",
    name: "Classic",
    desc: "Clean professional blue",
    preview: ["#0a0f1e", "#1a3d9e", "#38a3f5"],
  },
  {
    id: "mood",
    name: "Mood",
    desc: "Warm amber & deep plum",
    preview: ["#12080f", "#7c2d68", "#f59e0b"],
  },
  {
    id: "vibe",
    name: "Vibe",
    desc: "Electric green neon",
    preview: ["#030d07", "#064e3b", "#10b981"],
  },
  {
    id: "galaxy",
    name: "Galaxy",
    desc: "Violet nebula purple",
    preview: ["#0b0718", "#4c1d95", "#a78bfa"],
  },
  {
    id: "technology",
    name: "Technology",
    desc: "Cyber red & steel",
    preview: ["#0f0a0a", "#7f1d1d", "#ef4444"],
  },
  {
  id: "sakura",
  name: "Sakura",
  desc: "Cherry blossom pink & deep rose",
  preview: ["#1a0a10", "#831843", "#f472b6"],
},
];


const statusVars = {
  dark: {
    "--accept": "#6ee7b7",
    "--accept-bg": "rgba(16, 185, 129, 0.22)",
    "--accept-border": "rgba(52, 211, 153, 0.45)",
    "--waiting": "#fde68a",
    "--waiting-bg": "rgba(245, 158, 11, 0.22)",
    "--waiting-border": "rgba(251, 191, 36, 0.45)",
    "--resent": "#fca5a5",
    "--resent-bg": "rgba(239, 68, 68, 0.22)",
    "--resent-border": "rgba(248, 113, 113, 0.45)",
    "--cancel": "#e2e8f0",
    "--cancel-bg": "rgba(148, 163, 184, 0.16)",
    "--cancel-border": "rgba(148, 163, 184, 0.35)",
  },
  light: {
    "--accept": "#047857",
    "--accept-bg": "rgba(16, 185, 129, 0.18)",
    "--accept-border": "rgba(5, 150, 105, 0.38)",
    "--waiting": "#b45309",
    "--waiting-bg": "rgba(245, 158, 11, 0.18)",
    "--waiting-border": "rgba(180, 83, 9, 0.35)",
    "--resent": "#b91c1c",
    "--resent-bg": "rgba(239, 68, 68, 0.18)",
    "--resent-border": "rgba(185, 28, 28, 0.35)",
    "--cancel": "#475569",
    "--cancel-bg": "rgba(148, 163, 184, 0.20)",
    "--cancel-border": "rgba(71, 85, 105, 0.35)",
  },
};

const themeVars = {
  classic: {
    dark: {
      "--bg-base":        "#0a0f1e",
      "--bg-surface":     "rgba(255,255,255,0.04)",
      "--bg-elevated":    "rgba(255,255,255,0.08)",
      "--border-subtle":  "rgba(255,255,255,0.08)",
      "--border-accent":  "rgba(56,163,245,0.3)",
      "--accent":         "#38a3f5",
      "--accent-dim":     "rgba(56,163,245,0.15)",
      "--accent-glow":    "rgba(56,163,245,0.25)",
      "--orb-1":          "#1a3d9e",
      "--orb-2":          "#0c4a8f",
      "--orb-3":          "#38a3f5",
      "--text-primary":   "#ffffff",
      "--text-secondary": "rgba(255,255,255,0.65)",
      "--text-muted":     "rgba(255,255,255,0.35)",
      "--text-primary-help":   "#ffffff",
    },
    light: {
      "--bg-base":        "#f0f6ff",
      "--bg-surface":     "rgba(255,255,255,0.85)",
      "--bg-elevated":    "rgba(255,255,255,0.95)",
      "--border-subtle":  "rgba(0,0,0,0.08)",
      "--border-accent":  "rgba(26,61,158,0.35)",
      "--accent":         "#1a3d9e",
      "--accent-dim":     "rgba(26,61,158,0.1)",
      "--accent-glow":    "rgba(26,61,158,0.2)",
      "--orb-1":          "#bfdbfe",
      "--orb-2":          "#93c5fd",
      "--orb-3":          "#60a5fa",
      "--text-primary":   "#0a0f1e",
      "--text-secondary": "rgba(10,15,30,0.65)",
      "--text-muted":     "rgba(10,15,30,0.4)",
      "--text-primary-help":   "#ffffff",
    },
  },
  mood: {
    dark: {
      "--bg-base":        "#12080f",
      "--bg-surface":     "rgba(255,255,255,0.04)",
      "--bg-elevated":    "rgba(255,255,255,0.07)",
      "--border-subtle":  "rgba(255,255,255,0.07)",
      "--border-accent":  "rgba(245,158,11,0.35)",
      "--accent":         "#f59e0b",
      "--accent-dim":     "rgba(245,158,11,0.15)",
      "--accent-glow":    "rgba(245,158,11,0.25)",
      "--orb-1":          "#7c2d68",
      "--orb-2":          "#4a044e",
      "--orb-3":          "#f59e0b",
      "--text-primary":   "#ffffff",
      "--text-secondary": "rgba(255,255,255,0.65)",
      "--text-muted":     "rgba(255,255,255,0.35)",
      "--text-primary-help":   "#ffffff",
    },
    light: {
      "--bg-base":        "#fdf8f0",
      "--bg-surface":     "rgba(255,255,255,0.85)",
      "--bg-elevated":    "rgba(255,255,255,0.95)",
      "--border-subtle":  "rgba(0,0,0,0.08)",
      "--border-accent":  "rgba(124,45,104,0.3)",
      "--accent":         "#7c2d68",
      "--accent-dim":     "rgba(124,45,104,0.1)",
      "--accent-glow":    "rgba(124,45,104,0.2)",
      "--orb-1":          "#f5d0fe",
      "--orb-2":          "#fde68a",
      "--orb-3":          "#f59e0b",
      "--text-primary":   "#12080f",
      "--text-secondary": "rgba(18,8,15,0.65)",
      "--text-muted":     "rgba(18,8,15,0.4)",
      "--text-primary-help":   "#ffffff",
    },
  },
  vibe: {
    dark: {
      "--bg-base":        "#030d07",
      "--bg-surface":     "rgba(255,255,255,0.04)",
      "--bg-elevated":    "rgba(255,255,255,0.07)",
      "--border-subtle":  "rgba(255,255,255,0.07)",
      "--border-accent":  "rgba(16,185,129,0.35)",
      "--accent":         "#10b981",
      "--accent-dim":     "rgba(16,185,129,0.15)",
      "--accent-glow":    "rgba(16,185,129,0.25)",
      "--orb-1":          "#064e3b",
      "--orb-2":          "#065f46",
      "--orb-3":          "#10b981",
      "--text-primary":   "#ffffff",
      "--text-secondary": "rgba(255,255,255,0.65)",
      "--text-muted":     "rgba(255,255,255,0.35)",
      "--text-primary-help":   "#ffffff",
    },
    light: {
      "--bg-base":        "#f0fdf4",
      "--bg-surface":     "rgba(255,255,255,0.85)",
      "--bg-elevated":    "rgba(255,255,255,0.95)",
      "--border-subtle":  "rgba(0,0,0,0.08)",
      "--border-accent":  "rgba(6,78,59,0.3)",
      "--accent":         "#064e3b",
      "--accent-dim":     "rgba(6,78,59,0.1)",
      "--accent-glow":    "rgba(6,78,59,0.2)",
      "--orb-1":          "#a7f3d0",
      "--orb-2":          "#6ee7b7",
      "--orb-3":          "#10b981",
      "--text-primary":   "#030d07",
      "--text-secondary": "rgba(3,13,7,0.65)",
      "--text-muted":     "rgba(3,13,7,0.4)",
      "--text-primary-help":   "#ffffff",
    },
  },
  galaxy: {
    dark: {
      "--bg-base":        "#0b0718",
      "--bg-surface":     "rgba(255,255,255,0.04)",
      "--bg-elevated":    "rgba(255,255,255,0.07)",
      "--border-subtle":  "rgba(255,255,255,0.07)",
      "--border-accent":  "rgba(167,139,250,0.35)",
      "--accent":         "#a78bfa",
      "--accent-dim":     "rgba(167,139,250,0.15)",
      "--accent-glow":    "rgba(167,139,250,0.25)",
      "--orb-1":          "#4c1d95",
      "--orb-2":          "#5b21b6",
      "--orb-3":          "#a78bfa",
      "--text-primary":   "#ffffff",
      "--text-secondary": "rgba(255,255,255,0.65)",
      "--text-muted":     "rgba(255,255,255,0.35)",
      "--text-primary-help":   "#ffffff",
    },
    light: {
      "--bg-base":        "#f5f3ff",
      "--bg-surface":     "rgba(255,255,255,0.85)",
      "--bg-elevated":    "rgba(255,255,255,0.95)",
      "--border-subtle":  "rgba(0,0,0,0.08)",
      "--border-accent":  "rgba(76,29,149,0.3)",
      "--accent":         "#4c1d95",
      "--accent-dim":     "rgba(76,29,149,0.1)",
      "--accent-glow":    "rgba(76,29,149,0.2)",
      "--orb-1":          "#ddd6fe",
      "--orb-2":          "#c4b5fd",
      "--orb-3":          "#a78bfa",
      "--text-primary":   "#0b0718",
      "--text-secondary": "rgba(11,7,24,0.65)",
      "--text-muted":     "rgba(11,7,24,0.4)",
      "--text-primary-help":   "#ffffff",
    },
  },
  technology: {
    dark: {
      "--bg-base":        "#0f0a0a",
      "--bg-surface":     "rgba(255,255,255,0.04)",
      "--bg-elevated":    "rgba(255,255,255,0.07)",
      "--border-subtle":  "rgba(255,255,255,0.07)",
      "--border-accent":  "rgba(239,68,68,0.35)",
      "--accent":         "#ef4444",
      "--accent-dim":     "rgba(239,68,68,0.15)",
      "--accent-glow":    "rgba(239,68,68,0.25)",
      "--orb-1":          "#7f1d1d",
      "--orb-2":          "#991b1b",
      "--orb-3":          "#ef4444",
      "--text-primary":   "#ffffff",
      "--text-secondary": "rgba(255,255,255,0.65)",
      "--text-muted":     "rgba(255,255,255,0.35)",
      "--text-primary-help":   "#ffffff",
    },
    light: {
      "--bg-base":        "#fff5f5",
      "--bg-surface":     "rgba(255,255,255,0.85)",
      "--bg-elevated":    "rgba(255,255,255,0.95)",
      "--border-subtle":  "rgba(0,0,0,0.08)",
      "--border-accent":  "rgba(127,29,29,0.3)",
      "--accent":         "#7f1d1d",
      "--accent-dim":     "rgba(127,29,29,0.1)",
      "--accent-glow":    "rgba(127,29,29,0.2)",
      "--orb-1":          "#fecaca",
      "--orb-2":          "#fca5a5",
      "--orb-3":          "#ef4444",
      "--text-primary":   "#0f0a0a",
      "--text-secondary": "rgba(15,10,10,0.65)",
      "--text-muted":     "rgba(15,10,10,0.4)",
      "--text-primary-help":   "#ffffff",
    },
  },
  sakura: {
  dark: {
    "--bg-base":        "#1a0a10",
    "--bg-surface":     "rgba(255,255,255,0.04)",
    "--bg-elevated":    "rgba(255,255,255,0.07)",
    "--border-subtle":  "rgba(255,255,255,0.07)",
    "--border-accent":  "rgba(244,114,182,0.35)",
    "--accent":         "#f472b6",
    "--accent-dim":     "rgba(244,114,182,0.15)",
    "--accent-glow":    "rgba(244,114,182,0.25)",
    "--orb-1":          "#831843",
    "--orb-2":          "#9d174d",
    "--orb-3":          "#f472b6",
    "--text-primary":   "#ffffff",
    "--text-secondary": "rgba(255,255,255,0.65)",
    "--text-muted":     "rgba(255,255,255,0.35)",
    "--text-primary-help":   "#ffffff",
  },
  light: {
    "--bg-base":        "#fff1f7",
    "--bg-surface":     "rgba(255,255,255,0.88)",
    "--bg-elevated":    "rgba(255,255,255,0.96)",
    "--border-subtle":  "rgba(0,0,0,0.07)",
    "--border-accent":  "rgba(131,24,67,0.3)",
    "--accent":         "#831843",
    "--accent-dim":     "rgba(131,24,67,0.1)",
    "--accent-glow":    "rgba(131,24,67,0.2)",
    "--orb-1":          "#fbcfe8",
    "--orb-2":          "#f9a8d4",
    "--orb-3":          "#f472b6",
    "--text-primary":   "#1a0a10",
    "--text-secondary": "rgba(26,10,16,0.65)",
    "--text-muted":     "rgba(26,10,16,0.4)",
    "--text-primary-help":   "#ffffff",
  },
},
};

/* ══════════════════════════════════════
   STORE
══════════════════════════════════════ */
export const useThemeStore = defineStore("theme", () => {
  const themeId  = ref(localStorage.getItem("rfq_theme")  || "classic");
  const isDark   = ref(localStorage.getItem("rfq_dark") !== "false"); // default dark

  /* Apply CSS variables to :root */
  function applyVars() {
    const mode = isDark.value ? "dark" : "light";
    const vars = themeVars[themeId.value]?.[mode] ?? themeVars.classic.dark;
    const root = document.documentElement;

    root.setAttribute("data-theme", mode);
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    Object.entries(statusVars[mode] ?? statusVars.dark).forEach(([k, v]) => root.style.setProperty(k, v));

    root.style.setProperty("--bg-base", vars["--bg-base"] ?? "#0a0f1e");
    root.style.setProperty("--bg-surface", vars["--bg-surface"] ?? "rgba(255,255,255,0.04)");
    root.style.setProperty("--bg-elevated", vars["--bg-elevated"] ?? "rgba(255,255,255,0.08)");
    root.style.setProperty("--bg", vars["--bg-base"] ?? "#0a0f1e");
    root.style.setProperty("--bg-secondary", vars["--bg-surface"] ?? "rgba(255,255,255,0.04)");
    root.style.setProperty("--text-primary", vars["--text-primary"] ?? "#ffffff");
    root.style.setProperty("--text-primary-help", vars["--text-primary-help"] ?? "#ffffff");
    root.style.setProperty("--text-secondary", vars["--text-secondary"] ?? "rgba(255,255,255,0.65)");
    root.style.setProperty("--text-muted", vars["--text-muted"] ?? "rgba(255,255,255,0.35)");
    root.style.setProperty("--text", vars["--text-secondary"] ?? "rgba(255,255,255,0.65)");
    root.style.setProperty("--text-h", vars["--text-primary"] ?? "#ffffff");
    root.style.setProperty("--border-subtle", vars["--border-subtle"] ?? "rgba(255,255,255,0.08)");
    root.style.setProperty("--border-accent", vars["--border-accent"] ?? "rgba(56,163,245,0.3)");
    root.style.setProperty("--border", vars["--border-subtle"] ?? "rgba(255,255,255,0.08)");
    root.style.setProperty("--border-strong", vars["--border-accent"] ?? "rgba(56,163,245,0.3)");
    root.style.setProperty("--accent", vars["--accent"] ?? "#38a3f5");
    root.style.setProperty("--accent-alt", vars["--accent"] ?? "#38a3f5");
    root.style.setProperty("--accent-dim", vars["--accent-dim"] ?? "rgba(56,163,245,0.15)");
    root.style.setProperty("--accent-glow", vars["--accent-glow"] ?? "rgba(56,163,245,0.25)");
    root.style.setProperty("--accent-bg", vars["--accent-dim"] ?? "rgba(56,163,245,0.15)");
    root.style.setProperty("--accent-border", vars["--accent-glow"] ?? "rgba(56,163,245,0.25)");
    root.style.setProperty("--orb-1", vars["--orb-1"] ?? "#1a3d9e");
    root.style.setProperty("--orb-2", vars["--orb-2"] ?? "#0c4a8f");
    root.style.setProperty("--orb-3", vars["--orb-3"] ?? "#38a3f5");
    root.style.setProperty("--shadow", `0 18px 30px -12px ${vars["--accent-glow"] ?? "rgba(56,163,245,0.25)"}`);
    root.style.setProperty("--accept", statusVars[mode]?.["--accept"] ?? "#6ee7b7");
    root.style.setProperty("--accept-bg", statusVars[mode]?.["--accept-bg"] ?? "rgba(16, 185, 129, 0.22)");
    root.style.setProperty("--accept-border", statusVars[mode]?.["--accept-border"] ?? "rgba(52, 211, 153, 0.45)");
    root.style.setProperty("--waiting", statusVars[mode]?.["--waiting"] ?? "#fde68a");
    root.style.setProperty("--waiting-bg", statusVars[mode]?.["--waiting-bg"] ?? "rgba(245, 158, 11, 0.22)");
    root.style.setProperty("--waiting-border", statusVars[mode]?.["--waiting-border"] ?? "rgba(251, 191, 36, 0.45)");
    root.style.setProperty("--resent", statusVars[mode]?.["--resent"] ?? "#fca5a5");
    root.style.setProperty("--resent-bg", statusVars[mode]?.["--resent-bg"] ?? "rgba(239, 68, 68, 0.22)");
    root.style.setProperty("--resent-border", statusVars[mode]?.["--resent-border"] ?? "rgba(248, 113, 113, 0.45)");
    root.style.setProperty("--cancel", statusVars[mode]?.["--cancel"] ?? "#e2e8f0");
    root.style.setProperty("--cancel-bg", statusVars[mode]?.["--cancel-bg"] ?? "rgba(148, 163, 184, 0.16)");
    root.style.setProperty("--cancel-border", statusVars[mode]?.["--cancel-border"] ?? "rgba(148, 163, 184, 0.35)");
  }


  watch([themeId, isDark], () => {
    localStorage.setItem("rfq_theme", themeId.value);
    localStorage.setItem("rfq_dark",  String(isDark.value));
    applyVars();
  }, { immediate: true });

  function setTheme(id) { themeId.value = id; }
  function toggleDark()  { isDark.value = !isDark.value; }

  return { themeId, isDark, setTheme, toggleDark, themes };
});

