import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowRight } from "lucide-react";
import { Button } from "../components/Button";
import { asset, AWARD_LINE } from "../helpers/site";
import styles from "./about.module.css";

const AWARD_YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About Inflow | Inflow Co.</title>
        <meta
          name="description"
          content="Inflow Co. is an independent engineering consultancy in Saint Paul, Minnesota, founded by Peter Vinck. Listed Xcel Energy study provider and Energy Efficiency Partner Award winner every year since 2015."
        />
      </Helmet>

      <div className={styles.pageHeader}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>About Inflow</p>
          <h1 className={styles.pageTitle}>An engineering firm, not an equipment dealer</h1>
          <p className={styles.pageSubtitle}>
            Inflow Co. is an independent consultancy in Saint Paul, Minnesota. Our fee is the only thing
            we are paid, so the recommendation is the one that is right for your plant.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <section className={styles.split}>
          <div>
            <h2 className={styles.sectionTitle}>Peter Vinck</h2>
            <p className={styles.role}>Senior Engineering Consultant, founder</p>
            <p className={styles.textBody}>
              Peter founded Inflow after five years as a Senior Energy Efficiency Engineer at Xcel Energy,
              where he managed the compressed air program and reviewed measurement and verification on
              large custom projects, and before that as an auditor and sales engineer on compressed air,
              vacuum and cooling systems.
            </p>
            <p className={styles.textBody}>
              Inflow is a listed study provider for Xcel Energy's Minnesota commercial and industrial
              programs. Since 2024 the firm has completed studies for more than forty industrial plants
              across medical device, building materials, food and beverage, semiconductor, paper, consumer
              products, water and wastewater, and university campuses.
            </p>
            <dl className={styles.facts}>
              <div><dt>Education</dt><dd>B.S. Mechanical Engineering, Iowa State University</dd></div>
              <div><dt>DOE qualified</dt><dd>AirMaster+ Compressed Air Specialist, Pump System Specialist, Fan System Specialist</dd></div>
              <div><dt>Xcel Energy</dt><dd>Listed study provider; Partner Award winner 2015 to 2026; former Senior Energy Efficiency Engineer</dd></div>
              <div><dt>Speaking</dt><dd>Compressed Air Best Practices webinars and Expo Conference, 2025 and 2026</dd></div>
              <div><dt>Experience</dt><dd>25 years in compressed air and industrial systems, independent since 2012</dd></div>
            </dl>
          </div>
          <aside className={styles.awardCard}>
            <div className={styles.utilityRow}>
              <img src={asset("xcel-energy-logo.svg")} alt="Xcel Energy" className={styles.utilityLogo} />
              <span className={styles.utilityLabel}>Listed study provider, Minnesota</span>
            </div>
            <img src={asset("xcel-award-badge.png")} alt="Xcel Energy Partner Award, 2015 to 2026" className={styles.badge} />
            <p className={styles.awardHeadline}>{AWARD_LINE}.</p>
            <p className={styles.awardSub}>Won every year since the award began. Compressed Air category winner, 2025 and 2026.</p>
            <div className={styles.yearRow}>
              {AWARD_YEARS.map((y) => <span key={y} className={styles.yearChip}>{y}</span>)}
            </div>
          </aside>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Industry education</h2>
          <ul className={styles.talks}>
            <li><span>2026</span> The Hidden kWh Cost of Compressed Air. Best Practices EXPO, Indianapolis</li>
            <li><span>2026</span> Leveraging Utility Incentives and Demand Side Credits for Compressed Air. CABP Magazine webinar</li>
            <li><span>2026</span> Condensate Management: Drains, Separators and Compliance Strategies. CABP Magazine webinar</li>
            <li><span>2025</span> The Future of Optimizing Compressed Air Systems with Generative AI. Best Practices EXPO, Kansas City</li>
            <li><span>2025</span> Optimizing Air Compressor Efficiency with Variable Speed Drives. CABP Magazine webinar</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What independent means here</h2>
          <div className={styles.principles}>
            <div className={styles.principle}>
              <h3>No equipment, no gas</h3>
              <p>We do not sell, represent or get paid by any manufacturer, distributor or gas supplier. The study fee is the whole relationship.</p>
            </div>
            <div className={styles.principle}>
              <h3>Measured, not estimated</h3>
              <p>Two weeks of power, pressure and flow logging behind every compressed air number. A tank read across a shutdown behind every gas number.</p>
            </div>
            <div className={styles.principle}>
              <h3>Written for three readers</h3>
              <p>Your maintenance team, your controller and your utility's rebate reviewer all get the same report, and it works for each of them.</p>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>Tell us about the system</h2>
          <Button asChild size="lg" variant="primary">
            <Link to="/contact">Request a study <ArrowRight size={18} /></Link>
          </Button>
        </section>
      </div>
    </>
  );
}
