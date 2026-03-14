import React, { createContext, useState, useContext } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en'); // default to English

    const toggleLanguage = () => {
        setLanguage(prev => (prev === 'en' ? 'ar' : 'en'));
    };

    const t = (key) => {
        // Simple deep access helper (e.g., 'emirates.dubai')
        const keys = key.split('.');
        let value = translations[language];
        for (let k of keys) {
            value = value?.[k];
        }
        return value || key;
    };

    const isRTL = language === 'ar';

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
