import React from 'react';

interface LegalLayoutProps {
  title: string;
  category: string;
  children: React.ReactNode;
}

function LegalLayout({ title, category, children }: LegalLayoutProps) {
  return (
    <div style={{ background: '#FFFFFF', padding: '80px 20px', minHeight: 'calc(100vh - 72px)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--nomba-teal)', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: 8 }}>
          {category}
        </span>
        <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--nomba-teal)', marginBottom: 28, letterSpacing: '-0.5px' }}>
          {title}
        </h1>
        <div style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" category="LEGAL & POLICIES">
      <p style={{ marginBottom: 16 }}>Welcome to Encore. By creating an account or subscribing to our billing services, you agree to comply with and be bound by the following terms and conditions.</p>
      
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--nomba-teal)', marginTop: 24, marginBottom: 10 }}>1. Account Registration & KYC Requirements</h3>
      <p style={{ marginBottom: 16 }}>To use Encore beyond the testing Sandbox mode, merchants must submit valid business registration documents (e.g. CAC filings), verified owner identification details, and accurate payout bank accounts to satisfy compliance checks.</p>
      
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--nomba-teal)', marginTop: 24, marginBottom: 10 }}>2. Permitted Merchant Activities</h3>
      <p style={{ marginBottom: 16 }}>Merchants may only use the subscription engine to process legitimate recurring transactions for authorized products and services. Fraudulent subscription creation or unauthorized financial schemes are strictly prohibited.</p>
      
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--nomba-teal)', marginTop: 24, marginBottom: 10 }}>3. Fees and Settlements</h3>
      <p style={{ marginBottom: 16 }}>Encore charges platform transaction fees as detailed in your billing dashboard settings. All settled collections are computed dynamically using our immutable ledger and requested payout transfers must match verified corporate bank account records.</p>
    </LegalLayout>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" category="DATA PROTECTIONS">
      <p style={{ marginBottom: 16 }}>Encore is committed to securing customer data and processing billing mandate info transparently. This policy details how we handle merchant details and subscriber transactions data.</p>
      
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--nomba-teal)', marginTop: 24, marginBottom: 10 }}>1. Information We Collect</h3>
      <p style={{ marginBottom: 16 }}>We collect registered email credentials, KYC verification files, banking mandate reference IDs, and transaction metadata. We do not store raw card numbers; card vaulting is tokenized directly at the gateway processor level.</p>
      
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--nomba-teal)', marginTop: 24, marginBottom: 10 }}>2. Regulatory Compliance</h3>
      <p style={{ marginBottom: 16 }}>Encore adheres strictly to the Nigeria Data Protection Regulation (NDPR) and general data safety directives. Subscribers retain absolute rights to update billing cards, review invoice histories, or request account deletions via self-service portals.</p>
      
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--nomba-teal)', marginTop: 24, marginBottom: 10 }}>3. Webhooks & Data Sharing</h3>
      <p style={{ marginBottom: 16 }}>Billing event webhooks are transmitted securely containing only token identifiers. Data is only shared with verified processing institutions (Nomba, Paystack) to settle authorized payments.</p>
    </LegalLayout>
  );
}

export function SecurityPage() {
  return (
    <LegalLayout title="Security & Compliance" category="TRUST ARCHITECTURE">
      <p style={{ marginBottom: 16 }}>Security is built directly into Encore's core ledger infrastructure. We maintain institutional grade practices to guarantee safe payout processing and fraud detection.</p>
      
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--nomba-teal)', marginTop: 24, marginBottom: 10 }}>1. Double-Entry Accounting Reconciliations</h3>
      <p style={{ marginBottom: 16 }}>Every payment, debit, or payout credit is recorded in an immutable ledger database. Balanced auditing logs ensure that balances can never be manually generated or altered outside authenticated gateway events.</p>
      
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--nomba-teal)', marginTop: 24, marginBottom: 10 }}>2. Tokenization & Encryption Standards</h3>
      <p style={{ marginBottom: 16 }}>All network requests use secure SSL/TLS protocols. Client credentials, webhook sign-keys, and integration API keys are hashed and vaulted using strong AES-256 standards.</p>
      
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--nomba-teal)', marginTop: 24, marginBottom: 10 }}>3. Anti-Money Laundering (AML) Compliance</h3>
      <p style={{ marginBottom: 16 }}>To satisfy regulatory safety requirements, payout requests are routed through verified bank API matching rules to verify that beneficiary accounts match corporate owner structures.</p>
    </LegalLayout>
  );
}
