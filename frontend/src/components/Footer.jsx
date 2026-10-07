import { Link } from 'react-router-dom';
import { Github, Mail, Heart } from 'lucide-react';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer__container container">
                <div className="footer__grid">
                    <div className="footer__brand">
                        <Link to="/" className="footer__logo">
                            <span>🍎</span> NutriVision
                        </Link>
                        <p className="footer__tagline">
                            Nutrition information and calorie guidance for a healthier lifestyle.
                        </p>
                    </div>

                    <div className="footer__links-group">
                        <h4>Quick Links</h4>
                        <Link to="/">Home</Link>
                        <Link to="/about">About</Link>
                        <Link to="/contact">Contact</Link>
                    </div>

                    <div className="footer__links-group">
                        <h4>Account</h4>
                        <Link to="/signin">Sign In</Link>
                        <Link to="/signup">Sign Up</Link>
                        <Link to="/dashboard">Dashboard</Link>
                    </div>

                    <div className="footer__links-group">
                        <h4>Connect</h4>
                        <a href="https://github.com/13harshit" target="_blank" rel="noopener noreferrer">
                            <Github size={16} /> GitHub
                        </a>
                        <a href="mailto:contact@nutrivision.app">
                            <Mail size={16} /> Email
                        </a>
                    </div>
                </div>

                <div className="footer__bottom">
                    <p>© {new Date().getFullYear()} NutriVision. Made with <Heart size={14} className="footer__heart" /> by Harshit</p>
                </div>
            </div>
        </footer>
    );
}
