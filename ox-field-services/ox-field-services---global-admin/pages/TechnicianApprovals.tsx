import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    ChevronRight,
    Download,
    Eye,
    FileText,
    Loader2,
    ShieldCheck,
    AlertTriangle,
} from 'lucide-react';
import { adminService, TechnicianWithTenant, TechnicianDocument } from '../services/admin';

type View = 'list' | 'verification';

interface TechnicianApprovalsProps {
    onBack?: () => void;
}

export const TechnicianApprovals: React.FC<TechnicianApprovalsProps> = () => {
    const [view, setView] = useState<View>('list');
    const [technicians, setTechnicians] = useState<TechnicianWithTenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTech, setSelectedTech] = useState<TechnicianWithTenant | null>(null);
    const [documents, setDocuments] = useState<TechnicianDocument[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectionComment, setRejectionComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchPendingTechnicians = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminService.getPendingTechnicians();
            setTechnicians(data);
        } catch (err) {
            console.error('Failed to fetch pending technicians:', err);
            setError('Failed to load pending technicians. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingTechnicians();
    }, []);

    const handleTechClick = (tech: TechnicianWithTenant) => {
        setSelectedTech(tech);
        setView('verification');
        setDocuments([]);
        setDocsLoading(true);
        adminService.getTechnicianDocuments(tech.id)
            .then(setDocuments)
            .catch(() => setDocuments([]))
            .finally(() => setDocsLoading(false));
    };

    const handleBack = () => {
        setView('list');
        setSelectedTech(null);
        setDocuments([]);
        fetchPendingTechnicians();
    };

    const handleApprove = async () => {
        if (!selectedTech) return;
        try {
            setSubmitting(true);
            await adminService.updateTechnicianStatus(selectedTech.id, 'APPROVED');
            handleBack();
        } catch (err) {
            console.error('Failed to approve technician:', err);
            alert('Failed to approve technician. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!selectedTech || !rejectionReason) {
            alert('Please select a rejection reason.');
            return;
        }
        try {
            setSubmitting(true);
            const notes = `${rejectionReason}${rejectionComment ? ': ' + rejectionComment : ''}`;
            await adminService.updateTechnicianStatus(selectedTech.id, 'REJECTED', notes);
            setRejectModalOpen(false);
            setRejectionReason('');
            setRejectionComment('');
            handleBack();
        } catch (err) {
            console.error('Failed to reject technician:', err);
            alert('Failed to reject technician. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
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

    const pendingCount = technicians.length;

    // LIST VIEW
    if (view === 'list') {
        return (
            <div className="p-6 lg:p-8 max-w-6xl mx-auto h-full flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                            Technician Approvals
                        </h1>
                        <p className="text-slate-400">
                            Review pending applications and document verifications.
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        {loading && <Loader2 className="h-6 w-6 text-ox-500 animate-spin" />}
                        <div className="bg-dark-800 px-4 py-2 rounded-lg border border-dark-700 flex flex-col items-center">
                            <span className="text-2xl font-bold text-white">{pendingCount}</span>
                            <span className="text-xs text-slate-400 uppercase">Pending</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-400 text-sm mb-4">
                        {error}
                    </div>
                )}

                <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden shadow-lg flex-1 min-h-0">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-dark-700 bg-dark-900 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <div className="col-span-4">Technician</div>
                        <div className="col-span-2">Company</div>
                        <div className="col-span-3">Role & Skills</div>
                        <div className="col-span-2">Date Applied</div>
                        <div className="col-span-1 text-right">Status</div>
                    </div>

                    <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
                        {technicians.length === 0 && !loading && (
                            <div className="p-12 text-center text-slate-500">
                                No pending technicians.
                            </div>
                        )}
                        {technicians.map((tech) => {
                            const status = getStatusDisplay(tech.status);
                            return (
                                <div
                                    key={tech.id}
                                    onClick={() => handleTechClick(tech)}
                                    className="grid grid-cols-12 gap-4 p-4 border-b border-dark-700/50 items-center cursor-pointer hover:bg-dark-700/50 transition-colors"
                                >
                                    <div className="col-span-4 flex items-center gap-4">
                                        <img
                                            src={tech.avatarUrl || `https://picsum.photos/seed/${tech.id}/60/60`}
                                            alt=""
                                            className="w-10 h-10 rounded-full border border-dark-600"
                                        />
                                        <div>
                                            <div className="font-bold text-white">{tech.name}</div>
                                            <div className="text-xs text-slate-400">{tech.email}</div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-slate-300 text-sm">
                                        {tech.tenantName || tech.tenantDomain || '-'}
                                    </div>
                                    <div className="col-span-3">
                                        <div className="text-white text-sm">{tech.role || '-'}</div>
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {(tech.skills || []).map((s) => (
                                                <span
                                                    key={s}
                                                    className="text-[10px] bg-dark-700 px-1.5 rounded text-slate-400"
                                                >
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-slate-400 text-sm">
                                        {formatDate(tech.createdAt)}
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${status.color}`}
                                        >
                                            {status.text}
                                            <ChevronRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // VERIFICATION VIEW
    return (
        <div className="h-full flex flex-col animate-fade-in relative">
            {/* Header */}
            <div className="h-16 border-b border-dark-700 flex items-center justify-between px-6 bg-dark-900">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-dark-700 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            Verification: {selectedTech?.name}
                            <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">
                                Pending
                            </span>
                        </h1>
                        {docsLoading && <Loader2 className="animate-spin text-ox-500" size={16} />}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setRejectModalOpen(true)}
                        disabled={submitting}
                        className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 rounded border border-red-800 text-sm font-medium disabled:opacity-50"
                    >
                        Reject with Comment
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={submitting}
                        className="px-4 py-2 bg-ox-600 hover:bg-ox-500 text-white rounded border border-ox-500 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : null}
                        Approve Application
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Document Viewer (Left) */}
                <div className="flex-1 bg-dark-950 p-8 flex flex-col items-center justify-center relative">
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button className="p-2 bg-dark-700 text-white rounded hover:bg-dark-600">
                            <Download size={18} />
                        </button>
                        <button className="p-2 bg-dark-700 text-white rounded hover:bg-dark-600">
                            <Eye size={18} />
                        </button>
                    </div>

                    <div className="w-full max-w-2xl aspect-[3/4] bg-white shadow-2xl rounded-sm p-8 relative overflow-hidden group">
                        <div className="border-4 border-double border-gray-200 h-full p-8 flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <div className="text-gray-900 font-serif text-2xl font-bold">
                                    CERTIFICATE
                                </div>
                                <div className="w-16 h-16 rounded-full bg-yellow-400 opacity-20" />
                            </div>
                            <div className="space-y-4">
                                <div className="h-4 bg-gray-100 w-full rounded" />
                                <div className="h-4 bg-gray-100 w-3/4 rounded" />
                                <div className="h-4 bg-gray-100 w-5/6 rounded" />
                            </div>
                            <div className="mt-auto pt-8 border-t border-gray-300 flex justify-between">
                                <div className="text-gray-500 text-xs">Authorized Signature</div>
                                <div className="text-gray-500 text-xs">Date: 10/12/2022</div>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-ox-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                            <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                Click to Zoom
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sidebar (Right) */}
                <div className="w-96 bg-dark-900 border-l border-dark-700 flex flex-col">
                    <div className="p-6 border-b border-dark-700">
                        <h3 className="font-bold text-white mb-1">Validation Checklist</h3>
                        <p className="text-slate-400 text-sm">Verify all data points before approving.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                    <ShieldCheck className="text-green-500" size={18} />
                                </div>
                                <div>
                                    <h4 className="text-white text-sm font-medium">Identity Match</h4>
                                    <p className="text-slate-400 text-xs">Name matches application.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                    <AlertTriangle className="text-amber-500" size={18} />
                                </div>
                                <div>
                                    <h4 className="text-white text-sm font-medium">Expiration Check</h4>
                                    <p className="text-slate-400 text-xs">Document expires in 30 days.</p>
                                </div>
                            </div>
                        </div>

                        <hr className="border-dark-700" />

                        {selectedTech && (
                            <div>
                                <h4 className="text-sm font-medium text-white mb-2">Technician Info</h4>
                                <div className="space-y-1 text-sm text-slate-300">
                                    <p>Email: {selectedTech.email}</p>
                                    <p>Phone: {selectedTech.phone || '-'}</p>
                                    <p>Company: {selectedTech.tenantName || selectedTech.tenantDomain || '-'}</p>
                                    <p>Skills: {(selectedTech.skills || []).join(', ') || '-'}</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="text-sm font-medium text-white mb-3">Uploaded Documents</h4>
                            <div className="space-y-2">
                                {documents.length === 0 && !docsLoading && (
                                    <p className="text-slate-500 text-sm">No documents uploaded.</p>
                                )}
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center gap-2 p-2 bg-dark-800 rounded-lg"
                                    >
                                        <FileText size={16} className="text-slate-400" />
                                        <span className="text-sm text-white flex-1 truncate">
                                            {doc.fileName}
                                        </span>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded ${
                                                doc.status === 'APPROVED'
                                                    ? 'bg-green-500/10 text-green-500'
                                                    : doc.status === 'REJECTED'
                                                    ? 'bg-red-500/10 text-red-500'
                                                    : 'bg-amber-500/10 text-amber-500'
                                            }`}
                                        >
                                            {doc.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* REJECTION MODAL */}
            {rejectModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-dark-800 w-full max-w-lg rounded-xl border border-dark-700 shadow-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Reject Application</h2>
                        <p className="text-slate-400 text-sm mb-6">
                            Please select a reason for rejection. This will be sent to the technician via
                            email and push notification.
                        </p>

                        <div className="space-y-3 mb-6">
                            {[
                                'Image is blurry or unreadable',
                                'Document has expired',
                                'Name does not match profile',
                                'Wrong document type',
                            ].map((reason) => (
                                <label
                                    key={reason}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-dark-600 bg-dark-900 hover:border-ox-500/50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={reason}
                                        checked={rejectionReason === reason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="text-ox-500 focus:ring-ox-500 bg-dark-800 border-dark-600"
                                    />
                                    <span className="text-white text-sm">{reason}</span>
                                </label>
                            ))}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                                Additional Comments
                            </label>
                            <textarea
                                className="w-full h-24 bg-dark-900 border border-dark-600 rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-ox-500 resize-none"
                                placeholder="Provide specific details..."
                                value={rejectionComment}
                                onChange={(e) => setRejectionComment(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => {
                                    setRejectModalOpen(false);
                                    setRejectionReason('');
                                    setRejectionComment('');
                                }}
                                disabled={submitting}
                                className="px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={submitting || !rejectionReason}
                                className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 rounded border border-red-800 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
