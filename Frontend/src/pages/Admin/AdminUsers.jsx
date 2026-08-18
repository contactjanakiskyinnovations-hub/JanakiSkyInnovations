import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mail, Phone, Calendar, UserCheck, Shield, Trash2, Loader2, X, SlidersHorizontal, Users } from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const debounceRef = useRef(null);

    const fetchUsers = useCallback(async (keyword = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            const { data } = await api.get(`/api/users?${params.toString()}`);
            setUsers(data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers('');
    }, [fetchUsers]);

    // Debounced search — fires 400ms after user stops typing
    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchUsers(val);
        }, 400);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        fetchUsers('');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/api/users/${id}`);
                fetchUsers(searchTerm);
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    const toggleRole = async (user) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            try {
                await api.put(`/api/users/${user._id}`, { role: newRole });
                fetchUsers(searchTerm);
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to update user role');
            }
        }
    };

    // Apply local role filter on top of already-searched results
    const filteredUsers = roleFilter === 'All'
        ? users
        : users.filter(u => u.role === roleFilter);

    return (
        <div className="admin-users">
            <div className="page-actions">
                <div className="action-header">
                    <h3>User Management</h3>
                    <p>Track customer registrations and manage administrative roles.</p>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="admin-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexGrow: 1, maxWidth: '500px', background: '#f8fafc', border: `1px solid ${searchTerm ? 'var(--primary-orange)' : '#e2e8f0'}`, borderRadius: '10px', padding: '10px 14px', transition: 'border-color 0.2s', position: 'relative' }}>
                    <Search size={16} style={{ color: searchTerm ? 'var(--primary-orange)' : '#94a3b8', flexShrink: 0, transition: 'color 0.2s' }} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or mobile..."
                        value={searchTerm}
                        onChange={handleSearch}
                        style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#0f172a', paddingRight: searchTerm ? '28px' : '0' }}
                    />
                    {searchTerm && (
                        <button
                            onClick={handleClearSearch}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '2px' }}
                            title="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Role:</span>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: '600', fontSize: '13px', background: 'white', cursor: 'pointer' }}
                    >
                        <option value="All">All Roles</option>
                        <option value="user">Customers</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                    <Users size={14} style={{ color: 'var(--primary-orange)' }} />
                    <span>{loading ? '...' : filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {searchTerm && !loading && (
                <div style={{ marginBottom: '10px', fontSize: '13px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SlidersHorizontal size={14} style={{ color: 'var(--primary-orange)' }} />
                    Showing <strong style={{ color: '#0f172a' }}>{filteredUsers.length}</strong> result{filteredUsers.length !== 1 ? 's' : ''} for &ldquo;<span style={{ color: 'var(--primary-orange)' }}>{searchTerm}</span>&rdquo;
                </div>
            )}

            {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

            <div className="admin-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Contact</th>
                                <th>Joined Date</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                                        <Loader2 size={28} className="spin" style={{ margin: '0 auto', color: 'var(--primary-orange)' }} />
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user._id}>
                                        <td>
                                            <div className="product-info-cell">
                                                <div className="admin-avatar" style={{ background: user.role === 'admin' ? '#1a1c23' : 'var(--primary-orange)' }}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="user-details">
                                                    <Link to={`/admin/users/${user._id}`} className="user-name-link">
                                                        <span className="user-name">{user.name}</span>
                                                    </Link>
                                                    <span className="user-id">ID: {user._id.substring(0,8)}...</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-cell">
                                                <div className="contact-item"><Mail size={14} /> {user.email || 'N/A'}</div>
                                                <div className="contact-item"><Phone size={14} /> {user.mobile || 'N/A'}</div>
                                            </div>
                                        </td>
                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge ${user.role === 'admin' ? 'pending' : 'completed'}`}>
                                                {user.role === 'admin' ? 'Admin' : 'Customer'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button 
                                                    className="icon-btn-sm" 
                                                    title={user.role === 'admin' ? "Revoke Admin" : "Promote to Admin"}
                                                    onClick={() => toggleRole(user)}
                                                >
                                                    {user.role === 'admin' ? <UserCheck size={16} /> : <Shield size={16} />}
                                                </button>
                                                <button className="icon-btn-sm danger" title="Delete User" onClick={() => handleDelete(user._id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
