import { useState } from 'react';
import { useReferrals } from '@/contexts/ReferralContext';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import ReferralCard from '@/components/ReferralCard';
import { StatusBadge, UrgencyBadge } from '@/components/StatusBadge';
import { hospitals, mockDoctors } from '@/data/mockData';
import { Hospital, Doctor } from '@/types/referral';
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
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const { referrals } = useReferrals();
  const [hospitalsList, setHospitalsList] = useState<Hospital[]>(hospitals);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>(mockDoctors);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Add Hospital Dialog State
  const [addHospitalOpen, setAddHospitalOpen] = useState(false);
  const [newHospital, setNewHospital] = useState({
    name: '',
    city: '',
    specialty: ''
  });

  // Add Doctor Dialog State
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    hospitalId: '',
    specialty: '',
    role: 'doctor' as 'doctor' | 'admin'
  });

  // Redirect if not admin
  if (currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Statistics
  const stats = {
    totalReferrals: referrals.length,
    pendingReferrals: referrals.filter(r => r.status === 'pending').length,
    completedReferrals: referrals.filter(r => r.status === 'completed').length,
    emergencyReferrals: referrals.filter(r => r.urgency === 'emergency').length,
    totalHospitals: hospitalsList.length,
    totalDoctors: doctorsList.filter(d => d.role === 'doctor').length
  };

  // Filter referrals
  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = 
      referral.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.fromHospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.toHospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.patientCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Add Hospital Handler
  const handleAddHospital = () => {
    if (!newHospital.name || !newHospital.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    const hospital: Hospital = {
      id: `h${hospitalsList.length + 1}`,
      name: newHospital.name,
      city: newHospital.city,
      specialty: newHospital.specialty.split(',').map(s => s.trim()).filter(Boolean)
    };

    setHospitalsList([...hospitalsList, hospital]);
    setNewHospital({ name: '', city: '', specialty: '' });
    setAddHospitalOpen(false);
    toast.success('Hospital added successfully');
  };

  // Add Doctor Handler
  const handleAddDoctor = () => {
    if (!newDoctor.name || !newDoctor.email || !newDoctor.hospitalId || !newDoctor.specialty) {
      toast.error('Please fill in all required fields');
      return;
    }

    const hospital = hospitalsList.find(h => h.id === newDoctor.hospitalId);
    const doctor: Doctor = {
      id: `d${doctorsList.length + 1}`,
      name: newDoctor.name,
      email: newDoctor.email,
      hospitalId: newDoctor.hospitalId,
      hospitalName: hospital?.name || '',
      specialty: newDoctor.specialty,
      role: newDoctor.role
    };

    setDoctorsList([...doctorsList, doctor]);
    setNewDoctor({ name: '', email: '', hospitalId: '', specialty: '', role: 'doctor' });
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
                  <Users className="w-5 h-5 text-accent" />
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
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="referrals" className="gap-2">
              <FileText className="w-4 h-4" />
              All Referrals
            </TabsTrigger>
            <TabsTrigger value="hospitals" className="gap-2">
              <Building2 className="w-4 h-4" />
              Hospitals
            </TabsTrigger>
            <TabsTrigger value="doctors" className="gap-2">
              <Users className="w-4 h-4" />
              Doctors
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
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>From Hospital</TableHead>
                        <TableHead>To Hospital</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Code</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReferrals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No referrals found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredReferrals.map((referral) => (
                          <TableRow key={referral.id}>
                            <TableCell className="font-medium">{referral.patient.name}</TableCell>
                            <TableCell>{referral.fromHospitalName}</TableCell>
                            <TableCell>{referral.toHospitalName}</TableCell>
                            <TableCell>{referral.specialty}</TableCell>
                            <TableCell>
                              <UrgencyBadge urgency={referral.urgency} />
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={referral.status} />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {referral.createdAt.toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {referral.patientCode ? (
                                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                  {referral.patientCode}
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
                          <Label htmlFor="hospital-city">City *</Label>
                          <Input
                            id="hospital-city"
                            placeholder="e.g., San Francisco"
                            value={newHospital.city}
                            onChange={(e) => setNewHospital({ ...newHospital, city: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hospital-specialty">Specialties (comma-separated)</Label>
                          <Input
                            id="hospital-specialty"
                            placeholder="e.g., Cardiology, Oncology, Neurology"
                            value={newHospital.specialty}
                            onChange={(e) => setNewHospital({ ...newHospital, specialty: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddHospitalOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddHospital}>Add Hospital</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hospital Name</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Specialties</TableHead>
                        <TableHead>Referrals (In/Out)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hospitalsList.map((hospital) => {
                        const incomingCount = referrals.filter(r => r.toHospitalId === hospital.id).length;
                        const outgoingCount = referrals.filter(r => r.fromHospitalId === hospital.id).length;
                        return (
                          <TableRow key={hospital.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" />
                                {hospital.name}
                              </div>
                            </TableCell>
                            <TableCell>{hospital.city}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {hospital.specialty.map((spec) => (
                                  <Badge key={spec} variant="secondary" className="text-xs">
                                    {spec}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-success">{incomingCount} in</span>
                              {' / '}
                              <span className="text-info">{outgoingCount} out</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
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
                    <CardDescription>Manage physician accounts and credentials</CardDescription>
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
                          Register a new physician in the referral system
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="doctor-name">Full Name *</Label>
                          <Input
                            id="doctor-name"
                            placeholder="e.g., Dr. Jane Smith"
                            value={newDoctor.name}
                            onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doctor-email">Email *</Label>
                          <Input
                            id="doctor-email"
                            type="email"
                            placeholder="e.g., jane.smith@hospital.com"
                            value={newDoctor.email}
                            onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doctor-hospital">Hospital *</Label>
                          <Select 
                            value={newDoctor.hospitalId} 
                            onValueChange={(value) => setNewDoctor({ ...newDoctor, hospitalId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select hospital" />
                            </SelectTrigger>
                            <SelectContent>
                              {hospitalsList.map((hospital) => (
                                <SelectItem key={hospital.id} value={hospital.id}>
                                  {hospital.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doctor-specialty">Specialty *</Label>
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
                              <SelectValue placeholder="Select role" />
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
                        <Button onClick={handleAddDoctor}>Add Doctor</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
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
                      {doctorsList.map((doctor) => (
                        <TableRow key={doctor.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {doctor.name.split(' ').slice(-1)[0][0]}
                                </span>
                              </div>
                              {doctor.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{doctor.email}</TableCell>
                          <TableCell>{doctor.hospitalName}</TableCell>
                          <TableCell>{doctor.specialty}</TableCell>
                          <TableCell>
                            <Badge variant={doctor.role === 'admin' ? 'default' : 'secondary'}>
                              {doctor.role}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
