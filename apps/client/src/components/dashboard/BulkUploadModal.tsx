import { useState, useRef } from 'react';
import { UploadCloud, X, Check, AlertCircle } from 'lucide-react';
import type { CreateSubscriberPayload } from '../../types/subscribers.types';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subscribers: CreateSubscriberPayload[]) => Promise<any>;
}

export default function BulkUploadModal({ isOpen, onClose, onSubmit }: BulkUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const isCSV = file.name.endsWith('.csv');
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isCSV && !isExcel) {
      toast.error('Only CSV or Excel files are supported.');
      return;
    }

    const reader = new FileReader();

    if (isCSV) {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          const data = parseCSV(text);
          validateAndSetData(data);
        } catch (err) {
          toast.error('Failed to parse CSV file. Please verify format.');
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          validateAndSetData(jsonData);
        } catch (err) {
          toast.error('Failed to parse Excel file. Please verify format.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length <= 1) return [];
    
    // Header parsing
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    const results: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV cell extraction to handle commas in quotes
      const values: string[] = [];
      let currentVal = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

      if (values.length < headers.length) continue;
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      results.push(row);
    }
    return results;
  };

  const validateAndSetData = (data: any[]) => {
    const validated = data.map((item, index) => {
      const firstName = item.firstName || item.first_name || '';
      const lastName = item.lastName || item.last_name || '';
      const email = item.email || '';
      const phone = item.phone || item.phone_number || '';
      const address = item.address || '';
      const city = item.city || '';
      const state = item.state || '';
      
      let isValid = true;
      const errors: string[] = [];

      if (!firstName) {
        isValid = false;
        errors.push('Missing first name');
      }
      if (!lastName) {
        isValid = false;
        errors.push('Missing last name');
      }
      if (!email) {
        isValid = false;
        errors.push('Missing email');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        isValid = false;
        errors.push('Invalid email format');
      }
      if (!phone) {
        isValid = false;
        errors.push('Missing phone');
      }

      return {
        id: index,
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        isValid,
        errors,
      };
    });

    setParsedData(validated);
  };

  const handleUpload = async () => {
    const validRows = parsedData.filter(d => d.isValid);
    if (validRows.length === 0) {
      toast.error('No valid subscribers found to upload.');
      return;
    }

    setIsUploading(true);
    const payload: CreateSubscriberPayload[] = validRows.map(row => ({
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone,
      address: row.address || undefined,
      city: row.city || undefined,
      state: row.state || undefined,
      paymentMethod: 'card' as any, // default
    }));

    try {
      const res = await onSubmit(payload);
      if (res && res.successCount > 0) {
        toast.success(`Successfully uploaded ${res.successCount} subscribers.`);
        if (res.errors && res.errors.length > 0) {
          toast(`${res.errors.length} duplicates skipped.`, { icon: '⚠️' });
        }
        onClose();
      }
    } catch (err) {
      toast.error('Bulk upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadCSVTemplate = () => {
    const headers = 'firstName,lastName,email,phone,address,city,state\n';
    const sampleData = 'Kolawole,Emmanuel,kolade@example.com,+2348055139724,123 Billing Way,Lagos,Lagos State\n';
    const blob = new Blob([headers + sampleData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcelTemplate = () => {
    const headers = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state'];
    const sampleRow = ['Kolawole', 'Emmanuel', 'kolade@example.com', '+2348055139724', '123 Billing Way', 'Lagos', 'Lagos State'];
    const worksheetData = [headers, sampleRow];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Subscribers Template');
    
    XLSX.writeFile(workbook, 'subscribers_template.xlsx');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-slide-up" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 800, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Bulk Upload Subscribers</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Drag and Drop Zone */}
        {parsedData.length === 0 ? (
          <div>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: dragActive ? '2px dashed var(--link)' : '2px dashed var(--border-light)',
                background: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-secondary)',
                borderRadius: 12,
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                marginBottom: 20,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />
              <UploadCloud size={48} style={{ color: 'var(--text-secondary)', marginBottom: 12, opacity: 0.8 }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
                Drag and drop your CSV or Excel file here
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
                or click to browse from your computer
              </p>
              <span className="badge badge-neutral" style={{ fontSize: 11 }}>Supports .csv, .xlsx, .xls</span>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Expected Columns / Headers:</h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    type="button"
                    onClick={downloadCSVTemplate}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--link)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                  >
                    Download CSV Template
                  </button>
                  <button 
                    type="button"
                    onClick={downloadExcelTemplate}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--link)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                  >
                    Download Excel Template
                  </button>
                </div>
              </div>
              <code style={{ fontSize: 12, display: 'block', padding: 8, background: 'var(--bg-primary)', borderRadius: 4, border: '1px solid var(--border-light)', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                firstName, lastName, email, phone, address, city, state
              </code>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                * First name, last name, email, and phone number are required fields for every subscriber.
              </p>
            </div>
          </div>
        ) : (
          /* Preview Data Table */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                Previewing {parsedData.length} records ({parsedData.filter(d => d.isValid).length} valid)
              </span>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setParsedData([])}
                style={{ height: 'auto', minHeight: 'unset', padding: '4px 8px' }}
              >
                Clear File
              </button>
            </div>

            <div className="table-container" style={{ maxHeight: 350, overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 8, marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map(row => (
                    <tr key={row.id} style={{ background: row.isValid ? 'transparent' : 'rgba(239, 68, 68, 0.03)' }}>
                      <td style={{ fontSize: 13, color: row.firstName ? 'var(--text-primary)' : 'var(--error)' }}>
                        {row.firstName || '[Missing]'}
                      </td>
                      <td style={{ fontSize: 13, color: row.lastName ? 'var(--text-primary)' : 'var(--error)' }}>
                        {row.lastName || '[Missing]'}
                      </td>
                      <td style={{ fontSize: 13, color: row.email ? 'var(--text-primary)' : 'var(--error)' }}>
                        {row.email || '[Missing]'}
                      </td>
                      <td style={{ fontSize: 13, color: row.phone ? 'var(--text-primary)' : 'var(--error)' }}>
                        {row.phone || '[Missing]'}
                      </td>
                      <td>
                        {row.isValid ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                            <Check size={10} /> Valid
                          </span>
                        ) : (
                          <span 
                            className="badge badge-error" 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10 }}
                            title={row.errors.join(', ')}
                          >
                            <AlertCircle size={10} /> Invalid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={isUploading || parsedData.filter(d => d.isValid).length === 0}
              >
                {isUploading ? 'Uploading...' : `Upload ${parsedData.filter(d => d.isValid).length} Subscribers`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
