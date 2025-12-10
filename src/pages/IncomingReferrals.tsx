import { useAuth } from '@/contexts/AuthContext';
import { useReferrals } from '@/contexts/ReferralContext';
import Navigation from '@/components/Navigation';
import ReferralCard from '@/components/ReferralCard';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Inbox, AlertCircle } from 'lucide-react';

const IncomingReferrals = () => {
  const { currentUser } = useAuth();
  const { referrals } = useReferrals();

  if (!currentUser) return null;

  const incomingReferrals = referrals
    .filter(r => r.toHospitalId === currentUser.hospitalId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingReferrals = incomingReferrals.filter(r => r.status === 'pending');
  const activeReferrals = incomingReferrals.filter(r => r.status === 'accepted' || r.status === 'in_treatment');
  const completedReferrals = incomingReferrals.filter(r => r.status === 'completed' || r.status === 'rejected');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Incoming Referrals</h1>
            {pendingReferrals.length > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {pendingReferrals.length} pending
              </span>
            )}
          </div>
          <p className="text-muted-foreground">Referrals received from other hospitals</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pending ({pendingReferrals.length})
              {pendingReferrals.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="active">In Progress ({activeReferrals.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedReferrals.length})</TabsTrigger>
            <TabsTrigger value="all">All ({incomingReferrals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingReferrals.length > 0 ? (
              pendingReferrals.map(referral => (
                <ReferralCard key={referral.id} referral={referral} showFromHospital={true} />
              ))
            ) : (
              <EmptyState message="No pending referrals to review" />
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeReferrals.length > 0 ? (
              activeReferrals.map(referral => (
                <ReferralCard key={referral.id} referral={referral} showFromHospital={true} />
              ))
            ) : (
              <EmptyState message="No referrals in progress" />
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedReferrals.length > 0 ? (
              completedReferrals.map(referral => (
                <ReferralCard key={referral.id} referral={referral} showFromHospital={true} />
              ))
            ) : (
              <EmptyState message="No completed referrals" />
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {incomingReferrals.length > 0 ? (
              incomingReferrals.map(referral => (
                <ReferralCard key={referral.id} referral={referral} showFromHospital={true} />
              ))
            ) : (
              <EmptyState />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const EmptyState = ({ message = "No incoming referrals" }: { message?: string }) => (
  <Card className="card-elevated">
    <CardContent className="py-12 text-center">
      <Inbox className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
      <p className="text-muted-foreground">{message}</p>
    </CardContent>
  </Card>
);

export default IncomingReferrals;
