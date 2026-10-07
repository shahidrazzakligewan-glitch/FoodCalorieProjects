import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import './Auth.css';

export default function SignUp() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { signUp, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const validateName = (value) => value.trim().length >= 2 && /^[A-Za-zÀ-ÿ'\-\s]+$/.test(value.trim());
    const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    const validatePassword = (value) => value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const trimmedName = name.trim();
        const trimmedEmail = email.trim();

        if (!validateName(trimmedName)) {
            setError('Please enter a valid full name with at least 2 letters.');
            return;
        }

        if (!validateEmail(trimmedEmail)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (!validatePassword(password)) {
            setError('Password must be at least 8 characters and include uppercase, lowercase, and a number.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        const { error: submitError } = await signUp(trimmedEmail, password, trimmedName);

        if (submitError) {
            setError(submitError.message || 'Unable to create your account. Please try again.');
            setLoading(false);
            return;
        }

        setSuccess('Account created successfully. Redirecting to sign in...');
        setLoading(false);
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');

        setTimeout(() => {
            navigate('/signin');
        }, 1200);
    };

    const handleGoogleSignUp = async () => {
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
                <span>🥝</span><span>🍇</span><span>🍓</span><span>🫐</span>
            </div>

            <div className="auth-card auth-card--modern">
                <div className="auth-card__header">
                    <div className="auth-badge">
                        <Sparkles size={14} />
                        Create account
                    </div>
                    <div className="auth-card__logo">🥝</div>
                    <h1>Join NutriVision</h1>
                    <p>Build healthier habits with clear nutrition guidance.</p>
                </div>

                <button className="auth-google-btn" onClick={handleGoogleSignUp} type="button">
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
                {success && <div className="form-success">{success}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-name">Full Name</label>
                        <input
                            id="signup-name"
                            className="form-input"
                            type="text"
                            autoComplete="name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={80}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-email">Email</label>
                        <input
                            id="signup-email"
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
                        <label className="form-label" htmlFor="signup-password">Password</label>
                        <div className="password-field">
                            <input
                                id="signup-password"
                                className="form-input"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                placeholder="Create a strong password"
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
                        <small className="form-hint">Use 8+ characters with uppercase, lowercase, and a number.</small>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="signup-confirm-password">Confirm Password</label>
                        <div className="password-field">
                            <input
                                id="signup-confirm-password"
                                className="form-input"
                                type={showConfirmPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                minLength={8}
                                maxLength={128}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                            >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? <Loader2 size={18} className="spin-icon" /> : <UserPlus size={18} />}
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/signin">Sign In</Link>
                </div>
            </div>
        </div>
    );
}
