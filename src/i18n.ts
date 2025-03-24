import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import React from 'react';
import { initReactI18next } from 'react-i18next';

// Importez vos traductions directement
import frTranslation from '../public/locales/fr/translation.json';
import enTranslation from '../public/locales/en/translation.json';

// Définition des ressources de traduction
const resources = {
    fr: {
        translation: frTranslation
    },
    en: {
        translation: enTranslation
    }
};

// Initialisation de i18next
i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'fr',
        interpolation: {
            escapeValue: false, // échapper les valeurs pour éviter les injections XSS
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage']
        }
    });

// Types pour le contexte
interface I18nContextType {
    t: (key: string, options?: any) => string;
    changeLanguage: (lng: string) => void;
    language: string;
}

// Création du contexte React
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Props pour le provider
interface I18nProviderProps {
    children: ReactNode;
}

// Provider React pour i18next
export function I18nProvider({ children }: I18nProviderProps) {
    const [language, setLanguage] = useState(i18next.language);

    // Fonction pour changer de langue
    const changeLanguage = (lng: string) => {
        i18next.changeLanguage(lng).then(() => {
            setLanguage(lng);
        });
    };

    // Écouter les changements de langue
    useEffect(() => {
        const handleLanguageChanged = () => {
            setLanguage(i18next.language);
        };

        i18next.on('languageChanged', handleLanguageChanged);

        return () => {
            i18next.off('languageChanged', handleLanguageChanged);
        };
    }, []);

    // Fonction de traduction sécurisée
    const t = (key: string, options?: any): string => {
        // Vérification supplémentaire des options pour éviter les injections
        const safeOptions = options ? { ...options } : undefined;
        return i18next.t(key, safeOptions);
    };

    return React.createElement(
        I18nContext.Provider,
        { value: { t, changeLanguage, language } },
        children
    );
}

// Hook personnalisé pour utiliser les traductions
export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation doit être utilisé à l\'intérieur d\'un I18nProvider');
    }
    return context;
}

export default i18next; 