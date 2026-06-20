import { useState } from 'react';
import './Navbar.css';

function Navbar({ currentPath = '/', onNavigate }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const menuItems = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Admin Panel', path: '/admin/dashboard' },
        { label: 'Documentation', path: '/docs' },
        { label: 'Status', path: '/status' }
    ];

    const handleLinkClick = (path, e) => {
        e.preventDefault();
        setMobileMenuOpen(false);
        if (onNavigate) {
            onNavigate(path);
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Brand Logo */}
                <a href="/" className="navbar-brand" onClick={(e) => handleLinkClick('/dashboard', e)}>
                    <div className="navbar-logo-icon">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <defs>
                                <linearGradient id="logo-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#fbbf24" />
                                    <stop offset="1" stopColor="#fb7185" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="navbar-brand-name">Nitta<span className="brand-accent">.</span></span>
                </a>

                {/* Desktop Nav Links */}
                <div className="navbar-links">
                    {menuItems.map((item) => {
                        const isActive = currentPath === item.path;
                        return (
                            <a
                                key={item.label}
                                href={item.path}
                                className={`navbar-link-item ${isActive ? 'active' : ''}`}
                                onClick={(e) => handleLinkClick(item.path, e)}
                            >
                                {item.label}
                                {isActive && <span className="active-dot" />}
                            </a>
                        );
                    })}
                </div>

                {/* Navbar Action Button */}
                <div className="navbar-actions">
                    <button
                        className="navbar-cta-btn"
                        onClick={(e) => handleLinkClick('/signin', e)}
                    >
                        Sign In
                    </button>

                    {/* Mobile Hamburger Toggle */}
                    <button
                        className={`navbar-toggle-btn ${mobileMenuOpen ? 'open' : ''}`}
                        onClick={() => setMobileMenuOpen(prev => !prev)}
                        aria-label="Toggle navigation menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>

            {/* Mobile Nav Overlay / Menu */}
            <div className={`navbar-mobile-overlay ${mobileMenuOpen ? 'show' : ''}`}>
                <div className="navbar-mobile-menu">
                    <div className="navbar-mobile-header">
                        <span className="navbar-brand-name">Menu</span>
                        <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div className="navbar-mobile-links">
                        {menuItems.map((item) => {
                            const isActive = currentPath === item.path;
                            return (
                                <a
                                    key={item.label}
                                    href={item.path}
                                    className={`navbar-mobile-link-item ${isActive ? 'active' : ''}`}
                                    onClick={(e) => handleLinkClick(item.path, e)}
                                >
                                    {item.label}
                                    {isActive && <span className="active-bar" />}
                                </a>
                            );
                        })}
                        <button
                            className="navbar-mobile-cta"
                            onClick={(e) => handleLinkClick('/signin', e)}
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
