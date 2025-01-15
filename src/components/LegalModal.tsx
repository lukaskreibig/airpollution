import { Modal, Box, Typography, IconButton } from '@mui/material';
import { CloseOutlined } from '@ant-design/icons';

type LegalModalProps = {
  open: boolean;
  onClose: () => void;
};

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth: '800px',
  width: '90%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: '8px',
  maxHeight: '80vh',
  overflowY: 'auto',
};

export default function LegalModal({ open, onClose }: LegalModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            Legal Notice &amp; Privacy / Impressum &amp; Datenschutzerklärung
          </Typography>
          <IconButton onClick={onClose}>
            <CloseOutlined />
          </IconButton>
        </Box>

        {/* Datenschutzerklärung / Privacy Policy */}
        <section style={{ marginTop: '1.5rem' }}>
          <Typography variant="h6">
            Datenschutzerklärung / Privacy Policy
          </Typography>

          {/* Deutsche Version */}
          <Typography variant="body2" paragraph>
            <strong>Deutsch:</strong>
            <br />
            Willkommen auf <strong>MapTheAir.com</strong>. Wir nehmen den Schutz
            Ihrer personenbezogenen Daten ernst und möchten, dass Sie sich beim
            Besuch unserer Website sicher fühlen. Im Folgenden informieren wir
            Sie über den Umgang mit Daten auf MapTheAir.com.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Vercel Analytics:</strong> Unsere Website wird über{' '}
            <strong>Vercel</strong> gehostet und verwendet{' '}
            <strong>Vercel Analytics</strong> zur Auswertung anonymisierter
            Besucherstatistiken. Vercel Analytics speichert keine
            personenbezogenen Daten in Form von Cookies. IP-Adressen werden,
            sofern erfasst, anonymisiert.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Erhebung personenbezogener Daten:</strong> Personenbezogene
            Daten (z. B. Name, E-Mail-Adresse) werden nur erhoben, wenn Sie uns
            diese im Rahmen einer freiwilligen Anfrage, z. B. per E-Mail,
            mitteilen. Diese Daten verwenden wir ausschließlich zur Bearbeitung
            Ihrer Anfrage.
          </Typography>
          <Typography variant="body2" paragraph>
            Durch die Nutzung unserer Website erklären Sie sich mit diesen
            Datenschutzbestimmungen einverstanden. Sollten Sie mit den
            beschriebenen Verfahren nicht einverstanden sein, bitten wir um
            Verzicht auf einzelne Dienste der Website.
          </Typography>
          <Typography variant="body2">
            Weitere Informationen zum Datenschutz bei Vercel finden Sie in der{' '}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel Privacy Policy
            </a>
            .
          </Typography>

          <Box mt={2} />

          {/* Englische Version */}
          <Typography variant="body2" paragraph>
            <strong>English:</strong>
            <br />
            Welcome to <strong>MapTheAir.com</strong>. We take the protection of
            your personal data seriously and want you to feel secure when using
            our website. Below, we inform you about how data is handled on
            MapTheAir.com.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Vercel Analytics:</strong> Our website is hosted by{' '}
            <strong>Vercel</strong> and uses <strong>Vercel Analytics</strong>{' '}
            to analyze anonymized visitor statistics. Vercel Analytics does not
            store personal data in the form of cookies. Any captured IP
            addresses are anonymized.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Collection of Personal Data:</strong> Personal data (e.g.,
            name, email address) is collected only if you voluntarily provide it
            (e.g., via email inquiry). The data you provide will be used
            exclusively for processing your inquiry.
          </Typography>
          <Typography variant="body2" paragraph>
            By using our website, you agree to the data protection practices
            described here. If you do not agree with these practices, please
            refrain from using certain services offered on our website.
          </Typography>
        </section>

        {/* Disclaimer & Nutzungsbedingungen / Terms of Use */}
        <section style={{ marginTop: '1.5rem' }}>
          <Typography variant="h6">
            Disclaimer &amp; Nutzungsbedingungen / Terms of Use
          </Typography>

          {/* Deutsche Version */}
          <Typography variant="body2" paragraph>
            <strong>Deutsch:</strong>
            <br />
            <strong>Datenherkunft und -qualität:</strong> Die auf MapTheAir.com
            bereitgestellten Luftqualitätsdaten stammen primär von
            Drittanbietern (z. B. OpenAQ) und werden ohne Gewähr bereitgestellt.
            Eine Haftung für Richtigkeit, Vollständigkeit oder Aktualität dieser
            Daten wird ausdrücklich ausgeschlossen. Die Nutzung erfolgt auf
            eigene Gefahr.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Haftungsausschluss:</strong> Für Schäden, die aus der
            Nutzung oder der Unmöglichkeit der Nutzung dieser Website entstehen,
            übernehmen wir keine Haftung. Die Inhalte dienen ausschließlich der
            allgemeinen Information und stellen keine Beratung in medizinischen,
            gesundheitlichen oder sicherheitsrelevanten Fragen dar.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Nutzungsbedingungen:</strong> Der Missbrauch der Website ist
            untersagt. Insbesondere ist es Ihnen untersagt, rechtswidrige
            Inhalte zu verbreiten, in die Website einzudringen oder diese zu
            manipulieren. Wir behalten uns das Recht vor, Inhalte zu ändern, zu
            ergänzen oder einzelne Funktionen ohne Vorankündigung abzuschalten.
          </Typography>
          <Typography variant="body2">
            Diese Bestimmungen unterliegen dem Recht der Bundesrepublik
            Deutschland. Ausschließlicher Gerichtsstand für alle Streitigkeiten
            aus der Nutzung der Website ist Berlin.
          </Typography>

          <Box mt={2} />

          {/* Englische Version */}
          <Typography variant="body2" paragraph>
            <strong>English:</strong>
            <br />
            <strong>Data Origin and Quality:</strong> The air quality data
            provided on MapTheAir.com is primarily sourced from third parties
            (e.g., OpenAQ) and is provided "as is" without any guarantee. We
            expressly exclude any liability for the accuracy, completeness, or
            timeliness of this data. Use is at your own risk.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Disclaimer:</strong> We assume no liability for any damages
            resulting from the use or inability to use this website. The content
            is provided solely for informational purposes and does not
            constitute any form of professional advice in matters of health,
            safety, or similar areas.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Terms of Use:</strong> Misuse of the website is prohibited.
            In particular, you are not permitted to distribute illegal content,
            attempt to breach website security, or manipulate its content. We
            reserve the right to modify or discontinue features without prior
            notice.
          </Typography>
          <Typography variant="body2">
            These terms are governed by the law of the Federal Republic of
            Germany. The exclusive jurisdiction for all disputes arising from
            the use of the website is Berlin.
          </Typography>
        </section>

        <section style={{ marginTop: '1.5rem' }}>
          <Typography variant="h6">Kontakt / Contact</Typography>

          {/* Deutsche Version */}
          <Typography variant="body2" paragraph>
            <strong>Deutsch:</strong>
            <br />
            Bei Fragen oder Anliegen zu unseren rechtlichen Hinweisen oder der
            Datenschutzerklärung wenden Sie sich bitte an: <br />
            <strong>
              <a href="mailto:lukas.kreibig@posteo.de">
                lukas.kreibig@posteo.de
              </a>
            </strong>
          </Typography>

          {/* Englische Version */}
          <Typography variant="body2" paragraph>
            <strong>English:</strong>
            <br />
            For any questions or concerns regarding our legal notice or privacy
            policy, please contact: <br />
            <strong>
              <a href="mailto:lukas.kreibig@posteo.de">
                lukas.kreibig@posteo.de
              </a>
            </strong>
          </Typography>
        </section>

        <section style={{ marginTop: '1.5rem' }}>
          <Typography variant="h6">Impressum / Legal Notice</Typography>

          <Typography variant="body1" paragraph>
            <br />
            <strong>Betreiber:</strong> Lukas Kreibig
            <br />
            <strong>Adresse:</strong> Wipperstraße 6, 10179 Berlin, Deutschland
            <br />
            <strong>Kontakt:</strong>{' '}
            <a href="mailto:lukas.kreibig@posteo.de">lukas.kreibig@posteo.de</a>
          </Typography>
          <Typography variant="body2" paragraph>
            Angaben gemäß § 5 TMG (Telemediengesetz). Für Rückfragen oder
            weitere Informationen kontaktieren Sie uns bitte.
          </Typography>
          <Typography variant="body2" style={{ fontStyle: 'italic' }}>
            Last Updated / Letzte Aktualisierung: [15. Januar 2025]
          </Typography>
        </section>
      </Box>
    </Modal>
  );
}
