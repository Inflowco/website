import React from "react";
import { Helmet } from "react-helmet";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "../components/Accordion";
import { Button } from "../components/Button";
import { ArrowRight, Package } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./services.module.css";

export default function ServicesPage() {
  return (
    <>
      <Helmet>
        <title>Compressed Air Studies | Inflow Corp.</title>
        <meta name="description" content="Compressed air studies, ultrasonic leak surveys, system design and Xcel Energy rebate engineering from an independent firm in Saint Paul, Minnesota." />
      </Helmet>

      <div className={styles.pageHeader}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>Compressed Air Studies</h1>
          <p className={styles.pageSubtitle}>
            Supply side and demand side studies, ultrasonic leak surveys, rebate engineering and vendor neutral design.
            Two weeks of power, pressure and flow logging behind every number.
          </p>
          <div className={styles.fundingNote} id="funding">
            <strong>Most studies in Xcel Energy territory are paid by the utility.</strong>
            Inflow is a listed study provider for Xcel Energy's Minnesota compressed air and fluid system
            optimization programs and handles the application, the study and the measurement and verification.
            Send the compressor list and we will tell you what funding applies.
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.contentGrid}>
          {/* Main Services List */}
          <div className={styles.servicesList}>
            <Accordion type="single" collapsible className={styles.accordion}>
              <AccordionItem value="leak-detection">
                <AccordionTrigger className={styles.trigger}>Leak Detection</AccordionTrigger>
                <AccordionContent>
                  <div className={styles.serviceDetail}>
                    <p>
                      Compressed air leaks are a significant source of wasted energy in industrial facilities, often accounting for 20-30% of total compressor output. Our ultrasonic leak detection service identifies these invisible leaks with precision.
                    </p>
                    <h4>Key Benefits:</h4>
                    <ul>
                      <li>Immediate energy cost reduction</li>
                      <li>Reduced compressor load and wear</li>
                      <li>Improved system pressure stability</li>
                      <li>Detailed report with tag numbers, locations, and estimated savings</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="data-monitoring">
                <AccordionTrigger className={styles.trigger}>Data Monitoring & Collection</AccordionTrigger>
                <AccordionContent>
                  <div className={styles.serviceDetail}>
                    <p>
                      You can't manage what you don't measure. We deploy advanced data loggers to monitor critical system parameters including flow, power (kW), pressure, and dew point over a representative period.
                    </p>
                    <h4>What We Monitor:</h4>
                    <ul>
                      <li><strong>Flow:</strong> Understand your actual demand profile.</li>
                      <li><strong>Power:</strong> Measure true energy consumption.</li>
                      <li><strong>Pressure:</strong> Identify pressure drops and instability.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="data-reporting">
                <AccordionTrigger className={styles.trigger}>Data Reporting</AccordionTrigger>
                <AccordionContent>
                  <div className={styles.serviceDetail}>
                    <p>
                      Raw data is useless without context. We transform collected data into comprehensive, easy-to-understand reports that highlight inefficiencies and opportunities for improvement.
                    </p>
                    <h4>Our Reports Include:</h4>
                    <ul>
                      <li>System efficiency metrics (kW/100 cfm)</li>
                      <li>Cost of operation analysis</li>
                      <li>Load profile visualization</li>
                      <li>Actionable recommendations with ROI calculations</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="system-design">
                <AccordionTrigger className={styles.trigger}>System Design</AccordionTrigger>
                <AccordionContent>
                  <div className={styles.serviceDetail}>
                    <p>
                      Whether you are building a new facility or expanding an existing one, our vendor-neutral design services ensure your compressed air system is sized correctly and piped efficiently.
                    </p>
                    <h4>Design Services:</h4>
                    <ul>
                      <li>Compressor room layout and ventilation</li>
                      <li>Piping distribution design (loop vs. header)</li>
                      <li>Storage sizing and location</li>
                      <li>Air quality treatment selection (dryers/filters)</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="supply-audit">
                <AccordionTrigger className={styles.trigger}>Supply Side Audit</AccordionTrigger>
                <AccordionContent>
                  <div className={styles.serviceDetail}>
                    <p>
                      A focused analysis of your compressor room equipment. We evaluate how well your compressors, dryers, and controls are working together to meet demand.
                    </p>
                    <h4>Focus Areas:</h4>
                    <ul>
                      <li>Compressor control sequencing</li>
                      <li>Part-load efficiency</li>
                      <li>Maintenance condition assessment</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="demand-audit">
                <AccordionTrigger className={styles.trigger}>Demand Side Audit</AccordionTrigger>
                <AccordionContent>
                  <div className={styles.serviceDetail}>
                    <p>
                      We analyze how compressed air is being used in your facility to identify inappropriate uses, artificial demand, and pressure drop issues.
                    </p>
                    <h4>We Look For:</h4>
                    <ul>
                      <li>Open blowing applications</li>
                      <li>Unregulated usage</li>
                      <li>Undersized point-of-use piping</li>
                      <li>High-pressure requirements</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="energy-savings">
                <AccordionTrigger className={styles.trigger}>Energy Savings & Rebates</AccordionTrigger>
                <AccordionContent>
                  <div className={styles.serviceDetail}>
                    <p>
                      We help you navigate utility rebate programs to offset the cost of efficiency upgrades. We handle the calculations and paperwork required to qualify for incentives.
                    </p>
                    <h4>Services:</h4>
                    <ul>
                      <li>Utility rebate application assistance</li>
                      <li>Detailed energy savings calculations</li>
                      <li>Project ROI and payback analysis</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="baselining">
                <AccordionTrigger className={styles.trigger}>Base-lining & Bench-marking</AccordionTrigger>
                <AccordionContent>
                  <div className={styles.serviceDetail}>
                    <p>
                      Establish a performance baseline for your system to track improvements over time. We benchmark your system against industry standards for your specific sector.
                    </p>
                    <h4>Deliverables:</h4>
                    <ul>
                      <li>Key Performance Indicators (KPIs)</li>
                      <li>Specific Power (kW/100 cfm) benchmarking</li>
                      <li>Annual performance reviews</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="fluid-systems" id="fluid-systems">
                <AccordionTrigger className={styles.trigger}>Fluid Systems: Blowers, Vacuum, Pumps and Fans</AccordionTrigger>
                <AccordionContent>
                  <div className={styles.serviceDetail}>
                    <p>
                      The same method applied to the other motor driven systems in the plant: aeration blowers, vacuum pumps, cooling water and process pumps, dust collection and ventilation fans. Measured in place, with DOE qualified pump and fan specialists.
                    </p>
                    <h4>Where it applies:</h4>
                    <ul>
                      <li>Blowers and aeration, vacuum, pumps, fans</li>
                      <li>Cooling water and dust collection</li>
                      <li>Utility custom program applications where they apply</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Sidebar / Promo */}
          <div className={styles.sidebar}>
            <div className={styles.promoCard}>
              <div className={styles.promoHeader}>
                <h3>Real-Time Monitoring</h3>
                <span className={styles.badge}>Coming soon</span>
              </div>
              <p>
                compressedair.ai, an Inflow platform. A self install monitoring kit and dashboard built by the people who do the studies.
              </p>
              <ul className={styles.promoList}>
                <li>Self-install kit for any setup</li>
                <li>Remote assistance included</li>
                <li>PID drawing dashboard</li>
                <li>Block diagram creation</li>
              </ul>
              <Button asChild variant="primary" className={styles.fullWidth}>
                <Link to="/platform">
                  Preview the platform <Package size={16} />
                </Link>
              </Button>
            </div>

            <div className={styles.contactCard}>
              <h3>Need a Custom Solution?</h3>
              <p>Contact our engineering team to discuss your specific requirements.</p>
              <Button asChild variant="outline" className={styles.fullWidth}>
                <Link to="/contact">Contact Us <ArrowRight size={16} /></Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}