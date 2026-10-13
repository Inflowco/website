import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Menu, X, ExternalLink } from "lucide-react";
import { Button } from "./Button";
import { asset, SITE_URL, CONTACT, AWARD_SHORT } from "../helpers/site";
import styles from "./Layout.module.css";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const navLinks = [
    { name: "Compressed Air", path: "/services" },
    { name: "Argon and Nitrogen", path: "/industrial-gas" },
    { name: "Platform", path: "/platform" },
    { name: "Results", path: "/case-studies" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const logo = asset("inflow-logo.png");
  const ogImage = SITE_URL ? SITE_URL + asset("og-image.jpg") : undefined;
  const canonical = SITE_URL ? SITE_URL + (location.pathname === "/" ? "/" : location.pathname.replace(/\/$/, "")) : undefined;
  const year = new Date().getFullYear();

  return (
    <div className={styles.layout}>
      <Helmet>
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Inflow Corp." />
        {canonical && <link rel="canonical" href={canonical} />}
        {canonical && <meta property="og:url" content={canonical} />}
        {ogImage && <meta property="og:image" content={ogImage} />}
        {ogImage && <meta name="twitter:card" content="summary_large_image" />}
      </Helmet>

      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            <Link to="/" className={styles.logo} onClick={closeMenu}>
              <img src={logo} alt="Inflow" className={styles.logoImage} />
            </Link>

            {/* Desktop Nav */}
            <nav className={styles.desktopNav}>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`${styles.navLink} ${
                    location.pathname === link.path ? styles.active : ""
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Button asChild variant="primary" size="sm">
                <Link to="/contact">Request a study</Link>
              </Button>
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              className={styles.mobileToggle}
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className={styles.mobileNav}>
            <div className={styles.container}>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`${styles.mobileNavLink} ${
                    location.pathname === link.path ? styles.active : ""
                  }`}
                  onClick={closeMenu}
                >
                  {link.name}
                </Link>
              ))}
              <div className={styles.mobileNavCta}>
                <Button asChild variant="primary" className={styles.fullWidth}>
                  <Link to="/contact" onClick={closeMenu}>
                    Request a study
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className={styles.brandBand} aria-hidden="true" />

      <main className={styles.main}>{children}</main>

      <div className={styles.brandBand} aria-hidden="true" />

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <img src={logo} alt="Inflow" className={styles.logoImageFooter} />
              <p className={styles.tagline}>Compressed Air Consultants, since 2012</p>
              <p className={styles.footerDesc}>
                Independent engineering for compressed air, argon and nitrogen
                systems. We measure it, we do not sell it.
              </p>
              <p className={styles.footerContact}>
                {CONTACT.name}<br />
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a><br />
                {CONTACT.company}, {CONTACT.address1}, {CONTACT.address2}
              </p>
            </div>

            <div className={styles.footerLinks}>
              <h4>Practices</h4>
              <ul>
                <li><Link to="/services">Compressed Air Studies</Link></li>
                <li><Link to="/industrial-gas">Argon and Nitrogen Reviews</Link></li>
                <li><Link to="/services#fluid-systems">Fluid Systems</Link></li>
                <li><Link to="/services#funding">Utility study funding</Link></li>
              </ul>
            </div>

            <div className={styles.footerLinks}>
              <h4>Company</h4>
              <ul>
                <li><Link to="/case-studies">Results</Link></li>
                <li><Link to="/about">About Inflow</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><a href={asset("downloads/Inflow-Services-Linecard-2026.pdf")} target="_blank" rel="noopener noreferrer">Services linecard (PDF)</a></li>
              </ul>
            </div>

            <div className={styles.footerExternal}>
              <h4>Monitoring platform</h4>
              <p>compressedair.ai, an Inflow platform. Flow, power and pressure on one screen. Coming soon.</p>
              <div className={styles.externalLinks}>
                <Link to="/platform" className={styles.externalLink}>
                  compressedair.ai <ExternalLink size={14} />
                </Link>
                <Link to="/contact?system=platform" className={styles.externalLink}>
                  Request early access
                </Link>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p className={styles.awardLine}>Independent. Vendor neutral. {AWARD_SHORT}.</p>
            <p>&copy; {year} {CONTACT.company} All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
