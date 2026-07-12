import React, { useEffect } from 'react';
import { CloseIcon } from './icons';

type LegalModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function LegalModal({ open, onClose }: LegalModalProps) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="modal glass"
        role="dialog"
        aria-modal="true"
        aria-label="Legal Notice and Privacy"
      >
        <div className="modal-head">
          <h2>Legal &amp; Privacy / Impressum &amp; Datenschutz</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close legal notice"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          <h3>Datenschutzerklärung / Privacy Policy</h3>
          <p>
            <strong>Deutsch:</strong> Willkommen auf{' '}
            <strong>MapTheAir.com</strong>. Wir nehmen den Schutz Ihrer
            personenbezogenen Daten ernst und möchten, dass Sie sich beim Besuch
            unserer Website sicher fühlen. Im Folgenden informieren wir Sie über
            den Umgang mit Daten auf MapTheAir.com.
          </p>
          <p>
            <strong>Vercel Analytics:</strong> Unsere Website wird über{' '}
            <strong>Vercel</strong> gehostet und verwendet{' '}
            <strong>Vercel Analytics</strong> zur Auswertung anonymisierter
            Besucherstatistiken. Vercel Analytics speichert keine
            personenbezogenen Daten in Form von Cookies. IP-Adressen werden,
            sofern erfasst, anonymisiert.
          </p>
          <p>
            <strong>Erhebung personenbezogener Daten:</strong> Personenbezogene
            Daten (z.&nbsp;B. Name, E-Mail-Adresse) werden nur erhoben, wenn Sie
            uns diese im Rahmen einer freiwilligen Anfrage, z.&nbsp;B. per
            E-Mail, mitteilen. Diese Daten verwenden wir ausschließlich zur
            Bearbeitung Ihrer Anfrage.
          </p>
          <p>
            Durch die Nutzung unserer Website erklären Sie sich mit diesen
            Datenschutzbestimmungen einverstanden. Sollten Sie mit den
            beschriebenen Verfahren nicht einverstanden sein, bitten wir um
            Verzicht auf einzelne Dienste der Website. Weitere Informationen zum
            Datenschutz bei Vercel finden Sie in der{' '}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel Privacy Policy
            </a>
            .
          </p>
          <p>
            <strong>English:</strong> Welcome to <strong>MapTheAir.com</strong>.
            We take the protection of your personal data seriously and want you
            to feel secure when using our website. Our website is hosted by{' '}
            <strong>Vercel</strong> and uses <strong>Vercel Analytics</strong>{' '}
            to analyze anonymized visitor statistics. Vercel Analytics does not
            store personal data in the form of cookies. Any captured IP
            addresses are anonymized. Personal data (e.g., name, email address)
            is collected only if you voluntarily provide it (e.g., via email
            inquiry) and is used exclusively for processing your inquiry. By
            using our website, you agree to the data protection practices
            described here.
          </p>

          <h3>Disclaimer &amp; Nutzungsbedingungen / Terms of Use</h3>
          <p>
            <strong>Deutsch:</strong> Die auf MapTheAir.com bereitgestellten
            Luftqualitätsdaten stammen primär von Drittanbietern (z.&nbsp;B.
            WAQI/AQICN) und werden ohne Gewähr bereitgestellt. Eine Haftung für
            Richtigkeit, Vollständigkeit oder Aktualität dieser Daten wird
            ausdrücklich ausgeschlossen. Die Nutzung erfolgt auf eigene Gefahr.
            Für Schäden, die aus der Nutzung oder der Unmöglichkeit der Nutzung
            dieser Website entstehen, übernehmen wir keine Haftung. Die Inhalte
            dienen ausschließlich der allgemeinen Information und stellen keine
            Beratung in medizinischen, gesundheitlichen oder
            sicherheitsrelevanten Fragen dar. Der Missbrauch der Website ist
            untersagt. Wir behalten uns das Recht vor, Inhalte zu ändern, zu
            ergänzen oder einzelne Funktionen ohne Vorankündigung abzuschalten.
            Diese Bestimmungen unterliegen dem Recht der Bundesrepublik
            Deutschland. Ausschließlicher Gerichtsstand für alle Streitigkeiten
            aus der Nutzung der Website ist Berlin.
          </p>
          <p>
            <strong>English:</strong> The air quality data provided on
            MapTheAir.com is primarily sourced from third parties (e.g.,
            WAQI/AQICN) and is provided &quot;as is&quot; without any guarantee.
            We expressly exclude any liability for the accuracy, completeness,
            or timeliness of this data. Use is at your own risk. We assume no
            liability for any damages resulting from the use or inability to use
            this website. The content is provided solely for informational
            purposes and does not constitute any form of professional advice in
            matters of health, safety, or similar areas. Misuse of the website
            is prohibited. We reserve the right to modify or discontinue
            features without prior notice. These terms are governed by the law
            of the Federal Republic of Germany. The exclusive jurisdiction for
            all disputes arising from the use of the website is Berlin.
          </p>

          <h3>Kontakt / Contact</h3>
          <p>
            Bei Fragen oder Anliegen zu unseren rechtlichen Hinweisen oder der
            Datenschutzerklärung wenden Sie sich bitte an / For any questions or
            concerns regarding our legal notice or privacy policy, please
            contact:{' '}
            <strong>
              <a href="mailto:lukas.kreibig@posteo.de">
                lukas.kreibig@posteo.de
              </a>
            </strong>
          </p>

          <h3>Impressum / Legal Notice</h3>
          <p>
            <strong>Betreiber:</strong> Lukas Kreibig
            <br />
            <strong>Adresse:</strong> Wipperstraße 6, 10179 Berlin, Deutschland
            <br />
            <strong>Kontakt:</strong>{' '}
            <a href="mailto:lukas.kreibig@posteo.de">lukas.kreibig@posteo.de</a>
          </p>
          <p>
            Angaben gemäß § 5 TMG (Telemediengesetz). Für Rückfragen oder
            weitere Informationen kontaktieren Sie uns bitte.
          </p>
          <p>
            <em>Last Updated / Letzte Aktualisierung: 15. Januar 2025</em>
          </p>
        </div>
      </div>
    </div>
  );
}
