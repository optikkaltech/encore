// ====================================================================
// Encore - Dashboard Overview Page
// ====================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD, ROUTES } from '../../constants/app.constants';
import {
  CreditCard, Users, AlertTriangle,
  Upload, Search, Sparkles, Sliders, Send,
  Loader2, CheckCircle2
} from 'lucide-react';
import client from '../../api/client';
import toast from 'react-hot-toast';

const QUICK_ACTION_ICONS = [Sparkles, CreditCard, Users, Upload, Search, Sliders];

export default function OverviewPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    intent: string;
    message: string;
    data?: any;
    fallbackUsed?: boolean;
  } | null>(null);

  const reset = () => {
    setQuery('');
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const { data } = await client.post('/ai/command', { query });
      setResult(data);
      if (data.success) {
        toast.success('AI Command executed successfully!');
      } else {
        toast.error('Could not execute command.');
      }
    } catch (err: any) {
      setResult({
        success: false,
        intent: 'ERROR',
        message: err.response?.data?.message || err.message || 'An error occurred while running the AI command.',
      });
      toast.error('AI command execution failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - var(--topbar-height) - var(--space-xl))',
      animation: 'fadeIn 300ms ease-out',
      padding: 'var(--space-md)',
    }}>
      <h1 style={{
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-xl)',
        textAlign: 'center',
      }}>
        What are you working on?
      </h1>

      <div style={{ width: '100%', maxWidth: 700 }}>
        {/* Chat Input Container */}
        <form
          onSubmit={handleSubmit}
          className="shadow-premium"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-light)',
            borderRadius: 32,
            padding: '12px 16px 12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <input
            id="overview-ai-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder="Ask AI to create plans, invoice users, or search..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 16,
              color: 'var(--text-primary)',
              background: 'transparent',
              padding: '8px 0',
            }}
          />

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: (isLoading || !query.trim()) ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
              color: (isLoading || !query.trim()) ? 'var(--text-muted)' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: (isLoading || !query.trim()) ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              transition: 'all 200ms ease',
            }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>

        {/* Execution Result Area */}
        {result && (
          <div style={{ marginTop: 'var(--space-md)', animation: 'slideUp 300ms ease-out' }}>
            <div style={{
              background: result.success ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
              border: `1px solid ${result.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              gap: 12,
            }}>
              {result.success ? (
                <CheckCircle2 size={24} style={{ color: '#10B981', flexShrink: 0 }} />
              ) : (
                <AlertTriangle size={24} style={{ color: '#EF4444', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {result.success ? 'Action Executed Successfully' : 'Command Execution Blocked'}
                  {result.fallbackUsed && (
                    <span style={{ fontSize: 11, background: 'var(--bg-tertiary)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>
                      Offline Mode / Local Fallback
                    </span>
                  )}
                </h4>
                <p style={{ fontSize: 13, color: result.success ? 'var(--text-secondary)' : '#EF4444', lineHeight: '20px' }}>
                  {result.message}
                </p>
                {result.data && (
                  <div style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginTop: 12,
                    border: '1px solid var(--border-light)',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: 'var(--text-secondary)',
                  }}>
                    {result.data.id && <div>ID: {result.data.id}</div>}
                    {result.data.code && <div>Code: {result.data.code}</div>}
                    {result.data.invoiceNumber && <div>Invoice: {result.data.invoiceNumber}</div>}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button
                    onClick={reset}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 6,
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Clear & Start New
                  </button>

                  {result.success && result.intent === 'CREATE_PLAN' && (
                    <button
                      onClick={() => navigate(ROUTES.DASHBOARD.PLANS)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--accent-primary)',
                        border: 'none',
                        borderRadius: 6,
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      View Plans
                    </button>
                  )}
                  {result.success && result.intent === 'SUBSCRIBE_CUSTOMER' && (
                    <button
                      onClick={() => navigate(ROUTES.DASHBOARD.SUBSCRIBERS)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--accent-primary)',
                        border: 'none',
                        borderRadius: 6,
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      View Subscribers
                    </button>
                  )}
                  {result.success && result.intent === 'CREATE_INVOICE' && (
                    <button
                      onClick={() => navigate(ROUTES.DASHBOARD.TRANSACTIONS)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--accent-primary)',
                        border: 'none',
                        borderRadius: 6,
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      View Transactions
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Suggestion Pills */}
        {!result && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)',
            justifyContent: 'center',
            marginTop: 'var(--space-lg)',
          }}>
            {DASHBOARD.QUICK_ACTIONS.slice(0, 4).map((action, index) => {
              const Icon = QUICK_ACTION_ICONS[index] || Sparkles;
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (index === 0) document.getElementById('overview-ai-input')?.focus();
                    else if (index === 1) navigate(ROUTES.DASHBOARD.PLANS);
                    else if (index === 2) navigate(ROUTES.DASHBOARD.SUBSCRIBERS);
                    else if (index === 3) navigate(ROUTES.DASHBOARD.TRANSACTIONS);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 20,
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--text-muted)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <Icon size={14} />
                  {action.title}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
