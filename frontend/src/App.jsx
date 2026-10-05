import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AuthModal from './pages/AuthModal';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { api } from './services/api';
import { X, Bell } from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function fetchNotifs() {
      if (user) {
        try {
          const res = await api.notifications.getMy();
          setNotifications(res.data || []);
        } catch (e) {
          console.error('Failed to fetch notifications:', e);
        }
      }
    }
    fetchNotifs();
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading Smart Appointment Platform...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar 
        onOpenAuth={() => setShowAuthModal(true)} 
        onOpenNotifications={() => setShowNotifDrawer(true)}
        unreadCount={notifications.length}
      />

      {!user ? (
        <LandingPage onOpenAuth={() => setShowAuthModal(true)} />
      ) : user.role === 'admin' ? (
        <AdminDashboard />
      ) : (
        <CustomerDashboard />
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Notifications Drawer */}
      {showNotifDrawer && (
        <div className="modal-overlay" onClick={() => setShowNotifDrawer(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} color="#2563eb" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>In-App Notifications</h3>
              </div>
              <button onClick={() => setShowNotifDrawer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem' }}>
                  No notifications yet.
                </p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb' }}>{n.type}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(n.sent_at).toLocaleTimeString()}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#1e293b' }}>{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
