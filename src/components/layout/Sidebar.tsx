import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth';
import { versionService, VersionInfo } from '../../services/version';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/gotify-logo-small.svg';

interface SidebarProps {
    children: React.ReactNode;
    title?: string;
    isOpen?: boolean;
    onClose?: () => void;
    mobileOnly?: boolean;
    versionInfo?: { version: string };
    isLoadingVersion?: boolean;
}

const Sidebar = ({
    children,
    title = "Navigation",
    isOpen = false,
    onClose = () => { },
    mobileOnly = false,
}: SidebarProps) => {
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const navigate = useNavigate();
    const location = useLocation();
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
    const [isLoadingVersion, setIsLoadingVersion] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
        };

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

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Si c'est la vue desktop et que la sidebar est marquée comme mobileOnly, ne pas l'afficher
    if (!isMobileView && mobileOnly) {
        return null;
    }

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
        onClose();
    };

    const handleNavItemClick = () => {
        if (isMobileView) {
            // Ajouter une légère temporisation pour permettre à l'animation de se produire
            setTimeout(() => {
                onClose();
            }, 150);
        }
    };

    const navItems = [
        {
            name: t('navigation.messages'),
            path: '/',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
            )
        },
        {
            name: t('navigation.users'),
            path: '/users',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
            )
        },
        {
            name: t('navigation.applications'),
            path: '/apps',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                </svg>
            )
        },
        {
            name: t('navigation.clients'),
            path: '/clients',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
            )
        },
        {
            name: t('navigation.plugins'),
            path: '/plugins',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path>
                </svg>
            )
        },
    ];

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <>
            {/* Overlay pour mobile avec animation */}
            {isMobileView && isOpen && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 transition-opacity duration-300"
                    onClick={onClose}
                ></div>
            )}

            {/* Sidebar avec animation améliorée */}
            <div className={`
        ${isMobileView ? 'fixed inset-y-0 left-0 z-30 w-72 transition-all duration-300 transform shadow-lg' : 'w-64 flex-shrink-0 h-screen'}
        ${isMobileView && !isOpen ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        bg-white border-r border-gray-200 overflow-hidden flex flex-col
      `}>
                {/* En-tête de la sidebar avec logo et bouton de fermeture */}
                {isMobileView && (
                    <div className="flex items-center justify-between p-4 bg-blue-600 text-white">
                        <div className="flex items-center space-x-2">
                            <img
                                src={logo}
                                alt="Gotify Logo"
                                className="h-8 w-8 mr-2"
                            />
                            <h2 className="text-xl font-bold">Gotify</h2>
                            {versionInfo && (
                                <span className="text-xs bg-blue-700 px-2 py-1 rounded-full">
                                    v{versionInfo.version}
                                </span>
                            )}
                            {isLoadingVersion && (
                                <span className="text-xs bg-blue-700 px-2 py-1 rounded-full animate-pulse">
                                    Chargement...
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-blue-200 focus:outline-none transition-colors duration-200"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Navigation principale sur mobile */}
                {isMobileView && (
                    <div className="p-4">
                        <nav className="space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${isActive(item.path)
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    onClick={handleNavItemClick}
                                >
                                    <span className={`mr-3 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-500'}`}>
                                        {item.icon}
                                    </span>
                                    {item.name}
                                </Link>
                            ))}

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center px-4 py-3 mt-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
                            >
                                <span className="mr-3 text-red-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                    </svg>
                                </span>
                                {t('auth.logout')}
                            </button>
                        </nav>
                    </div>
                )}

                {/* Séparateur avec dégradé */}
                {isMobileView && (
                    <div className="px-4">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                    </div>
                )}

                {/* Titre de la section contenu */}
                <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center">
                        <span className="mr-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path>
                            </svg>
                        </span>
                        {title}
                    </h3>
                </div>

                {/* Contenu de la sidebar */}
                <div className="flex-1 overflow-y-auto" onClick={isMobileView ? handleNavItemClick : undefined}>
                    {children}
                </div>
            </div>
        </>
    );
};

export default Sidebar;