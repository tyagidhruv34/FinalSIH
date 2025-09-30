'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '@/lib/translations/en.json';
import hi from '@/lib/translations/hi.json';
import ta from '@/lib/translations/ta.json';
import te from '@/lib/translations/te.json';
import bn from '@/lib/translations/bn.json';
import mr from '@/lib/translations/mr.json';
import gu from '@/lib/translations/gu.json';
import kn from '@/lib/translations/kn.json';

type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn';

const translations = { en, hi, ta, te, bn, mr, gu, kn };

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof en) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const storedLanguage = localStorage.getItem('app-language') as Language | null;
    if (storedLanguage && Object.keys(translations).includes(storedLanguage)) {
      setLanguage(storedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app-language', lang);
  };
  
  const t = useCallback((key: keyof typeof en): string => {
    return translations[language][key] || translations['en'][key] || key;
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage: handleSetLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
