'use client';

import React, { useState } from 'react';
import { useAuth, supabaseBrowser } from '@/lib/auth-client';

/**
 * Basic member clips upload form (Phase 3 frontend integration).
 * Posts FormData to /api/clips/upload (nodejs + @vercel/blob backend).
 * Auth: attempts Supabase session token (matches backend Bearer check).
 * For real use: member login + BLOB_READ_WRITE_TOKEN on server required.
 * Ties to "Latest Dispatches" / community area (post side-quest fix).
 * Simple, token-based, no external deps beyond existing auth.
 */
interface UploadResult {
  id?: string;
  url?: string;
  approved?: boolean;
  error?: string;
}

export default function ClipsUploadForm({ epId }: { epId?: string }) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setResult({ error: 'Please select a clip file (video/audio, ~30s max recommended).' });
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (epId) formData.append('ep_id', epId);
      if (title) formData.append('title', title); // backend can ignore for now

      const headers: Record<string, string> = {};
      // Get fresh token from Supabase browser client (real member flow)
      try {
        const sb = supabaseBrowser();
        const { data: { session } } = await sb.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        } else if (user) {
          // Fallback for MVP (backend still has loose "member" stub)
          headers['Authorization'] = 'Bearer member';
        }
      } catch {
        if (user) headers['Authorization'] = 'Bearer member';
      }

      const res = await fetch('/api/clips/upload', {
        method: 'POST',
        body: formData,
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      setResult({
        id: data.id,
        url: data.url,
        approved: data.approved,
      });
      setFile(null);
      setTitle('');
    } catch (err: any) {
      setResult({ error: err.message || 'Upload failed. Check login + server BLOB token.' });
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="clips-teaser" aria-label="Member clips upload">
        <div className="clips-teaser__header">
          <span className="mono-eyebrow">▼ UPLOAD A CLIP</span>
        </div>
        <p className="clips-teaser__desc">
          Member clips appear across the hub and live. Sign in to upload your 30s ranch report, faith moment, or local update.
        </p>
        <a href="/membership" className="btn btn--outline btn--sm">
          Sign in to upload
        </a>
      </div>
    );
  }

  return (
    <div className="clips-teaser" aria-label="Member clips upload form">
      <div className="clips-teaser__header">
        <span className="mono-eyebrow">▼ UPLOAD A CLIP</span>
        <span className="clips-teaser__count">30s TWA-friendly</span>
      </div>
      <p className="clips-teaser__desc">
        Ranch reports, faith moments, local ag updates — uploaded by members, transcribed, featured across the hub and live.
      </p>

      <form onSubmit={handleSubmit} className="clips-upload-form">
        <label className="clips-upload-label">
          Clip file (video or audio)
          <input
            type="file"
            accept="video/*,audio/*"
            onChange={handleFileChange}
            disabled={isUploading}
            required
          />
        </label>

        <label className="clips-upload-label">
          Optional title / note
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Jackson County drought update"
            disabled={isUploading}
          />
        </label>

        <button
          type="submit"
          className="btn btn--primary btn--sm"
          disabled={isUploading || !file}
        >
          {isUploading ? 'Uploading…' : 'Upload clip (members)'}
        </button>
      </form>

      {result && (
        <div className="clips-upload-result" aria-live="polite">
          {result.error ? (
            <p className="clips-upload-error">Error: {result.error}</p>
          ) : (
            <>
              <p>Upload received! ID: <code>{result.id}</code></p>
              <p>Status: <strong>{result.approved ? 'Approved' : 'Pending moderation + transcript'}</strong></p>
              {result.url && (
                <a href={result.url} target="_blank" rel="noopener" className="btn btn--outline btn--sm">
                  View raw file
                </a>
              )}
            </>
          )}
        </div>
      )}

      <p className="fine-print" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
        Requires active member session. Real transcription + approval via backend jobs. Max ~30s for mobile friendliness.
      </p>
    </div>
  );
}
