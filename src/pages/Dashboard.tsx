import { useAuth } from '@/contexts/AuthContext';
import { useReferrals } from '@/contexts/ReferralContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Send, 
  Inbox, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  FileText,
  Activity
} from 'lucide-react';
import ReferralCard from '@/components/ReferralCard';
import Navigation from '@/components/Navigation';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { referrals } = useReferrals();

  if (!currentUser) return null;

  const sentReferrals = referrals.filter(r => r.fromHospitalId === currentUser.hospitalId);
  const incomingReferrals = referrals.filter(r => r.toHospitalId === currentUser.hospitalId);
  
  const pendingIncoming = incomingReferrals.filter(r => r.status === 'pending');
  const inTreatment = incomingReferrals.filter(r => r.status === 'in_treatment' || r.status === 'accepted');
  const completed = [...sentReferrals, ...incomingReferrals].filter(r => r.status === 'completed');

  const stats = [
    { label: 'Sent Referrals', value: sentReferrals.length, icon: Send, color: 'text-primary' },
    { label: 'Pending Review', value: pendingIncoming.length, icon: Clock, color: 'text-warning' },
    { label: 'In Treatment', value: inTreatment.length, icon: Activity, color: 'text-info' },
    { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'text-success' },
  ];

  const recentReferrals = [...sentReferrals, ...incomingReferrals]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {currentUser.name.split(' ')[1]}
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentUser.hospitalName} • {currentUser.specialty}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link to="/create-referral">
            <Card className="card-elevated hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Send className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Create New Referral</h3>
                  <p className="text-sm text-muted-foreground">Send a patient to another hospital</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/incoming-referrals">
            <Card className="card-elevated hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors relative">
                  <Inbox className="w-6 h-6 text-warning" />
                  {pendingIncoming.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
                      {pendingIncoming.length}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Review Incoming Referrals</h3>
                  <p className="text-sm text-muted-foreground">
                    {pendingIncoming.length > 0 
                      ? `${pendingIncoming.length} pending your review`
                      : 'No pending referrals'}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-warning transition-colors" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={stat.label} className="card-elevated animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Referrals</CardTitle>
              <CardDescription>Latest updates across your referrals</CardDescription>
            </div>
            <Link to="/sent-referrals">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReferrals.length > 0 ? (
              recentReferrals.map((referral) => (
                <ReferralCard 
                  key={referral.id} 
                  referral={referral}
                  showFromHospital={referral.toHospitalId === currentUser.hospitalId}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No referrals yet</p>
                <p className="text-sm">Create your first referral to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
