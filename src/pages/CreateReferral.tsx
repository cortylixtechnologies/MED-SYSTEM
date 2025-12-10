import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useReferrals } from '@/contexts/ReferralContext';
import { hospitals } from '@/data/mockData';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { ArrowLeft, Send, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { UrgencyLevel } from '@/types/referral';

const CreateReferral = () => {
  const { currentUser } = useAuth();
  const { addReferral } = useReferrals();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    patientContact: '',
    medicalId: '',
    medicalSummary: '',
    reasonForReferral: '',
    toHospitalId: '',
    specialty: '',
    urgency: 'routine' as UrgencyLevel,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  const availableHospitals = hospitals.filter(h => h.id !== currentUser.hospitalId);

  const selectedHospital = availableHospitals.find(h => h.id === formData.toHospitalId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const targetHospital = hospitals.find(h => h.id === formData.toHospitalId);

    addReferral({
      patient: {
        id: `p-${Date.now()}`,
        name: formData.patientName,
        age: parseInt(formData.patientAge),
        contact: formData.patientContact,
        medicalId: formData.medicalId,
      },
      medicalSummary: formData.medicalSummary,
      reasonForReferral: formData.reasonForReferral,
      urgency: formData.urgency,
      status: 'pending',
      fromHospitalId: currentUser.hospitalId,
      fromHospitalName: currentUser.hospitalName,
      fromDoctorId: currentUser.id,
      fromDoctorName: currentUser.name,
      toHospitalId: formData.toHospitalId,
      toHospitalName: targetHospital?.name || '',
      specialty: formData.specialty,
    });

    setIsSubmitting(false);
    toast.success('Referral created successfully!', {
      description: `Sent to ${targetHospital?.name}`,
    });
    navigate('/sent-referrals');
  };

  const urgencyOptions = [
    { value: 'routine', label: 'Routine', icon: CheckCircle, description: 'Standard processing time', color: 'text-muted-foreground' },
    { value: 'urgent', label: 'Urgent', icon: Clock, description: 'Requires attention within 24-48 hours', color: 'text-warning' },
    { value: 'emergency', label: 'Emergency', icon: AlertTriangle, description: 'Immediate attention required', color: 'text-destructive' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="card-elevated animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Create New Referral
            </CardTitle>
            <CardDescription>
              Send a patient referral to another hospital. All fields are required.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground border-b border-border pb-2">
                  Patient Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Patient Name</Label>
                    <Input
                      id="patientName"
                      placeholder="Full name"
                      value={formData.patientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patientAge">Age</Label>
                    <Input
                      id="patientAge"
                      type="number"
                      placeholder="Years"
                      min="0"
                      max="150"
                      value={formData.patientAge}
                      onChange={(e) => setFormData(prev => ({ ...prev, patientAge: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patientContact">Contact Number</Label>
                    <Input
                      id="patientContact"
                      placeholder="+1-555-0123"
                      value={formData.patientContact}
                      onChange={(e) => setFormData(prev => ({ ...prev, patientContact: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicalId">Medical ID</Label>
                    <Input
                      id="medicalId"
                      placeholder="MED-2024-XXX"
                      value={formData.medicalId}
                      onChange={(e) => setFormData(prev => ({ ...prev, medicalId: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Medical Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground border-b border-border pb-2">
                  Medical Details
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="medicalSummary">Medical Summary</Label>
                  <Textarea
                    id="medicalSummary"
                    placeholder="Provide a summary of the patient's condition, symptoms, and relevant medical history..."
                    rows={4}
                    value={formData.medicalSummary}
                    onChange={(e) => setFormData(prev => ({ ...prev, medicalSummary: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reasonForReferral">Reason for Referral</Label>
                  <Textarea
                    id="reasonForReferral"
                    placeholder="Explain why the patient is being referred and what specialist care is needed..."
                    rows={3}
                    value={formData.reasonForReferral}
                    onChange={(e) => setFormData(prev => ({ ...prev, reasonForReferral: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Destination & Urgency */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground border-b border-border pb-2">
                  Referral Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Destination Hospital</Label>
                    <Select
                      value={formData.toHospitalId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, toHospitalId: value, specialty: '' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select hospital" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableHospitals.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id}>
                            {hospital.name} ({hospital.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Specialty Required</Label>
                    <Select
                      value={formData.specialty}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, specialty: value }))}
                      disabled={!selectedHospital}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedHospital ? "Select specialty" : "Select hospital first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedHospital?.specialty.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Urgency Level</Label>
                  <RadioGroup
                    value={formData.urgency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value as UrgencyLevel }))}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {urgencyOptions.map((option) => (
                      <Label
                        key={option.value}
                        htmlFor={option.value}
                        className={`
                          flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                          ${formData.urgency === option.value 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'}
                        `}
                      >
                        <RadioGroupItem value={option.value} id={option.value} />
                        <div className="space-y-1">
                          <div className={`font-medium flex items-center gap-1.5 ${option.color}`}>
                            <option.icon className="w-4 h-4" />
                            {option.label}
                          </div>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.toHospitalId || !formData.specialty}
                  className="flex-1"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Referral'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateReferral;
