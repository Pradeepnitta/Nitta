import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/header';
import Footer from '../Footer/Footer';
import Search from '../Search/Search';
import './DashboardLayout.css';

function DashboardLayout({ children, title }) {
    const navigate = useNavigate();
    const location = useLocation();
    
    // UI Layout state managers
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    // Global navigation interceptor to update routes in layout shell
    const handleNavigation = (path) => {
        navigate(path);
        setMobileSidebarOpen(false);
    };

    const handleAction = (action) => {
        if (action === 'logout') {
            // Logout logic will clear state, we can handle it via the Sidebar profile card or here
            navigate('/auth');
        } else {
            console.log('Action triggered:', action);
        }
    };

    return (
        <div className="dashboard-layout-wrapper">
            {/* Spotlight Command Search Modal overlay */}
            <Search
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
                onNavigate={handleNavigation}
                onAction={handleAction}
            />

            {/* Sidebar Left Component - Desktop and Mobile wrapper */}
            <div className={`sidebar-container ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
                {/* Mobile sidebar background backdrop click overlay close */}
                {mobileSidebarOpen && (
                    <div
                        className="sidebar-backdrop-overlay"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                )}
                
                <Sidebar
                    collapsed={sidebarCollapsed}
                    setCollapsed={setSidebarCollapsed}
                    currentPath={location.pathname}
                    onNavigate={handleNavigation}
                />
            </div>

            {/* Main content viewport containing top Header, page Body, and bottom Footer */}
            <div className="dashboard-content-viewport">
                <Header
                    title={title}
                    onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
                    onOpenSearch={() => setSearchOpen(true)}
                    onNavigate={handleNavigation}
                />
                
                <main className="dashboard-main-body">
                    <div className="dashboard-page-container">
                        {children}
                    </div>
                    <Footer onNavigate={handleNavigation} />
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;
