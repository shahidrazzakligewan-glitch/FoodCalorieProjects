import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
    Users, BarChart3, UserCircle, Shield, Loader2, Home, LogOut,
    Edit3, X, Save, Clock, History, ChevronDown, ChevronUp, ArrowLeft, MessageSquare, Download
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';

const COLORS = ['#FF6B35', '#1B998B', '#F7C948', '#A78BFA', '#EF4444', '#22C55E', '#3B82F6', '#EC4899'];

export default function AdminDashboard() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');

    // Data
    const [allUsers, setAllUsers] = useState([]);
    const [allAnalyses, setAllAnalyses] = useState([]);
    const [allSessions, setAllSessions] = useState([]);
    const [allMessages, setAllMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');

    // User detail view
    const [selectedUser, setSelectedUser] = useState(null);

    // Edit modal
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ full_name: '', email: '', role: 'user' });
    const [editSaving, setEditSaving] = useState(false);
    const [editMsg, setEditMsg] = useState('');

    const tabs = [
        { id: 'users', label: 'Users', icon: <Users size={18} /> },
        { id: 'user-history', label: 'User History', icon: <History size={18} /> },
        { id: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
        { id: 'profile', label: 'My Profile', icon: <UserCircle size={18} /> },
    ];

    useEffect(() => { fetchAdminData(); }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        setFetchError('');
        try {
            const [profilesRes, analysesRes, sessionsRes, messagesRes] = await Promise.all([
                supabase.from('profiles').select('*').order('created_at', { ascending: false }),
                supabase.from('food_analysis_history').select('*').order('created_at', { ascending: false }),
                supabase.from('user_sessions').select('*').order('login_at', { ascending: false }),
                supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
            ]);

            if (profilesRes.error) setFetchError(`Users: ${profilesRes.error.message}`);
            if (analysesRes.error) console.warn('Analyses error:', analysesRes.error);
            if (messagesRes.error) console.warn('Messages error:', messagesRes.error);

            setAllUsers(profilesRes.data || []);
            setAllAnalyses(analysesRes.data || []);
            setAllSessions(sessionsRes.data || []);
            setAllMessages(messagesRes.data || []);
        } catch (err) {
            setFetchError(`Connection error: ${err.message}`);
        }
        setLoading(false);
    };

    // Filter: only non-admin users
    const regularUsers = allUsers.filter(u => u.role !== 'admin');

    // Helpers
    const getUserAnalysisCount = (userId) => allAnalyses.filter(a => a.user_id === userId).length;
    const getUserCalories = (userId) => allAnalyses.filter(a => a.user_id === userId).reduce((s, a) => s + (a.total_calories || 0), 0);
    const getUserSessions = (userId) => allSessions.filter(s => s.user_id === userId);
    const getUserHistory = (userId) => allAnalyses.filter(a => a.user_id === userId);
    const getUserTotalTime = (userId) => {
        const sessions = getUserSessions(userId);
        return sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    };
    const getUserLastActive = (userId) => {
        const sessions = getUserSessions(userId);
        if (sessions.length === 0) return null;
        return new Date(Math.max(...sessions.map(s => new Date(s.last_active_at || s.login_at).getTime())));
    };

    // Edit user
    const openEditModal = (u) => {
        setEditingUser(u);
        setEditForm({ full_name: u.full_name || '', email: u.email || '', role: u.role || 'user' });
        setEditMsg('');
    };

    const saveEditUser = async () => {
        if (!editingUser) return;
        setEditSaving(true);
        setEditMsg('');
        const { error } = await supabase.from('profiles').update({
            full_name: editForm.full_name,
            role: editForm.role,
            updated_at: new Date().toISOString()
        }).eq('id', editingUser.id);

        if (error) {
            setEditMsg(`Error: ${error.message}`);
        } else {
            setEditMsg('Updated successfully!');
            setAllUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, full_name: editForm.full_name, role: editForm.role } : u));
            setTimeout(() => { setEditingUser(null); setEditMsg(''); }, 1000);
        }
        setEditSaving(false);
    };

    // Analytics data
    const buildAnalyticsData = () => {
        // Daily visits
        const dailyVisits = {};
        allSessions.forEach(s => {
            const day = new Date(s.login_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!dailyVisits[day]) dailyVisits[day] = { date: day, visits: 0, uniqueUsers: new Set() };
            dailyVisits[day].visits++;
            dailyVisits[day].uniqueUsers.add(s.user_id);
        });
        const dailyData = Object.values(dailyVisits).map(d => ({
            date: d.date, visits: d.visits, uniqueUsers: d.uniqueUsers.size
        })).slice(-14);

        // Analyses per day
        const dailyAnalyses = {};
        allAnalyses.forEach(a => {
            const day = new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!dailyAnalyses[day]) dailyAnalyses[day] = { date: day, imageAnalyses: 0, calorieSearches: 0 };
            if (a.type === 'calorie_search') dailyAnalyses[day].calorieSearches++;
            else dailyAnalyses[day].imageAnalyses++;
        });
        const analysesData = Object.values(dailyAnalyses).slice(-14);

        // User activity ranking
        const userActivity = regularUsers.map(u => ({
            name: u.full_name || u.email?.split('@')[0] || 'User',
            sessions: getUserSessions(u.id).length,
            analyses: getUserAnalysisCount(u.id),
            minutes: getUserTotalTime(u.id)
        })).filter(u => u.sessions > 0 || u.analyses > 0).sort((a, b) => b.analyses - a.analyses);

        return { dailyData, analysesData, userActivity };
    };

    const downloadMessagesPDF = () => {
        if (allMessages.length === 0) return;

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Contact Messages Report', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const tableColumn = ["Date", "Name", "Email", "Subject", "Message"];
        const tableRows = [];

        allMessages.forEach(msg => {
            const messageData = [
                new Date(msg.created_at).toLocaleDateString(),
                msg.name || 'N/A',
                msg.email || 'N/A',
                msg.subject || 'N/A',
                (msg.message || '').length > 100 ? msg.message.substring(0, 100) + '...' : msg.message
            ];
            tableRows.push(messageData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [167, 139, 250], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            columnStyles: {
                0: { cellWidth: 25 }, // Date
                1: { cellWidth: 35 }, // Name
                2: { cellWidth: 45 }, // Email
                3: { cellWidth: 35 }, // Subject
                4: { cellWidth: 'auto' } // Message
            }
        });

        // Open the PDF in a new tab to bypass IDM/Download Manager interception.
        // It allows the browser's native PDF viewer to handle saving/printing.
        const pdfBlob = doc.output('blob');
        const url = window.URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="dashboard">
                <div className="dashboard__main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={40} className="spin-icon" style={{ color: 'var(--color-primary)' }} />
                </div>
            </div>
        );
    }

    const analytics = buildAnalyticsData();

    return (
        <div className="dashboard">
            {/* Edit User Modal */}
            {editingUser && (
                <div className="modal-overlay" onClick={() => setEditingUser(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><Edit3 size={18} /> Edit User</h3>
                            <button onClick={() => setEditingUser(null)} className="modal-close"><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input className="form-input" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email (read-only)</label>
                                <input className="form-input" value={editForm.email} disabled style={{ opacity: 0.6 }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select className="form-input" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            {editMsg && <p style={{ color: editMsg.startsWith('Error') ? '#EF4444' : '#22C55E', fontSize: '0.85rem', marginTop: '8px' }}>{editMsg}</p>}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveEditUser} disabled={editSaving}>
                                {editSaving ? <Loader2 size={14} className="spin-icon" /> : <Save size={14} />} Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <div className="dashboard__sidebar">
                <div className="dashboard__sidebar-header">
                    <div className="dashboard__avatar" style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)' }}>
                        <Shield size={20} />
                    </div>
                    <div>
                        <p className="dashboard__user-name">Admin Panel</p>
                        <p className="dashboard__user-email">{user?.email}</p>
                    </div>
                </div>

                <nav className="dashboard__nav">
                    {tabs.map(tab => (
                        <button key={tab.id}
                            className={`dashboard__nav-item ${activeTab === tab.id ? 'dashboard__nav-item--active' : ''}`}
                            onClick={() => { setActiveTab(tab.id); setSelectedUser(null); }}
                        >
                            {tab.icon} {tab.label}
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
                {/* ===== USERS TAB ===== */}
                {activeTab === 'users' && (
                    <div className="dashboard__tab animate-fade-in">
                        <h2>Manage Users</h2>
                        <p className="dashboard__tab-desc">View and edit all registered users (admins are hidden).</p>

                        {fetchError && (
                            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>
                                <p style={{ color: '#EF4444', fontSize: '0.85rem' }}>{fetchError}</p>
                            </div>
                        )}

                        <div className="admin-stats">
                            <div className="analysis-stat glass-card">
                                <h4>Total Users</h4>
                                <span>{regularUsers.length}</span>
                            </div>
                            <div className="analysis-stat glass-card">
                                <h4>Total Analyses</h4>
                                <span>{allAnalyses.length}</span>
                            </div>
                            <div className="analysis-stat glass-card">
                                <h4>Total Sessions</h4>
                                <span>{allSessions.length}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <table className="upload-results__table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Analyses</th>
                                        <th>Sessions</th>
                                        <th>Last Active</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {regularUsers.length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No regular users yet</td></tr>
                                    ) : regularUsers.map((u, i) => (
                                        <tr key={u.id || i}>
                                            <td style={{ fontWeight: 500 }}>{u.full_name || '—'}</td>
                                            <td>{u.email}</td>
                                            <td><span className="profile-role-badge">{u.role || 'user'}</span></td>
                                            <td>{getUserAnalysisCount(u.id)}</td>
                                            <td>{getUserSessions(u.id).length}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {getUserLastActive(u.id) ? getUserLastActive(u.id).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                                            </td>
                                            <td>
                                                <button className="btn-icon" onClick={() => openEditModal(u)} title="Edit User">
                                                    <Edit3 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ===== USER HISTORY TAB ===== */}
                {activeTab === 'user-history' && !selectedUser && (
                    <div className="dashboard__tab animate-fade-in">
                        <h2>User History</h2>
                        <p className="dashboard__tab-desc">Click a user to view their full analysis history and details.</p>

                        <div className="user-cards-grid">
                            {regularUsers.map((u, i) => (
                                <div key={u.id || i} className="user-card glass-card" onClick={() => setSelectedUser(u)}>
                                    <div className="user-card__avatar">{(u.full_name || u.email || '?').charAt(0).toUpperCase()}</div>
                                    <div className="user-card__info">
                                        <h4>{u.full_name || u.email?.split('@')[0] || 'User'}</h4>
                                        <span>{u.email}</span>
                                    </div>
                                    <div className="user-card__stats">
                                        <div><strong>{getUserAnalysisCount(u.id)}</strong><span>Analyses</span></div>
                                        <div><strong>{getUserCalories(u.id).toFixed(0)}</strong><span>kcal</span></div>
                                        <div><strong>{getUserSessions(u.id).length}</strong><span>Visits</span></div>
                                    </div>
                                </div>
                            ))}
                            {regularUsers.length === 0 && (
                                <div className="dashboard__empty glass-card" style={{ gridColumn: '1/-1' }}>
                                    <Users size={48} color="var(--text-muted)" />
                                    <p>No users yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== SELECTED USER DETAIL ===== */}
                {activeTab === 'user-history' && selectedUser && (
                    <div className="dashboard__tab animate-fade-in">
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUser(null)} style={{ marginBottom: '16px' }}>
                            <ArrowLeft size={14} /> Back to Users
                        </button>

                        <div className="user-detail-header glass-card">
                            <div className="user-card__avatar" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>
                                {(selectedUser.full_name || selectedUser.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 style={{ marginBottom: '4px' }}>{selectedUser.full_name || 'Unnamed User'}</h2>
                                <p style={{ color: 'var(--text-muted)' }}>{selectedUser.email}</p>
                            </div>
                        </div>

                        {/* User Stats */}
                        <div className="admin-stats" style={{ marginTop: '20px' }}>
                            <div className="analysis-stat glass-card">
                                <h4>Total Analyses</h4>
                                <span>{getUserAnalysisCount(selectedUser.id)}</span>
                            </div>
                            <div className="analysis-stat glass-card">
                                <h4>Total Calories</h4>
                                <span>{getUserCalories(selectedUser.id).toFixed(0)}</span>
                            </div>
                            <div className="analysis-stat glass-card">
                                <h4>Total Visits</h4>
                                <span>{getUserSessions(selectedUser.id).length}</span>
                            </div>
                            <div className="analysis-stat glass-card">
                                <h4>Time Spent</h4>
                                <span>{getUserTotalTime(selectedUser.id)} min</span>
                            </div>
                        </div>

                        {/* User's Session History */}
                        {getUserSessions(selectedUser.id).length > 0 && (
                            <div className="analysis-chart glass-card" style={{ marginTop: '20px' }}>
                                <h3><Clock size={16} /> Session History</h3>
                                <table className="upload-results__table" style={{ marginTop: '12px' }}>
                                    <thead>
                                        <tr><th>Login Time</th><th>Last Active</th><th>Duration</th></tr>
                                    </thead>
                                    <tbody>
                                        {getUserSessions(selectedUser.id).slice(0, 10).map((s, i) => (
                                            <tr key={i}>
                                                <td>{new Date(s.login_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                                <td>{new Date(s.last_active_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                                <td>{s.duration_minutes || 0} min</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* User's Analysis History */}
                        <div style={{ marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '12px' }}>📋 Analysis History</h3>
                            {getUserHistory(selectedUser.id).length === 0 ? (
                                <div className="dashboard__empty glass-card">
                                    <History size={32} color="var(--text-muted)" />
                                    <p>No analyses yet</p>
                                </div>
                            ) : (
                                <div className="history-list">
                                    {getUserHistory(selectedUser.id).map((entry, i) => (
                                        <div key={entry.id || i} className="history-item glass-card">
                                            <div className="history-item__header">
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span className={`history-item__type-badge ${entry.type === 'calorie_search' ? 'history-item__type-badge--search' : ''}`}>
                                                            {entry.type === 'image_analysis' ? '📸 Image' : '🔍 Search'}
                                                        </span>
                                                        <h4>{entry.filename || entry.search_query || 'Unknown'}</h4>
                                                    </div>
                                                    <span className="history-item__date">
                                                        {new Date(entry.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <span className="history-item__calories">{(entry.total_calories || 0).toFixed(1)} kcal</span>
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
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== ANALYTICS TAB ===== */}
                {activeTab === 'analytics' && (
                    <div className="dashboard__tab animate-fade-in">
                        <h2>Platform Analytics</h2>
                        <p className="dashboard__tab-desc">User visits, activity trends, and engagement analytics.</p>

                        <div className="admin-stats">
                            <div className="analysis-stat glass-card">
                                <h4>Total Visits</h4>
                                <span>{allSessions.length}</span>
                            </div>
                            <div className="analysis-stat glass-card">
                                <h4>Total Analyses</h4>
                                <span>{allAnalyses.length}</span>
                            </div>
                            <div className="analysis-stat glass-card">
                                <h4>Avg Time/Session</h4>
                                <span>{allSessions.length > 0 ? Math.round(allSessions.reduce((s, ses) => s + (ses.duration_minutes || 0), 0) / allSessions.length) : 0} min</span>
                            </div>
                        </div>

                        <div className="analysis-charts" style={{ marginTop: '24px' }}>
                            {/* Daily Visits Chart */}
                            {analytics.dailyData.length > 0 && (
                                <div className="analysis-chart glass-card">
                                    <h3>📈 Daily Visits & Unique Users</h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <LineChart data={analytics.dailyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                                            <Tooltip contentStyle={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                            <Legend />
                                            <Line type="monotone" dataKey="visits" stroke="var(--color-primary)" strokeWidth={2} name="Total Visits" />
                                            <Line type="monotone" dataKey="uniqueUsers" stroke="var(--color-secondary)" strokeWidth={2} name="Unique Users" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Daily Analyses Chart */}
                            {analytics.analysesData.length > 0 && (
                                <div className="analysis-chart glass-card">
                                    <h3>🔬 Daily Analyses</h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={analytics.analysesData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                                            <Tooltip contentStyle={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                            <Legend />
                                            <Bar dataKey="imageAnalyses" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Image Analyses" />
                                            <Bar dataKey="calorieSearches" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} name="Calorie Searches" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* User Activity Ranking */}
                            {analytics.userActivity.length > 0 && (
                                <div className="analysis-chart glass-card">
                                    <h3>🏆 User Activity Ranking</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={analytics.userActivity} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                                            <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={100} />
                                            <Tooltip contentStyle={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                            <Legend />
                                            <Bar dataKey="analyses" fill="var(--color-primary)" name="Analyses" />
                                            <Bar dataKey="sessions" fill="var(--color-secondary)" name="Sessions" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {analytics.dailyData.length === 0 && analytics.analysesData.length === 0 && (
                                <div className="dashboard__empty glass-card">
                                    <BarChart3 size={48} color="var(--text-muted)" />
                                    <p>No activity data yet.</p>
                                    <span>Data will appear as users visit and use the platform.</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== PROFILE TAB ===== */}
                {activeTab === 'profile' && (
                    <div className="dashboard__tab animate-fade-in">
                        <h2>Admin Profile</h2>
                        <p className="dashboard__tab-desc">Your admin account details.</p>
                        <div className="profile-section glass-card">
                            <h3>Account Information</h3>
                            <div className="profile-info">
                                <div className="profile-info__row"><span>Email</span><span>{user?.email}</span></div>
                                <div className="profile-info__row">
                                    <span>Role</span>
                                    <span className="profile-role-badge" style={{ background: 'rgba(167,139,250,0.1)', color: '#A78BFA' }}>admin</span>
                                </div>
                                <div className="profile-info__row">
                                    <span>Member Since</span>
                                    <span>{new Date(user?.created_at || Date.now()).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== MESSAGES TAB ===== */}
                {activeTab === 'messages' && (
                    <div className="dashboard__tab animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h2>Contact Messages</h2>
                            <button
                                className="btn btn-secondary"
                                onClick={downloadMessagesPDF}
                                disabled={allMessages.length === 0}
                                style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 16px' }}
                            >
                                <Download size={16} /> Download PDF
                            </button>
                        </div>
                        <p className="dashboard__tab-desc">Submissions from the public Contact Us page.</p>

                        {allMessages.length === 0 ? (
                            <div className="dashboard__empty glass-card">
                                <MessageSquare size={48} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                                <p>No messages yet.</p>
                                <span>When users submit the contact form, their queries will appear here.</span>
                            </div>
                        ) : (
                            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                                <table className="upload-results__table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Sender</th>
                                            <th>Subject</th>
                                            <th>Message</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allMessages.map(msg => (
                                            <tr key={msg.id}>
                                                <td style={{ whiteSpace: 'nowrap', verticalAlign: 'top', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                    {new Date(msg.created_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ verticalAlign: 'top' }}>
                                                    <div style={{ fontWeight: 500 }}>{msg.name}</div>
                                                    <a href={`mailto:${msg.email}`} style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none' }}>{msg.email}</a>
                                                </td>
                                                <td style={{ verticalAlign: 'top', fontWeight: 500 }}>
                                                    {msg.subject}
                                                </td>
                                                <td style={{ verticalAlign: 'top', maxWidth: '300px' }}>
                                                    <div style={{ padding: '12px', background: 'var(--bg-dark-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                                        {msg.message}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
