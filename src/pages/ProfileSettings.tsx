import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Save, User, Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { TwoFactorSetup, TwoFactorDisable } from '@/components/TwoFactorSetup';
import { useMFA } from '@/hooks/useMFA';

const SPECIALTIES = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Oncology',
  'Dermatology',
  'Psychiatry',
  'Radiology',
  'Emergency Medicine',
  'Internal Medicine',
  'General Surgery',
  'Ophthalmology',
  'ENT',
  'Gastroenterology',
  'Pulmonology',
  'Nephrology',
  'Endocrinology',
  'Rheumatology',
  'Urology',
  'Obstetrics & Gynecology',
];

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available', description: 'Accepting new referrals' },
  { value: 'busy', label: 'Busy', description: 'Limited availability' },
  { value: 'unavailable', label: 'Unavailable', description: 'Not accepting referrals' },
];

const REFERRAL_METHODS = [
  { value: 'in-app', label: 'In-App Messages' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Call' },
];

interface ProfileData {
  full_name: string;
  email: string;
  specialty: string;
  phone: string;
  bio: string;
  years_experience: number | null;
  availability_status: string;
  preferred_referral_method: string;
}

const ProfileSettings = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [showMfaDisable, setShowMfaDisable] = useState(false);
  const { isEnabled: mfaEnabled, factors, loading: mfaLoading, refresh: refreshMfa } = useMFA();
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    specialty: '',
    phone: '',
    bio: '',
    years_experience: null,
    availability_status: 'available',
    preferred_referral_method: 'in-app',
  });

  useEffect(() => {
    if (currentUser?.id) {
      fetchProfile();
    }
  }, [currentUser?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          specialty: data.specialty || '',
          phone: data.phone || '',
          bio: data.bio || '',
          years_experience: data.years_experience,
          availability_status: data.availability_status || 'available',
          preferred_referral_method: data.preferred_referral_method || 'in-app',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          specialty: profile.specialty || null,
          phone: profile.phone || null,
          bio: profile.bio || null,
          years_experience: profile.years_experience,
          availability_status: profile.availability_status,
          preferred_referral_method: profile.preferred_referral_method,
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your professional profile and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{profile.full_name}</h2>
                  <p className="text-muted-foreground">{profile.email}</p>
                  {currentUser?.hospital_name && (
                    <p className="text-sm text-muted-foreground mt-1">{currentUser.hospital_name}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your basic profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Dr. John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Select
                    value={profile.specialty}
                    onValueChange={(value) => setProfile({ ...profile, specialty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="years_experience">Years of Experience</Label>
                  <Input
                    id="years_experience"
                    type="number"
                    min={0}
                    max={60}
                    value={profile.years_experience ?? ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        years_experience: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Write a brief professional bio..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Availability & Preferences */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Availability & Preferences</CardTitle>
              <CardDescription>Control how other doctors can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Availability Status</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProfile({ ...profile, availability_status: option.value })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        profile.availability_status === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_method">Preferred Referral Method</Label>
                <Select
                  value={profile.preferred_referral_method}
                  onValueChange={(value) => setProfile({ ...profile, preferred_referral_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred method" />
                  </SelectTrigger>
                  <SelectContent>
                    {REFERRAL_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Security - Two-Factor Authentication */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {mfaEnabled ? (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <ShieldOff className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      {mfaEnabled
                        ? 'Your account is protected with 2FA'
                        : 'Add an extra layer of security to your account'}
                    </p>
                  </div>
                </div>
                {mfaLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mfaEnabled ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowMfaDisable(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <ShieldOff className="w-4 h-4 mr-2" />
                    Disable
                  </Button>
                ) : (
                  <Button onClick={() => setShowMfaSetup(true)}>
                    <Shield className="w-4 h-4 mr-2" />
                    Enable 2FA
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* 2FA Setup Dialog */}
        <TwoFactorSetup
          open={showMfaSetup}
          onOpenChange={setShowMfaSetup}
          onComplete={refreshMfa}
        />

        {/* 2FA Disable Dialog */}
        {factors[0] && (
          <TwoFactorDisable
            open={showMfaDisable}
            onOpenChange={setShowMfaDisable}
            factorId={factors[0].id}
            onDisabled={refreshMfa}
          />
        )}
      </main>
    </div>
  );
};

export default ProfileSettings;
