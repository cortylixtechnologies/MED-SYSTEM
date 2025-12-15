import { useState } from 'react';
import { FileText, Image, Download, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReferralAttachment } from '@/hooks/useReferralAttachments';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AttachmentsListProps {
  attachments: ReferralAttachment[];
  loading?: boolean;
  onDownload: (attachment: ReferralAttachment) => Promise<void>;
  onDelete?: (attachment: ReferralAttachment) => Promise<void>;
  canDelete?: boolean;
  currentUserId?: string;
}

export const AttachmentsList = ({
  attachments,
  loading = false,
  onDownload,
  onDelete,
  canDelete = false,
  currentUserId
}: AttachmentsListProps) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReferralAttachment | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5 text-primary" />;
    return <FileText className="h-5 w-5 text-primary" />;
  };

  const handleDownload = async (attachment: ReferralAttachment) => {
    setDownloadingId(attachment.id);
    try {
      await onDownload(attachment);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget && onDelete) {
      await onDelete(deleteTarget);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No attachments yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {getFileIcon(attachment.file_type)}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.file_size)} • Uploaded by {attachment.uploader_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(attachment.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(attachment)}
                disabled={downloadingId === attachment.id}
              >
                {downloadingId === attachment.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
              {canDelete && (currentUserId === attachment.uploaded_by || canDelete) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(attachment)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.file_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
