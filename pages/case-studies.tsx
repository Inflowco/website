import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowRight } from "lucide-react";
import { Button } from "../components/Button";
import styles from "./case-studies.module.css";

type Row = { plant: string; system: string; finding: string; package: string };

const RESULTS: Row[] = [
  {
    plant: "Coatings plant, Minnesota",
    system: "170 HP, three compressors",
    finding: "Plant averaged 59 ACFM against 845 ACFM installed; the fixed speed unit carried half the hours at 0.31 kW per ACFM",
    package: "$10,300 per year, 43% of air energy cost",
  },
  {
    plant: "University campus loop",
    system: "Multi building header",
    finding: "Leak repair basis established from logger data; supply consolidated on the efficient machine",
    package: "$31,400 per year, 15%",
  },
  {
    plant: "Building materials and assembled components plant",
    system: "High pressure system, 400 HP",
    finding: "Swing compressor measured at 0 to 2,570 CFM; VSD replacement engineered and rebated",
    package: "$400,000 project, 2.3 year payback",
  },
  {
    plant: "Metal fabrication plant, Minnesota",
    system: "Argon, micro bulk tank",
    finding: "Idle draw with the plant shut down was about two thirds of average draw; several small leaks and open whips",
    package: "About $15,000 per year on a $4,700 review",
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      <Helmet>
        <title>Results | Inflow Co.</title>
        <meta name="description" content="Representative outcomes from recent Inflow compressed air and industrial gas studies, stated the way the reports state them." />
      </Helmet>

      <div className={styles.pageHeader}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>Results</h1>
          <p className={styles.pageSubtitle}>
            Figures from recent Inflow reports, stated the way the reports state them. Client names on request.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Plant</th>
                <th>System</th>
                <th>Finding</th>
                <th>Recommended package</th>
              </tr>
            </thead>
            <tbody>
              {RESULTS.map((r) => (
                <tr key={r.plant}>
                  <td data-label="Plant"><strong>{r.plant}</strong></td>
                  <td data-label="System">{r.system}</td>
                  <td data-label="Finding">{r.finding}</td>
                  <td data-label="Recommended package" className={styles.pkg}>{r.package}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.footnote}>
          Savings are as stated in the reports at the time of issue. Rebates are estimates pending utility
          pre approval. Each study logs power, pressure and flow for about two weeks before any number is
          written down.
        </p>

        <div className={styles.cards}>
          <div className={styles.card}>
            <h3>What a study costs you</h3>
            <p>
              The electric utility in your area may pay some or all of the cost of the study, the report or
              the project. Where it does not, the fee is scaled to installed horsepower and is usually
              recovered in the first year of the lowest cost measure.
            </p>
          </div>
          <div className={styles.card}>
            <h3>What you get back</h3>
            <p>
              A ranked list of measures with savings, budget cost and payback on each, the logger data behind
              them, and a report your utility reviewer can approve without a second visit.
            </p>
          </div>
        </div>

        <div className={styles.cta}>
          <Button asChild size="lg" variant="primary">
            <Link to="/contact">Request a study <ArrowRight size={18} /></Link>
          </Button>
        </div>
      </div>
    </>
  );
}
