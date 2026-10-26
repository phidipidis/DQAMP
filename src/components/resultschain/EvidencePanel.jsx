import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function EvidencePanel({ activities, outputs, feedback }) {
  // Collect evidence from activities (photos)
  const activityEvidence = activities
    .filter(a => a.Photo_1 || a.Photo_2)
    .flatMap(a => {
      const evidence = [];
      if (a.Photo_1) {
        evidence.push({
          type: 'photo',
          url: a.Photo_1,
          title: a.Title,
          source: 'Activity',
          date: a.created_date,
          category: a.Category
        });
      }
      if (a.Photo_2) {
        evidence.push({
          type: 'photo',
          url: a.Photo_2,
          title: a.Title,
          source: 'Activity',
          date: a.created_date,
          category: a.Category
        });
      }
      return evidence;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Published activities as evidence
  const publishedActivities = activities
    .filter(a => a.Workflow_Status === 'Published')
    .map(a => ({
      type: 'report',
      title: a.Title,
      source: 'Activity',
      date: a.updated_date || a.created_date,
      status: 'Published',
      category: a.Category
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Verified outputs as evidence
  const verifiedOutputs = outputs
    .filter(o => o.Output_Verification_Status === 'Verified')
    .map(o => ({
      type: 'output',
      title: o.Output_Description,
      source: 'Output',
      date: o.Verification_Date || o.updated_date,
      verifiedBy: o.Verified_By,
      category: o.Output_Category
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // ARTA feedback count
  const feedbackCount = feedback?.length || 0;

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return '-';
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#1e3a5f]" />
          Means of Verification / Evidence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="reports">Reports ({publishedActivities.length})</TabsTrigger>
            <TabsTrigger value="outputs">Outputs ({verifiedOutputs.length})</TabsTrigger>
            <TabsTrigger value="photos">Photos ({activityEvidence.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-2 max-h-64 overflow-y-auto">
            {publishedActivities.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No published reports yet</p>
            ) : (
              publishedActivities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
                  </div>
                  {item.category && (
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="outputs" className="space-y-2 max-h-64 overflow-y-auto">
            {verifiedOutputs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No verified outputs yet</p>
            ) : (
              verifiedOutputs.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  <FileText className="h-4 w-4 text-[#0d9488]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      Verified: {formatDate(item.date)} {item.verifiedBy && `by ${item.verifiedBy}`}
                    </p>
                  </div>
                  {item.category && (
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="photos" className="max-h-64 overflow-y-auto">
            {activityEvidence.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No photo evidence uploaded</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {activityEvidence.slice(0, 9).map((item, idx) => (
                  <a 
                    key={idx} 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden"
                  >
                    <img 
                      src={item.url} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="h-5 w-5 text-white" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {feedbackCount > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">ARTA Feedback Responses</span>
              <Badge className="bg-[#1e3a5f]">{feedbackCount} responses</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}