export type UrgencyLevel = 'emergency' | 'urgent' | 'routine';

export type ReferralStatus = 
  | 'pending' 
  | 'accepted' 
  | 'in_treatment' 
  | 'more_info_requested' 
  | 'rejected' 
  | 'completed';

export interface Hospital {
  id: string;
  name: string;
  city: string;
  specialty: string[];
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  hospitalId: string;
  hospitalName: string;
  specialty: string;
  role: 'doctor' | 'admin';
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  contact: string;
  medicalId: string;
}

export interface ActivityLog {
  id: string;
  referralId: string;
  timestamp: Date;
  action: string;
  performedBy: string;
  details?: string;
}

export interface Referral {
  id: string;
  patientCode?: string;
  patient: Patient;
  medicalSummary: string;
  reasonForReferral: string;
  urgency: UrgencyLevel;
  status: ReferralStatus;
  fromHospitalId: string;
  fromHospitalName: string;
  fromDoctorId: string;
  fromDoctorName: string;
  toHospitalId: string;
  toHospitalName: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  specialty: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  rejectionReason?: string;
  moreInfoRequest?: string;
  activityLog: ActivityLog[];
}

export interface ReferralSummary {
  patientCode: string;
  dates: {
    created: Date;
    completed?: Date;
  };
  hospitalsInvolved: string[];
  specialty: string;
  outcome: string;
}
