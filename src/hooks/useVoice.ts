import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceOptions {
  onTranscript?: (text: string) => void;
  language?: string;
}

export const useVoice = (options: UseVoiceOptions = {}) => {
  const { onTranscript, language = 'en-US' } = options;
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const speakingCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep callback ref updated
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscriptRef.current?.(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Check for speech synthesis support
    const hasSynthesis = 'speechSynthesis' in window;
    setIsSupported(!!(SpeechRecognition || hasSynthesis));

    // Handle Chrome's async voice loading
    if (hasSynthesis) {
      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setVoicesLoaded(true);
          setIsReady(true);
        }
      };

      // Check immediately (works in Firefox/Safari)
      checkVoices();

      // Listen for voiceschanged event (required for Chrome)
      window.speechSynthesis.onvoiceschanged = () => {
        checkVoices();
      };

      // Fallback timeout - some browsers may not fire voiceschanged
      const fallbackTimer = setTimeout(() => {
        if (!voicesLoaded) {
          setVoicesLoaded(true);
          setIsReady(true);
        }
      }, 1000);

      return () => {
        clearTimeout(fallbackTimer);
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        if (speakingCheckIntervalRef.current) {
          clearInterval(speakingCheckIntervalRef.current);
        }
      };
    } else {
      setIsReady(true);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (speakingCheckIntervalRef.current) {
        clearInterval(speakingCheckIntervalRef.current);
      }
    };
  }, [language]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition error:', error);
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Clear any existing interval
    if (speakingCheckIntervalRef.current) {
      clearInterval(speakingCheckIntervalRef.current);
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      // Chrome workaround: poll speaking state since onend sometimes doesn't fire
      speakingCheckIntervalRef.current = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setIsSpeaking(false);
          if (speakingCheckIntervalRef.current) {
            clearInterval(speakingCheckIntervalRef.current);
            speakingCheckIntervalRef.current = null;
          }
        }
      }, 100);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (speakingCheckIntervalRef.current) {
        clearInterval(speakingCheckIntervalRef.current);
        speakingCheckIntervalRef.current = null;
      }
    };

    utterance.onerror = (e) => {
      // Ignore 'interrupted' errors as they're expected when cancelling
      if (e.error !== 'interrupted') {
        console.error('Speech error:', e);
      }
      setIsSpeaking(false);
      if (speakingCheckIntervalRef.current) {
        clearInterval(speakingCheckIntervalRef.current);
        speakingCheckIntervalRef.current = null;
      }
    };

    // Get and set voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const englishVoice = voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  }, [language]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      if (speakingCheckIntervalRef.current) {
        clearInterval(speakingCheckIntervalRef.current);
        speakingCheckIntervalRef.current = null;
      }
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    isSupported,
    isReady,
    voicesLoaded,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
};

// Add type declarations for webkit prefix
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
