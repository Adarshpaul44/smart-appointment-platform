import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Shield, Bell, User, LogOut, Play, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ onOpenAuth, onOpenNotifications, unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const [runningAuto, setRunningAuto] = React.useState(false);
  const [autoMessage, setAutoMessage] = React.useState(null);

  const handleRunAutomation = async () => {
    try {
      setRunningAuto(true);
      const res = await api.automation.runCycle();
      setAutoMessage(`Cycle executed: ${res.data.remindersSent} reminders, ${res.data.highRiskAlertsSent} high-risk alerts.`);
      setTimeout(() => setAutoMessage(null), 4000);
    } catch (err) {
      setAutoMessage('Automation error: ' + err.message);
      setTimeout(() => setAutoMessage(null), 4000);
    } finally {
      setRunningAuto(false);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div style={{ background: '#2563eb', padding: '0.45rem', borderRadius: '8px', color: '#fff', display: 'flex' }}>
          <Calendar size={20} />
        </div>
        <div>
          <span style={{ color: '#0f172a', fontWeight: 800 }}>SmartAppointment</span>
          <span style={{ color: '#2563eb', fontWeight: 700 }}>.io</span>
        </div>
        <span className="student-tag">
          Adarsh Paul . T (24MIS0564)
        </span>
      </div>

      <div className="navbar-actions">
        {autoMessage && (
          <span style={{ fontSize: '0.8rem', background: '#ecfdf5', color: '#065f46', padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
            {autoMessage}
          </span>
        )}

        {user && user.role === 'admin' && (
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={handleRunAutomation}
            disabled={runningAuto}
            title="Trigger automated reminder check and risk recalculation"
          >
            <Play size={14} />
            {runningAuto ? 'Running...' : 'Run Automation Cycle'}
          </button>
        )}

        {user ? (
          <>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={onOpenNotifications}
              style={{ position: 'relative' }}
              title="View in-app notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '50%',
                  fontSize: '0.65rem',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                background: user.role === 'admin' ? '#fef3c7' : '#e0e7ff',
                color: user.role === 'admin' ? '#92400e' : '#3730a3',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                {user.role === 'admin' ? <Shield size={14} /> : <User size={14} />}
                {user.name} ({user.role.toUpperCase()})
              </div>

              <button className="btn btn-secondary btn-sm" onClick={logout} title="Sign Out">
                <LogOut size={15} />
              </button>
            </div>
          </>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
            Sign In / Register
          </button>
        )}
      </div>
    </header>
  );
}
