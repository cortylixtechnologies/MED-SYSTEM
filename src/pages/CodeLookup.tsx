import { useState } from 'react';
import { useReferrals } from '@/contexts/ReferralContext';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FileText, Building2, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const CodeLookup = () => {
  const { getReferralByCode } = useReferrals();
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<'idle' | 'found' | 'not_found'>('idle');
  const [referralData, setReferralData] = useState<{
    patientCode: string;
    dates: { created: Date; completed?: Date };
    hospitalsInvolved: string[];
    specialty: string;
    outcome: string;
  } | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchCode.trim()) return;

    const referral = getReferralByCode(searchCode.trim());

    if (referral && referral.patientCode) {
      setReferralData({
        patientCode: referral.patientCode,
        dates: {
          created: referral.createdAt,
          completed: referral.completedAt,
        },
        hospitalsInvolved: [referral.fromHospitalName, referral.toHospitalName],
        specialty: referral.specialty,
        outcome: referral.status === 'completed' ? 'Treatment Completed Successfully' : 'In Progress',
      });
      setSearchResult('found');
    } else {
      setReferralData(null);
      setSearchResult('not_found');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Patient Code Lookup</h1>
          <p className="text-muted-foreground mt-2">
            Enter a patient's unique access code to view their referral history summary
          </p>
        </div>

        <Card className="card-elevated animate-slide-up">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter code (e.g., REF-7A7B-2C9D)"
                  value={searchCode}
                  onChange={(e) => {
                    setSearchCode(e.target.value.toUpperCase());
                    if (searchResult !== 'idle') setSearchResult('idle');
                  }}
                  className="pl-10 font-mono"
                />
              </div>
              <Button type="submit">
                <Search className="w-4 h-4 mr-2" />
                Lookup
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {searchResult === 'found' && referralData && (
          <Card className="card-elevated mt-6 animate-slide-up border-success/30">
            <CardHeader>
              <div className="flex items-center gap-2 text-success mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Record Found</span>
              </div>
              <CardTitle className="font-mono">{referralData.patientCode}</CardTitle>
              <CardDescription>Referral History Summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Building2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Hospitals Involved</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {referralData.hospitalsInvolved.map((hospital, idx) => (
                        <span key={idx} className="text-sm text-muted-foreground">
                          {idx > 0 && '→ '}
                          {hospital}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileText className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Specialty</p>
                    <p className="text-sm text-muted-foreground">{referralData.specialty}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Dates</p>
                    <p className="text-sm text-muted-foreground">
                      Referred: {format(new Date(referralData.dates.created), 'MMMM d, yyyy')}
                    </p>
                    {referralData.dates.completed && (
                      <p className="text-sm text-muted-foreground">
                        Completed: {format(new Date(referralData.dates.completed), 'MMMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Outcome</p>
                    <p className="text-sm text-success">{referralData.outcome}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
                This summary is provided for continuity of care purposes. 
                Full medical records are available upon authorized request.
              </p>
            </CardContent>
          </Card>
        )}

        {searchResult === 'not_found' && (
          <Card className="card-elevated mt-6 animate-slide-up border-destructive/30">
            <CardContent className="py-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
              <p className="font-medium text-foreground">No Record Found</p>
              <p className="text-sm text-muted-foreground mt-1">
                The code "{searchCode}" does not match any referral in our system.
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Please verify the code and try again. Patient codes are generated 
                only after treatment completion.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <Card className="mt-6 bg-muted/30 border-dashed">
          <CardContent className="py-4">
            <h4 className="font-medium text-foreground text-sm mb-2">About Patient Codes</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Codes are generated automatically when treatment is completed</li>
              <li>• They provide a privacy-focused summary of the referral chain</li>
              <li>• Full medical records are not accessible through this lookup</li>
              <li>• Patients can share their code with future healthcare providers</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CodeLookup;
