export default function AboutPage() {
  return (
    <div style={{ background: '#FFFFFF', padding: '80px 20px', minHeight: 'calc(100vh - 72px)' }}>
      {/* Scope styles */}
      <style>{`
        .about-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .about-title {
          font-size: 40px;
          font-weight: 800;
          color: var(--nomba-teal);
          line-height: 1.15;
          margin-bottom: 24px;
          letter-spacing: -1px;
        }
        .about-section {
          margin-top: 48px;
        }
        .about-section h2 {
          font-size: 22px;
          font-weight: 700;
          color: var(--nomba-teal);
          margin-bottom: 16px;
        }
        .about-p {
          font-size: 15.5px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }
        .about-quote {
          border-left: 4px solid var(--nomba-lime);
          background: var(--bg-secondary);
          padding: 24px;
          border-radius: 0 12px 12px 0;
          margin: 32px 0;
          font-size: 16px;
          font-style: italic;
          color: var(--nomba-teal);
          line-height: 1.6;
        }
      `}</style>

      <div className="about-container">
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--nomba-teal)', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: 8 }}>
          OUR MISSION & STORY
        </span>
        <h1 className="about-title">Building the Billing Middleware for Africa's Digital GDP.</h1>
        
        <p className="about-p">
          Encore was founded to bridge the gap between subscription-based commerce and the realities of payment collections in Africa. While the global recurring economy runs primarily on credit cards and structured billing systems, local networks require support for cards, mobile money, and automated virtual bank transfers.
        </p>

        <div className="about-quote">
          "We believe subscription billing shouldn't be a complex technical headache. Encore exists to automate plan iterations, prevent involuntary churn, and let teams focus entirely on building their products."
        </div>

        <div className="about-section">
          <h2>Our Story</h2>
          <p className="about-p">
            African digital merchants are scaling rapidly. Yet, card failure rates and lack of native support for mobile wallets make billing operations highly fragile. Encore acts as the intelligent orchestration middleware, connecting platforms like Nomba and Paystack directly to automated dunning logic and double-entry accounting files.
          </p>
        </div>

        <div className="about-section">
          <h2>Our Vision</h2>
          <p className="about-p">
            We envision an economy where any African merchant — from local utility services to SaaS start-ups — can easily create recurring income models with robust deposit protections and compliant payout matching systems. By building a reliable, secure ledger infrastructure, Encore helps companies secure their cashflows and scale their customer relationships.
          </p>
        </div>
      </div>
    </div>
  );
}
