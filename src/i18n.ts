import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import React from 'react';
import { initReactI18next } from 'react-i18next';

export const AVAILABLE_LANGUAGES = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    // { code: 'es', name: 'Español' },
    // { code: 'de', name: 'Deutsch' },
];

const loadTranslations = async () => {
    const resources: Record<string, { translation: any }> = {};

    const modules = import.meta.glob('../public/locales/*/translation.json', { eager: true });

    for (const path in modules) {
        const langCode = path.split('/')[3];

        if (AVAILABLE_LANGUAGES.some(lang => lang.code === langCode)) {
            resources[langCode] = {
                translation: (modules[path] as any).default
            };
        }
    }

    return resources;
};

const initI18n = async () => {
    try {
        const resources = await loadTranslations();

        i18next
            .use(LanguageDetector)
            .use(initReactI18next)
            .init({
                resources,
                fallbackLng: 'fr',
                interpolation: {
                    escapeValue: false,
                },
                detection: {
                    order: ['localStorage', 'navigator'],
                    caches: ['localStorage']
                }
            });

        console.log('i18n initialized with languages:', Object.keys(resources));
    } catch (error) {
        console.error('Failed to initialize i18n:', error);
    }
};

initI18n();

interface I18nContextType {
    t: (key: string, options?: any) => string;
    changeLanguage: (lng: string) => void;
    language: string;
    availableLanguages: typeof AVAILABLE_LANGUAGES;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
    children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
    const [language, setLanguage] = useState(i18next.language);
    const [isInitialized, setIsInitialized] = useState(i18next.isInitialized);

    const changeLanguage = (lng: string) => {
        i18next.changeLanguage(lng).then(() => {
            setLanguage(lng);
        });
    };

    useEffect(() => {
        const handleLanguageChanged = () => {
            setLanguage(i18next.language);
        };

        const handleInitialized = () => {
            setIsInitialized(true);
        };

        i18next.on('languageChanged', handleLanguageChanged);
        i18next.on('initialized', handleInitialized);

        return () => {
            i18next.off('languageChanged', handleLanguageChanged);
            i18next.off('initialized', handleInitialized);
        };
    }, []);

    const t = (key: string, options?: any): string => {
        if (!isInitialized) {
            return key;
        }
        const safeOptions = options ? { ...options } : undefined;
        return i18next.t(key, safeOptions);
    };

    return React.createElement(
        I18nContext.Provider,
        {
            value: {
                t,
                changeLanguage,
                language,
                availableLanguages: AVAILABLE_LANGUAGES
            }
        },
        children
    );
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
}

export default i18next; 