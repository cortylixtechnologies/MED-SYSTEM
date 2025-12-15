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
  MessageCircle
} from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

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
