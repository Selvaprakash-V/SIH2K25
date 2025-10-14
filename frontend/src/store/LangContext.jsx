import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from '../i18n';

const LangContext = createContext();

// Delegate to i18next so existing components can keep `t()` API
export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  useEffect(() => {
    localStorage.setItem('lang', lang);
    // Reflect language across the whole app (useful after navigation/login)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
      i18n.changeLanguage(lang);
    }
  }, [lang]);

  const t = (key) => i18n.t(key);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
