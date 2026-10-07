import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import './Auth.css';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

    const validatePassword = (value) => value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedEmail = email.trim();
        const submittedPassword = password;

        if (!validateEmail(trimmedEmail)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (!submittedPassword || !validatePassword(submittedPassword)) {
            setError('Password must be at least 8 characters and include uppercase, lowercase, and a number.');
            return;
        }

        setLoading(true);

        const { error: submitError } = await signIn(trimmedEmail, submittedPassword);

        if (submitError) {
            setError(submitError.message || 'Unable to sign in. Please try again.');
            setLoading(false);
            return;
        }

        navigate('/dashboard');
    };

    const handleGoogleSignIn = async () => {
        setError('');
        const { error } = await signInWithGoogle();
        if (error) {
            setError(error.message);
            return;
        }
        navigate('/dashboard');
    };

    return (
        <div className="auth-page">
            <div className="auth-page__decoration">
                <span>🍎</span><span>🥕</span><span>🍌</span><span>🍊</span>
            </div>

            <div className="auth-card auth-card--modern">
                <div className="auth-card__header">
                    <div className="auth-badge">
                        <Sparkles size={14} />
                        Welcome back
                    </div>
                    <div className="auth-card__logo">🍏</div>
                    <h1>Sign in</h1>
                    <p>Access your nutrition dashboard and healthy insights.</p>
                </div>

                <button className="auth-google-btn" onClick={handleGoogleSignIn} type="button">
                    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                        <path fill="#34A853" d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z" />
                        <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
                        <path fill="#EA4335" d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.48 0 2.438 2.017.956 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" />
                    </svg>
                    Continue with Google
                </button>

                <div className="auth-divider"><span>or</span></div>

                {error && <div className="form-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="signin-email">Email</label>
                        <input
                            id="signin-email"
                            className="form-input"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            maxLength={120}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="signin-password">Password</label>
                        <div className="password-field">
                            <input
                                id="signin-password"
                                className="form-input"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={8}
                                maxLength={128}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="auth-utility-row">
                        <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? <Loader2 size={18} className="spin-icon" /> : <LogIn size={18} />}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    Don’t have an account? <Link to="/signup">Create one</Link>
                </div>
            </div>
        </div>
    );
}
