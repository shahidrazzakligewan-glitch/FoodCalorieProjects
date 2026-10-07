import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, ChevronDown, LogOut, User, Shield } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user, userProfile, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMobileOpen(false);
        setIsDropdownOpen(false);
    }, [location]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const navLinks = [
        { to: '/', label: 'Home' },
        { to: '/about', label: 'About' },
        { to: '/contact', label: 'Contact' },
    ];

    return (
        <nav className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
            <div className="navbar__container container">
                <Link to="/" className="navbar__logo">
                    <span className="navbar__logo-icon">🍎</span>
                    <span className="navbar__logo-text">NutriVision</span>
                </Link>

                <div className={`navbar__links ${isMobileOpen ? 'navbar__links--open' : ''}`}>
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`navbar__link ${location.pathname === link.to ? 'navbar__link--active' : ''}`}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {user ? (
                        <div className="navbar__user-menu">
                            <button
                                className="navbar__user-btn"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <div className="navbar__avatar">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                                <ChevronDown size={16} />
                            </button>

                            {isDropdownOpen && (
                                <div className="navbar__dropdown">
                                    <Link to="/dashboard" className="navbar__dropdown-item">
                                        <User size={16} /> Dashboard
                                    </Link>
                                    {userProfile?.role === 'admin' && (
                                        <Link to="/admin" className="navbar__dropdown-item">
                                            <Shield size={16} /> Admin Panel
                                        </Link>
                                    )}
                                    <button onClick={handleSignOut} className="navbar__dropdown-item navbar__dropdown-item--danger">
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="navbar__auth-btns">
                            <Link to="/signin" className="btn btn-secondary btn-sm">Sign In</Link>
                            <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
                        </div>
                    )}
                </div>

                <button
                    className="navbar__mobile-toggle"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                >
                    {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </nav>
    );
}
