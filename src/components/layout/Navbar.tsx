import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth';
import { versionService, VersionInfo } from '../../services/version';

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
                            <Link to="/" className="text-xl font-bold">Gotify</Link>

                            {versionInfo && (
                                <span className="ml-2 text-xs bg-blue-700 px-2 py-1 rounded-full">
                                    v{versionInfo.version}
                                </span>
                            )}
                            {isLoadingVersion && (
                                <span className="ml-2 text-xs bg-blue-700 px-2 py-1 rounded-full animate-pulse">
                                    Chargement...
                                </span>
                            )}
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
                        <button
                            onClick={handleLogout}
                            className="hidden md:block bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium"
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