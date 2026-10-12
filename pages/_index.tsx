import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowRight, CheckCircle2, Wind, FlaskConical, Fan, Eye, Gauge, FileText } from "lucide-react";
import { Button } from "../components/Button";
import { asset, AWARD_LINE } from "../helpers/site";
import styles from "./_index.module.css";

const AWARD_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>Inflow Corp. | Compressed Air and Industrial Gas Engineering</title>
        <meta
          name="description"
          content="Independent engineering for compressed air, argon and nitrogen systems in Saint Paul, Minnesota. Studies, leak surveys, utility rebate engineering and the compressedair.ai monitoring platform."
        />
      </Helmet>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <p className={styles.kicker}>Independent engineering, Saint Paul, Minnesota</p>
            <h1 className={styles.heroTitle}>
              Measure the system. Fix what pays.
              <br />
              <span className={styles.highlight}>Prove it with data.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Inflow maps compressed air, argon and nitrogen systems, logs them long enough to catch what
              averages hide, and hands you a ranked list of fixes with the dollars on each one. We do not
              sell equipment or gas.
            </p>
            <div className={styles.heroActions}>
              <Button asChild size="lg" variant="primary">
                <Link to="/contact">Request a study</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className={styles.heroSecondaryBtn}>
                <Link to="/platform">See the monitoring platform</Link>
              </Button>
            </div>
            <p className={styles.heroNote}>
              Most compressed air studies in Xcel Energy territory are funded by the utility. Inflow is a
              listed study provider and handles the paperwork.
            </p>
          </div>
        </div>
      </section>

      {/* Award band */}
      <section className={styles.awardBand}>
        <div className={styles.container}>
          <div className={styles.awardGrid}>
            <div className={styles.awardCount}>
              <span className={styles.awardNumber}>12</span>
              <span className={styles.awardLabel}>consecutive years</span>
            </div>
            <div className={styles.awardText}>
              <p className={styles.awardHeadline}>{AWARD_LINE}.</p>
              <p className={styles.awardSub}>
                Won every year since the award began. Compressed Air category winner, 2025 and 2026.
              </p>
              <div className={styles.yearRow}>
                {AWARD_YEARS.map((y) => (
                  <span key={y} className={styles.yearChip}>{y}</span>
                ))}
              </div>
            </div>
            <img src={asset("xcel-award-badge.png")} alt="Xcel Energy Partner Award, 2015 to 2026" className={styles.awardBadge} />
          </div>
        </div>
      </section>

      {/* Practices */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>What we do</p>
            <h2 className={styles.sectionTitle}>Three practices, one method</h2>
            <p className={styles.sectionSubtitle}>
              Walk the system in production, measure it long enough to trust the numbers, and report
              findings your team and your utility can both use.
            </p>
          </div>

          <div className={styles.practiceGrid}>
            <PracticeCard
              icon={<Wind />}
              title="Compressed Air Studies"
              items={[
                "Supply side and demand side studies with two weeks of power, pressure and flow logging",
                "Ultrasonic leak surveys, tagged and priced",
                "Custom rebate engineering and measurement and verification",
                "Vendor neutral specifications and bid review",
              ]}
              note="Xcel Energy study funding available"
              link="/services"
              linkText="Compressed air services"
            />
            <PracticeCard
              icon={<FlaskConical />}
              title="Argon and Nitrogen Reviews"
              items={[
                "System map from the tank tie in to every point of use",
                "Twelve month cost baseline from invoices and tank telemetry",
                "Idle draw measured from tank level over a shutdown",
                "Leaks, regulators, hoses, purge practice and moisture path",
              ]}
              note="Pays back out of the gas bill, usually in months"
              link="/industrial-gas"
              linkText="Where does the argon go?"
            />
            <PracticeCard
              icon={<Fan />}
              title="Fluid Systems"
              items={[
                "Blowers and aeration, vacuum, pumps, fans",
                "Cooling water and dust collection",
                "Motor driven system optimization with DOE qualified specialists",
                "Utility custom program applications",
              ]}
              note="Utility custom incentives where they apply"
              link="/contact?system=fluid"
              linkText="Ask about a system"
            />
          </div>
        </div>
      </section>

      {/* Method */}
      <section className={`${styles.section} ${styles.bgMuted}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>How we work</p>
            <h2 className={styles.sectionTitle}>Observe. Measure. Report.</h2>
          </div>
          <div className={styles.stepGrid}>
            <Step
              n="1"
              icon={<Eye />}
              title="Observe"
              text="Walk the system in production. Compressor room, dryers, storage, header, points of use, open drops and blow offs. Decide what needs measuring before anything is clamped on."
            />
            <Step
              n="2"
              icon={<Gauge />}
              title="Measure"
              text="Log power, pressure and flow for two weeks, or read a gas tank across a shutdown. Long enough to capture weekends, idle hours and the swings a spot reading misses."
            />
            <Step
              n="3"
              icon={<FileText />}
              title="Report"
              text="Findings, measures, savings and payback in a document your maintenance team, your controller and your utility rebate reviewer can all use. Budget costs on every measure."
            />
          </div>
        </div>
      </section>

      {/* Platform teaser */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.splitContent}>
            <div className={styles.textContent}>
              <p className={styles.eyebrow}>compressedair.ai, an Inflow platform</p>
              <h2 className={styles.sectionTitle}>Keep the savings from drifting away</h2>
              <p className={styles.textBody}>
                A self install monitoring kit and dashboard built by the people who do the studies. Flow,
                power and pressure on one screen, a block diagram of your system drawn with remote help
                from Inflow, and analysis written the way an engineer would write it.
              </p>
              <p className={styles.textBody}>
                Use it after a study to hold the gains, or before one to see the system first.
              </p>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <CheckCircle2 className={styles.featureIcon} />
                  <span>Idle flow and leak growth, flagged before the next survey</span>
                </li>
                <li className={styles.featureItem}>
                  <CheckCircle2 className={styles.featureIcon} />
                  <span>Specific power, pressure band and dryer health in one view</span>
                </li>
                <li className={styles.featureItem}>
                  <CheckCircle2 className={styles.featureIcon} />
                  <span>Coming soon. Pilot plants are being selected now.</span>
                </li>
              </ul>
              <div className={styles.heroActions}>
                <Button asChild variant="primary">
                  <Link to="/platform">See the preview <ArrowRight size={16} /></Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contact?system=platform">Request early access</Link>
                </Button>
              </div>
            </div>
            <div className={styles.imageContent}>
              <div className={styles.miniDash}>
                <div className={styles.miniDashHead}>
                  <span>Main plant header</span>
                  <span className={styles.miniDashLive}>Preview</span>
                </div>
                <div className={styles.miniTiles}>
                  <MiniTile value="412" unit="ACFM" label="Flow" sub="Baseline 445, down 7%" />
                  <MiniTile value="96.8" unit="kW" label="Compressor power" sub="0.235 kW per ACFM" />
                  <MiniTile value="98" unit="psig" label="Header pressure" sub="Setpoint 100, band 4 psi" />
                </div>
                <p className={styles.miniInsight}>
                  Weekend idle flow 61 ACFM, up 18 ACFM since the last leak survey. Suggested: walk
                  Building 2 drops.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results teaser */}
      <section className={`${styles.section} ${styles.bgMuted}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Results</p>
            <h2 className={styles.sectionTitle}>Representative study outcomes</h2>
            <p className={styles.sectionSubtitle}>
              Figures from recent Inflow reports, stated the way the reports state them. Client names on request.
            </p>
          </div>
          <div className={styles.statGrid}>
            <StatCard value="43%" label="of air energy cost" text="Coatings plant, three compressors averaging 59 ACFM against 845 installed. $10,300 per year." />
            <StatCard value="$31,400" label="per year, 15%" text="University campus loop. Leak repair basis from logger data, supply consolidated on the efficient machine." />
            <StatCard value="2.3 yr" label="payback on $400,000" text="Window manufacturer, 400 HP system. Swing compressor measured at 0 to 2,570 CFM, VSD replacement engineered and rebated." />
            <StatCard value="80%" label="of argon bought while shut down" text="Medical device plant. Four small leaks and open whips. About $8,700 per year on a $4,700 review." />
          </div>
          <div className={styles.centerAction}>
            <Button asChild variant="secondary">
              <Link to="/case-studies">All results <ArrowRight size={16} /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About teaser */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.splitContent}>
            <div className={styles.textContent}>
              <p className={styles.eyebrow}>About Inflow</p>
              <h2 className={styles.sectionTitle}>An engineering firm, not an equipment dealer</h2>
              <p className={styles.textBody}>
                Inflow Corp. is an independent consultancy in Saint Paul, Minnesota. Our fee is the only
                thing we are paid, so the recommendation is the one that is right for your plant. We are a
                listed study provider for Xcel Energy's Minnesota commercial and industrial programs and
                have won its Energy Efficiency Partner Award every year since the award began.
              </p>
              <Button asChild variant="outline">
                <Link to="/about">About Peter Vinck and Inflow <ArrowRight size={16} /></Link>
              </Button>
            </div>
            <div className={styles.imageContent}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>25</div>
                <div className={styles.statLabel}>years in compressed air and industrial systems</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>2012</div>
                <div className={styles.statLabel}>independent since</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2>Tell us about the system</h2>
            <p>Send the compressor list or the gas bill. We will tell you what a study would cover and what funding applies.</p>
            <Button asChild size="lg" variant="primary">
              <Link to="/contact">Request a study</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function PracticeCard({
  icon, title, items, note, link, linkText,
}: { icon: React.ReactNode; title: string; items: string[]; note: string; link: string; linkText: string }) {
  return (
    <div className={styles.practiceCard}>
      <div className={styles.serviceIcon}>{icon}</div>
      <h3 className={styles.serviceTitle}>{title}</h3>
      <ul className={styles.practiceList}>
        {items.map((t) => <li key={t}>{t}</li>)}
      </ul>
      <p className={styles.practiceNote}>{note}</p>
      <Link to={link} className={styles.link}>{linkText} <ArrowRight size={14} /></Link>
    </div>
  );
}

function Step({ n, icon, title, text }: { n: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className={styles.step}>
      <div className={styles.stepHead}>
        <span className={styles.stepNumber}>{n}</span>
        <span className={styles.stepIcon}>{icon}</span>
        <h3 className={styles.serviceTitle}>{title}</h3>
      </div>
      <p className={styles.serviceDesc}>{text}</p>
    </div>
  );
}

function MiniTile({ value, unit, label, sub }: { value: string; unit: string; label: string; sub: string }) {
  return (
    <div className={styles.miniTile}>
      <div className={styles.miniValue}>{value} <span className={styles.miniUnit}>{unit}</span></div>
      <div className={styles.miniLabel}>{label}</div>
      <div className={styles.miniSub}>{sub}</div>
    </div>
  );
}

function StatCard({ value, label, text }: { value: string; label: string; text: string }) {
  return (
    <div className={styles.resultCard}>
      <div className={styles.resultValue}>{value}</div>
      <div className={styles.resultLabel}>{label}</div>
      <p className={styles.resultText}>{text}</p>
    </div>
  );
}
