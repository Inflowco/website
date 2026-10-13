import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { Input } from "../components/Input";
import { Textarea } from "../components/Textarea";
import { Button } from "../components/Button";
import { CONTACT, FORMSPREE_ID } from "../helpers/site";
import styles from "./contact.module.css";

const SYSTEMS: { value: string; label: string }[] = [
  { value: "compressed-air", label: "Compressed air" },
  { value: "argon", label: "Argon" },
  { value: "nitrogen", label: "Nitrogen" },
  { value: "fluid", label: "Blower, vacuum, pump or fan" },
  { value: "bid-spec", label: "Bid specification and implementation" },
  { value: "platform", label: "Monitoring platform (compressedair.ai)" },
  { value: "other", label: "Something else" },
];

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const [params] = useSearchParams();
  const preset = params.get("system") || "";
  const [values, setValues] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    system: SYSTEMS.some((s) => s.value === preset) ? preset : "",
    message: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const systemLabel = SYSTEMS.find((s) => s.value === values.system)?.label || "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim() || !values.email.trim() || !values.message.trim()) {
      setError("Name, email and a short message are needed.");
      setStatus("error");
      return;
    }
    setError("");

    if (FORMSPREE_ID) {
      setStatus("sending");
      try {
        const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ...values, system: systemLabel, _subject: `Inflow website: ${values.company || values.name}` }),
        });
        if (!res.ok) throw new Error("The form service did not accept the message.");
        setStatus("sent");
      } catch (err) {
        setError((err as Error).message || "Could not send. Email or call instead.");
        setStatus("error");
      }
      return;
    }

    // No form service configured: open the visitor's email client with the
    // message filled in, so nothing is lost.
    const subject = `Inflow website: ${values.company || values.name}`;
    const body = [
      `Name: ${values.name}`,
      `Company: ${values.company}`,
      `Email: ${values.email}`,
      `Phone: ${values.phone}`,
      `System: ${systemLabel}`,
      "",
      values.message,
    ].join("\n");
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus("sent");
  };

  return (
    <>
      <Helmet>
        <title>Contact | Inflow Corp.</title>
        <meta name="description" content="Tell Inflow about your compressed air, argon or nitrogen system. Peter Vinck replies within one business day." />
      </Helmet>

      <div className={styles.pageHeader}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>Tell us about the system</h1>
          <p className={styles.pageSubtitle}>
            Send the compressor list or the gas bill and we will tell you what a study would cover and what
            funding applies. {CONTACT.name} replies within one business day.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.formSection}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Send a message</h2>

              {status === "sent" ? (
                <div className={styles.sent}>
                  <CheckCircle2 className={styles.sentIcon} />
                  <div>
                    <strong>{FORMSPREE_ID ? "Sent." : "Your email client should have opened with the message filled in."}</strong>
                    <p>
                      {FORMSPREE_ID
                        ? `${CONTACT.name} replies within one business day.`
                        : `If it did not, email ${CONTACT.email}.`}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit} className={styles.form} noValidate>
                  <div className={styles.row}>
                    <label className={styles.halfWidth}>
                      <span className={styles.label}>Name <span className={styles.required}>*</span></span>
                      <Input placeholder="Your name" value={values.name} onChange={set("name")} autoComplete="name" />
                    </label>
                    <label className={styles.halfWidth}>
                      <span className={styles.label}>Company</span>
                      <Input placeholder="Plant or company" value={values.company} onChange={set("company")} autoComplete="organization" />
                    </label>
                  </div>

                  <div className={styles.row}>
                    <label className={styles.halfWidth}>
                      <span className={styles.label}>Email <span className={styles.required}>*</span></span>
                      <Input type="email" placeholder="email@company.com" value={values.email} onChange={set("email")} autoComplete="email" />
                    </label>
                    <label className={styles.halfWidth}>
                      <span className={styles.label}>Phone</span>
                      <Input type="tel" placeholder="Optional" value={values.phone} onChange={set("phone")} autoComplete="tel" />
                    </label>
                  </div>

                  <label>
                    <span className={styles.label}>System</span>
                    <select className={styles.select} value={values.system} onChange={set("system")}>
                      <option value="">Pick one</option>
                      {SYSTEMS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className={styles.label}>What is going on <span className={styles.required}>*</span></span>
                    <Textarea
                      placeholder="Compressor count and horsepower, the problem you see, or the question you have."
                      rows={6}
                      value={values.message}
                      onChange={set("message")}
                    />
                  </label>

                  {status === "error" && error && <p className={styles.error}>{error}</p>}

                  <Button type="submit" variant="primary" size="lg" className={styles.submitBtn} disabled={status === "sending"}>
                    {status === "sending" ? "Sending" : "Send"}
                  </Button>
                  <p className={styles.formNote}>
                    {FORMSPREE_ID
                      ? "Sent straight to Peter's inbox."
                      : `Opens your email client addressed to ${CONTACT.email}.`}
                  </p>
                </form>
              )}
            </div>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.infoCard}>
              <h3>{CONTACT.name}</h3>
              <p className={styles.infoTitle}>{CONTACT.title}, {CONTACT.company}</p>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <Mail className={styles.infoIcon} />
                  <div>
                    <strong>Email</strong>
                    <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <MapPin className={styles.infoIcon} />
                  <div>
                    <strong>Mail</strong>
                    <p>{CONTACT.company}<br />{CONTACT.address1}<br />{CONTACT.address2}</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <Clock className={styles.infoIcon} />
                  <div>
                    <strong>Hours</strong>
                    <p>Monday to Friday, 8 am to 5 pm Central</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.fundingCard}>
              <h3>Utility study funding</h3>
              <p>
                The electric utility in your area may pay some or all of the cost of a study, a report or a
                project. Inflow is a listed study provider and handles the application. Send us your electric
                utility and we will find out what funding applies.
              </p>
              <Link to="/services#funding" className={styles.fundingLink}>How the funding works</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
