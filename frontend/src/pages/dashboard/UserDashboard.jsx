import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Upload, History, BarChart3, UserCircle, Loader2, Image, Trash2, Lock, ChevronDown, ChevronUp, LogOut, Home } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const API_URL = import.meta.env.DEV ? 'http://localhost:8000' : import.meta.env.VITE_API_URL;

// Compress image to a much smaller base64 string to fit in Supabase row limits
function compressImage(file, maxWidth = 300) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new window.Image();
        img.onload = () => {
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // High compression: 0.4 quality JPEG
            resolve(canvas.toDataURL('image/jpeg', 0.4));
        };
        img.src = URL.createObjectURL(file);
    });
}

export default function UserDashboard() {
    const { user, userProfile, updatePassword, signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('upload');

    // Upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [saveStatus, setSaveStatus] = useState('');
    const [saveErrorMsg, setSaveErrorMsg] = useState('');

    // History state
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [expandedEntry, setExpandedEntry] = useState(null);
    const [historyError, setHistoryError] = useState('');

    // Analysis state
    const [analysisData, setAnalysisData] = useState({ foods: [], daily: [] });

    // Profile state
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [profileMsg, setProfileMsg] = useState('');
    const [profileError, setProfileError] = useState('');

    const tabs = [
        { id: 'upload', label: 'Upload', icon: <Upload size={18} /> },
        { id: 'history', label: 'History', icon: <History size={18} /> },
        { id: 'analysis', label: 'Analysis', icon: <BarChart3 size={18} /> },
        { id: 'profile', label: 'Profile', icon: <UserCircle size={18} /> },
    ];

    // Build analysis data from history
    const buildAnalysisData = useCallback((data) => {
        const foodCounts = {};
        const dailyCalories = {};

        data.forEach(entry => {
            const day = new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!dailyCalories[day]) dailyCalories[day] = { date: day, calories: 0, searches: 0 };
            dailyCalories[day].calories += (entry.total_calories || 0);
            dailyCalories[day].searches += 1;

            if (entry.results && Array.isArray(entry.results)) {
                entry.results.forEach(r => {
                    const label = r.Label || r.label || r.name || 'Unknown';
                    const cal = parseFloat(r['Energy (kcal)'] || r.calories || 0);
                    if (!foodCounts[label]) {
                        foodCounts[label] = { name: label, totalCalories: 0, count: 0 };
                    }
                    foodCounts[label].totalCalories += cal;
                    foodCounts[label].count += 1;
                });
            }
        });

        setAnalysisData({
            foods: Object.values(foodCounts),
            daily: Object.values(dailyCalories).slice(-14)
        });
    }, []);

    // Fetch history from Supabase
    const fetchHistory = useCallback(async () => {
        if (!user) return;
        setHistoryLoading(true);
        setHistoryError('');
        try {
            const { data, error } = await supabase
                .from('food_analysis_history')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase fetch error:', error);
                setHistoryError(`Database error: ${error.message}. Make sure you've run the SQL setup in Supabase.`);
            } else if (data) {
                setHistoryData(data);
                buildAnalysisData(data);
            }
        } catch (err) {
            console.error('Error fetching history:', err);
            setHistoryError(`Connection error: ${err.message}`);
        }
        setHistoryLoading(false);
    }, [user, buildAnalysisData]);

    useEffect(() => {
        if (activeTab === 'history' || activeTab === 'analysis') {
            fetchHistory();
        }
    }, [activeTab, fetchHistory]);

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setAnalysisResult(null);
            setUploadError('');
            setSaveStatus('');
            setSaveErrorMsg('');
        }
    };

    // Handle upload & analyze
    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        setUploadError('');
        setAnalysisResult(null);
        setSaveStatus('');
        setSaveErrorMsg('');

        try {
            // Compress original image for DB storage
            const compressedOriginal = await compressImage(selectedFile);

            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch(`${API_URL}/analyze`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            setAnalysisResult(data);

            // Save to Supabase
            if (user) {
                setSaveStatus('saving');
                // Compress annotated image too
                let annotatedCompressed = null;
                if (data.annotated_image) {
                    // Create a small version of the annotated image
                    const annotatedBlob = await fetch(`data:image/jpeg;base64,${data.annotated_image}`).then(r => r.blob());
                    const annotatedFile = new File([annotatedBlob], 'annotated.jpg', { type: 'image/jpeg' });
                    annotatedCompressed = await compressImage(annotatedFile);
                }

                const insertData = {
                    user_id: user.id,
                    type: 'image_analysis',
                    filename: selectedFile.name,
                    original_image: compressedOriginal,
                    annotated_image: annotatedCompressed,
                    results: data.results || [],
                    total_calories: data.total_calories || 0,
                    thumb_detected: data.thumb_detected || false
                };

                console.log('Inserting to Supabase:', { ...insertData, original_image: '[base64_hidden]', annotated_image: '[base64_hidden]' });

                const { data: insertResult, error: insertError } = await supabase
                    .from('food_analysis_history')
                    .insert([insertData])
                    .select();

                if (insertError) {
                    console.error('Supabase insert error:', insertError);
                    setSaveStatus('error');
                    setSaveErrorMsg(insertError.message);
                } else {
                    console.log('Saved successfully:', insertResult);
                    setSaveStatus('saved');
                }
            }
        } catch (err) {
            setUploadError(`Failed to analyze image. Make sure the backend server is running at ${API_URL}. Error: ${err.message}`);
        }
        setUploading(false);
    };

    // Handle password update
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setProfileMsg('');
        setProfileError('');

        if (newPassword !== confirmNewPassword) {
            setProfileError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setProfileError('Password must be at least 6 characters.');
            return;
        }

        const { error } = await updatePassword(newPassword);
        if (error) {
            setProfileError(error.message);
        } else {
            setProfileMsg('Password updated successfully!');
            setNewPassword('');
            setConfirmNewPassword('');
        }
    };

    // Delete history item from Supabase
    const deleteHistoryItem = async (id) => {
        const { error } = await supabase.from('food_analysis_history').delete().eq('id', id);
        if (!error) {
            setHistoryData(prev => prev.filter(item => item.id !== id));
        } else {
            console.error('Delete error:', error.message);
        }
    };

    const COLORS = ['#FF6B35', '#1B998B', '#F7C948', '#A78BFA', '#EF4444', '#22C55E', '#3B82F6', '#EC4899'];

    return (
        <div className="dashboard">
            <div className="dashboard__sidebar">
                <div className="dashboard__sidebar-header">
                    <div className="dashboard__avatar">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="dashboard__user-name">{user?.user_metadata?.full_name || 'User'}</p>
                        <p className="dashboard__user-email">{user?.email}</p>
                    </div>
                </div>

                <nav className="dashboard__nav">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`dashboard__nav-item ${activeTab === tab.id ? 'dashboard__nav-item--active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="dashboard__sidebar-footer">
                    <button className="dashboard__nav-item dashboard__nav-item--danger" onClick={async () => { await signOut(); navigate('/'); }}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </div>

            <div className="dashboard__main">
                {/* Upload Tab */}
                {activeTab === 'upload' && (
                    <div className="dashboard__tab animate-fade-in">
                        <h2>Upload Food Image</h2>
                        <p className="dashboard__tab-desc">Upload a photo of your food to get calorie estimates using our YOLOv5 model.</p>

                        <div className="upload-area glass-card">
                            {!preview ? (
                                <label className="upload-area__drop" htmlFor="file-upload">
                                    <Image size={48} color="var(--text-muted)" />
                                    <p>Click to upload or drag and drop</p>
                                    <span>JPG, JPEG, PNG (Max 10MB)</span>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            ) : (
                                <div className="upload-area__preview">
                                    <img src={preview} alt="Preview" />
                                    <button className="btn btn-sm btn-secondary" onClick={() => { setPreview(null); setSelectedFile(null); setAnalysisResult(null); setSaveStatus(''); }}>
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        {preview && !analysisResult && (
                            <button className="btn btn-primary btn-lg" onClick={handleUpload} disabled={uploading} style={{ marginTop: '16px' }}>
                                {uploading ? <><Loader2 size={18} className="spin-icon" /> Analyzing...</> : <><Upload size={18} /> Analyze Image</>}
                            </button>
                        )}

                        {uploadError && <div className="form-error" style={{ marginTop: '12px' }}>{uploadError}</div>}

                        {analysisResult && (
                            <div className="upload-results animate-scale-in">
                                <h3>Analysis Results</h3>

                                {/* Before & After Images */}
                                <div className="upload-results__comparison">
                                    <div className="upload-results__compare-item">
                                        <h4>📷 Original</h4>
                                        {preview && <img src={preview} alt="Original" />}
                                    </div>
                                    {analysisResult.annotated_image && (
                                        <div className="upload-results__compare-item">
                                            <h4>🔍 Detected</h4>
                                            <img src={`data:image/jpeg;base64,${analysisResult.annotated_image}`} alt="Annotated" />
                                        </div>
                                    )}
                                </div>

                                <div className="upload-results__total">
                                    <span>Total Estimated Calories</span>
                                    <strong>{(analysisResult.total_calories || 0).toFixed(2)} kcal</strong>
                                </div>

                                {analysisResult.results && analysisResult.results.length > 0 ? (
                                    <table className="upload-results__table">
                                        <thead>
                                            <tr>
                                                <th>Food Item</th>
                                                <th>Confidence</th>
                                                <th>Mass (g)</th>
                                                <th>Calories (kcal)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analysisResult.results.map((r, i) => (
                                                <tr key={i}>
                                                    <td>{r.Label}</td>
                                                    <td>{r.Confidence}</td>
                                                    <td>{r['Mass (g)']}</td>
                                                    <td>{r['Energy (kcal)']}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>No food items detected.</p>
                                )}

                                {/* Save status indicators */}
                                {saveStatus === 'saving' && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Loader2 size={14} className="spin-icon" /> Saving to Supabase...
                                    </p>
                                )}
                                {saveStatus === 'saved' && (
                                    <p style={{ color: '#22C55E', fontSize: '0.85rem', marginTop: '12px' }}>
                                        ✅ Results saved to Supabase database
                                    </p>
                                )}
                                {saveStatus === 'error' && (
                                    <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>
                                        <p style={{ color: '#EF4444', fontSize: '0.85rem', fontWeight: 600 }}>
                                            ⚠️ Failed to save to Supabase
                                        </p>
                                        <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '4px' }}>
                                            {saveErrorMsg || 'Unknown error. Check browser console for details.'}
                                        </p>
                                    </div>
                                )}
                                {!user && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '12px' }}>
                                        ℹ️ Sign in to save results to your history
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="dashboard__tab animate-fade-in">
                        <h2>Analysis History</h2>
                        <p className="dashboard__tab-desc">View your past food analysis results stored in Supabase.</p>

                        {historyError && (
                            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>
                                <p style={{ color: '#EF4444', fontSize: '0.85rem' }}>{historyError}</p>
                            </div>
                        )}

                        {historyLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <Loader2 size={32} className="spin-icon" style={{ color: 'var(--color-primary)' }} />
                            </div>
                        ) : historyData.length === 0 && !historyError ? (
                            <div className="dashboard__empty glass-card">
                                <History size={48} color="var(--text-muted)" />
                                <p>No analysis history yet.</p>
                                <span>Upload a food image or use the Calorie Calculator to get started!</span>
                            </div>
                        ) : (
                            <div className="history-list">
                                {historyData.map((entry, i) => {
                                    const isExpanded = expandedEntry === (entry.id || i);
                                    const isImageAnalysis = entry.type === 'image_analysis';
                                    const isCalSearch = entry.type === 'calorie_search';

                                    return (
                                        <div key={entry.id || i} className="history-item glass-card">
                                            <div className="history-item__header" onClick={() => setExpandedEntry(isExpanded ? null : (entry.id || i))} style={{ cursor: 'pointer' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span className={`history-item__type-badge ${isCalSearch ? 'history-item__type-badge--search' : ''}`}>
                                                            {isImageAnalysis ? '📸 Image' : isCalSearch ? '🔍 Search' : '📋 Analysis'}
                                                        </span>
                                                        <h4>{entry.filename || entry.search_query || 'Unknown'}</h4>
                                                    </div>
                                                    <span className="history-item__date">
                                                        {new Date(entry.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric', month: 'short', day: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="history-item__actions">
                                                    <span className="history-item__calories">{(entry.total_calories || 0).toFixed(1)} kcal</span>
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    <button className="history-item__delete" onClick={(e) => { e.stopPropagation(); deleteHistoryItem(entry.id); }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {entry.results && entry.results.length > 0 && (
                                                <div className="history-item__results">
                                                    {entry.results.map((r, j) => (
                                                        <span key={j} className="history-item__tag">
                                                            {r.Label || r.label || r.name}: {r['Energy (kcal)'] || r.calories || 0} kcal
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {isExpanded && (
                                                <div className="history-item__expanded animate-fade-in">
                                                    {(entry.original_image || entry.annotated_image) && (
                                                        <div className="upload-results__comparison">
                                                            {entry.original_image && (
                                                                <div className="upload-results__compare-item">
                                                                    <h4>📷 Original</h4>
                                                                    <img src={entry.original_image} alt="Original" />
                                                                </div>
                                                            )}
                                                            {entry.annotated_image && (
                                                                <div className="upload-results__compare-item">
                                                                    <h4>🔍 Detected</h4>
                                                                    <img src={entry.annotated_image} alt="Annotated" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {entry.results && entry.results.length > 0 && (
                                                        <table className="upload-results__table" style={{ marginTop: '12px' }}>
                                                            <thead>
                                                                <tr>
                                                                    <th>Food Item</th>
                                                                    {isImageAnalysis && <th>Confidence</th>}
                                                                    {isImageAnalysis && <th>Mass (g)</th>}
                                                                    <th>Calories (kcal)</th>
                                                                    {isCalSearch && <th>Protein (g)</th>}
                                                                    {isCalSearch && <th>Carbs (g)</th>}
                                                                    {isCalSearch && <th>Fat (g)</th>}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {entry.results.map((r, j) => (
                                                                    <tr key={j}>
                                                                        <td style={{ textTransform: 'capitalize' }}>{r.Label || r.label || r.name}</td>
                                                                        {isImageAnalysis && <td>{r.Confidence}</td>}
                                                                        {isImageAnalysis && <td>{r['Mass (g)']}</td>}
                                                                        <td>{r['Energy (kcal)'] || r.calories}</td>
                                                                        {isCalSearch && <td>{r.protein_g}</td>}
                                                                        {isCalSearch && <td>{r.carbohydrates_total_g}</td>}
                                                                        {isCalSearch && <td>{r.fat_total_g}</td>}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Analysis Tab */}
                {activeTab === 'analysis' && (
                    <div className="dashboard__tab animate-fade-in">
                        <h2>Calorie Analysis</h2>
                        <p className="dashboard__tab-desc">Overview of all food items you've analyzed — from uploads and calorie searches.</p>

                        {(!analysisData.foods || analysisData.foods.length === 0) ? (
                            <div className="dashboard__empty glass-card">
                                <BarChart3 size={48} color="var(--text-muted)" />
                                <p>No data to analyze yet.</p>
                                <span>Upload food images or search the calorie calculator!</span>
                            </div>
                        ) : (
                            <div className="analysis-charts">
                                <div className="analysis-stats">
                                    <div className="analysis-stat glass-card">
                                        <h4>Total Analyses</h4>
                                        <span>{historyData.length}</span>
                                    </div>
                                    <div className="analysis-stat glass-card">
                                        <h4>Total Calories</h4>
                                        <span>{historyData.reduce((sum, e) => sum + (e.total_calories || 0), 0).toFixed(0)}</span>
                                    </div>
                                    <div className="analysis-stat glass-card">
                                        <h4>Unique Foods</h4>
                                        <span>{analysisData.foods.length}</span>
                                    </div>
                                </div>

                                {analysisData.daily && analysisData.daily.length > 0 && (
                                    <div className="analysis-chart glass-card">
                                        <h3>📈 Daily Calorie Trend</h3>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <LineChart data={analysisData.daily}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                                <Tooltip contentStyle={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                                <Legend />
                                                <Line type="monotone" dataKey="calories" stroke="var(--color-primary)" strokeWidth={2} dot={{ fill: 'var(--color-primary)' }} name="Calories" />
                                                <Line type="monotone" dataKey="searches" stroke="var(--color-secondary)" strokeWidth={2} dot={{ fill: 'var(--color-secondary)' }} name="Searches" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                <div className="analysis-chart glass-card">
                                    <h3>🔥 Calories per Food Item</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={analysisData.foods}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                                            <Tooltip contentStyle={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                            <Bar dataKey="totalCalories" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Total Calories" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="analysis-chart glass-card">
                                    <h3>🥧 Food Distribution</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie data={analysisData.foods} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, count }) => `${name} (${count})`}>
                                                {analysisData.foods.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="dashboard__tab animate-fade-in">
                        <h2>Profile Settings</h2>
                        <p className="dashboard__tab-desc">Manage your account and security settings.</p>

                        <div className="profile-section glass-card">
                            <h3>Account Information</h3>
                            <div className="profile-info">
                                <div className="profile-info__row"><span>Name</span><span>{user?.user_metadata?.full_name || 'Not set'}</span></div>
                                <div className="profile-info__row"><span>Email</span><span>{user?.email}</span></div>
                                <div className="profile-info__row"><span>Role</span><span className="profile-role-badge">{userProfile?.role || 'user'}</span></div>
                                <div className="profile-info__row"><span>Member Since</span><span>{new Date(user?.created_at || Date.now()).toLocaleDateString()}</span></div>
                            </div>
                        </div>

                        <div className="profile-section glass-card">
                            <h3><Lock size={18} /> Change Password</h3>
                            {profileMsg && <div className="form-success">{profileMsg}</div>}
                            {profileError && <div className="form-error">{profileError}</div>}
                            <form onSubmit={handlePasswordUpdate}>
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <input className="form-input" type="password" placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm New Password</label>
                                    <input className="form-input" type="password" placeholder="••••••••" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
                                </div>
                                <button type="submit" className="btn btn-primary"><Lock size={16} /> Update Password</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
