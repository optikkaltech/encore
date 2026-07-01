import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export default function BillingGlossary() {
  const [isOpen, setIsOpen] = useState(false);

  const terms = [
    {
      title: 'Trial Period (days)',
      description: 'The introductory period during which a subscriber accesses your service for free. Encore schedules the first automatic charge to execute exactly when the trial period expires.',
      howItWorks: 'If you set a 7-day trial, the subscriber is created but not billed immediately. Their card/mandate is validated, and their first actual payment is scheduled for day 8.',
    },
    {
      title: 'Setup Fee (NGN)',
      description: 'An additional, one-time charge collected during the subscriber\'s initial sign-up cycle. Useful for registration, hardware provisioning, or onboarding tasks.',
      howItWorks: 'If a plan costs ₦5,000/month with a ₦2,000 setup fee, the first billing pulls ₦7,000. All subsequent monthly renewals will be exactly ₦5,000.',
    },
    {
      title: 'Prorate Plan Changes',
      description: 'Proration auto-calculates proportional amounts when a customer upgrades or downgrades their plan mid-cycle. This ensures they only pay for the exact duration they use each tier.',
      howItWorks: 'If a subscriber moves from a ₦10,000 plan to a ₦20,000 plan halfway through their month, they are only charged the ₦5,000 difference for the remaining 15 days.',
    },
    {
      title: 'Usage-Based Billing',
      description: 'Also known as metered billing, this model dynamically calculates the renewal amount based on the subscriber\'s resource consumption rather than a fixed rate.',
      howItWorks: 'You track metrics (e.g. API calls, credits used). At the end of the billing cycle, the system multiplies the consumed units by your Unit Rate and debits the final sum.',
    },
    {
      title: 'Dedicated Virtual Accounts',
      description: 'A permanent, unique bank account number issued through Nomba assigned to each subscriber. Transfers to this account are auto-matched, removing manual reconciliation.',
      howItWorks: 'When a subscriber transfers money to their dedicated virtual account, Encore instantly detects the credit webhook, tags the payment to their ledger, and renews their plan.',
    },
    {
      title: 'Automatic Pull Mandate',
      description: 'A tokenized card token or NIBSS bank mandate. Once authorized on onboarding, it gives Encore permission to automatically pull renewal charges from the subscriber.',
      howItWorks: 'When billing is due, the scheduler calls the Nomba API with the token/mandate reference. The subscriber is charged immediately without needing to manually click pay.',
    },
  ];

  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-light)',
      borderRadius: 12,
      padding: '16px 20px',
      marginTop: 'var(--space-xl)',
    }} className="shadow-premium">
      <div 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HelpCircle size={18} className="text-secondary" />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Subscription Billing Terminology & Lifecycle Guide
          </h3>
        </div>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <div style={{ 
          marginTop: 16, 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: 16,
          animation: 'fadeIn 200ms ease-out'
        }}>
          {terms.map((term, index) => (
            <div key={index} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={14} className="text-success" />
                <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  {term.title}
                </h4>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: '16px', margin: 0 }}>
                {term.description}
              </p>
              <div style={{ 
                marginTop: 4, 
                padding: '6px 8px', 
                background: 'var(--bg-primary)', 
                borderRadius: 4, 
                fontSize: 11, 
                color: 'var(--text-muted)',
                lineHeight: '14px' 
              }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>How it works: </span>
                {term.howItWorks}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
