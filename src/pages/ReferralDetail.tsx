import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useReferrals } from '@/hooks/useReferrals';
import { useReferralAttachments } from '@/hooks/useReferralAttachments';
import { useReferralMessages } from '@/hooks/useReferralMessages';
import Navigation from '@/components/Navigation';
import { StatusBadge, UrgencyBadge } from '@/components/StatusBadge';
import ActivityTimeline from '@/components/ActivityTimeline';
import { FileUploadZone } from '@/components/FileUploadZone';
import { AttachmentsList } from '@/components/AttachmentsList';
import { ReferralChat } from '@/components/ReferralChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Building2, 
  Phone, 
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare,
  Copy,
  AlertTriangle,
  Loader2,
  Paperclip,
  MessageCircle,
  Printer,
  Download
} from 'lucide-react';
import { generateReferralPDF } from '@/utils/pdfGenerator';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ReferralDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getReferralById, updateReferralStatus, loading } = useReferrals();
  const { attachments, loading: attachmentsLoading, uploading, uploadFile, deleteAttachment, getDownloadUrl } = useReferralAttachments(id);
  const { messages, loading: messagesLoading, sending, sendMessage } = useReferralMessages(id);
  
  const [actionReason, setActionReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<'accept' | 'reject' | 'more_info' | 'complete' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!currentUser || !id) return null;

  const referral = getReferralById(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="card-elevated">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-warning" />
              <p className="text-lg font-medium text-foreground">Referral not found</p>
              <p className="text-muted-foreground">The referral you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/dashboard')} className="mt-4">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isReceivingHospital = referral.toHospitalId === currentUser.hospital_id;
  const canTakeAction = isReceivingHospital && (referral.status === 'pending' || referral.status === 'accepted' || referral.status === 'in_treatment');

  const handleAction = async (action: 'accept' | 'reject' | 'more_info' | 'complete') => {
    setCurrentAction(action);
    if (action === 'accept') {
      setIsUpdating(true);
      await updateReferralStatus(referral.id, 'accepted');
      setIsUpdating(false);
    } else {
      setDialogOpen(true);
    }
  };

  const confirmAction = async () => {
    if (!currentAction) return;

    setIsUpdating(true);

    switch (currentAction) {
      case 'reject':
        await updateReferralStatus(referral.id, 'rejected', actionReason);
        break;
      case 'more_info':
        await updateReferralStatus(referral.id, 'more_info_requested', actionReason);
        break;
      case 'complete':
        await updateReferralStatus(referral.id, 'completed', actionReason);
        break;
    }

    setIsUpdating(false);
    setDialogOpen(false);
    setActionReason('');
    setCurrentAction(null);
  };

  const copyPatientCode = () => {
    if (referral.patientCode) {
      navigator.clipboard.writeText(referral.patientCode);
      toast.success('Patient code copied to clipboard');
    }
  };

  const startTreatment = async () => {
    setIsUpdating(true);
    await updateReferralStatus(referral.id, 'in_treatment', 'Treatment started');
    setIsUpdating(false);
  };

  const handleFilesSelected = async (files: File[]) => {
    for (const file of files) {
      await uploadFile(file);
    }
  };

  const handleDownload = async (attachment: any) => {
    const url = await getDownloadUrl(attachment);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the referral');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Referral - ${referral.patient.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111; }
          .header { border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; }
          .header h1 { font-size: 24px; margin-bottom: 4px; }
          .header .subtitle { color: #666; }
          .header .ids { text-align: right; }
          .header .ids p { font-size: 12px; color: #666; }
          .header .ids .code { font-family: monospace; font-weight: bold; font-size: 14px; }
          .badges { display: flex; gap: 12px; margin-bottom: 24px; }
          .badge { padding: 8px 16px; border-radius: 4px; font-size: 14px; }
          .badge-status { background: #f0f0f0; }
          .badge-routine { background: #d1fae5; }
          .badge-urgent { background: #fef3c7; }
          .badge-emergency { background: #fee2e2; }
          section { margin-bottom: 24px; }
          section h2 { font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .field label { font-size: 12px; color: #666; display: block; margin-bottom: 4px; }
          .field p { font-weight: 500; }
          .route { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
          .route-item { border-left: 4px solid; padding-left: 12px; }
          .route-from { border-color: #3b82f6; }
          .route-to { border-color: #22c55e; }
          .text-box { background: #f9fafb; padding: 12px; border-radius: 4px; border: 1px solid #e5e7eb; white-space: pre-wrap; }
          .text-box.error { background: #fef2f2; border-color: #fecaca; }
          footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
          @media print { body { padding: 20px; } @page { margin: 1cm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Medical Referral Document</h1>
            <p class="subtitle">MedRefer - Hospital Referral System</p>
          </div>
          <div class="ids">
            <p>Referral ID</p>
            <p class="code">${referral.id.slice(0, 8).toUpperCase()}</p>
            ${referral.patientCode ? `<p style="margin-top: 8px;">Patient Code</p><p class="code">${referral.patientCode}</p>` : ''}
          </div>
        </div>

        <div class="badges">
          <span class="badge badge-status">Status: ${referral.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
          <span class="badge badge-${referral.urgency}">Urgency: ${referral.urgency.charAt(0).toUpperCase() + referral.urgency.slice(1)}</span>
        </div>

        <section>
          <h2>Patient Information</h2>
          <div class="grid">
            <div class="field"><label>Name</label><p>${referral.patient.name}</p></div>
            <div class="field"><label>Age</label><p>${referral.patient.age} years</p></div>
            <div class="field"><label>Contact</label><p>${referral.patient.contact}</p></div>
            <div class="field"><label>Medical ID</label><p>${referral.patient.medicalId}</p></div>
          </div>
        </section>

        <section>
          <h2>Referral Route</h2>
          <div class="route">
            <div class="route-item route-from">
              <label style="font-size: 12px; color: #666; text-transform: uppercase;">Referring Hospital</label>
              <p style="font-weight: 500;">${referral.fromHospitalName}</p>
              <p style="color: #666;">${referral.fromDoctorName}</p>
            </div>
            <div class="route-item route-to">
              <label style="font-size: 12px; color: #666; text-transform: uppercase;">Receiving Hospital</label>
              <p style="font-weight: 500;">${referral.toHospitalName}</p>
              <p style="color: #666;">${referral.assignedDoctorName || 'Awaiting assignment'}</p>
            </div>
          </div>
        </section>

        <section>
          <h2>Specialty Required</h2>
          <p style="font-weight: 500;">${referral.specialty}</p>
        </section>

        <section>
          <h2>Medical Information</h2>
          <div style="margin-bottom: 16px;">
            <label style="font-size: 12px; color: #666; display: block; margin-bottom: 4px;">Medical Summary</label>
            <div class="text-box">${referral.medicalSummary}</div>
          </div>
          <div>
            <label style="font-size: 12px; color: #666; display: block; margin-bottom: 4px;">Reason for Referral</label>
            <div class="text-box">${referral.reasonForReferral}</div>
          </div>
          ${referral.rejectionReason ? `
            <div style="margin-top: 16px;">
              <label style="font-size: 12px; color: #dc2626; display: block; margin-bottom: 4px;">Rejection Reason</label>
              <div class="text-box error">${referral.rejectionReason}</div>
            </div>
          ` : ''}
        </section>

        <section>
          <h2>Timeline</h2>
          <div class="grid">
            <div class="field"><label>Created</label><p>${format(new Date(referral.createdAt), 'MMMM d, yyyy h:mm a')}</p></div>
            <div class="field"><label>Last Updated</label><p>${format(new Date(referral.updatedAt), 'MMMM d, yyyy h:mm a')}</p></div>
          </div>
        </section>

        <footer>
          <p>This document was generated from MedRefer on ${format(new Date(), 'MMMM d, yyyy h:mm a')}</p>
          <p style="margin-top: 4px;">This is an official medical referral document. Please handle with confidentiality.</p>
        </footer>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                generateReferralPDF({
                  id: referral.id,
                  patientName: referral.patient.name,
                  patientAge: referral.patient.age,
                  patientContact: referral.patient.contact,
                  patientMedicalId: referral.patient.medicalId,
                  patientCode: referral.patientCode,
                  fromHospitalName: referral.fromHospitalName,
                  toHospitalName: referral.toHospitalName,
                  urgency: referral.urgency,
                  status: referral.status,
                  medicalSummary: referral.medicalSummary,
                  reason: referral.reasonForReferral,
                  createdAt: typeof referral.createdAt === 'string' ? referral.createdAt : referral.createdAt.toISOString(),
                  rejectionReason: referral.rejectionReason,
                  assignedDoctorName: referral.assignedDoctorName,
                }, referral.activityLog?.map(log => ({ ...log, created_at: log.timestamp.toISOString() })));
                toast.success('PDF downloaded successfully');
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePrint()}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card className="card-elevated animate-fade-in">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <StatusBadge status={referral.status} />
                  <UrgencyBadge urgency={referral.urgency} />
                </div>
                <CardTitle className="text-xl">{referral.patient.name}</CardTitle>
                <CardDescription>
                  {referral.patient.age} years old • {referral.specialty}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {referral.patient.contact}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    {referral.patient.medicalId}
                  </div>
                </div>

                {referral.patientCode && (
                  <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                    <p className="text-sm text-success font-medium mb-2">Patient Access Code</p>
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-mono font-bold text-foreground bg-background px-3 py-1.5 rounded">
                        {referral.patientCode}
                      </code>
                      <Button variant="ghost" size="icon" onClick={copyPatientCode}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Share this code with the patient for their medical history access
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medical Details */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Medical Summary</h4>
                  <p className="text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg">
                    {referral.medicalSummary}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Reason for Referral</h4>
                  <p className="text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg">
                    {referral.reasonForReferral}
                  </p>
                </div>
                {referral.rejectionReason && (
                  <div>
                    <h4 className="font-medium text-destructive mb-2">Rejection Reason</h4>
                    <p className="text-muted-foreground text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                      {referral.rejectionReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachments & Messages Tabs */}
            <Card className="card-elevated">
              <Tabs defaultValue="attachments" className="w-full">
                <CardHeader className="pb-0">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="attachments" className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Attachments ({attachments.length})
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Messages ({messages.length})
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="pt-4">
                  <TabsContent value="attachments" className="mt-0 space-y-4">
                    <FileUploadZone
                      onFilesSelected={handleFilesSelected}
                      uploading={uploading}
                      maxFiles={5}
                    />
                    <AttachmentsList
                      attachments={attachments}
                      loading={attachmentsLoading}
                      onDownload={handleDownload}
                      onDelete={deleteAttachment}
                      canDelete={true}
                      currentUserId={currentUser.id}
                    />
                  </TabsContent>
                  <TabsContent value="messages" className="mt-0">
                    <ReferralChat
                      messages={messages}
                      loading={messagesLoading}
                      sending={sending}
                      currentUserId={currentUser.id}
                      onSendMessage={sendMessage}
                    />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* Activity Log */}
            <Card className="card-elevated">
              <CardContent className="pt-6">
                <ActivityTimeline activities={referral.activityLog} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hospital Info */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Referral Route</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">From</p>
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{referral.fromHospitalName}</p>
                      <p className="text-sm text-muted-foreground">{referral.fromDoctorName}</p>
                    </div>
                  </div>
                </div>
                <div className="border-l-2 border-dashed border-border h-4 ml-2" />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">To</p>
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 mt-0.5 text-success" />
                    <div>
                      <p className="font-medium text-foreground">{referral.toHospitalName}</p>
                      <p className="text-sm text-muted-foreground">
                        {referral.assignedDoctorName || 'Awaiting assignment'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card className="card-elevated">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(referral.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(referral.updatedAt), 'MMM d, yyyy')}
                  </span>
                </div>
                {referral.completedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium text-success">
                      {format(new Date(referral.completedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {canTakeAction && (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {referral.status === 'pending' && (
                    <>
                      <Button 
                        className="w-full" 
                        onClick={() => handleAction('accept')}
                        disabled={isUpdating}
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Accept Referral
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleAction('more_info')}
                        disabled={isUpdating}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Request More Info
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={() => handleAction('reject')}
                        disabled={isUpdating}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Referral
                      </Button>
                    </>
                  )}
                  {referral.status === 'accepted' && (
                    <Button 
                      className="w-full" 
                      onClick={startTreatment}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Start Treatment
                    </Button>
                  )}
                  {referral.status === 'in_treatment' && (
                    <Button 
                      className="w-full bg-success hover:bg-success/90" 
                      onClick={() => handleAction('complete')}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Mark as Complete
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {currentAction === 'reject' && 'Reject Referral'}
                {currentAction === 'more_info' && 'Request Additional Information'}
                {currentAction === 'complete' && 'Complete Treatment'}
              </DialogTitle>
              <DialogDescription>
                {currentAction === 'reject' && 'Please provide a reason for rejecting this referral.'}
                {currentAction === 'more_info' && 'What additional information do you need?'}
                {currentAction === 'complete' && 'Add any notes about the completed treatment. A unique patient code will be generated.'}
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder={
                currentAction === 'reject' 
                  ? 'Reason for rejection...' 
                  : currentAction === 'more_info'
                  ? 'Information needed...'
                  : 'Treatment notes...'
              }
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button 
                onClick={confirmAction}
                variant={currentAction === 'reject' ? 'destructive' : 'default'}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ReferralDetail;
