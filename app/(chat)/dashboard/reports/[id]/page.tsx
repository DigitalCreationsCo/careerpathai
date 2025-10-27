import { notFound } from 'next/navigation';
import { getReportById } from '@/lib/db/queries/report';
import CareerPathReport from '@/components/report';
import { Button } from '@/components/ui/button/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SAMPLE_DATA } from '@/lib/sample-data';

type ReportPageProps = {
  params: Promise<{
    id: string;
  }>
};

export async function generateMetadata(props: ReportPageProps) {
  const params = await props.params
  const id = params.id
}

export default async function ReportPage(props: ReportPageProps) {
  const params = await props.params;

  const reportId = parseInt(params.id);
  
  if (isNaN(reportId)) {
    notFound();
  }

  // const report = await getReportById(reportId);
  const report = SAMPLE_DATA
  
  if (!report) {
    notFound();
  }

  const metadata: any = report.metadata as any;

  return (
    <div className="flex-1 p-4 lg:p-8">
      {/* Header with back button */}
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <h1 className="text-lg lg:text-2xl font-medium text-foreground">
            Career Path Report #{report.id}
          </h1>
          <div className="text-sm text-gray-500">
            Generated {metadata?.generated_at ? 
              new Date(metadata.generated_at).toLocaleDateString() : 
              'Unknown date'
            }
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <CareerPathReport data={report} />
      </div>
    </div>
  );
}
