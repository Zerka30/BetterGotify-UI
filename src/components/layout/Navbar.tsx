import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth';
import { versionService, VersionInfo } from '../../services/version';
import { useTranslation } from '../../i18n';
import logo from '../../assets/gotify-logo-small.svg';

interface NavbarProps {
    onToggleSidebar?: () => void;
    showSidebarToggle?: boolean;
    sidebarContent?: React.ReactNode;
}

const Navbar = ({
    onToggleSidebar,
    showSidebarToggle = false,
    sidebarContent
}: NavbarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
    const [isLoadingVersion, setIsLoadingVersion] = useState(false);
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
    const { t, changeLanguage: i18nChangeLanguage, language, availableLanguages } = useTranslation();

    useEffect(() => {
        const fetchVersion = async () => {
            setIsLoadingVersion(true);
            try {
                const info = await versionService.getVersion();
                setVersionInfo(info);
            } catch (error) {
                console.error('Failed to fetch version:', error);
            } finally {
                setIsLoadingVersion(false);
            }
        };

        fetchVersion();
    }, []);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const navItems = [
        { name: t('navigation.messages'), path: '/' },
        { name: t('navigation.users'), path: '/users' },
        { name: t('navigation.applications'), path: '/apps' },
        { name: t('navigation.clients'), path: '/clients' },
        { name: t('navigation.plugins'), path: '/plugins' },
    ];

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const changeLanguage = (lng: string) => {
        i18nChangeLanguage(lng);
        setIsLanguageMenuOpen(false);
    };

    return (
        <nav className="bg-blue-600 text-white">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        {/* Bouton de toggle sidebar sur mobile */}
                        {showSidebarToggle && (
                            <button
                                onClick={onToggleSidebar}
                                className="md:hidden mr-2 inline-flex items-center justify-center p-2 rounded-md text-blue-100 hover:text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            >
                                <span className="sr-only">Ouvrir la sidebar</span>
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        )}

                        <div className="flex-shrink-0">
                            <Link to="/" className="flex items-center">
                                <img
                                    src={logo}
                                    alt="Gotify Logo"
                                    className="h-8 w-8 mr-2"
                                />
                                <span className="text-xl font-bold">Gotify</span>

                                {versionInfo && (
                                    <span className="ml-2 text-xs bg-blue-700 px-2 py-1 rounded-full">
                                        v{versionInfo.version}
                                    </span>
                                )}
                                {isLoadingVersion && (
                                    <span className="ml-2 text-xs bg-blue-700 px-2 py-1 rounded-full animate-pulse">
                                        {t('actions.loading')}
                                    </span>
                                )}
                            </Link>
                        </div>

                        <div className="hidden md:block ml-10">
                            <div className="flex space-x-4">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        className={`px-3 py-2 rounded-md text-sm font-medium ${isActive(item.path)
                                            ? 'bg-blue-700 text-white'
                                            : 'text-blue-100 hover:bg-blue-500'
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center">
                        {/* Sélecteur de langue avec menu déroulant */}
                        <div className="relative ml-3">
                            <button
                                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-500 focus:outline-none"
                            >
                                <span>{availableLanguages.find(lang => lang.code === language)?.name || 'Langue'}</span>
                                <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {/* Menu déroulant des langues avec défilement si nécessaire */}
                            {isLanguageMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 max-h-60 overflow-y-auto">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        {availableLanguages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => changeLanguage(lang.code)}
                                                className={`block w-full text-left px-4 py-2 text-sm ${language === lang.code
                                                    ? 'bg-blue-100 text-blue-900'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                role="menuitem"
                                            >
                                                {lang.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="hidden md:block bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium ml-3"
                        >
                            {t('auth.logout')}
                        </button>
                    </div>
                </div>

                <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(item.path)
                                    ? 'bg-blue-700 text-white'
                                    : 'text-blue-100 hover:bg-blue-500'
                                    }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {/* Sélecteur de langue pour mobile */}
                        <div className="mt-3 px-3 py-2">
                            <div className="text-sm font-medium text-blue-100 mb-2">
                                {t('common.language')}
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                {availableLanguages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => changeLanguage(lang.code)}
                                        className={`px-3 py-2 rounded-md text-sm font-medium ${language === lang.code
                                            ? 'bg-blue-700 text-white'
                                            : 'bg-blue-500 text-blue-100 hover:bg-blue-600'
                                            }`}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Afficher le contenu de la sidebar dans le menu mobile si disponible */}
                        {showSidebarToggle && sidebarContent && (
                            <>
                                <div className="border-t border-blue-800 my-2"></div>
                                <div className="px-3 py-2 text-sm font-medium text-blue-100">
                                    Contenu de la page
                                </div>
                                <div className="bg-white text-gray-800 rounded-md p-2">
                                    {sidebarContent}
                                </div>
                            </>
                        )}

                        <button
                            onClick={handleLogout}
                            className="w-full text-left mt-2 px-3 py-2 rounded-md text-base font-medium bg-blue-700 text-white hover:bg-blue-800"
                        >
                            {t('auth.logout')}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;