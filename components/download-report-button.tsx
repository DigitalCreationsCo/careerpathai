'use client';
import React, { useState } from 'react';
import { Button } from './ui/button';

type DownloadReportButtonProps = {
  markdownContent: string;
};

export function DownloadReportButton({ markdownContent }: DownloadReportButtonProps) {
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: markdownContent }),
      });
      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor to download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      alert('Failed to download PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      className="rounded bg-primary text-white px-4 py-2 font-bold"
      disabled={loading}
    >
      {loading ? 'Downloading...' : 'Download this report as PDF'}
    </Button>
  );
}

