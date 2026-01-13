import { useState } from 'react';
import { MessageCircle, X, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useAIChat } from '@/hooks/useAIChat';
import AIChatInterface from '@/components/AIChatInterface';
import { cn } from '@/lib/utils';

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor'>('patient');
  const [patientCode, setPatientCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const { currentUser } = useAuth();

  // Patient chat without code
  const generalChat = useAIChat({ mode: 'general' });

  // Patient chat with code
  const patientChat = useAIChat({ mode: 'patient', patientCode });

  // Doctor chat (authenticated)
  const doctorChat = useAIChat({ mode: 'doctor' });

  const handleVerifyCode = () => {
    if (patientCode.trim()) {
      setIsCodeVerified(true);
    }
  };

  const handleResetCode = () => {
    setPatientCode('');
    setIsCodeVerified(false);
    patientChat.clearMessages();
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const patientQuickActions = [
    { label: 'Check status', message: 'What is the current status of my referral?' },
    { label: 'Next steps', message: 'What are the next steps in my referral process?' },
    { label: 'Contact info', message: 'How can I contact the hospital about my referral?' },
  ];

  const doctorQuickActions = [
    { label: 'Pending referrals', message: 'Show me my pending referrals' },
    { label: 'Urgent cases', message: 'Are there any urgent referrals I need to handle?' },
    { label: 'Today\'s summary', message: 'Give me a summary of my referral activity' },
  ];

  const generalQuickActions = [
    { label: 'How it works', message: 'How does the referral process work?' },
    { label: 'Check status', message: 'How can I check my referral status?' },
    { label: 'What to expect', message: 'What should I expect after being referred?' },
  ];

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={handleOpen}
        className={cn(
          'fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 transition-all',
          isOpen && 'scale-0 opacity-0'
        )}
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chat window */}
      <div
        className={cn(
          'fixed bottom-6 right-6 w-[380px] h-[550px] bg-card rounded-xl shadow-2xl border border-border z-50 flex flex-col overflow-hidden transition-all duration-300',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        )}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-4 h-4" />
        </Button>

        {currentUser ? (
          // Authenticated user - show doctor interface
          <AIChatInterface
            messages={doctorChat.messages}
            isLoading={doctorChat.isLoading}
            onSendMessage={doctorChat.sendMessage}
            onClear={doctorChat.clearMessages}
            placeholder="Ask about referrals, patients..."
            quickActions={doctorQuickActions}
          />
        ) : (
          // Unauthenticated - show patient interface with tabs
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'patient' | 'doctor')} className="flex flex-col h-full">
            <div className="p-3 border-b border-border">
              <TabsList className="w-full">
                <TabsTrigger value="patient" className="flex-1">Patient</TabsTrigger>
                <TabsTrigger value="doctor" className="flex-1">Doctor Login</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="patient" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden">
              {!isCodeVerified ? (
                // Code entry or general chat
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <KeyRound className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Have a referral code?</span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code (e.g., REF-XXXX-XXXX)"
                        value={patientCode}
                        onChange={(e) => setPatientCode(e.target.value.toUpperCase())}
                        className="flex-1 text-sm"
                      />
                      <Button size="sm" onClick={handleVerifyCode} disabled={!patientCode.trim()}>
                        Check
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <AIChatInterface
                      messages={generalChat.messages}
                      isLoading={generalChat.isLoading}
                      onSendMessage={generalChat.sendMessage}
                      onClear={generalChat.clearMessages}
                      placeholder="Ask about referrals..."
                      quickActions={generalQuickActions}
                    />
                  </div>
                </div>
              ) : (
                // Code verified - show patient chat
                <div className="flex flex-col h-full">
                  <div className="px-4 py-2 bg-success/10 border-b border-success/20 flex items-center justify-between">
                    <span className="text-sm text-success">
                      Code: <strong>{patientCode}</strong>
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleResetCode} className="text-xs h-7">
                      Change
                    </Button>
                  </div>
                  <div className="flex-1">
                    <AIChatInterface
                      messages={patientChat.messages}
                      isLoading={patientChat.isLoading}
                      onSendMessage={patientChat.sendMessage}
                      onClear={patientChat.clearMessages}
                      placeholder="Ask about your referral..."
                      quickActions={patientQuickActions}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="doctor" className="flex-1 flex flex-col items-center justify-center p-6 m-0 data-[state=inactive]:hidden">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Doctor Access</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please log in to access the full AI assistant with your referral data.
                </p>
                <Button onClick={() => window.location.href = '/login'}>
                  Go to Login
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
};

export default AIChatWidget;