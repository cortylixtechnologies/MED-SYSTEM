import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Referral } from '@/types/referral';
import { mockReferrals, generatePatientCode } from '@/data/mockData';

interface ReferralContextType {
  referrals: Referral[];
  addReferral: (referral: Omit<Referral, 'id' | 'activityLog' | 'createdAt' | 'updatedAt'>) => void;
  updateReferralStatus: (id: string, status: Referral['status'], updatedBy: string, details?: string) => void;
  completeReferral: (id: string, completedBy: string, details?: string) => void;
  getReferralByCode: (code: string) => Referral | undefined;
  getReferralById: (id: string) => Referral | undefined;
}

const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

export const ReferralProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [referrals, setReferrals] = useState<Referral[]>(mockReferrals);

  const addReferral = (referralData: Omit<Referral, 'id' | 'activityLog' | 'createdAt' | 'updatedAt'>) => {
    const newReferral: Referral = {
      ...referralData,
      id: `ref-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      activityLog: [{
        id: `a-${Date.now()}`,
        referralId: `ref-${Date.now()}`,
        timestamp: new Date(),
        action: 'Referral Created',
        performedBy: referralData.fromDoctorName,
      }],
    };
    setReferrals(prev => [newReferral, ...prev]);
  };

  const updateReferralStatus = (id: string, status: Referral['status'], updatedBy: string, details?: string) => {
    setReferrals(prev => prev.map(ref => {
      if (ref.id === id) {
        const newLog = {
          id: `a-${Date.now()}`,
          referralId: id,
          timestamp: new Date(),
          action: `Status changed to ${status.replace('_', ' ')}`,
          performedBy: updatedBy,
          details,
        };
        return {
          ...ref,
          status,
          updatedAt: new Date(),
          activityLog: [...ref.activityLog, newLog],
          ...(details && status === 'rejected' ? { rejectionReason: details } : {}),
          ...(details && status === 'more_info_requested' ? { moreInfoRequest: details } : {}),
        };
      }
      return ref;
    }));
  };

  const completeReferral = (id: string, completedBy: string, details?: string) => {
    setReferrals(prev => prev.map(ref => {
      if (ref.id === id) {
        const patientCode = generatePatientCode();
        const newLog = {
          id: `a-${Date.now()}`,
          referralId: id,
          timestamp: new Date(),
          action: 'Treatment Completed - Patient Code Generated',
          performedBy: completedBy,
          details: details || `Patient code: ${patientCode}`,
        };
        return {
          ...ref,
          status: 'completed' as const,
          patientCode,
          completedAt: new Date(),
          updatedAt: new Date(),
          activityLog: [...ref.activityLog, newLog],
        };
      }
      return ref;
    }));
  };

  const getReferralByCode = (code: string) => {
    return referrals.find(r => r.patientCode?.toLowerCase() === code.toLowerCase());
  };

  const getReferralById = (id: string) => {
    return referrals.find(r => r.id === id);
  };

  return (
    <ReferralContext.Provider value={{ 
      referrals, 
      addReferral, 
      updateReferralStatus, 
      completeReferral, 
      getReferralByCode,
      getReferralById 
    }}>
      {children}
    </ReferralContext.Provider>
  );
};

export const useReferrals = (): ReferralContextType => {
  const context = useContext(ReferralContext);
  if (!context) {
    throw new Error('useReferrals must be used within a ReferralProvider');
  }
  return context;
};
