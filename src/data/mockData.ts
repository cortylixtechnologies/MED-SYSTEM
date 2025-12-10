import { Hospital, Doctor, Referral, UrgencyLevel, ReferralStatus } from '@/types/referral';

export const hospitals: Hospital[] = [
  { id: 'h1', name: 'Metro General Hospital', city: 'New York', specialty: ['Cardiology', 'Oncology', 'Neurology'] },
  { id: 'h2', name: 'City Medical Center', city: 'Los Angeles', specialty: ['Orthopedics', 'Pediatrics', 'Cardiology'] },
  { id: 'h3', name: 'Regional Health Hospital', city: 'Chicago', specialty: ['Oncology', 'Pulmonology', 'Gastroenterology'] },
  { id: 'h4', name: 'University Medical Center', city: 'Boston', specialty: ['Neurology', 'Cardiology', 'Oncology'] },
  { id: 'h5', name: 'Central Healthcare System', city: 'Houston', specialty: ['Orthopedics', 'Nephrology', 'Dermatology'] },
];

export const mockDoctors: Doctor[] = [
  { id: 'd1', name: 'Dr. Sarah Johnson', email: 'sarah.j@metrogeneral.com', hospitalId: 'h1', hospitalName: 'Metro General Hospital', specialty: 'Cardiology', role: 'doctor' },
  { id: 'd2', name: 'Dr. Michael Chen', email: 'michael.c@citymed.com', hospitalId: 'h2', hospitalName: 'City Medical Center', specialty: 'Oncology', role: 'doctor' },
  { id: 'd3', name: 'Dr. Emily Rodriguez', email: 'emily.r@regional.com', hospitalId: 'h3', hospitalName: 'Regional Health Hospital', specialty: 'Neurology', role: 'doctor' },
  { id: 'admin1', name: 'Admin User', email: 'admin@medreferral.com', hospitalId: 'system', hospitalName: 'System Admin', specialty: 'Administration', role: 'admin' },
];

export const generatePatientCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `REF-${part1}-${part2}`;
};

export const mockReferrals: Referral[] = [
  {
    id: 'ref1',
    patientCode: 'REF-7A7B-2C9D',
    patient: { id: 'p1', name: 'John Smith', age: 45, contact: '+1-555-0123', medicalId: 'MED-2024-001' },
    medicalSummary: 'Patient presents with persistent chest pain and shortness of breath. ECG shows abnormalities.',
    reasonForReferral: 'Suspected coronary artery disease requiring specialist evaluation and possible intervention.',
    urgency: 'urgent',
    status: 'completed',
    fromHospitalId: 'h2',
    fromHospitalName: 'City Medical Center',
    fromDoctorId: 'd2',
    fromDoctorName: 'Dr. Michael Chen',
    toHospitalId: 'h1',
    toHospitalName: 'Metro General Hospital',
    assignedDoctorId: 'd1',
    assignedDoctorName: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-22'),
    completedAt: new Date('2024-01-22'),
    activityLog: [
      { id: 'a1', referralId: 'ref1', timestamp: new Date('2024-01-15'), action: 'Referral Created', performedBy: 'Dr. Michael Chen' },
      { id: 'a2', referralId: 'ref1', timestamp: new Date('2024-01-16'), action: 'Referral Accepted', performedBy: 'Dr. Sarah Johnson' },
      { id: 'a3', referralId: 'ref1', timestamp: new Date('2024-01-22'), action: 'Treatment Completed', performedBy: 'Dr. Sarah Johnson', details: 'Successful angioplasty performed' },
    ],
  },
  {
    id: 'ref2',
    patient: { id: 'p2', name: 'Maria Garcia', age: 62, contact: '+1-555-0456', medicalId: 'MED-2024-002' },
    medicalSummary: 'Patient diagnosed with stage 2 breast cancer. Requires specialized oncology treatment.',
    reasonForReferral: 'Referral for chemotherapy and radiation therapy planning.',
    urgency: 'urgent',
    status: 'in_treatment',
    fromHospitalId: 'h1',
    fromHospitalName: 'Metro General Hospital',
    fromDoctorId: 'd1',
    fromDoctorName: 'Dr. Sarah Johnson',
    toHospitalId: 'h3',
    toHospitalName: 'Regional Health Hospital',
    specialty: 'Oncology',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-21'),
    activityLog: [
      { id: 'a4', referralId: 'ref2', timestamp: new Date('2024-01-20'), action: 'Referral Created', performedBy: 'Dr. Sarah Johnson' },
      { id: 'a5', referralId: 'ref2', timestamp: new Date('2024-01-21'), action: 'Referral Accepted', performedBy: 'Dr. Emily Rodriguez' },
    ],
  },
  {
    id: 'ref3',
    patient: { id: 'p3', name: 'Robert Wilson', age: 38, contact: '+1-555-0789', medicalId: 'MED-2024-003' },
    medicalSummary: 'Patient experiencing severe migraines with visual disturbances. MRI requested.',
    reasonForReferral: 'Neurological evaluation for possible migraine with aura or other underlying condition.',
    urgency: 'routine',
    status: 'pending',
    fromHospitalId: 'h2',
    fromHospitalName: 'City Medical Center',
    fromDoctorId: 'd2',
    fromDoctorName: 'Dr. Michael Chen',
    toHospitalId: 'h4',
    toHospitalName: 'University Medical Center',
    specialty: 'Neurology',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
    activityLog: [
      { id: 'a6', referralId: 'ref3', timestamp: new Date('2024-01-25'), action: 'Referral Created', performedBy: 'Dr. Michael Chen' },
    ],
  },
  {
    id: 'ref4',
    patient: { id: 'p4', name: 'Lisa Thompson', age: 55, contact: '+1-555-0321', medicalId: 'MED-2024-004' },
    medicalSummary: 'Patient with acute abdominal pain, suspected gallbladder inflammation.',
    reasonForReferral: 'Emergency surgical evaluation required.',
    urgency: 'emergency',
    status: 'accepted',
    fromHospitalId: 'h3',
    fromHospitalName: 'Regional Health Hospital',
    fromDoctorId: 'd3',
    fromDoctorName: 'Dr. Emily Rodriguez',
    toHospitalId: 'h1',
    toHospitalName: 'Metro General Hospital',
    assignedDoctorId: 'd1',
    assignedDoctorName: 'Dr. Sarah Johnson',
    specialty: 'General Surgery',
    createdAt: new Date('2024-01-26'),
    updatedAt: new Date('2024-01-26'),
    activityLog: [
      { id: 'a7', referralId: 'ref4', timestamp: new Date('2024-01-26'), action: 'Referral Created', performedBy: 'Dr. Emily Rodriguez' },
      { id: 'a8', referralId: 'ref4', timestamp: new Date('2024-01-26'), action: 'Referral Accepted (Emergency)', performedBy: 'Dr. Sarah Johnson' },
    ],
  },
];

export const getStatusColor = (status: ReferralStatus): string => {
  const colors: Record<ReferralStatus, string> = {
    pending: 'bg-warning/10 text-warning border-warning/30',
    accepted: 'bg-info/10 text-info border-info/30',
    in_treatment: 'bg-primary/10 text-primary border-primary/30',
    more_info_requested: 'bg-accent/10 text-accent border-accent/30',
    rejected: 'bg-destructive/10 text-destructive border-destructive/30',
    completed: 'bg-success/10 text-success border-success/30',
  };
  return colors[status];
};

export const getUrgencyColor = (urgency: UrgencyLevel): string => {
  const colors: Record<UrgencyLevel, string> = {
    emergency: 'bg-destructive text-destructive-foreground',
    urgent: 'bg-warning text-warning-foreground',
    routine: 'bg-muted text-muted-foreground',
  };
  return colors[urgency];
};

export const formatStatus = (status: ReferralStatus): string => {
  const labels: Record<ReferralStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    in_treatment: 'In Treatment',
    more_info_requested: 'More Info Requested',
    rejected: 'Rejected',
    completed: 'Completed',
  };
  return labels[status];
};
