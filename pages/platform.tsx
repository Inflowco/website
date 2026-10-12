import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Activity, Bell, Workflow, MessageSquare, Package, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "../components/Button";
import { PlatformPreview } from "../components/PlatformPreview";
import { asset } from "../helpers/site";
import styles from "./platform.module.css";

export default function PlatformPage() {
  return (
    <>
      <Helmet>
        <title>compressedair.ai | Coming soon from Inflow</title>
        <meta
          name="description"
          content="compressedair.ai is a self install monitoring kit and dashboard for compressed air systems, built by the engineers who do the studies. Coming soon. Preview the dashboard and request early access."
        />
      </Helmet>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.badgeRow}>
              <span className={styles.badge}>compressedair.ai, an Inflow platform</span>
              <span className={styles.soon}>Coming soon</span>
            </div>
            <h1 className={styles.heroTitle}>
              The whole system
              <br />
              <span className={styles.highlight}>on one screen</span>
            </h1>
            <p className={styles.heroSubtitle}>
              A self install monitoring kit and dashboard built by the people who do the studies. Flow,
              power and pressure together, a block diagram of your plant, and analysis written the way an
              engineer would write it. Not a vendor's portal for one compressor.
            </p>
            <div className={styles.heroActions}>
              <Button asChild size="lg" variant="primary">
                <Link to="/contact?system=platform">Request early access <ArrowRight size={18} /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className={styles.heroSecondaryBtn}>
                <a href="#preview">See the preview</a>
              </Button>
            </div>
            <p className={styles.status}>
              Status, October 2026: the kit is in design and pilot plants are being selected. Inflow studies
              and leak surveys run today; the dashboard login opens with the first pilots.
            </p>
          </div>
        </div>
      </section>

      {/* Preview */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Preview</p>
            <h2 className={styles.sectionTitle}>Try the dashboard</h2>
            <p className={styles.sectionSubtitle}>
              This is a simulation, not a live plant. Push the system through a shift start or a slow leak
              and watch what the platform flags.
            </p>
          </div>
          <PlatformPreview />
          <p className={styles.previewNote}>
            The numbers mirror a real study: 445 ACFM baseline, 0.235 kW per ACFM, 61 ACFM of weekend idle
            flow after leak repair. The live product reads your meters instead.
          </p>
        </div>
      </section>

      {/* Why it matters */}
      <section className={`${styles.section} ${styles.bgMuted}`}>
        <div className={styles.container}>
          <div className={styles.split}>
            <div>
              <p className={styles.eyebrow}>Why it matters</p>
              <h2 className={styles.sectionTitle}>Production is downstream of the pipe</h2>
              <p className={styles.textBody}>
                Think of the compressor as the source and the plant as the forest it feeds. When clean air
                flows at the right pressure, production thrives. When it does not, the cost shows up far
                from the compressor room: in downtime, in scrap from low pressure, in contaminated product
                from wet or oily air.
              </p>
              <p className={styles.textBody}>
                Most monitoring watches the compressor. compressedair.ai watches the forest: the header,
                the idle flow that never stops, the pressure band at the point of use, and the dryer that
                quietly stops doing its job.
              </p>
              <ul className={styles.list}>
                <li><CheckCircle2 className={styles.listIcon} /> No air: downtime, idle labor and the energy to restart</li>
                <li><CheckCircle2 className={styles.listIcon} /> Low flow or low pressure: scrap, rework and rejected parts</li>
                <li><CheckCircle2 className={styles.listIcon} /> Poor air quality: contaminated product and damaged tools</li>
              </ul>
            </div>
            <figure className={styles.figure}>
              <img src={asset("hero-forest.jpg")} alt="A compressor pours clean compressed air like a river into a forest of production" loading="lazy" />
              <figcaption>Healthy system: clean compressed air from the pipe feeds production, and the forest thrives.</figcaption>
            </figure>
          </div>
          <figure className={`${styles.figure} ${styles.figureWide}`}>
            <img src={asset("forest-modes.jpg")} alt="Four states of a compressed air system shown as a forest: healthy, low flow, poor air quality and no flow" loading="lazy" />
            <figcaption>The same plant in four states. The platform is built to tell you which one you are in before production does.</figcaption>
          </figure>
        </div>
      </section>

      {/* What is in it */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>What you get</p>
            <h2 className={styles.sectionTitle}>Kit, dashboard, engineer</h2>
          </div>
          <div className={styles.featuresGrid}>
            <FeatureCard
              icon={<Package />}
              title="Self install kit"
              desc="Flow, power and pressure sensors sized for your header, a gateway, and an install guide. Remote help from Inflow while you mount it."
            />
            <FeatureCard
              icon={<Workflow />}
              title="Block diagram of your plant"
              desc="Compressors, dryers, storage, header and the big users drawn with you on a call, then overlaid with live readings."
            />
            <FeatureCard
              icon={<Activity />}
              title="The numbers a study uses"
              desc="Specific power, idle flow, pressure band, dryer dew point and the weekend profile, trended against your study baseline."
            />
            <FeatureCard
              icon={<Bell />}
              title="Alerts that name the fix"
              desc="Not a red light. A sentence that says what moved, by how much, and where to walk first."
            />
            <FeatureCard
              icon={<MessageSquare />}
              title="Ask the engineer"
              desc="Questions about your readings, your standards and your options, answered against your own data and Inflow's study library."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2>Be one of the first plants on it</h2>
            <p>
              Pilot plants get the kit at cost, Inflow on the install, and a say in what the dashboard
              shows. A study is the best way to start, and in Xcel Energy territory the utility usually pays
              for it.
            </p>
            <div className={styles.ctaActions}>
              <Button asChild size="lg" variant="primary">
                <Link to="/contact?system=platform">Request early access</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/services">Start with a study</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{desc}</p>
    </div>
  );
}
