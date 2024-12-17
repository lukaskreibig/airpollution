import React from 'react';
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
          <Typography variant="h5">Legal Notice & Privacy</Typography>
          <IconButton onClick={onClose}>
            <CloseOutlined />
          </IconButton>
        </Box>

        {/* Impressum / Legal Notice (German requirement) */}
        <section style={{ marginTop: '1rem' }}>
          <Typography variant="h6">Impressum / Legal Notice</Typography>
          <Typography variant="body1" paragraph>
            <strong>Operator:</strong> Lukas Kreibig<br />
            <strong>Address:</strong> Wipperstrasse 6, Berlin, Germany<br />
            <strong>Contact:</strong> lukas.kreibig@posteo.de
          </Typography>
          <Typography variant="body2" paragraph>
            According to §5 TMG (Telemediengesetz), operators of commercial websites in Germany
            must provide an Impressum (Legal Notice). This legal disclosure contains personal or
            company details. If you’re hosting the site in Berlin (Germany) for a public/commercial
            purpose, you are required to display this information.
          </Typography>
        </section>

        {/* Privacy Policy */}
        <section style={{ marginTop: '1.5rem' }}>
          <Typography variant="h6">Privacy Policy</Typography>
          <Typography variant="body2" paragraph>
            Welcome to <strong>MapTheAir.com</strong>. We respect your privacy and commit to
            protecting it through this policy. We use <strong>Vercel Analytics</strong> for
            aggregated, anonymized traffic analysis. Vercel Analytics does not store cookies or
            other personal data in your browser. However, IP addresses may be anonymized and
            collected for the purpose of generating analytics.
          </Typography>
          <Typography variant="body2" paragraph>
            We do not collect personally identifiable information (PII) unless you voluntarily
            provide it, for instance via email inquiries. Any PII you submit is used solely for
            the purpose stated at the time of collection.
          </Typography>
          <Typography variant="body2" paragraph>
            By using our website, you consent to the data practices described in this policy.
            If you do not agree, please do not use our services. For more details on how Vercel
            handles data, see their{' '}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>.
          </Typography>
        </section>

        {/* Disclaimer & Terms of Use */}
        <section style={{ marginTop: '1.5rem' }}>
          <Typography variant="h6">Disclaimer & Terms of Use</Typography>
          <Typography variant="body2" paragraph>
            <strong>Data Accuracy:</strong> All air quality data is provided “as is” from 
            third-party sources (e.g., OpenAQ). We make no guarantee of its accuracy or timeliness. 
            You acknowledge that any reliance on this data is at your own risk.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Liability:</strong> We are not liable for damages arising from the use or
            inability to use our website or the information provided. The information on
            MapTheAir.com is for general informational purposes only and should not be relied upon
            for medical, health, or safety decisions without consulting relevant professionals.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Usage Restrictions:</strong> You agree not to misuse the website. This includes
            refraining from unlawful activities, attempting to break the site, or spamming the service.
            We reserve the right to modify or discontinue any feature at any time.
          </Typography>
          <Typography variant="body2" paragraph>
            These Terms and this Disclaimer are governed by the laws of Germany. Any disputes
            arising shall be settled in the courts of Berlin, Germany.
          </Typography>
        </section>

        {/* Contact */}
        <section style={{ marginTop: '1.5rem' }}>
          <Typography variant="h6">Contact</Typography>
          <Typography variant="body2" paragraph>
            If you have any questions or concerns about this legal notice or our Privacy Policy,
            please contact: <strong>lukas.kreibig@posteo.de</strong>
          </Typography>
          <Typography variant="body2" style={{ fontStyle: 'italic' }}>
            Last Updated: [December 17, 2024]
          </Typography>
        </section>
      </Box>
    </Modal>
  );
}
