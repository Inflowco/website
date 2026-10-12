import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Activity, Gauge, Zap } from "lucide-react";
import styles from "./PlatformPreview.module.css";

// A small simulated dashboard for the public site. No backend, no real plant.
// It ticks every 1.5 s and lets the visitor push the system through three
// situations so they can see what the platform would surface.

type Mode = "normal" | "shift" | "leak";

type Point = { flow: number; kw: number; psig: number };

const TICK_MS = 1500;
const HISTORY = 72; // points shown on the chart

const BASE = { flow: 412, psig: 98.2, kwPerAcfm: 0.235, idle: 61 };

function target(mode: Mode, t: number): { flow: number; psig: number; idle: number } {
  switch (mode) {
    case "shift": {
      // A second line starts: demand climbs, the header sags, then the second
      // compressor catches up and pressure recovers.
      const ramp = Math.min(1, t / 10);
      const sag = t < 12 ? -5.5 * Math.sin((Math.PI * t) / 12) : 0;
      return { flow: BASE.flow + 115 * ramp, psig: BASE.psig + sag, idle: BASE.idle };
    }
    case "leak": {
      // Idle flow creeps up as leaks grow, which drags total flow with it.
      const creep = Math.min(1, t / 20) * 28;
      return { flow: BASE.flow + creep, psig: BASE.psig - creep * 0.03, idle: BASE.idle + creep };
    }
    default:
      return { flow: BASE.flow, psig: BASE.psig, idle: BASE.idle };
  }
}

function noise(scale: number): number {
  return (Math.random() - 0.5) * 2 * scale;
}

export function PlatformPreview() {
  const [mode, setMode] = useState<Mode>("normal");
  const [tick, setTick] = useState(0);
  const modeStart = useRef(0);
  const [history, setHistory] = useState<Point[]>(() => {
    const pts: Point[] = [];
    for (let i = 0; i < HISTORY; i++) {
      const flow = BASE.flow + noise(10);
      pts.push({ flow, kw: flow * BASE.kwPerAcfm + noise(1.2), psig: BASE.psig + noise(0.5) });
    }
    return pts;
  });
  const [idle, setIdle] = useState(BASE.idle);
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setSecondsAgo((s) => (s + 1) % 1000), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const t = tick - modeStart.current;
    const tg = target(mode, t);
    const flow = tg.flow + noise(10);
    const kwPerAcfm = mode === "shift" ? BASE.kwPerAcfm + 0.012 : BASE.kwPerAcfm;
    const next: Point = {
      flow,
      kw: flow * kwPerAcfm + noise(1.2),
      psig: tg.psig + noise(0.45),
    };
    setHistory((h) => [...h.slice(-(HISTORY - 1)), next]);
    setIdle(tg.idle);
    setSecondsAgo(0);
  }, [tick, mode]);

  const changeMode = (m: Mode) => {
    modeStart.current = tick;
    setMode(m);
  };

  const latest = history[history.length - 1];
  const specific = latest.kw / latest.flow;
  const vsBaseline = ((latest.flow - 445) / 445) * 100;
  const idleDelta = idle - 43;

  const insight = useMemo(() => {
    if (mode === "leak") {
      return {
        level: idleDelta > 30 ? "alert" : "watch",
        text: `Weekend idle flow ${idle.toFixed(0)} ACFM, up ${idleDelta.toFixed(0)} ACFM since the last leak survey. Suggested: walk Building 2 drops and the paint line hose reels.`,
      };
    }
    if (mode === "shift") {
      return {
        level: latest.psig < 95 ? "watch" : "ok",
        text: latest.psig < 95
          ? `Header dipped to ${latest.psig.toFixed(1)} psig at shift start. Second compressor caught up after about 90 seconds. Storage or a lower lead setpoint would flatten this.`
          : "Shift start handled. Both compressors loaded, header back inside the 4 psi band.",
      };
    }
    return {
      level: "ok",
      text: `Steady. Flow ${vsBaseline.toFixed(0)}% against the study baseline of 445 ACFM. Weekend idle flow ${idle.toFixed(0)} ACFM, within 18 ACFM of the post repair number.`,
    };
  }, [mode, idle, idleDelta, latest.psig, vsBaseline]);

  return (
    <div className={styles.dash} id="preview">
      <div className={styles.head}>
        <div>
          <div className={styles.plant}>Main plant header</div>
          <div className={styles.meta}>Simulated data for the preview. Updated {secondsAgo} s ago.</div>
        </div>
        <div className={styles.modes} role="group" aria-label="Simulate a situation">
          <ModeButton active={mode === "normal"} onClick={() => changeMode("normal")}>Normal day</ModeButton>
          <ModeButton active={mode === "shift"} onClick={() => changeMode("shift")}>Shift start</ModeButton>
          <ModeButton active={mode === "leak"} onClick={() => changeMode("leak")}>Leaks growing</ModeButton>
        </div>
      </div>

      <div className={styles.tiles}>
        <Tile
          icon={<Activity size={16} />}
          label="Flow"
          value={latest.flow.toFixed(0)}
          unit="ACFM"
          sub={`Baseline 445, ${vsBaseline <= 0 ? "down" : "up"} ${Math.abs(vsBaseline).toFixed(0)}%`}
          tone={vsBaseline > 4 ? "warn" : "ok"}
        />
        <Tile
          icon={<Zap size={16} />}
          label="Compressor power"
          value={latest.kw.toFixed(1)}
          unit="kW"
          sub={`${specific.toFixed(3)} kW per ACFM`}
          tone={specific > 0.245 ? "warn" : "ok"}
        />
        <Tile
          icon={<Gauge size={16} />}
          label="Header pressure"
          value={latest.psig.toFixed(1)}
          unit="psig"
          sub="Setpoint 100, band 4 psi"
          tone={latest.psig < 95 ? "alert" : "ok"}
        />
        <Tile
          icon={<Activity size={16} />}
          label="Weekend idle flow"
          value={idle.toFixed(0)}
          unit="ACFM"
          sub={`${idleDelta >= 0 ? "+" : ""}${idleDelta.toFixed(0)} vs last survey`}
          tone={idleDelta > 25 ? "alert" : idleDelta > 15 ? "warn" : "ok"}
        />
      </div>

      <div className={styles.charts}>
        <Spark
          title="Flow, ACFM"
          values={history.map((p) => p.flow)}
          min={360}
          max={560}
          color="hsl(190 70% 65%)"
          band={[445, 445]}
          bandLabel="study baseline"
        />
        <Spark
          title="Header pressure, psig"
          values={history.map((p) => p.psig)}
          min={88}
          max={104}
          color="hsl(152 65% 60%)"
          band={[96, 100]}
          bandLabel="control band"
        />
      </div>

      <div className={`${styles.insight} ${styles[insight.level]}`}>
        {insight.level !== "ok" && <AlertTriangle size={16} className={styles.insightIcon} />}
        <span>{insight.text}</span>
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`${styles.modeBtn} ${active ? styles.modeActive : ""}`} onClick={onClick} aria-pressed={active}>
      {children}
    </button>
  );
}

function Tile({ icon, label, value, unit, sub, tone }: { icon: React.ReactNode; label: string; value: string; unit: string; sub: string; tone: "ok" | "warn" | "alert" }) {
  return (
    <div className={`${styles.tile} ${styles[`tile_${tone}`]}`}>
      <div className={styles.tileLabel}>{icon} {label}</div>
      <div className={styles.tileValue}>{value} <span className={styles.tileUnit}>{unit}</span></div>
      <div className={styles.tileSub}>{sub}</div>
    </div>
  );
}

function Spark({ title, values, min, max, color, band, bandLabel }: { title: string; values: number[]; min: number; max: number; color: string; band: [number, number]; bandLabel: string }) {
  const W = 320;
  const H = 110;
  const pad = 6;
  const y = (v: number) => H - pad - ((v - min) / (max - min)) * (H - 2 * pad);
  const x = (i: number) => pad + (i / (values.length - 1)) * (W - 2 * pad);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${d} L${x(values.length - 1).toFixed(1)},${(H - pad).toFixed(1)} L${x(0).toFixed(1)},${(H - pad).toFixed(1)} Z`;
  const bTop = y(band[1]);
  const bBot = y(band[0]);
  return (
    <div className={styles.spark}>
      <div className={styles.sparkTitle}>{title}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.sparkSvg} role="img" aria-label={title}>
        {band[0] === band[1] ? (
          <line x1={pad} x2={W - pad} y1={bTop} y2={bTop} className={styles.bandLine} />
        ) : (
          <rect x={pad} y={bTop} width={W - 2 * pad} height={Math.max(1, bBot - bTop)} className={styles.bandRect} />
        )}
        <path d={area} fill={color} opacity={0.15} />
        <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        <text x={W - pad} y={bTop - 3} textAnchor="end" className={styles.bandText}>{bandLabel}</text>
      </svg>
      <div className={styles.sparkAxis}><span>{min}</span><span>last 90 s</span><span>{max}</span></div>
    </div>
  );
}
