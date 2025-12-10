import { Referral } from '@/types/referral';
import { StatusBadge, UrgencyBadge } from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Building2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface ReferralCardProps {
  referral: Referral;
  showFromHospital?: boolean;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ referral, showFromHospital = true }) => {
  return (
    <Card className="card-elevated hover:shadow-lg transition-all duration-200 animate-slide-up">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={referral.status} />
              <UrgencyBadge urgency={referral.urgency} />
              {referral.patientCode && (
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {referral.patientCode}
                </span>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-foreground">{referral.patient.name}</h3>
              <p className="text-sm text-muted-foreground">
                {referral.patient.age} years • {referral.specialty}
              </p>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {referral.reasonForReferral}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {showFromHospital ? (
                  <span>From: {referral.fromHospitalName}</span>
                ) : (
                  <span>To: {referral.toHospitalName}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{showFromHospital ? referral.fromDoctorName : referral.assignedDoctorName || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(new Date(referral.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>

          <Link to={`/referral/${referral.id}`}>
            <Button variant="outline" size="sm" className="shrink-0">
              View Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
