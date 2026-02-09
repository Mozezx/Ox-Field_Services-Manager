import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../../components/BottomNav';
import { techService } from '../../services/tech';
import { authService } from '../../services/auth';

interface DocItem {
  id: string;
  type: string;
  fileName: string;
  status: string;
  uploadedAt: string;
}

export const DocumentsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('ID');
  const [file, setFile] = useState<File | null>(null);

  const user = authService.getStoredUser();

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await techService.getDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      setError(err.response?.data?.message || 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }
    try {
      setUploading(true);
      setError(null);
      await techService.uploadDocument(selectedType, file);
      setFile(null);
      await loadDocuments();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-bg-dark/95 backdrop-blur-md p-4 border-b border-white/10">
        <button onClick={() => navigate(-1)} className="text-slate-300 hover:text-white">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-white">Complete Registration</h1>
        <div className="w-10" />
      </header>

      <div className="px-4 py-6">
        <p className="text-slate-400 text-sm mb-6">
          Complete your profile and upload documents so your company can approve you. Once approved, you will be able to receive service orders.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
            {error.includes('not configured') && (
              <p className="mt-2 text-slate-400 text-xs">You can still wait for approval; your company will review your profile.</p>
            )}
          </div>
        )}

        <div className="bg-surface-dark rounded-xl border border-slate-800 p-4 mb-6">
          <h2 className="text-lg font-bold text-white mb-3">Upload document</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-slate-400 block mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-bg-dark text-white py-2.5 px-3"
              >
                <option value="ID">ID</option>
                <option value="CERTIFICATE">Certificate</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">File</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-slate-300 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-secondary file:text-primary file:font-medium"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="w-full py-3 rounded-lg bg-secondary text-primary font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="material-symbols-outlined animate-spin-cw">progress_activity</span>
                  Uploading...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">upload</span>
                  Upload
                </>
              )}
            </button>
          </div>
        </div>

        <h2 className="text-lg font-bold text-white mb-3">Uploaded documents</h2>
        {loading ? (
          <div className="py-8 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin-cw">sync</span>
            <p className="text-sm mt-2">Loading...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center text-slate-400 rounded-xl border border-dashed border-slate-700">
            <span className="material-symbols-outlined text-4xl mb-2">description</span>
            <p className="text-sm">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-dark border border-slate-800"
              >
                <div className="size-12 rounded-lg bg-slate-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400">description</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{doc.fileName}</p>
                  <p className="text-slate-400 text-sm">{doc.type} • {doc.status}</p>
                </div>
                <span className="material-symbols-outlined text-secondary">check_circle</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};
