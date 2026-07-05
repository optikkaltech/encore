import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('support');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      toast.success("Thank you for reaching out! We'll get back to you shortly.");
      setName('');
      setEmail('');
      setMessage('');
      setSending(false);
    }, 1200);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--border-light)',
    background: '#FFFFFF',
    color: 'var(--text-primary)',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <div style={{ background: '#FFFFFF', padding: '80px 20px', minHeight: 'calc(100vh - 72px)' }}>
      {/* Scope styles */}
      <style>{`
        .contact-container {
          max-width: 500px;
          margin: 0 auto;
          background: #FFFFFF;
          border: 1px solid var(--border-light);
          padding: 40px;
          border-radius: 16px;
          box-shadow: var(--shadow-md);
        }
        .contact-input:focus {
          border-color: var(--nomba-teal) !important;
          box-shadow: 0 0 0 3px var(--nomba-lime-glow);
        }
      `}</style>

      <div className="contact-container">
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--nomba-teal)', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: 8, textAlign: 'center' }}>
          GET IN TOUCH
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--nomba-teal)', marginBottom: 24, textAlign: 'center', letterSpacing: '-0.5px' }}>
          Contact our team
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Full Name</label>
            <input 
              type="text" 
              className="contact-input"
              style={inputStyle} 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Your name" 
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Email address</label>
            <input 
              type="email" 
              className="contact-input"
              style={inputStyle} 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="you@company.com" 
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Inquiry Subject</label>
            <select 
              className="contact-input"
              style={inputStyle} 
              value={subject} 
              onChange={e => setSubject(e.target.value)}
            >
              <option value="support">General Customer Support</option>
              <option value="sales">Sales Consultation</option>
              <option value="integration">Technical Integration Query</option>
              <option value="partner">Partnership Opportunities</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Message</label>
            <textarea 
              className="contact-input"
              style={{ ...inputStyle, height: '120px', resize: 'vertical' }} 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              placeholder="Explain how we can help you..." 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={sending} 
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: 8 }}
          >
            {sending ? 'Sending Message...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
