import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthMFAGetAuthenticatorAssuranceLevelResponse } from '@supabase/supabase-js';

export interface MFAFactor {
  id: string;
  friendly_name: string | null;
  factor_type: string;
  status: string;
  created_at: string;
}

export interface MFAState {
  isEnabled: boolean;
  isVerified: boolean;
  factors: MFAFactor[];
  currentLevel: 'aal1' | 'aal2' | null;
  nextLevel: 'aal1' | 'aal2' | null;
  loading: boolean;
  needsVerification: boolean;
}

export const useMFA = () => {
  const [state, setState] = useState<MFAState>({
    isEnabled: false,
    isVerified: false,
    factors: [],
    currentLevel: null,
    nextLevel: null,
    loading: true,
    needsVerification: false,
  });

  const checkMFAStatus = useCallback(async () => {
    try {
      // Get all enrolled factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        console.error('Error listing MFA factors:', factorsError);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      // Get current assurance level
      const { data: aalData, error: aalError }: AuthMFAGetAuthenticatorAssuranceLevelResponse = 
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalError) {
        console.error('Error getting AAL:', aalError);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const verifiedFactors = factorsData?.totp?.filter(f => f.status === 'verified') || [];
      const isEnabled = verifiedFactors.length > 0;
      const currentLevel = aalData?.currentLevel || null;
      const nextLevel = aalData?.nextLevel || null;
      
      // User needs to verify if they have enabled 2FA but are at aal1
      const needsVerification = isEnabled && currentLevel === 'aal1' && nextLevel === 'aal2';

      setState({
        isEnabled,
        isVerified: currentLevel === 'aal2',
        factors: verifiedFactors.map(f => ({
          id: f.id,
          friendly_name: f.friendly_name,
          factor_type: f.factor_type,
          status: f.status,
          created_at: f.created_at,
        })),
        currentLevel,
        nextLevel,
        loading: false,
        needsVerification,
      });
    } catch (error) {
      console.error('Error checking MFA status:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkMFAStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkMFAStatus();
    });

    return () => subscription.unsubscribe();
  }, [checkMFAStatus]);

  return {
    ...state,
    refresh: checkMFAStatus,
  };
};
