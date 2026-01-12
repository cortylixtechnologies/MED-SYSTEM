import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Trash2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/hooks/useAIChat';
import { useVoice } from '@/hooks/useVoice';
import AudioWaveform from '@/components/AudioWaveform';
interface AIChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClear: () => void;
  placeholder?: string;
  quickActions?: { label: string; message: string }[];
  onFirstOpen?: () => void;
  speakResponses?: boolean;
  onSpeakResponsesChange?: (enabled: boolean) => void;
}

const AIChatInterface = ({
  messages,
  isLoading,
  onSendMessage,
  onClear,
  placeholder = 'Type your message...',
  quickActions = [],
  onFirstOpen,
  speakResponses = true,
  onSpeakResponsesChange,
}: AIChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const hasCalledFirstOpenRef = useRef(false);

  const handleTranscript = (text: string) => {
    if (text.trim()) {
      onSendMessage(text.trim());
    }
  };

  const { isListening, isSpeaking, isSupported, startListening, stopListening, speak, stopSpeaking } = useVoice({
    onTranscript: handleTranscript,
  });

  // Call onFirstOpen only once
  useEffect(() => {
    if (!hasCalledFirstOpenRef.current && onFirstOpen) {
      hasCalledFirstOpenRef.current = true;
      onFirstOpen();
    }
  }, [onFirstOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Speak new assistant messages when they're complete
  useEffect(() => {
    if (!speakResponses || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    // Only speak when the assistant message is complete (status = 'sent') and has content
    // Also check that we haven't already spoken this message
    if (
      lastMessage.role === 'assistant' &&
      lastMessage.status === 'sent' &&
      lastMessage.content &&
      lastMessage.content.length > 0 &&
      lastMessage.id !== lastMessageIdRef.current
    ) {
      lastMessageIdRef.current = lastMessage.id;
      // Small delay to ensure content is fully rendered
      setTimeout(() => {
        speak(lastMessage.content);
      }, 100);
    }
  }, [messages, speakResponses, speak]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleQuickAction = (message: string) => {
    if (isLoading) return;
    onSendMessage(message);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleSpeakResponses = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    onSpeakResponsesChange?.(!speakResponses);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative">
            {isSpeaking ? (
              <AudioWaveform isActive={true} barCount={3} className="h-4" />
            ) : (
              <Bot className="w-4 h-4 text-primary-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-medium">MedRefer Assistant</p>
              <p className="text-xs text-muted-foreground">
                {isSpeaking ? 'Speaking...' : 'AI-powered help'}
              </p>
            </div>
            {isSpeaking && (
              <AudioWaveform isActive={true} barCount={5} className="h-5 ml-1" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isSupported && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSpeakResponses}
              title={speakResponses ? 'Mute voice' : 'Enable voice'}
            >
              {speakResponses ? (
                <Volume2 className="w-4 h-4 text-primary" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>
          )}
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium mb-1">How can I help you?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask me about referrals, status updates, or the referral process.
            </p>
            {quickActions.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {quickActions.map((action, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.message)}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content || (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
        {/* Recording indicator */}
        {isListening && (
          <div className="flex items-center justify-center gap-2 mb-3 p-2 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <AudioWaveform isActive={true} barCount={7} className="h-6" />
            <span className="text-sm font-medium text-destructive">Recording...</span>
            <AudioWaveform isActive={true} barCount={7} className="h-6" />
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          </div>
        )}
        <div className="flex gap-2">
          {isSupported && (
            <Button
              type="button"
              variant={isListening ? 'destructive' : 'outline'}
              size="icon"
              onClick={toggleVoiceInput}
              disabled={isLoading}
              title={isListening ? 'Stop listening' : 'Voice input'}
              className={cn(isListening && 'animate-pulse')}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          )}
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Listening...' : placeholder}
            disabled={isLoading || isListening}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI assistant for general guidance only. Not medical advice.
        </p>
      </form>
    </div>
  );
};

export default AIChatInterface;
