import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  DollarSign, 
  MessageSquareText, 
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
  Handshake
} from 'lucide-react';

const reports = [
  {
    title: 'PIRPA Report',
    description: 'Program Implementation Review and Plan Adjustment - Track activity execution, remarks, and financial performance by quarter',
    icon: ClipboardCheck,
    page: 'PIRPAReport',
    color: 'bg-blue-500'
  },
  {
    title: 'QAME Tools Report',
    description: 'Quality Assurance Monitoring and Evaluation Tools - View activities with QAME evaluation forms and reports',
    icon: FileText,
    page: 'QAMEToolsReport',
    color: 'bg-purple-500'
  },
  {
    title: 'Consolidated QAME Report',
    description: 'Consolidated QAME ratings and assessments across all activities with performance statistics',
    icon: TrendingUp,
    page: 'ConsolidatedQAMEReport',
    color: 'bg-emerald-500'
  },
  {
    title: 'Financial Utilization Report',
    description: 'Budget allocation, utilization, and variance analysis with overspending alerts',
    icon: DollarSign,
    page: 'FinancialUtilizationReport',
    color: 'bg-amber-500'
  },
  {
    title: 'ARTA CSM Summary',
    description: 'Client Satisfaction Measurement based on ARTA MC 2022-05 with Service Quality Dimension scores',
    icon: MessageSquareText,
    page: 'ARTACSMSummary',
    color: 'bg-teal-500'
  },
  {
    title: 'Partnership Report',
    description: 'Activities conducted in partnership with another agency — grouped by project and functional division with partner details and types',
    icon: Handshake,
    page: 'PartnershipReport',
    color: 'bg-indigo-500'
  }
];

export default function ReportCenter() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f]">Report Center</h1>
        <p className="text-slate-600 mt-2">Access comprehensive reports with CSV and PDF export capabilities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.page} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${report.color} flex items-center justify-center mb-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{report.title}</CardTitle>
                <CardDescription className="text-sm mt-2">
                  {report.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={createPageUrl(report.page)}>
                  <Button className="w-full bg-[#1e3a5f] hover:bg-[#2d4a6f]">
                    View Report
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg">Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            All reports support both CSV and PDF export formats. Use the filters on each report page to customize the data before exporting.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}