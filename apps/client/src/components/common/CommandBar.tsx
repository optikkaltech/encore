import { useState, useEffect, useRef } from 'react';
import { Sparkles, Terminal, X, CornerDownLeft, Loader2, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import client from '../../api/client';
import toast from 'react-hot-toast';

export default function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Execution result states
  const [result, setResult] = useState<{
    success: boolean;
    intent: string;
    message: string;
    data?: any;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle command bar with Cmd/Ctrl + K or custom event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setResult(null);
        setQuery('');
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
      setResult(null);
      setQuery('');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-bar', handleCustomOpen);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-bar', handleCustomOpen);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

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

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const resetBar = () => {
    setQuery('');
    setResult(null);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '12vh',
      background: 'rgba(5, 8, 16, 0.7)',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 200ms ease-out',
    }}>
      {/* Click outside backdrop */}
      <div 
        onClick={() => setIsOpen(false)}
        style={{ position: 'absolute', inset: 0, zIndex: -1 }} 
      />

      <div style={{
        width: '100%',
        maxWidth: 640,
        background: 'rgba(17, 24, 39, 0.9)',
        borderRadius: 16,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        animation: 'scaleUp 250ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Search Input Box */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <Sparkles size={20} style={{ color: isLoading ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.4)', marginRight: 12, flexShrink: 0, animation: isLoading ? 'pulse 1s infinite alternate' : 'none' }} />
          <input
            ref={inputRef}
            type="text"
            id="ai-command-input"
            placeholder="Oooh, i need to create a plan for my users for monthly..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#F3F4F6',
              fontSize: 16,
              outline: 'none',
            }}
          />
          {query && !isLoading && (
            <button 
              type="button" 
              onClick={resetBar}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', padding: 4, marginRight: 8 }}
            >
              <X size={16} />
            </button>
          )}
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255, 255, 255, 0.4)', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: 4 }}>
              <span>Enter</span>
              <CornerDownLeft size={10} />
            </div>
          )}
        </form>

        {/* Suggestion / Tips View */}
        {!result && !isLoading && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', marginBottom: 12 }}>
              <Terminal size={12} />
              <span>Instant AI Suggestions</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div 
                onClick={() => handleSuggestionClick("Create a monthly plan for ₦5,000 called standard-membership")}
                className="suggestion-item"
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid transparent',
                  transition: 'all 150ms ease',
                }}
              >
                💡 Create a monthly plan for ₦5,000 called standard-membership
              </div>

              <div 
                onClick={() => handleSuggestionClick("Bill john@example.com ₦15,000 for one-time server consulting")}
                className="suggestion-item"
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid transparent',
                  transition: 'all 150ms ease',
                }}
              >
                💡 Bill john@example.com ₦15,000 for one-time server consulting
              </div>

              <div 
                onClick={() => handleSuggestionClick("Subscribe john@example.com to plan standard-membership")}
                className="suggestion-item"
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid transparent',
                  transition: 'all 150ms ease',
                }}
              >
                💡 Subscribe john@example.com to plan standard-membership
              </div>
            </div>
          </div>
        )}

        {/* Loading State Effect */}
        {isLoading && (
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-primary)', animation: 'spin 1.5s linear infinite' }} />
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)' }}>AI engine is translating command into system actions...</p>
          </div>
        )}

        {/* Execution Result Display */}
        {result && (
          <div style={{ padding: '24px 20px', animation: 'fadeIn 300ms ease-out' }}>
            {result.success ? (
              <div style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                gap: 12,
              }}>
                <CheckCircle2 size={24} style={{ color: '#10B981', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#F3F4F6', marginBottom: 4 }}>
                    Action Executed Successfully
                  </h4>
                  <p style={{ fontSize: 13, color: '#A3A3A3', lineHeight: '20px' }}>
                    {result.message}
                  </p>
                  
                  {/* Entity detail pill */}
                  {result.data && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      marginTop: 12,
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: 'rgba(255, 255, 255, 0.6)',
                    }}>
                      {result.data.id && <div>ID: {result.data.id}</div>}
                      {result.data.code && <div>Code: {result.data.code}</div>}
                      {result.data.invoiceNumber && <div>Invoice: {result.data.invoiceNumber}</div>}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      onClick={resetBar}
                      id="ai-command-another-btn"
                      style={{
                        padding: '6px 12px',
                        background: '#10B981',
                        border: 'none',
                        borderRadius: 6,
                        color: '#FFF',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Enter Another Command
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 6,
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Close Command Center
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                gap: 12,
              }}>
                <AlertTriangle size={24} style={{ color: '#EF4444', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#F3F4F6', marginBottom: 4 }}>
                    Command Execution Blocked
                  </h4>
                  <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 500, marginBottom: 6 }}>
                    {result.intent === 'UNSUPPORTED' ? 'Unsupported Billing Model' : 'Validation Error'}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', lineHeight: '18px' }}>
                    {result.message}
                  </p>
                  
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      onClick={resetBar}
                      id="ai-command-retry-btn"
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 6,
                        color: '#FFF',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Revise Command
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Command Center Footer Tips */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '10px 20px',
          fontSize: 11,
          color: 'rgba(255, 255, 255, 0.4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <HelpCircle size={10} />
            <span>Esc to close. Commands execute instantly against database.</span>
          </span>
          <span>HuggingFace NLP Parser</span>
        </div>
      </div>

      <style>{`
        .suggestion-item:hover {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #FFF !important;
          transform: translateX(4px);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
