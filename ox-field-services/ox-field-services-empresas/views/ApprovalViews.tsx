import React, { useState, useEffect, useRef } from 'react';
import { AppView } from '../types';
import { ArrowLeft, Check, X, Eye, FileText, AlertTriangle, ChevronRight, ShieldCheck, Download, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { empresaService, Technician, TechnicianDocument } from '../services/empresa';
import client from '../services/client';

interface Props {
  setView: (view: AppView) => void;
}

// Fallback mock data
const mockTechs: Technician[] = [
  { id: '1', userId: 'u1', name: 'David Miller', email: 'david@example.com', phone: '555-1234', role: 'Electrician', status: 'PENDING', skills: ['HVAC', 'Wiring'], rating: 4.5, isOnline: false, avatarUrl: 'https://picsum.photos/seed/david/60/60', createdAt: '2023-10-24' },
  { id: '2', userId: 'u2', name: 'Elena Rodriguez', email: 'elena@example.com', phone: '555-5678', role: 'Plumber', status: 'PENDING', skills: ['Pipefitting'], rating: 4.8, isOnline: true, avatarUrl: 'https://picsum.photos/seed/elena/60/60', createdAt: '2023-10-23' },
  { id: '3', userId: 'u3', name: 'Sam Bridges', email: 'sam@bridges.com', phone: '555-9999', role: 'Courier', status: 'REJECTED', skills: ['Driving'], rating: 3.2, isOnline: false, avatarUrl: 'https://picsum.photos/seed/sam/60/60', createdAt: '2023-10-20' },
];

// INBOX VIEW
export const ApprovalInbox: React.FC<Props> = ({ setView }) => {
  const [technicians, setTechnicians] = useState<Technician[]>(mockTechs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await empresaService.getTechnicians();
        if (data && data.length > 0) {
          setTechnicians(data);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch technicians:', err);
        setError('Using cached data - API unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const pendingCount = technicians.filter(t => t.status === 'PENDING').length;
  const urgentCount = Math.min(pendingCount, 4); // Mock urgent count

  const handleTechClick = (tech: Technician) => {
    if (tech.status === 'PENDING') {
      setSelectedTechId(tech.id);
      setView(AppView.APPROVALS_VERIFICATION);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { text: 'Needs Review', color: 'bg-amber-500/10 text-amber-500' };
      case 'APPROVED':
        return { text: 'Approved', color: 'bg-green-500/10 text-green-500' };
      case 'REJECTED':
        return { text: 'Rejected', color: 'bg-red-500/10 text-red-500' };
      case 'SUSPENDED':
        return { text: 'Suspended', color: 'bg-gray-500/10 text-gray-500' };
      default:
        return { text: status, color: 'bg-gray-500/10 text-gray-500' };
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Technician Approvals</h1>
          <p className="text-secondary">Review pending applications and document verifications.</p>
        </div>
        <div className="flex gap-3 items-center">
          {loading && <Loader2 className="animate-spin text-primary" size={24} />}
          <div className="bg-surface px-4 py-2 rounded-lg border border-white/10 flex flex-col items-center">
             <span className="text-2xl font-bold text-white">{pendingCount}</span>
             <span className="text-xs text-secondary uppercase">Pending</span>
          </div>
          <div className="bg-surface px-4 py-2 rounded-lg border border-white/10 flex flex-col items-center">
             <span className="text-2xl font-bold text-primary">{urgentCount}</span>
             <span className="text-xs text-secondary uppercase">Urgent</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-400 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-surface border border-white/10 rounded-xl overflow-hidden shadow-lg">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-[#0f2a30] text-xs font-bold text-secondary uppercase tracking-wider">
          <div className="col-span-4">Technician</div>
          <div className="col-span-3">Role & Skills</div>
          <div className="col-span-3">Date Applied</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {technicians.map((tech) => {
          const status = getStatusDisplay(tech.status);
          return (
            <div 
              key={tech.id}
              onClick={() => handleTechClick(tech)}
              className={`
                grid grid-cols-12 gap-4 p-4 border-b border-white/5 items-center cursor-pointer transition-colors
                ${tech.status === 'PENDING' ? 'hover:bg-white/5' : 'opacity-60'}
              `}
            >
              <div className="col-span-4 flex items-center gap-4">
                <img src={tech.avatarUrl || `https://picsum.photos/seed/${tech.id}/60/60`} className="w-10 h-10 rounded-full border border-white/10" />
                <div>
                  <div className="font-bold text-white">{tech.name}</div>
                  <div className="text-xs text-secondary">{tech.email}</div>
                </div>
              </div>
              <div className="col-span-3">
                 <div className="text-white text-sm">{tech.role}</div>
                 <div className="flex gap-1 mt-1 flex-wrap">
                   {tech.skills.map(s => <span key={s} className="text-[10px] bg-white/10 px-1.5 rounded text-secondary">{s}</span>)}
                 </div>
              </div>
              <div className="col-span-3 text-secondary text-sm">{formatDate(tech.createdAt)}</div>
              <div className="col-span-2 flex justify-end">
                <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${status.color}`}>
                  {status.text}
                  {tech.status === 'PENDING' && <ChevronRight size={14} />}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Path for API request (client uses baseURL /api/v1)
const getDocumentApiPath = (doc: TechnicianDocument): string => doc.url.startsWith('/') ? doc.url : `/${doc.url}`;

const isImageFile = (fileName: string): boolean => {
  const lower = (fileName || '').toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(lower);
};

const isPdfFile = (fileName: string): boolean => /\.pdf$/i.test(fileName || '');

// VERIFICATION & REJECTION FLOW
export const DocumentVerification: React.FC<Props> = ({ setView }) => {
  const [isRejectModalOpen, setRejectModalOpen] = useState(false);
  const [tech, setTech] = useState<Technician>(mockTechs[0]);
  const [documents, setDocuments] = useState<TechnicianDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<TechnicianDocument | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionComment, setRejectionComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const prevBlobUrlRef = useRef<string | null>(null);

  // Fetch document as blob (with auth) for preview
  useEffect(() => {
    if (!selectedDoc) {
      if (prevBlobUrlRef.current) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
        prevBlobUrlRef.current = null;
      }
      setPreviewBlobUrl(null);
      setPreviewLoading(false);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    setPreviewBlobUrl(null);
    const path = getDocumentApiPath(selectedDoc);
    client
      .get(path, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        const blob = res.data as Blob;
        const url = URL.createObjectURL(blob);
        if (prevBlobUrlRef.current) URL.revokeObjectURL(prevBlobUrlRef.current);
        prevBlobUrlRef.current = url;
        setPreviewBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewBlobUrl(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
      if (prevBlobUrlRef.current) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
        prevBlobUrlRef.current = null;
      }
    };
  }, [selectedDoc?.id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Try to get real data
        const techs = await empresaService.getTechnicians('PENDING').catch(() => null);
        if (techs && techs.length > 0) {
          setTech(techs[0]);
          const docs = await empresaService.getTechnicianDocuments(techs[0].id).catch(() => []);
          setDocuments(docs);
          setSelectedDoc(docs.length > 0 ? docs[0] : null);
        }
      } catch (err) {
        console.error('Failed to fetch technician data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await empresaService.updateTechnicianStatus(tech.id, 'APPROVED');
      setView(AppView.APPROVALS);
    } catch (err) {
      console.error('Failed to approve technician:', err);
      alert('Failed to approve technician. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      alert('Please select a rejection reason.');
      return;
    }
    
    try {
      setSubmitting(true);
      await empresaService.updateTechnicianStatus(tech.id, 'REJECTED', `${rejectionReason}${rejectionComment ? ': ' + rejectionComment : ''}`);
      setRejectModalOpen(false);
      setView(AppView.APPROVALS);
    } catch (err) {
      console.error('Failed to reject technician:', err);
      alert('Failed to reject technician. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in relative">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-surface">
        <div className="flex items-center gap-4">
          <button onClick={() => setView(AppView.APPROVALS)} className="p-2 hover:bg-white/10 rounded-full text-secondary hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Verification: {tech.name}
              <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">Pending</span>
            </h1>
            {loading && <Loader2 className="animate-spin text-primary" size={16} />}
          </div>
        </div>
        <div className="flex gap-3">
           <Button variant="danger" onClick={() => setRejectModalOpen(true)} disabled={submitting}>
             Reject with Comment
           </Button>
           <Button variant="primary" onClick={handleApprove} disabled={submitting}>
             {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Approve Application'}
           </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Document Viewer (Left) */}
        <div className="flex-1 bg-[#081a1e] p-8 flex flex-col items-center justify-center relative overflow-auto">
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            {selectedDoc && previewBlobUrl && (
              <a
                href={previewBlobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-black/40 text-white rounded hover:bg-black/60"
                title="Open in new tab"
              >
                <Eye size={18} />
              </a>
            )}
            {selectedDoc && previewBlobUrl && (
              <a
                href={previewBlobUrl}
                download={selectedDoc.fileName}
                className="p-2 bg-black/40 text-white rounded hover:bg-black/60"
                title="Download"
              >
                <Download size={18} />
              </a>
            )}
          </div>

          <div className="w-full max-w-2xl min-h-[400px] bg-white shadow-2xl rounded-sm overflow-hidden flex flex-col items-center justify-center">
            {previewLoading && selectedDoc ? (
              <div className="p-8 flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-gray-500 text-sm">Loading document...</p>
              </div>
            ) : selectedDoc && previewBlobUrl ? (
              (() => {
                if (isImageFile(selectedDoc.fileName)) {
                  return (
                    <img
                      src={previewBlobUrl}
                      alt={selectedDoc.fileName}
                      className="max-w-full max-h-[70vh] w-auto h-auto object-contain"
                    />
                  );
                }
                if (isPdfFile(selectedDoc.fileName)) {
                  return (
                    <iframe
                      src={previewBlobUrl}
                      title={selectedDoc.fileName}
                      className="w-full min-h-[70vh] border-0"
                    />
                  );
                }
                return (
                  <div className="p-8 text-center">
                    <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 mb-4">{selectedDoc.fileName}</p>
                    <a
                      href={previewBlobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Open document in new tab
                    </a>
                  </div>
                );
              })()
            ) : selectedDoc && !previewBlobUrl && !previewLoading ? (
              <div className="p-8 text-center text-amber-600">
                <AlertTriangle size={48} className="mx-auto mb-4" />
                <p>Could not load document preview.</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>No documents uploaded yet.</p>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a document from the list to preview.</p>
              </div>
            )}
          </div>
        </div>

        {/* Checklist Sidebar (Right) */}
        <div className="w-96 bg-surface border-l border-white/10 flex flex-col">
           <div className="p-6 border-b border-white/10">
              <h3 className="font-bold text-white mb-1">Validation Checklist</h3>
              <p className="text-secondary text-sm">Verify all data points before approving.</p>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5"><ShieldCheck className="text-green-500" size={18} /></div>
                  <div>
                    <h4 className="text-white text-sm font-medium">Identity Match</h4>
                    <p className="text-secondary text-xs">Name matches application.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5"><AlertTriangle className="text-amber-500" size={18} /></div>
                  <div>
                    <h4 className="text-white text-sm font-medium">Expiration Check</h4>
                    <p className="text-secondary text-xs">Document expires in 30 days.</p>
                  </div>
                </div>
              </div>

              <hr className="border-white/10" />

              {/* Documents List */}
              {documents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">Uploaded Documents</h4>
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setSelectedDoc(doc)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors border ${
                          selectedDoc?.id === doc.id
                            ? 'bg-primary/20 border-primary/50 ring-1 ring-primary/30'
                            : 'bg-black/20 border-transparent hover:bg-white/10'
                        }`}
                      >
                        <FileText size={16} className="text-secondary shrink-0" />
                        <span className="text-sm text-white flex-1 truncate">{doc.fileName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                          doc.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                          doc.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {doc.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white mb-2">Internal Notes</label>
                <textarea 
                  className="w-full h-32 bg-[#0B242A] border border-white/10 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Add notes about this verification..."
                />
              </div>
           </div>
        </div>
      </div>

      {/* REJECTION MODAL */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-full max-w-lg rounded-xl border border-white/10 shadow-2xl p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-white mb-4">Reject Document</h2>
            <p className="text-secondary text-sm mb-6">
              Please select a reason for rejection. This will be sent to the technician via email and push notification.
            </p>

            <div className="space-y-3 mb-6">
               {['Image is blurry or unreadable', 'Document has expired', 'Name does not match profile', 'Wrong document type'].map((reason, idx) => (
                 <label key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-[#0B242A] hover:border-primary/50 cursor-pointer transition-colors group">
                    <input 
                      type="radio" 
                      name="reason" 
                      value={reason}
                      checked={rejectionReason === reason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="text-primary focus:ring-primary bg-surface border-white/20" 
                    />
                    <span className="text-white text-sm group-hover:text-primary transition-colors">{reason}</span>
                 </label>
               ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-2 uppercase tracking-wider">Additional Comments</label>
              <textarea 
                className="w-full h-24 bg-[#0B242A] border border-white/10 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-primary resize-none"
                placeholder="Provide specific details..."
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" onClick={() => setRejectModalOpen(false)} disabled={submitting}>Cancel</Button>
              <Button variant="danger" onClick={handleReject} disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
