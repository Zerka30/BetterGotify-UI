import { useState, useEffect } from 'react';
import { versionService, VersionInfo } from '../../services/version';
import { useTranslation } from 'react-i18next';

const Footer = () => {
    const { t } = useTranslation();
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const info = await versionService.getVersion();
                setVersionInfo(info);
            } catch (error) {
                console.error('Failed to fetch version for footer:', error);
            }
        };

        fetchVersion();
    }, []);

    return (
        <footer className="bg-gray-100 border-t border-gray-200">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-4 md:flex md:items-center md:justify-between">
                    <div className="text-center md:text-left">
                        <p className="text-sm text-gray-500">
                            {t('footer.copyright', { year: currentYear })}
                        </p>
                    </div>

                    <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-center justify-center md:justify-end space-y-2 md:space-y-0 md:space-x-6">
                        {versionInfo && (
                            <div className="text-xs text-gray-500">
                                {t('footer.version', { version: versionInfo.version })}
                            </div>
                        )}

                        <div className="flex space-x-4">
                            <a
                                href="https://gotify.net"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">{t('footer.website')}</span>
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                </svg>
                            </a>
                            <a
                                href="https://github.com/gotify/server"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">GitHub</span>
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 