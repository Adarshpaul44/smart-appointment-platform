import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, LogIn, UserPlus, Shield, UserCheck } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register({ name, email, password, phone, role });
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail, quickPassword) => {
    setError('');
    setLoading(true);
    try {
      await login(quickEmail, quickPassword);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            {isRegister ? 'Create an Account' : 'Sign In to Your Account'}
          </h2>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            padding: '0.65rem 0.85rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Adarsh Paul" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  placeholder="+1-555-0199" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="customer">Customer / Patient</option>
                  <option value="admin">Administrator (Evaluator Mode)</option>
                </select>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isRegister ? 'Register Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
          {isRegister ? (
            <>Already have an account? <span style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }} onClick={() => setIsRegister(false)}>Sign In</span></>
          ) : (
            <>Don't have an account? <span style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }} onClick={() => setIsRegister(true)}>Register here</span></>
          )}
        </div>

        {/* 1-Click Demo Profiles */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.04em' }}>
            ⚡ 1-Click Demo Profiles (For College Evaluator)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={() => handleQuickLogin('admin@appointment.com', 'Admin@123')}
            >
              <Shield size={14} color="#d97706" />
              <strong>Administrator</strong> (Full Analytics & Management)
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={() => handleQuickLogin('alice.smith@example.com', 'Password@123')}
            >
              <UserCheck size={14} color="#10b981" />
              <strong>Alice Smith</strong> (Low Risk Demo Customer - 100% Attendance)
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={() => handleQuickLogin('john.davis@example.com', 'Password@123')}
            >
              <UserCheck size={14} color="#ef4444" />
              <strong>John Davis</strong> (High Risk Demo Customer - Past No-Shows)
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={() => handleQuickLogin('adarsh@vitstudent.ac.in', 'Password@123')}
            >
              <UserCheck size={14} color="#2563eb" />
              <strong>Adarsh Paul . T</strong> (Registered Student Profile)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
