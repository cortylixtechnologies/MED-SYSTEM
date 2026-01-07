import { useAuth } from '@/contexts/AuthContext';
import { useReferrals } from '@/hooks/useReferrals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Send, 
  Inbox, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  FileText,
  Activity,
  Loader2,
  Shield,
  AlertTriangle
} from 'lucide-react';
import ReferralCard from '@/components/ReferralCard';
import Navigation from '@/components/Navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { referrals, loading } = useReferrals();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const hasHospital = !!currentUser.hospital_id;

  // For admins, show all referrals; for doctors, show only their hospital's referrals
  const sentReferrals = isAdmin 
    ? referrals 
    : referrals.filter(r => r.fromHospitalId === currentUser.hospital_id);
  const incomingReferrals = isAdmin 
    ? referrals 
    : referrals.filter(r => r.toHospitalId === currentUser.hospital_id);
  
  const pendingIncoming = incomingReferrals.filter(r => r.status === 'pending');
  const inTreatment = incomingReferrals.filter(r => r.status === 'in_treatment' || r.status === 'accepted');
  const completed = [...sentReferrals, ...incomingReferrals].filter(r => r.status === 'completed');

  // Role-based theme colors
  const themeColor = isAdmin ? 'accent' : 'primary';
  const themeBg = isAdmin ? 'bg-accent' : 'bg-primary';
  const themeBgLight = isAdmin ? 'bg-accent/10' : 'bg-primary/10';
  const themeBgMedium = isAdmin ? 'bg-accent/20' : 'bg-primary/20';
  const themeText = isAdmin ? 'text-accent' : 'text-primary';
  const themeBorder = isAdmin ? 'border-accent/20' : 'border-primary/20';

  const stats = [
    { label: isAdmin ? 'Total Referrals' : 'Sent Referrals', value: sentReferrals.length, icon: Send, color: themeText },
    { label: 'Pending Review', value: pendingIncoming.length, icon: Clock, color: 'text-warning' },
    { label: 'In Treatment', value: inTreatment.length, icon: Activity, color: 'text-info' },
    { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'text-success' },
  ];

  const recentReferrals = [...sentReferrals, ...incomingReferrals]
    .filter((r, i, arr) => arr.findIndex(x => x.id === r.id) === i) // Remove duplicates
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <div className={`min-h-screen ${isAdmin ? 'bg-gradient-to-br from-accent/5 via-background to-accent/10' : 'bg-gradient-to-br from-primary/5 via-background to-secondary/10'}`}>
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <Loader2 className={`w-8 h-8 animate-spin ${themeText}`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isAdmin ? 'bg-gradient-to-br from-accent/5 via-background to-accent/10' : 'bg-gradient-to-br from-primary/5 via-background to-secondary/10'}`}>
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2">
            <h1 className={`text-2xl font-bold ${isAdmin ? 'text-accent' : 'text-foreground'}`}>
              Welcome back, {currentUser.full_name.split(' ')[1] || currentUser.full_name}
            </h1>
            {isAdmin && (
              <span className="bg-accent/15 text-accent text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 border border-accent/30">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {currentUser.hospital_name || 'System Administrator'} • {currentUser.specialty || (isAdmin ? 'All Hospitals' : 'General')}
          </p>
        </div>

        {/* Warning for doctors without hospital */}
        {!isAdmin && !hasHospital && (
          <Alert className="mb-6 border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              You are not assigned to a hospital. Please contact an administrator to be assigned before creating referrals.
            </AlertDescription>
          </Alert>
        )}

        {/* Admin Quick Action */}
        {isAdmin && (
          <Link to="/admin" className="block mb-4">
            <Card className={`card-elevated hover:shadow-lg transition-all duration-200 cursor-pointer group ${themeBorder} ${themeBgLight}`}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${themeBgMedium} flex items-center justify-center group-hover:bg-accent/30 transition-colors`}>
                  <Shield className={`w-6 h-6 ${themeText}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Admin Dashboard</h3>
                  <p className="text-sm text-muted-foreground">Manage hospitals, doctors, and view all referrals</p>
                </div>
                <ArrowRight className={`w-5 h-5 text-muted-foreground group-hover:${themeText} transition-colors`} />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {hasHospital && (
            <Link to="/create-referral">
              <Card className={`card-elevated hover:shadow-lg transition-all duration-200 cursor-pointer group ${isAdmin ? 'hover:border-accent/30' : 'hover:border-primary/30'}`}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${themeBgLight} flex items-center justify-center group-hover:${themeBgMedium} transition-colors`}>
                    <Send className={`w-6 h-6 ${themeText}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Create New Referral</h3>
                    <p className="text-sm text-muted-foreground">Send a patient to another hospital</p>
                  </div>
                  <ArrowRight className={`w-5 h-5 text-muted-foreground group-hover:${themeText} transition-colors`} />
                </CardContent>
              </Card>
            </Link>
          )}

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
                  showFromHospital={referral.toHospitalId === currentUser.hospital_id}
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
