import React, { useEffect, useState } from 'react';
import client from '../services/client';

/**
 * Renders an image from a URL that requires Authorization (e.g. /api/v1/uploads/...).
 * Fetches the image with the auth token and displays it via a blob URL so the browser
 * doesn't send an unauthenticated request for <img src="...">.
 */
export const AuthImage: React.FC<{
  src: string;
  alt?: string;
  className?: string;
}> = ({ src, alt = '', className }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setBlobUrl(null);
      return;
    }
    // Only use authenticated fetch for our API uploads path; other URLs (data:, external) use normal img
    const isUploadUrl = src.includes('/uploads/');
    if (!isUploadUrl) {
      setBlobUrl(src);
      return;
    }

    let objectUrl: string | null = null;
    const load = async () => {
      try {
        const url = new URL(src, window.location.origin);
        const path = url.pathname.startsWith('/api/v1') ? url.pathname.slice(7) : url.pathname; // path relative to baseURL /api/v1
        const res = await client.get(path, { responseType: 'blob' });
        objectUrl = URL.createObjectURL(res.data);
        setBlobUrl(objectUrl);
        setError(false);
      } catch {
        setError(true);
        setBlobUrl(null);
      }
    };
    load();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (error) {
    return (
      <div className={`bg-slate-700 flex items-center justify-center ${className || ''}`}>
        <span className="text-slate-500 text-xs">Erro ao carregar</span>
      </div>
    );
  }

  if (!blobUrl) {
    return <div className={`bg-slate-800 animate-pulse ${className || ''}`} />;
  }

  return <img src={blobUrl} alt={alt} className={className} />;
};
