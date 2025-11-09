import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
  text: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  hasRecognitionSupport: boolean;
  setText: (text: string) => void;
}

// FIX: Cast window to `any` to access non-standard browser APIs for speech recognition.
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// FIX: Define a minimal type for the speech recognition event.
type CustomSpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: {
    isFinal: boolean;
    [key: number]: {
      transcript: string;
    };
  }[];
};

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any | null>(null);
  const userStoppedRef = useRef(false);

  // Combine final and interim transcripts for display in the UI
  const text = [finalTranscript, interimTranscript].filter(Boolean).join(' ');

  // Manual setter for the text (e.g., from typing in the textarea)
  const setText = useCallback((newText: string) => {
    setFinalTranscript(newText);
    setInterimTranscript('');
  }, []);

  useEffect(() => {
    if (!SpeechRecognition) {
      console.warn('Speech Recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Stay active, but will still timeout
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: CustomSpeechRecognitionEvent) => {
      let latestInterim = '';
      let latestFinal = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          latestFinal += transcript;
        } else {
          latestInterim += transcript;
        }
      }

      // Append final results to the state, ensuring proper spacing
      if (latestFinal) {
        setFinalTranscript(prev => [prev.trim(), latestFinal.trim()].filter(Boolean).join(' '));
      }
      // Update interim results for real-time feedback
      setInterimTranscript(latestInterim);
    };
    
    // This is the key for continuous listening: auto-restart on timeout
    recognition.onend = () => {
      // If the user didn't manually stop it, restart it.
      if (!userStoppedRef.current) {
        try {
          recognition.start();
        } catch(e) {
          console.error("Error restarting speech recognition:", e);
          setIsListening(false); // Stop if there's an error
        }
      } else {
        setIsListening(false);
      }
    };
    
    recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
    }

    recognitionRef.current = recognition;
    
    // Cleanup on component unmount
    return () => {
        userStoppedRef.current = true;
        if (recognitionRef.current) {
            recognitionRef.current.onend = null; // Prevent restart on unmount
            recognitionRef.current.stop();
        }
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      userStoppedRef.current = false;
      // When starting, make sure the current text has a trailing space for the new words.
      setFinalTranscript(prev => prev.trim() ? prev.trim() + ' ' : '');
      setInterimTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      userStoppedRef.current = true; // Signal that the user is stopping it
      recognitionRef.current.stop();
      // The onend handler will set isListening to false.
      setFinalTranscript(prev => prev.trim()); // Clean up trailing space
      setInterimTranscript('');
    }
  };

  return {
    text,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport: !!SpeechRecognition,
    setText,
  };
};