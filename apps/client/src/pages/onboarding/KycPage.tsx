import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import client, { getErrorMessage } from '../../api/client';
import { ONBOARDING, ROUTES, API_ENDPOINTS } from '../../constants/app.constants';
import type { ApiResponse } from '../../types/api.types';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadState {
  file: File | null;
  url: string;
  isUploading: boolean;
  error: string;
}

export default function KycPage() {
  const navigate = useNavigate();
  const { submitKyc } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regStatus, setRegStatus] = useState<'registered' | 'unregistered'>('registered');

  // Form Fields
  const [regNumber, setRegNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('NG');

  // File Upload States
  const [cacState, setCacState] = useState<UploadState>({ file: null, url: '', isUploading: false, error: '' });
  const [taxDocState, setTaxDocState] = useState<UploadState>({ file: null, url: '', isUploading: false, error: '' });
  const [bankState, setBankState] = useState<UploadState>({ file: null, url: '', isUploading: false, error: '' });

  const handleFileUpload = async (
    file: File,
    endpoint: string,
    stateSetter: React.Dispatch<React.SetStateAction<UploadState>>
  ) => {
    stateSetter((prev) => ({ ...prev, file, isUploading: true, error: '' }));
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await client.post<ApiResponse<{ url: string }>>(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      stateSetter((prev) => ({ ...prev, isUploading: false, url: data.data.url }));
      toast.success(`${file.name} uploaded successfully`);
    } catch (err) {
      const errMsg = getErrorMessage(err);
      stateSetter((prev) => ({ ...prev, isUploading: false, error: errMsg }));
      toast.error(`Failed to upload ${file.name}: ${errMsg}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || !city || !state || !country) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (regStatus === 'registered') {
      if (!regNumber) {
        toast.error('Business Registration Number is required');
        return;
      }
      if (!cacState.url) {
        toast.error('CAC Certificate is required. Please upload the file.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await submitKyc({
        registrationNumber: regStatus === 'registered' ? regNumber : undefined,
        taxId: regStatus === 'registered' && taxId ? taxId : undefined,
        address,
        city,
        state,
        country,
        cacCertificateUrl: regStatus === 'registered' ? cacState.url : undefined,
        taxClearanceUrl: regStatus === 'registered' && taxDocState.url ? taxDocState.url : undefined,
        bankStatementUrl: bankState.url || undefined,
      });

      toast.success(ONBOARDING.KYC.SUCCESS);
      navigate(ROUTES.ONBOARDING.PAYMENT_SETUP);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-xl) var(--space-md)',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 700,
        animation: 'slideUp 300ms ease-out',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            {ONBOARDING.KYC.TITLE}
          </h1>
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-secondary)' }}>
            {ONBOARDING.KYC.SUBTITLE}
          </p>
        </div>

        {/* KYC Form Card */}
        <div className="card" style={{ background: 'var(--bg-primary)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            
            {/* Registration Status Selector */}
            <div className="input-group">
              <label className="input-label">Business Registration Status</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-md)',
              }}>
                <div
                  onClick={() => setRegStatus('registered')}
                  style={{
                    border: regStatus === 'registered' ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                    borderRadius: 8,
                    padding: '10px var(--space-md)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    background: regStatus === 'registered' ? 'var(--bg-secondary)' : 'transparent',
                    fontSize: 13,
                    fontWeight: 600,
                    color: regStatus === 'registered' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 150ms ease',
                  }}
                >
                  Registered (RC / BN)
                </div>
                <div
                  onClick={() => setRegStatus('unregistered')}
                  style={{
                    border: regStatus === 'unregistered' ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                    borderRadius: 8,
                    padding: '10px var(--space-md)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    background: regStatus === 'unregistered' ? 'var(--bg-secondary)' : 'transparent',
                    fontSize: 13,
                    fontWeight: 600,
                    color: regStatus === 'unregistered' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 150ms ease',
                  }}
                >
                  Unregistered / Starter
                </div>
              </div>
            </div>

            {/* Form Fields */}
            {regStatus === 'registered' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-md)', animation: 'fadeIn 200ms ease-out' }}>
                <div className="input-group">
                  <label className="input-label">{ONBOARDING.KYC.REGISTRATION_NUMBER} *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. RC123456 or BN123456"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">{ONBOARDING.KYC.TAX_ID}</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 12345678-0001 (Optional)"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">{ONBOARDING.KYC.ADDRESS} *</label>
              <textarea
                className="input"
                style={{ resize: 'vertical', minHeight: 80 }}
                placeholder="Street address, building number..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
              <div className="input-group">
                <label className="input-label">{ONBOARDING.KYC.CITY} *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">{ONBOARDING.KYC.STATE} *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">{ONBOARDING.KYC.COUNTRY} *</label>
                <select
                  className="input"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                >
                  <option value="NG">Nigeria</option>
                  <option value="GH">Ghana</option>
                  <option value="KE">Kenya</option>
                  <option value="ZA">South Africa</option>
                </select>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border-light)', margin: 'var(--space-xs) 0' }} />

            {/* Document Uploads */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                {regStatus === 'registered' ? 'Required Documents' : 'Supporting Documents (Optional)'}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {/* CAC File Upload */}
                {regStatus === 'registered' && (
                  <FileUploader
                    label={`${ONBOARDING.KYC.CAC_CERT} *`}
                    helpText={ONBOARDING.KYC.CAC_CERT_HELP}
                    state={cacState}
                    onFileSelect={(file) => handleFileUpload(file, API_ENDPOINTS.UPLOADS.KYC_CAC, setCacState)}
                  />
                )}

                {/* Tax Clearance Upload */}
                {regStatus === 'registered' && (
                  <FileUploader
                    label={ONBOARDING.KYC.TAX_CLEARANCE}
                    helpText="Optional: Upload your recent tax clearance certificate"
                    state={taxDocState}
                    onFileSelect={(file) => handleFileUpload(file, API_ENDPOINTS.UPLOADS.KYC_TAX, setTaxDocState)}
                  />
                )}

                {/* Bank Statement Upload */}
                <FileUploader
                  label={ONBOARDING.KYC.BANK_STATEMENT}
                  helpText="Optional: Upload your company bank statement"
                  state={bankState}
                  onFileSelect={(file) => handleFileUpload(file, API_ENDPOINTS.UPLOADS.KYC_BANK, setBankState)}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg mt-md"
              disabled={isSubmitting || cacState.isUploading || taxDocState.isUploading || bankState.isUploading}
            >
              {isSubmitting ? (
                <><span className="spinner spinner-sm" /> Submitting...</>
              ) : (
                ONBOARDING.KYC.SUBMIT
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

interface FileUploaderProps {
  label: string;
  helpText: string;
  state: UploadState;
  onFileSelect: (file: File) => void;
}

function FileUploader({ label, helpText, state, onFileSelect }: FileUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div style={{
      border: '1px solid var(--border-light)',
      borderRadius: 8,
      padding: 'var(--space-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'between',
      gap: 'var(--space-md)',
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{helpText}</p>
        
        {state.file && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            {state.url ? (
              <CheckCircle2 size={14} className="text-success" />
            ) : state.error ? (
              <AlertCircle size={14} className="text-error" />
            ) : (
              <span className="spinner spinner-sm" />
            )}
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 220 }}>
              {state.file.name}
            </span>
          </div>
        )}
      </div>

      <div>
        <label className={`btn btn-secondary btn-sm ${state.isUploading ? 'disabled' : ''}`} style={{ cursor: 'pointer' }}>
          <Upload size={14} />
          {state.url ? 'Change File' : 'Choose File'}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={state.isUploading}
          />
        </label>
      </div>
    </div>
  );
}
