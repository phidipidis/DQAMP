import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft, Save, Send, Eye, RotateCcw, CheckCircle2, Info, AlertCircle, User, CalendarCheck, Trash2
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

const STATUS_ALERT = {
  Submitted: {
    msg: 'Core fields are locked after submission. You may still update attachments, progress, and remarks.',
    cls: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  'Returned for Revision': {
    msg: 'Returned for revision — please make the required corrections and re-submit.',
    cls: 'border-amber-300 bg-amber-50 text-amber-800',
  },
  'Under Review': {
    msg: null, // filled dynamically
    cls: 'border-purple-200 bg-purple-50 text-purple-800',
  },
  Published: {
    msg: null, // filled dynamically
    cls: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
};

export default function ActivityFormHeader({
  isEditMode, activityTitle, status, isSaving,
  canSave, canSubmit, canStartReview, canReturnRevision, canPublish,
  isReviewer, isAdmin,
  reviewedBy, reviewedDate, publishedDate, error,
  onBack, onSave, onSubmitClick, onStartReview, onReturnRevision, onPublish, onView, onDelete
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const statusAlertData = STATUS_ALERT[status];
  const reviewMsg = (isReviewer || isAdmin)
    ? 'Under Review: Complete the QAME Evaluation section below.'
    : 'This activity is under QA review. Core activity fields are locked.';
  const publishedMsg = isAdmin
    ? 'Published record. Only evidence / MOV uploads are still allowed.'
    : 'Published — this is the official QA record. Core fields are locked.';

  const alertMsg = status === 'Under Review' ? reviewMsg
    : status === 'Published' ? publishedMsg
    : statusAlertData?.msg;

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#1e3a5f] leading-tight">
              {isEditMode ? (activityTitle || 'Edit Activity') : 'New Activity'}
            </h1>
            {isEditMode && (
              <div className="flex items-center gap-2 mt-0.5">
                {status === 'Draft' && <Badge className="bg-slate-100 text-slate-600 text-xs">Draft</Badge>}
                {status === 'Submitted' && <Badge className="bg-blue-100 text-blue-700 text-xs">Submitted</Badge>}
                {status === 'Returned for Revision' && <Badge className="bg-amber-100 text-amber-700 text-xs">Returned for Revision</Badge>}
                {status === 'Under Review' && <Badge className="bg-purple-100 text-purple-700 text-xs">Under Review</Badge>}
                {status === 'Published' && <Badge className="bg-emerald-100 text-emerald-700 text-xs">Published</Badge>}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {canSave && (
            <Button onClick={onSave} disabled={isSaving} className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
              <Save className="h-4 w-4 mr-1" />{isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
          {isEditMode && (
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="h-4 w-4 mr-1" />View
            </Button>
          )}
          {canSubmit && (
            <Button onClick={onSubmitClick} className="bg-[#0d9488] hover:bg-[#0d9488]/90">
              <Send className="h-4 w-4 mr-1" />Submit for Review
            </Button>
          )}
          {canStartReview && (
            <Button onClick={onStartReview} className="bg-purple-600 hover:bg-purple-700">
              <CheckCircle2 className="h-4 w-4 mr-1" />Start QA Review
            </Button>
          )}
          {canReturnRevision && (
            <Button variant="outline" onClick={onReturnRevision}
              className="border-amber-400 text-amber-700 hover:bg-amber-50">
              <RotateCcw className="h-4 w-4 mr-1" />Return for Revision
            </Button>
          )}
          {canPublish && (
            <Button onClick={onPublish} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="h-4 w-4 mr-1" />Publish
            </Button>
          )}
          {isEditMode && isAdmin && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" />Delete
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{activityTitle || 'this activity'}</strong> and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setDeleteDialogOpen(false); onDelete(); }} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status notice */}
      {alertMsg && isEditMode && (
        <Alert className={statusAlertData?.cls || 'border-purple-200 bg-purple-50'}>
          <Info className="h-4 w-4" />
          <AlertDescription>{alertMsg}</AlertDescription>
        </Alert>
      )}

      {/* Review audit trail */}
      {isEditMode && (reviewedBy || publishedDate) && (
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 px-1 pt-0.5">
          {reviewedBy && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Reviewed by: <span className="font-medium text-slate-700 ml-1">{reviewedBy}</span>
            </span>
          )}
          {reviewedDate && (
            <span className="flex items-center gap-1">
              <CalendarCheck className="h-3 w-3" />
              Review date: <span className="font-medium text-slate-700 ml-1">{reviewedDate}</span>
            </span>
          )}
          {publishedDate && (
            <span className="flex items-center gap-1">
              <CalendarCheck className="h-3 w-3" />
              Published: <span className="font-medium text-slate-700 ml-1">{publishedDate}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}