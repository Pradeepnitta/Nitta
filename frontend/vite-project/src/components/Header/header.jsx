import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

function Header({ title = 'Overview', onToggleSidebar, onOpenSearch, onNavigate }) {
    const { user, logout } = useAuth();
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);

    // Mock notification items list
    const notifications = [
        { id: 1, text: 'Your verification was approved.', time: '5m ago', read: false },
        { id: 2, text: 'New login detected from Safari.', time: '2h ago', read: false },
        { id: 3, text: 'Security patches applied.', time: '1d ago', read: true }
    ];

    // Close dropdowns on clicks outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setProfileDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLink = (path, e) => {
        e.preventDefault();
        setProfileDropdownOpen(false);
        if (onNavigate) {
            onNavigate(path);
        }
    };

    return (
        <header className="header">
            {/* Sidebar toggle and section header info */}
            <div className="header-left">
                <button
                    className="header-mobile-toggle"
                    onClick={onToggleSidebar}
                    aria-label="Toggle Sidebar Menu"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                <div className="header-breadcrumbs">
                    <span className="breadcrumb-parent">Console</span>
                    <span className="breadcrumb-slash">/</span>
                    <h1 className="breadcrumb-current">{title}</h1>
                </div>
            </div>

            {/* Quick search input overlay trigger */}
            <div className="header-center">
                <button className="header-search-trigger" onClick={onOpenSearch}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <span>Search Console...</span>
                    <kbd>Ctrl K</kbd>
                </button>
            </div>

            {/* Notification triggers & Profile avatars dropdowns */}
            <div className="header-right">
                {/* Connection Status indicator */}
                <div className="header-status" title="Live connection active">
                    <span className="status-dot"></span>
                    <span className="status-label">Online</span>
                </div>

                {/* Notifications Bell */}
                <div className="header-action-container" ref={notifRef}>
                    <button
                        className={`header-action-btn ${notifDropdownOpen ? 'active' : ''}`}
                        onClick={() => setNotifDropdownOpen(prev => !prev)}
                        aria-label="View notifications"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <span className="notif-badge-pulse" />
                    </button>

                    {/* Notifications Dropdown Panel */}
                    {notifDropdownOpen && (
                        <div className="header-dropdown notification-dropdown">
                            <div className="dropdown-header">
                                <h3>Notifications</h3>
                                <button className="dropdown-clear-btn">Mark read</button>
                            </div>
                            <div className="dropdown-list">
                                {notifications.map(n => (
                                    <div key={n.id} className={`dropdown-item notif-item ${!n.read ? 'unread' : ''}`}>
                                        <div className="notif-bullet" />
                                        <div className="notif-content">
                                            <p>{n.text}</p>
                                            <span>{n.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile menu avatar dropdown */}
                {user && (
                    <div className="header-action-container" ref={dropdownRef}>
                        <button
                            className="header-profile-trigger"
                            onClick={() => setProfileDropdownOpen(prev => !prev)}
                            aria-label="Toggle user profile menu"
                        >
                            <div className="header-avatar">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span className="header-profile-name">{user.name || 'User'}</span>
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chevron-icon">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {/* Profile Dropdown Panel */}
                        {profileDropdownOpen && (
                            <div className="header-dropdown profile-dropdown">
                                <div className="profile-dropdown-user">
                                    <strong>{user.name}</strong>
                                    <span>{user.email}</span>
                                    <div className="user-role-tag">{user.role}</div>
                                </div>
                                <div className="dropdown-divider" />
                                <a href="/settings" className="dropdown-link-item" onClick={(e) => handleLink('/settings', e)}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.5 1z" />
                                    </svg>
                                    Settings
                                </a>
                                <a href="/dashboard" className="dropdown-link-item" onClick={(e) => handleLink('/dashboard', e)}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="9" />
                                        <rect x="14" y="3" width="7" height="5" />
                                        <rect x="14" y="12" width="7" height="9" />
                                        <rect x="3" y="16" width="7" height="5" />
                                    </svg>
                                    Dashboard
                                </a>
                                <div className="dropdown-divider" />
                                <button className="dropdown-action-btn logout" onClick={logout}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;
