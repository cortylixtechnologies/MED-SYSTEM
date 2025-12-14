import { useNavigate } from 'react-router-dom';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const EmergencyAlertOverlay = () => {
  const { emergencyAlert, dismissEmergencyAlert } = useNotificationContext();
  const navigate = useNavigate();

  if (!emergencyAlert) return null;

  const handleViewReferral = () => {
    if (emergencyAlert.referralId) {
      navigate(`/referral/${emergencyAlert.referralId}`);
    }
    dismissEmergencyAlert();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop with pulsing effect */}
      <div 
        className="absolute inset-0 bg-destructive/20 backdrop-blur-sm animate-pulse"
        onClick={dismissEmergencyAlert}
      />
      
      {/* Alert Card */}
      <div className={cn(
        "relative w-full max-w-md bg-card border-2 border-destructive rounded-xl shadow-2xl",
        "animate-scale-in"
      )}>
        {/* Pulsing border effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-destructive via-red-500 to-destructive rounded-xl opacity-75 blur animate-pulse" />
        
        <div className="relative bg-card rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-destructive px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
              <AlertTriangle className="w-6 h-6 text-destructive-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-destructive-foreground">
                EMERGENCY REFERRAL
              </h2>
              <p className="text-sm text-destructive-foreground/80">
                Immediate attention required
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive-foreground hover:bg-white/20"
              onClick={dismissEmergencyAlert}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Patient</p>
              <p className="text-lg font-semibold text-foreground">
                {emergencyAlert.patientName}
              </p>
            </div>
            
            {emergencyAlert.fromHospital && (
              <div>
                <p className="text-sm text-muted-foreground">From Hospital</p>
                <p className="font-medium text-foreground">
                  {emergencyAlert.fromHospital}
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {emergencyAlert.message}
            </p>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={dismissEmergencyAlert}
              >
                Dismiss
              </Button>
              <Button
                className="flex-1 bg-destructive hover:bg-destructive/90"
                onClick={handleViewReferral}
              >
                View Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAlertOverlay;
