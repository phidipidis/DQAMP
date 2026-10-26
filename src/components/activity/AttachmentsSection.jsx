import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Paperclip, ExternalLink, Lock, FileText, Trash2, Upload } from 'lucide-react';

export default function AttachmentsSection({
  formData,
  onChange,
  locked,
  onEvidenceUpload,
  uploadingEvidence,
}) {
  // Evidence_Attachments: array of uploaded file URLs
  const attachments = formData.Evidence_Attachments || [];

  const fmtFilename = (url) =>
    decodeURIComponent(url.split('/').pop().split('?')[0]) || url;

  const handleRemove = (idx) => {
    onChange('Evidence_Attachments', attachments.filter((_, i) => i !== idx));
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-[#1e3a5f] flex items-center justify-between text-base">
          <span className="flex items-center gap-2"><Paperclip className="h-4 w-4" />Evidence / MOV Attachments</span>
          {!locked
            ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-normal text-xs">Editable</Badge>
            : <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1 text-xs"><Lock className="h-3 w-3" />Locked</Badge>
          }
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">

        {/* File upload */}
        {!locked && (
          <div>
            <Label className="flex items-center gap-1">
              <Upload className="h-3.5 w-3.5" />Upload Evidence File
            </Label>
            <Input
              type="file"
              className="mt-1"
              disabled={uploadingEvidence || locked}
              onChange={(e) => e.target.files?.[0] && onEvidenceUpload(e.target.files[0])}
            />
            {uploadingEvidence && (
              <p className="text-xs text-slate-500 mt-1">Uploading...</p>
            )}
          </div>
        )}

        {/* Attached files list */}
        {attachments.length > 0 ? (
          <div className="space-y-1">
            {attachments.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded border">
                <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate flex-1"
                >
                  {fmtFilename(url)}
                </a>
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  className="h-7 w-7 flex-shrink-0"
                >
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
                {!locked && (
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => handleRemove(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No evidence files attached yet.</p>
        )}

        <p className="text-xs text-slate-400">
          Upload PDFs, images, or documents as Means of Verification (MOV).
        </p>
      </CardContent>
    </Card>
  );
}