import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Activity, Droplets, Gauge, Upload, Wrench, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { asset } from "../helpers/site";
import styles from "./PlatformPreview.module.css";

// A small simulated dashboard for the public site. No backend, no real plant.
// It ticks every 1.5 s and lets the visitor push the system through three
// situations so they can see what the platform would surface.

type Mode = "normal" | "shift" | "leak" | "dryer";

type Point = { flow: number; kw: number; psig: number; dew: number };

const TICK_MS = 1500;
const HISTORY = 72; // points shown on the chart

const BASE = { flow: 412, psig: 98.2, kwPerAcfm: 0.235, idle: 61, dew: 38 }; // dew point in F, refrigerated dryer

type LogRow = { tag: string; kind: "Leak" | "Demand side"; item: string; scfm: number; status: "Open" | "Repaired"; when: string };

const LOG_SEED: LogRow[] = [
  { tag: "L-07", kind: "Leak", item: "Building 2, hose reel coupling", scfm: 6.2, status: "Open", when: "Survey 9/18" },
  { tag: "L-12", kind: "Leak", item: "Paint line, quick disconnect", scfm: 4.8, status: "Open", when: "Survey 9/18" },
  { tag: "D-02", kind: "Demand side", item: "Cabinet purge HRU-3, 10 psig to 2 psig", scfm: 9.0, status: "Open", when: "Walk 9/18" },
  { tag: "L-03", kind: "Leak", item: "Compressor room, drain seal", scfm: 3.1, status: "Repaired", when: "Done 9/30" },
];

function target(mode: Mode, t: number): { flow: number; psig: number; idle: number; dew: number } {
  switch (mode) {
    case "shift": {
      // A second line starts: demand climbs, the header sags, then the second
      // compressor catches up and pressure recovers.
      const ramp = Math.min(1, t / 10);
      const sag = t < 12 ? -5.5 * Math.sin((Math.PI * t) / 12) : 0;
      return { flow: BASE.flow + 115 * ramp, psig: BASE.psig + sag, idle: BASE.idle, dew: BASE.dew + 1.5 * ramp };
    }
    case "leak": {
      // Idle flow creeps up as leaks grow, which drags total flow with it.
      const creep = Math.min(1, t / 20) * 28;
      return { flow: BASE.flow + creep, psig: BASE.psig - creep * 0.03, idle: BASE.idle + creep, dew: BASE.dew };
    }
    case "dryer": {
      // The refrigerated dryer loses capacity: outlet dew point climbs from 38 F toward 56 F.
      const rise = Math.min(1, t / 18) * 18;
      return { flow: BASE.flow, psig: BASE.psig, idle: BASE.idle, dew: BASE.dew + rise };
    }
    default:
      return { flow: BASE.flow, psig: BASE.psig, idle: BASE.idle, dew: BASE.dew };
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
      pts.push({ flow, kw: flow * BASE.kwPerAcfm + noise(1.2), psig: BASE.psig + noise(0.5), dew: BASE.dew + noise(0.4) });
    }
    return pts;
  });
  const [idle, setIdle] = useState(BASE.idle);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [log, setLog] = useState<LogRow[]>(LOG_SEED);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const repairedToday = log.filter((r) => r.status === "Repaired" && r.when === "Done today").reduce((a, r) => a + r.scfm, 0);

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
      dew: tg.dew + noise(0.4),
    };
    setHistory((h) => [...h.slice(-(HISTORY - 1)), next]);
    setIdle(tg.idle - repairedToday);
    setSecondsAgo(0);
  }, [tick, mode, repairedToday]);

  const markRepaired = (tag: string) => {
    setLog((rows) => rows.map((r) => (r.tag === tag ? { ...r, status: "Repaired", when: "Done today" } : r)));
  };

  const showUploadNote = (what: string) => {
    setUploadNote(`${what} uploads open with the pilot login. The preview keeps the sample log.`);
  };

  const changeMode = (m: Mode) => {
    modeStart.current = tick;
    setMode(m);
  };

  const latest = history[history.length - 1];
  const specific = latest.kw / latest.flow;
  const vsBaseline = ((latest.flow - 445) / 445) * 100;
  const idleDelta = idle - 43;
  const dewDelta = latest.dew - BASE.dew;

  const insight = useMemo(() => {
    if (mode === "dryer") {
      return {
        level: dewDelta > 12 ? "alert" : dewDelta > 5 ? "watch" : "ok",
        text: dewDelta > 5
          ? `Dryer outlet dew point ${latest.dew.toFixed(0)} F, up ${dewDelta.toFixed(0)} F against a 38 F setpoint with flow steady. Refrigerant side or condenser airflow. Check the condenser screen and the drain before the paint line sees water.`
          : "Dryer outlet dew point holding at setpoint.",
      };
    }
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
      text: repairedToday > 0
        ? `Steady. Repairs logged today took ${repairedToday.toFixed(1)} SCFM off the idle flow. Weekend idle flow now ${idle.toFixed(0)} ACFM.`
        : `Steady. Flow ${vsBaseline.toFixed(0)}% against the study baseline of 445 ACFM. Weekend idle flow ${idle.toFixed(0)} ACFM, within ${Math.abs(idleDelta).toFixed(0)} ACFM of the post repair number.`,
    };
  }, [mode, idle, idleDelta, latest.psig, latest.dew, dewDelta, vsBaseline, repairedToday]);

  return (
    <div className={styles.dash} id="preview">
      <div className={styles.head}>
        <div>
          <div className={styles.brandChip}><img src={asset("inflow-mark.png")} alt="" /> compressedair.ai <span>by Inflow</span></div>
          <div className={styles.plant}>Main plant header</div>
          <div className={styles.meta}>Simulated data for the preview. Updated {secondsAgo} s ago.</div>
        </div>
        <div className={styles.modes} role="group" aria-label="Simulate a situation">
          <ModeButton active={mode === "normal"} onClick={() => changeMode("normal")}>Normal day</ModeButton>
          <ModeButton active={mode === "shift"} onClick={() => changeMode("shift")}>Shift start</ModeButton>
          <ModeButton active={mode === "leak"} onClick={() => changeMode("leak")}>Leaks growing</ModeButton>
          <ModeButton active={mode === "dryer"} onClick={() => changeMode("dryer")}>Dryer slipping</ModeButton>
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
        <Tile
          icon={<Droplets size={16} />}
          label="Dryer dew point"
          value={latest.dew.toFixed(0)}
          unit="F"
          sub="Refrigerated dryer, setpoint 38 F"
          tone={dewDelta > 12 ? "alert" : dewDelta > 5 ? "warn" : "ok"}
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
        <Spark
          title="Dryer dew point, F"
          values={history.map((p) => p.dew)}
          min={30}
          max={62}
          color="hsl(38 90% 62%)"
          band={[35, 41]}
          bandLabel="dryer spec"
        />
      </div>

      <div className={`${styles.insight} ${styles[insight.level]}`}>
        {insight.level !== "ok" && <AlertTriangle size={16} className={styles.insightIcon} />}
        <span>{insight.text}</span>
      </div>

      <div className={styles.log}>
        <div className={styles.logHead}>
          <div>
            <div className={styles.logTitle}>Leak and demand side log</div>
            <div className={styles.meta}>Survey findings, demand side items and repair completion in one list. Mark a repair and the idle flow follows.</div>
          </div>
          <div className={styles.logActions}>
            <button type="button" className={styles.logBtn} onClick={() => showUploadNote("Leak survey")}><Upload size={14} /> Upload leak survey</button>
            <button type="button" className={styles.logBtn} onClick={() => showUploadNote("Demand side inventory")}><Upload size={14} /> Upload demand side list</button>
          </div>
        </div>
        <table className={styles.logTable}>
          <thead>
            <tr><th>Tag</th><th>Type</th><th>Item</th><th>SCFM</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {log.map((r) => (
              <tr key={r.tag}>
                <td className={styles.logTag}>{r.tag}</td>
                <td>{r.kind}</td>
                <td>{r.item}</td>
                <td>{r.scfm.toFixed(1)}</td>
                <td><span className={r.status === "Repaired" ? styles.statusDone : styles.statusOpen}>{r.status}</span> <span className={styles.logWhen}>{r.when}</span></td>
                <td>
                  {r.status === "Open" && (
                    <button type="button" className={styles.repairBtn} onClick={() => markRepaired(r.tag)}><Wrench size={13} /> Mark repaired</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {uploadNote && (
          <div className={styles.logNote}>
            {uploadNote} <Link to="/contact?system=platform">Request early access</Link>.
          </div>
        )}
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
