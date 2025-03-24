import { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
    sidebarContent?: React.ReactNode;
    sidebarTitle?: string;
    showSidebar?: boolean;
}

const Layout = ({
    children,
    sidebarContent,
    sidebarTitle = "Navigation",
    showSidebar = false
}: LayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Navbar
                onToggleSidebar={toggleSidebar}
                showSidebarToggle={!!sidebarContent}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar pour desktop */}
                {showSidebar && sidebarContent && (
                    <div className="hidden md:block">
                        <Sidebar title={sidebarTitle}>
                            {sidebarContent}
                        </Sidebar>
                    </div>
                )}

                {/* Sidebar pour mobile - uniquement visible quand ouverte */}
                {sidebarContent && (
                    <Sidebar
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        title={sidebarTitle}
                        mobileOnly
                    >
                        {sidebarContent}
                    </Sidebar>
                )}

                {/* Contenu principal */}
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Layout;