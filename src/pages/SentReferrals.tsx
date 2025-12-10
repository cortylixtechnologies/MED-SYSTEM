import { useAuth } from '@/contexts/AuthContext';
import { useReferrals } from '@/contexts/ReferralContext';
import Navigation from '@/components/Navigation';
import ReferralCard from '@/components/ReferralCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SentReferrals = () => {
  const { currentUser } = useAuth();
  const { referrals } = useReferrals();

  if (!currentUser) return null;

  const sentReferrals = referrals
    .filter(r => r.fromHospitalId === currentUser.hospitalId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingReferrals = sentReferrals.filter(r => r.status === 'pending' || r.status === 'more_info_requested');
  const activeReferrals = sentReferrals.filter(r => r.status === 'accepted' || r.status === 'in_treatment');
  const completedReferrals = sentReferrals.filter(r => r.status === 'completed' || r.status === 'rejected');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sent Referrals</h1>
            <p className="text-muted-foreground">Track referrals you've sent to other hospitals</p>
          </div>
          <Link to="/create-referral">
            <Button>
              <Send className="w-4 h-4 mr-2" />
              New Referral
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({sentReferrals.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingReferrals.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeReferrals.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedReferrals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {sentReferrals.length > 0 ? (
              sentReferrals.map(referral => (
                <ReferralCard key={referral.id} referral={referral} showFromHospital={false} />
              ))
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingReferrals.length > 0 ? (
              pendingReferrals.map(referral => (
                <ReferralCard key={referral.id} referral={referral} showFromHospital={false} />
              ))
            ) : (
              <EmptyState message="No pending referrals" />
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeReferrals.length > 0 ? (
              activeReferrals.map(referral => (
                <ReferralCard key={referral.id} referral={referral} showFromHospital={false} />
              ))
            ) : (
              <EmptyState message="No active referrals" />
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedReferrals.length > 0 ? (
              completedReferrals.map(referral => (
                <ReferralCard key={referral.id} referral={referral} showFromHospital={false} />
              ))
            ) : (
              <EmptyState message="No completed referrals" />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const EmptyState = ({ message = "No referrals found" }: { message?: string }) => (
  <Card className="card-elevated">
    <CardContent className="py-12 text-center">
      <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
      <p className="text-muted-foreground">{message}</p>
      <Link to="/create-referral">
        <Button variant="outline" className="mt-4">
          Create New Referral
        </Button>
      </Link>
    </CardContent>
  </Card>
);

export default SentReferrals;
