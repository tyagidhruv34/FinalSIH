
'use client';

import { useState, useEffect, useRef } from 'react';

// Define the shape of the SpeechRecognition interface for TypeScript
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((this: SpeechRecognition, ev: any) => any) | null;
  onerror: ((this: SpeechRecognition, ev: any) => any) | null;
  onend: (() => void) | null;
}

// Define the global window object to include webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

type UseVoiceRecognitionProps = {
  onCommand: (command: string) => void;
  onError?: (error: string) => void;
};

export function useVoiceRecognition({ onCommand, onError }: UseVoiceRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Listen for a single command at a time
      recognition.interimResults = false; // We only care about the final result
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onCommand(transcript);
      };

      recognition.onerror = (event) => {
        if (onError) {
          onError(event.error);
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
          setIsListening(false);
      }

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onCommand, onError]);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  return {
    isListening,
    isSupported: !!recognitionRef.current,
    startListening,
    stopListening,
  };
}

    