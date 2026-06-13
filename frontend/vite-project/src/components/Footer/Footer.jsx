import { useState } from 'react';
import './Footer.css';

function Footer({ onNavigate }) {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email.trim()) {
            setSubmitted(true);
            setEmail('');
            setTimeout(() => setSubmitted(false), 3000);
        }
    };

    const handleLinkClick = (path, e) => {
        if (e) e.preventDefault();
        if (onNavigate) {
            onNavigate(path);
        }
    };

    return (
        <footer className="footer">
            <div className="footer-top">
                {/* Column 1: Brand description */}
                <div className="footer-column brand-col">
                    <a href="/dashboard" className="footer-brand" onClick={(e) => handleLinkClick('/dashboard', e)}>
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="url(#footer-logo-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <defs>
                                <linearGradient id="footer-logo-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#fbbf24" />
                                    <stop offset="1" stopColor="#fb7185" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="footer-brand-name">Nitta</span>
                    </a>
                    <p className="footer-description">
                        Building premium interfaces and robust backend integration models. Access clean dashboard metrics with modern design.
                    </p>
                </div>

                {/* Column 2: Navigation Links */}
                <div className="footer-column links-col">
                    <h4 className="footer-col-title">Platform</h4>
                    <ul className="footer-links-list">
                        <li><a href="/dashboard" onClick={(e) => handleLinkClick('/dashboard', e)}>Console overview</a></li>
                        <li><a href="/payments" onClick={(e) => handleLinkClick('/payments', e)}>Transactions</a></li>
                        <li><a href="/settings" onClick={(e) => handleLinkClick('/settings', e)}>Preferences</a></li>
                        <li><a href="/admin/dashboard" onClick={(e) => handleLinkClick('/admin/dashboard', e)}>Admin panel</a></li>
                    </ul>
                </div>

                {/* Column 3: Resources */}
                <div className="footer-column links-col">
                    <h4 className="footer-col-title">Resources</h4>
                    <ul className="footer-links-list">
                        <li><a href="/docs" onClick={(e) => handleLinkClick('/docs', e)}>Documentation</a></li>
                        <li><a href="/status" onClick={(e) => handleLinkClick('/status', e)}>System status</a></li>
                        <li><a href="/security" onClick={(e) => handleLinkClick('/security', e)}>Security center</a></li>
                        <li><a href="/support" onClick={(e) => handleLinkClick('/support', e)}>Help desk</a></li>
                    </ul>
                </div>

                {/* Column 4: Newsletter mockup */}
                <div className="footer-column newsletter-col">
                    <h4 className="footer-col-title">Stay Connected</h4>
                    <p className="newsletter-text">Subscribe to receive system release notes and security audits.</p>
                    <form className="newsletter-form" onSubmit={handleSubscribe}>
                        <input
                            type="email"
                            placeholder="your.email@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="newsletter-input"
                        />
                        <button type="submit" className="newsletter-submit-btn">
                            {submitted ? 'Subscribed!' : 'Join'}
                        </button>
                    </form>
                    {submitted && <span className="newsletter-success-note">Thank you for joining our feed!</span>}
                </div>
            </div>

            <div className="footer-divider" />

            {/* Bottom copyright details and socials */}
            <div className="footer-bottom">
                <div className="footer-bottom-left">
                    <span className="copyright-text">&copy; {new Date().getFullYear()} Antigravity Inc. All rights reserved.</span>
                    <div className="footer-meta-links">
                        <a href="/privacy" onClick={(e) => handleLinkClick('/privacy', e)}>Privacy Policy</a>
                        <span className="meta-dot">&bull;</span>
                        <a href="/terms" onClick={(e) => handleLinkClick('/terms', e)}>Terms of Service</a>
                    </div>
                </div>

                {/* Social icons list */}
                <div className="footer-socials">
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="GitHub">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                    </a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="Twitter">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                        </svg>
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="LinkedIn">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                            <circle cx="4" cy="4" r="2" />
                        </svg>
                    </a>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
