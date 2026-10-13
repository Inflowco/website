import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowRight, Download, CheckCircle2 } from "lucide-react";
import { Button } from "../components/Button";
import { asset } from "../helpers/site";
import styles from "./industrial-gas.module.css";

export default function IndustrialGasPage() {
  return (
    <>
      <Helmet>
        <title>Argon and Nitrogen Reviews | Inflow Corp.</title>
        <meta
          name="description"
          content="Argon and nitrogen system reviews: system map, twelve month cost baseline, idle draw measured over a shutdown, leaks tagged at your delivered price, ranked fixes. Pays back out of the gas bill."
        />
      </Helmet>

      <div className={styles.pageHeader}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>Argon and nitrogen</p>
          <h1 className={styles.pageTitle}>Where does the argon go?</h1>
          <p className={styles.pageSubtitle}>
            Most plants know what they buy and not what they use. A review maps the system, measures the
            idle draw, tags every leak at your delivered price and ranks the fixes. It pays back out of the
            gas bill, usually in months.
          </p>
          <div className={styles.headerActions}>
            <Button asChild size="lg" variant="primary">
              <Link to="/contact?system=argon">Request a gas review <ArrowRight size={18} /></Link>
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <section className={styles.split}>
          <div>
            <h2 className={styles.sectionTitle}>The idle draw is the story</h2>
            <p className={styles.textBody}>
              At the first plant Inflow measured, several small leaks, uncoupled quick disconnect whips and
              tank boil off made up the whole idle draw. No single big leak, and none was needed to explain
              the bill.
            </p>
            <p className={styles.textBody}>
              When points of use are failing moisture or purity tests, the review traces where the problem
              enters. If your nitrogen is made on site, the generator's compressor is a compressed air load
              and the electric utility in your area may pay some or all of the study cost.
            </p>
          </div>
          <div className={styles.callout}>
            <div className={styles.calloutValue}>2 of 3</div>
            <p className={styles.calloutText}>
              cubic feet of one Minnesota fabrication plant's argon were flowing while the plant was shut
              down. Review fee $4,700, recoverable about $15,000 a year.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What a review includes</h2>
          <div className={styles.stepsGrid}>
            <Step n="1" title="System map" text="From the tank tie in to every point of use. Regulators, manifolds, hoses, quick disconnects, purge stations." />
            <Step n="2" title="Cost baseline" text="Twelve months of delivery invoices and tank telemetry, turned into a cost per day and a cost per shift." />
            <Step n="3" title="Idle draw" text="Tank level read across a weekend or a shutdown. What flows when nothing is being made." />
            <Step n="4" title="Leaks and practice" text="Every leak tagged and priced at your delivered rate. Purge habits, open whips, moisture path." />
            <Step n="5" title="Ranked fixes" text="Each measure with its savings and its cost, ordered by payback. Most pay back in months." />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.gasGrid}>
            <div className={styles.gasCard}>
              <h3>Argon</h3>
              <ul>
                <li><CheckCircle2 className={styles.icon} /> Laser and TIG welding</li>
                <li><CheckCircle2 className={styles.icon} /> Insulated glass fill</li>
                <li><CheckCircle2 className={styles.icon} /> Gloveboxes and purge stations</li>
                <li><CheckCircle2 className={styles.icon} /> ICP and lab gas</li>
              </ul>
              <a href={asset("downloads/Inflow-Argon-System-Review-2026.pdf")} className={styles.download} target="_blank" rel="noopener noreferrer">
                <Download size={16} /> Argon review sell sheet (PDF)
              </a>
            </div>
            <div className={styles.gasCard}>
              <h3>Nitrogen</h3>
              <ul>
                <li><CheckCircle2 className={styles.icon} /> Laser assist at 300 psig</li>
                <li><CheckCircle2 className={styles.icon} /> Solder atmospheres</li>
                <li><CheckCircle2 className={styles.icon} /> Tank blanketing and purge</li>
                <li><CheckCircle2 className={styles.icon} /> Packaging flush and LN2 dosing</li>
              </ul>
              <a href={asset("downloads/Inflow-Nitrogen-System-Review-2026.pdf")} className={styles.download} target="_blank" rel="noopener noreferrer">
                <Download size={16} /> Nitrogen review sell sheet (PDF)
              </a>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>Start with the gas bill</h2>
          <p>Send twelve months of invoices and a photo of the tank gauge. We will tell you what the review would cover and what it should find.</p>
          <div className={styles.ctaActions}>
            <Button asChild size="lg" variant="primary">
              <Link to="/contact?system=argon">Request an argon review</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact?system=nitrogen">Request a nitrogen review</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className={styles.step}>
      <span className={styles.stepNumber}>{n}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
