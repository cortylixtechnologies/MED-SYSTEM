import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { StatusBadge, UrgencyBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Building2, 
  Users, 
  FileText, 
  Plus, 
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Shield
} from 'lucide-react';
import SecurityLogViewer from '@/components/SecurityLogViewer';
import IPBlockManager from '@/components/IPBlockManager';
import { Navigate } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';

type DbHospital = Database['public']['Tables']['hospitals']['Row'];
type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbReferral = Database['public']['Tables']['referrals']['Row'];
type DbUserRole = Database['public']['Tables']['user_roles']['Row'];

interface Hospital extends DbHospital {}

interface Profile extends DbProfile {
  hospital_name?: string;
  role?: string;
}

interface Referral extends DbReferral {
  from_hospital_name?: string;
  to_hospital_name?: string;
}

const AdminDashboard = () => {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Profile[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [userRoles, setUserRoles] = useState<DbUserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Add Hospital Dialog State
  const [addHospitalOpen, setAddHospitalOpen] = useState(false);
  const [newHospital, setNewHospital] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });
  const [addingHospital, setAddingHospital] = useState(false);

  // Add Doctor Dialog State
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    email: '',
    password: '',
    fullName: '',
    hospitalId: '',
    specialty: '',
    role: 'doctor' as 'doctor' | 'admin'
  });
  const [addingDoctor, setAddingDoctor] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Fetch hospitals
      const { data: hospitalsData } = await supabase
        .from('hospitals')
        .select('*')
        .order('name');
      
      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      // Fetch user roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*');
      
      // Fetch referrals
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      const hospitalsMap = new Map((hospitalsData || []).map(h => [h.id, h.name]));
      
      // Enrich profiles with hospital names and roles
      const enrichedProfiles: Profile[] = (profilesData || []).map(profile => {
        const role = (rolesData || []).find(r => r.user_id === profile.id);
        return {
          ...profile,
          hospital_name: profile.hospital_id ? hospitalsMap.get(profile.hospital_id) : undefined,
          role: role?.role || 'doctor'
        };
      });

      // Enrich referrals with hospital names
      const enrichedReferrals: Referral[] = (referralsData || []).map(referral => ({
        ...referral,
        from_hospital_name: hospitalsMap.get(referral.from_hospital_id),
        to_hospital_name: hospitalsMap.get(referral.to_hospital_id)
      }));

      if (hospitalsData) setHospitals(hospitalsData);
      setDoctors(enrichedProfiles);
      if (rolesData) setUserRoles(rolesData);
      setReferrals(enrichedReferrals);
      
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Redirect if not admin
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Statistics
  const stats = {
    totalReferrals: referrals.length,
    pendingReferrals: referrals.filter(r => r.status === 'pending').length,
    completedReferrals: referrals.filter(r => r.status === 'completed').length,
    emergencyReferrals: referrals.filter(r => r.urgency === 'emergency').length,
    totalHospitals: hospitals.length,
    totalDoctors: doctors.filter(d => d.role === 'doctor').length
  };

  // Filter referrals
  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = 
      referral.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.from_hospital_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.to_hospital_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.patient_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Add Hospital Handler
  const handleAddHospital = async () => {
    if (!newHospital.name) {
      toast.error('Hospital name is required');
      return;
    }

    setAddingHospital(true);
    
    const { data, error } = await supabase
      .from('hospitals')
      .insert({
        name: newHospital.name,
        address: newHospital.address || null,
        phone: newHospital.phone || null,
        email: newHospital.email || null
      })
      .select()
      .single();

    setAddingHospital(false);

    if (error) {
      toast.error('Failed to add hospital: ' + error.message);
      return;
    }

    setHospitals([...hospitals, data]);
    setNewHospital({ name: '', address: '', phone: '', email: '' });
    setAddHospitalOpen(false);
    toast.success('Hospital added successfully');
  };

  // Add Doctor Handler
  const handleAddDoctor = async () => {
    if (!newDoctor.email || !newDoctor.password || !newDoctor.fullName) {
      toast.error('Email, password, and full name are required');
      return;
    }

    setAddingDoctor(true);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newDoctor.email,
      password: newDoctor.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      }
    });

    if (authError) {
      toast.error('Failed to create user: ' + authError.message);
      setAddingDoctor(false);
      return;
    }

    if (!authData.user) {
      toast.error('Failed to create user');
      setAddingDoctor(false);
      return;
    }

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: newDoctor.email,
      full_name: newDoctor.fullName,
      hospital_id: newDoctor.hospitalId || null,
      specialty: newDoctor.specialty || null,
    });

    if (profileError) {
      toast.error('Failed to create profile: ' + profileError.message);
      setAddingDoctor(false);
      return;
    }

    // Assign role
    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: authData.user.id,
      role: newDoctor.role,
    });

    if (roleError) {
      toast.error('Failed to assign role: ' + roleError.message);
    }

    // Refresh doctors list
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('*');

    const hospitalsMap = new Map(hospitals.map(h => [h.id, h.name]));
    
    const enrichedProfiles: Profile[] = (profilesData || []).map(profile => {
      const role = (rolesData || []).find(r => r.user_id === profile.id);
      return {
        ...profile,
        hospital_name: profile.hospital_id ? hospitalsMap.get(profile.hospital_id) : undefined,
        role: role?.role || 'doctor'
      };
    });

    setDoctors(enrichedProfiles);

    setAddingDoctor(false);
    setNewDoctor({ email: '', password: '', fullName: '', hospitalId: '', specialty: '', role: 'doctor' });
    setAddDoctorOpen(false);
    toast.success('Doctor added successfully');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">System-wide overview and management</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                  <p className="text-xs text-muted-foreground">Total Referrals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingReferrals}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedReferrals}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.emergencyReferrals}</p>
                  <p className="text-xs text-muted-foreground">Emergency</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Building2 className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalHospitals}</p>
                  <p className="text-xs text-muted-foreground">Hospitals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Users className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalDoctors}</p>
                  <p className="text-xs text-muted-foreground">Doctors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="referrals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="referrals" className="gap-2">
              <FileText className="w-4 h-4" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="hospitals" className="gap-2">
              <Building2 className="w-4 h-4" />
              Hospitals
            </TabsTrigger>
            <TabsTrigger value="doctors" className="gap-2">
              <Users className="w-4 h-4" />
              Doctors
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* All Referrals Tab */}
          <TabsContent value="referrals" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>System-Wide Referrals</CardTitle>
                    <CardDescription>View and monitor all referrals across hospitals</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search referrals..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-full sm:w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="in_treatment">In Treatment</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>From Hospital</TableHead>
                          <TableHead>To Hospital</TableHead>
                          <TableHead>Urgency</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Code</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReferrals.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No referrals found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredReferrals.map((referral) => (
                            <TableRow key={referral.id}>
                              <TableCell className="font-medium">{referral.patient_name}</TableCell>
                              <TableCell>{referral.from_hospital_name || '—'}</TableCell>
                              <TableCell>{referral.to_hospital_name || '—'}</TableCell>
                              <TableCell>
                                <UrgencyBadge urgency={referral.urgency} />
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={referral.status} />
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(referral.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {referral.patient_code ? (
                                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                    {referral.patient_code}
                                  </code>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hospitals Tab */}
          <TabsContent value="hospitals" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Registered Hospitals</CardTitle>
                    <CardDescription>Manage participating healthcare facilities</CardDescription>
                  </div>
                  <Dialog open={addHospitalOpen} onOpenChange={setAddHospitalOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Hospital
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Hospital</DialogTitle>
                        <DialogDescription>
                          Register a new healthcare facility in the referral network
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="hospital-name">Hospital Name *</Label>
                          <Input
                            id="hospital-name"
                            placeholder="e.g., Central Medical Center"
                            value={newHospital.name}
                            onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hospital-address">Address</Label>
                          <Input
                            id="hospital-address"
                            placeholder="e.g., 123 Medical Drive"
                            value={newHospital.address}
                            onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hospital-phone">Phone</Label>
                          <Input
                            id="hospital-phone"
                            placeholder="e.g., (555) 123-4567"
                            value={newHospital.phone}
                            onChange={(e) => setNewHospital({ ...newHospital, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hospital-email">Email</Label>
                          <Input
                            id="hospital-email"
                            type="email"
                            placeholder="e.g., info@hospital.com"
                            value={newHospital.email}
                            onChange={(e) => setNewHospital({ ...newHospital, email: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddHospitalOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddHospital} disabled={addingHospital}>
                          {addingHospital ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Add Hospital
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hospital Name</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Referrals (In/Out)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hospitals.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No hospitals found
                            </TableCell>
                          </TableRow>
                        ) : (
                          hospitals.map((hospital) => {
                            const incomingCount = referrals.filter(r => r.to_hospital_id === hospital.id).length;
                            const outgoingCount = referrals.filter(r => r.from_hospital_id === hospital.id).length;
                            return (
                              <TableRow key={hospital.id}>
                                <TableCell className="font-medium">{hospital.name}</TableCell>
                                <TableCell>{hospital.address || '—'}</TableCell>
                                <TableCell>{hospital.phone || '—'}</TableCell>
                                <TableCell>{hospital.email || '—'}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Badge variant="secondary">{incomingCount} in</Badge>
                                    <Badge variant="outline">{outgoingCount} out</Badge>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Doctors Tab */}
          <TabsContent value="doctors" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Registered Doctors</CardTitle>
                    <CardDescription>Manage healthcare professionals in the network</CardDescription>
                  </div>
                  <Dialog open={addDoctorOpen} onOpenChange={setAddDoctorOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Doctor
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Doctor</DialogTitle>
                        <DialogDescription>
                          Create a new doctor account in the system
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="doctor-name">Full Name *</Label>
                          <Input
                            id="doctor-name"
                            placeholder="e.g., Dr. Jane Smith"
                            value={newDoctor.fullName}
                            onChange={(e) => setNewDoctor({ ...newDoctor, fullName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doctor-email">Email *</Label>
                          <Input
                            id="doctor-email"
                            type="email"
                            placeholder="e.g., doctor@hospital.com"
                            value={newDoctor.email}
                            onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doctor-password">Password *</Label>
                          <Input
                            id="doctor-password"
                            type="password"
                            placeholder="Create a password"
                            value={newDoctor.password}
                            onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doctor-hospital">Hospital</Label>
                          <Select 
                            value={newDoctor.hospitalId} 
                            onValueChange={(value) => setNewDoctor({ ...newDoctor, hospitalId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a hospital" />
                            </SelectTrigger>
                            <SelectContent>
                              {hospitals.map((hospital) => (
                                <SelectItem key={hospital.id} value={hospital.id}>
                                  {hospital.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doctor-specialty">Specialty</Label>
                          <Input
                            id="doctor-specialty"
                            placeholder="e.g., Cardiology"
                            value={newDoctor.specialty}
                            onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doctor-role">Role *</Label>
                          <Select 
                            value={newDoctor.role} 
                            onValueChange={(value: 'doctor' | 'admin') => setNewDoctor({ ...newDoctor, role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="doctor">Doctor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDoctorOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddDoctor} disabled={addingDoctor}>
                          {addingDoctor ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Add Doctor
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Hospital</TableHead>
                          <TableHead>Specialty</TableHead>
                          <TableHead>Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {doctors.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No doctors found
                            </TableCell>
                          </TableRow>
                        ) : (
                          doctors.map((doctor) => (
                            <TableRow key={doctor.id}>
                              <TableCell className="font-medium">{doctor.full_name}</TableCell>
                              <TableCell>{doctor.email}</TableCell>
                              <TableCell>{doctor.hospital_name || '—'}</TableCell>
                              <TableCell>{doctor.specialty || '—'}</TableCell>
                              <TableCell>
                                <Badge variant={doctor.role === 'admin' ? 'default' : 'secondary'}>
                                  {doctor.role || 'doctor'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <SecurityLogViewer />
              </div>
              <div className="lg:col-span-2">
                <IPBlockManager />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
