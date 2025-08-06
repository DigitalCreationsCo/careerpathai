import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, User, AlertCircle } from 'lucide-react';
import { getReports } from '@/lib/db/queries/report';
import Link from 'next/link';

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export default async function ReportPage() {
  const reports = await getReports();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-foreground mb-6">
        Reports
      </h1>
      
      {reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => {
            const metadata = report.metadata as any;
            const bestPath = metadata?.best_path || 'Career Path Analysis';
            const candidateCount = metadata?.candidate_count || 0;
            const generatedAt = metadata?.generated_at || metadata?.createdAt;
            const userName = metadata?.user?.name || 'Unknown User';
            
            return (
              <Link key={report.id} href={`/dashboard/reports/${report.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="bg-blue-100 rounded-full p-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-xs text-gray-500">
                        #{report.id}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
                      {bestPath}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span>{userName}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          {generatedAt ? formatDate(generatedAt) : 'Unknown date'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{candidateCount}</span> career paths analyzed
                      </div>
                      
                      {metadata?.scores && metadata.scores.length > 0 && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-gray-500 mb-1">Top Score</div>
                          <div className="text-lg font-bold text-blue-600">
                            {metadata.scores[0]?.score || 0}%
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No reports yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                When you generate career path reports, they'll appear here for easy access and review.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}