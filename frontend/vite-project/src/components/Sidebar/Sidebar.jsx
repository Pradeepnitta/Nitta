import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

function Sidebar({ collapsed, setCollapsed, currentPath = '/dashboard', onNavigate }) {
    const { user, logout } = useAuth();

    // Side navigation tree structured by category
    const menuGroups = [
        {
            group: 'Main',
            items: [
                {
                    label: 'Home',
                    path: '/dashboard',
                    role: ['user', 'admin'],
                    icon: (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    )
                },
                {
                    label: 'Membership',
                    path: '/membership',
                    role: ['user', 'admin'],
                    icon: (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    )
                },
                {
                    label: 'Transactions',
                    path: '/payments',
                    role: ['user', 'admin'],
                    icon: (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                    ),
                    badge: '2'
                }
            ]
        },
        {
            group: 'Administration',
            items: [
                {
                    label: 'Admin Panel',
                    path: '/admin/dashboard',
                    role: ['admin'],
                    icon: (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    ),
                    badge: 'Live'
                }
            ]
        },
        {
            group: 'Preferences',
            items: [
                {
                    label: 'Settings',
                    path: '/settings',
                    role: ['user', 'admin'],
                    icon: (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.5 1z" />
                        </svg>
                    )
                }
            ]
        }
    ];

    const handleItemClick = (path, e) => {
        e.preventDefault();
        if (onNavigate) {
            onNavigate(path);
        }
    };

    // Filters menu categories based on current user role privileges
    const filteredGroups = menuGroups.map(group => {
        const items = group.items.filter(item => {
            if (!user) return item.role.includes('user');
            return item.role.includes(user.role);
        });
        return { ...group, items };
    }).filter(group => group.items.length > 0);

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* Header branding */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="url(#sidebar-logo-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <defs>
                            <linearGradient id="sidebar-logo-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#fbbf24" />
                                <stop offset="1" stopColor="#fb7185" />
                            </linearGradient>
                        </defs>
                    </svg>
                    {!collapsed && <span className="sidebar-brand-text">Nitta</span>}
                </div>
                
                {/* Collapse/Expand toggle button */}
                <button
                    className="sidebar-collapse-btn"
                    onClick={() => setCollapsed(prev => !prev)}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        {collapsed ? (
                            <path d="M9 18l6-6-6-6" />
                        ) : (
                            <path d="M15 18l-6-6 6-6" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Menu groups links lists */}
            <div className="sidebar-body">
                {filteredGroups.map((group) => (
                    <div key={group.group} className="sidebar-menu-group">
                        {!collapsed && <div className="sidebar-group-title">{group.group}</div>}
                        <div className="sidebar-group-items">
                            {group.items.map((item) => {
                                const isActive = currentPath === item.path;
                                return (
                                    <a
                                        key={item.label}
                                        href={item.path}
                                        className={`sidebar-item ${isActive ? 'active' : ''}`}
                                        onClick={(e) => handleItemClick(item.path, e)}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <div className="sidebar-item-icon">{item.icon}</div>
                                        {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
                                        {!collapsed && item.badge && (
                                            <span className={`sidebar-item-badge ${item.badge === 'Live' ? 'badge-live' : ''}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Profile card */}
            <div className="sidebar-footer">
                {user ? (
                    <div className="sidebar-profile-card">
                        <div className="sidebar-avatar">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        {!collapsed && (
                            <div className="sidebar-profile-info">
                                <span className="profile-name">{user.name || 'User'}</span>
                                <span className="profile-email">{user.email || 'user@example.com'}</span>
                            </div>
                        )}
                        {!collapsed && (
                            <button
                                className="sidebar-logout-btn"
                                onClick={logout}
                                title="Sign out"
                                aria-label="Sign out"
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        )}
                    </div>
                ) : (
                    <a href="/signin" className="sidebar-login-prompt" onClick={(e) => handleItemClick('/signin', e)}>
                        <div className="sidebar-item-icon">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                <polyline points="10 17 15 12 10 7" />
                                <line x1="15" y1="12" x2="3" y2="12" />
                            </svg>
                        </div>
                        {!collapsed && <span>Sign In</span>}
                    </a>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
