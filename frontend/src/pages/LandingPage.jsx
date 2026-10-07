import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Camera, Brain, BarChart3 } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
    const features = [
        {
            icon: <Camera size={28} />,
            title: 'Food Guidance',
            description: 'Explore popular foods and learn about their calorie values, portion ideas, and common nutrition facts.',
            color: 'var(--color-primary)'
        },
        {
            icon: <Brain size={28} />,
            title: 'Calorie Facts',
            description: 'Understand calorie basics and how different foods fit into a balanced diet without needing prediction tools.',
            color: 'var(--color-secondary)'
        },
        {
            icon: <BarChart3 size={28} />,
            title: 'Track Habits',
            description: 'Follow healthier food habits with simple, clear nutrition insight and everyday calorie awareness.',
            color: 'var(--color-accent)'
        },
        {
            icon: <Sparkles size={28} />,
            title: 'Healthy Lifestyle',
            description: 'Build better food choices with easy educational guidance and practical nutrition support.',
            color: '#A78BFA'
        }
    ];

    const foodEmojis = ['🍎', '🍌', '🥕', '🍊', '🥝', '🍕', '🍅', '🧅', '🥑', '🍇', '🍓', '🫐', '🍑', '🥭'];

    return (
        <div className="landing">
            {/* Hero Section */}
            <section className="hero">
                {/* Floating Food Emojis */}
                <div className="hero__food-particles">
                    {foodEmojis.map((emoji, i) => (
                        <span
                            key={i}
                            className="hero__food-particle"
                            style={{
                                left: `${5 + (i * 7) % 90}%`,
                                top: `${10 + (i * 13) % 80}%`,
                                animationDelay: `${i * 0.5}s`,
                                animationDuration: `${4 + (i % 4)}s`,
                                fontSize: `${1.5 + (i % 3) * 0.5}rem`
                            }}
                        >
                            {emoji}
                        </span>
                    ))}
                </div>

                {/* Gradient Orbs */}
                <div className="hero__orb hero__orb--1"></div>
                <div className="hero__orb hero__orb--2"></div>
                <div className="hero__orb hero__orb--3"></div>

                <div className="hero__content container">
                    <div className="hero__badge animate-fade-in-up">
                        <Sparkles size={14} />
                        AI-Powered Food Analysis
                    </div>

                    <h1 className="hero__title animate-fade-in-up delay-100">
                        Learn Your Food.
                        <span className="hero__title-gradient"> Make Healthier Choices.</span>
                    </h1>

                    <p className="hero__subtitle animate-fade-in-up delay-200">
                        Explore calorie information, healthy food guidance, and nutrition insights in a simple,
                        easy-to-understand website designed for everyday wellness.
                    </p>

                    <div className="hero__actions animate-fade-in-up delay-300">
                        <Link to="/about" className="btn btn-primary btn-lg">
                            Explore Nutrition <ArrowRight size={18} />
                        </Link>
                        <Link to="/contact" className="btn btn-secondary btn-lg">
                            Contact Us
                        </Link>
                    </div>

                    {/* Animated Food Plate */}
                    <div className="hero__plate-container animate-fade-in-up delay-400">
                        <div className="hero__plate">
                            <div className="hero__plate-ring"></div>
                            <div className="hero__plate-items">
                                <span className="hero__plate-item" style={{ '--delay': '0s', '--angle': '0deg' }}>🍎</span>
                                <span className="hero__plate-item" style={{ '--delay': '0.3s', '--angle': '60deg' }}>🍌</span>
                                <span className="hero__plate-item" style={{ '--delay': '0.6s', '--angle': '120deg' }}>🍊</span>
                                <span className="hero__plate-item" style={{ '--delay': '0.9s', '--angle': '180deg' }}>🥝</span>
                                <span className="hero__plate-item" style={{ '--delay': '1.2s', '--angle': '240deg' }}>🍅</span>
                                <span className="hero__plate-item" style={{ '--delay': '1.5s', '--angle': '300deg' }}>🥕</span>
                            </div>
                            <div className="hero__plate-center">
                                <span className="hero__plate-cal">AI</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features section">
                <div className="container">
                    <div className="features__header">
                        <h2 className="features__title">Powerful Features</h2>
                        <p className="features__subtitle">
                            Everything you need to understand your food's nutritional content
                        </p>
                    </div>

                    <div className="features__grid">
                        {features.map((feature, i) => (
                            <div
                                key={i}
                                className="feature-card glass-card"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div className="feature-card__icon" style={{ color: feature.color, background: `${feature.color}15` }}>
                                    {feature.icon}
                                </div>
                                <h3 className="feature-card__title">{feature.title}</h3>
                                <p className="feature-card__desc">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works section">
                <div className="container">
                    <h2 className="how-it-works__title">How It Works</h2>
                    <div className="how-it-works__steps">
                        <div className="step">
                            <div className="step__number">01</div>
                            <div className="step__icon">�</div>
                            <h3>Explore Foods</h3>
                            <p>Browse common foods and learn their calorie values and overall nutrition profile.</p>
                        </div>
                        <div className="step__connector"></div>
                        <div className="step">
                            <div className="step__number">02</div>
                            <div className="step__icon">🥗</div>
                            <h3>Understand Nutrition</h3>
                            <p>Learn how calories, portions, and nutrient balance affect your daily health goals.</p>
                        </div>
                        <div className="step__connector"></div>
                        <div className="step">
                            <div className="step__number">03</div>
                            <div className="step__icon">📊</div>
                            <h3>Choose Better</h3>
                            <p>Use clear information to make smarter food decisions and maintain a healthier routine.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta section">
                <div className="container">
                    <div className="cta__card glass-card">
                        <div className="cta__food-bg">
                            <span>🍎</span><span>🍌</span><span>🥕</span><span>🍊</span>
                        </div>
                        <h2>Ready to Start Your Nutrition Journey?</h2>
                        <p>Use NutriVision as an informative calorie and nutrition website built for better everyday choices.</p>
                        <div className="cta__actions">
                            <Link to="/about" className="btn btn-primary btn-lg">
                                Learn More <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
