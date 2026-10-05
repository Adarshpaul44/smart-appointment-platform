import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Users, Calendar, CheckCircle, XCircle, AlertTriangle, 
  Clock, Plus, Search, Filter, RefreshCw, Send, Star, ShieldAlert, BarChart3, Settings
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, high-risk, appointments, availability, customers, simulator, feedback
  const [analytics, setAnalytics] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState(null);

  // Filters for Appointments Table
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Add Slot Form State
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotStart, setSlotStart] = useState('09:00:00');
  const [slotEnd, setSlotEnd] = useState('10:00:00');

  // Simulator State
  const [simNoShows, setSimNoShows] = useState(2);
  const [simCancellations, setSimCancellations] = useState(1);
  const [simCompleted, setSimCompleted] = useState(1);
  const [simConfirmed, setSimConfirmed] = useState('UNCONFIRMED');
  const [simResult, setSimResult] = useState(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, apptsRes, custRes, fbRes, slotsRes] = await Promise.all([
        api.analytics.getDashboard(),
        api.appointments.getAll(),
        api.analytics.getCustomers(),
        api.feedback.getAll(),
        api.availability.getSlots()
      ]);

      setAnalytics(analyticsRes.data || null);
      setAppointments(apptsRes.data || []);
      setCustomers(custRes.data || []);
      setFeedback(fbRes || null);
      setSlots(slotsRes.data || []);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Run Simulator on changes
  useEffect(() => {
    async function runSimulation() {
      try {
        const res = await api.risk.simulate({
          noShowCount: simNoShows,
          cancelledCount: simCancellations,
          completedCount: simCompleted,
          confirmationStatus: simConfirmed
        });
        setSimResult(res.data);
      } catch (err) {
        console.error('Simulation error:', err);
      }
    }
    runSimulation();
  }, [simNoShows, simCancellations, simCompleted, simConfirmed]);

  const showNotice = (text, isError = false) => {
    setActionNotice({ text, isError });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.appointments.updateStatus(id, status, `Marked ${status} by Administrator`);
      showNotice(`Appointment #${id} marked as ${status}`);
      loadAllData();
    } catch (err) {
      showNotice('Error: ' + err.message, true);
    }
  };

  const handleSendReminder = async (id) => {
    try {
      await api.appointments.sendUrgentReminder(id);
      showNotice(`Urgent reminder dispatched for Appointment #${id}!`);
    } catch (err) {
      showNotice('Reminder dispatch error: ' + err.message, true);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await api.availability.createSlot({
        date: slotDate,
        start_time: slotStart,
        end_time: slotEnd
      });
      showNotice('Availability slot added successfully!');
      const updatedSlots = await api.availability.getSlots();
      setSlots(updatedSlots.data || []);
    } catch (err) {
      showNotice('Error creating slot: ' + err.message, true);
    }
  };

  const handleToggleSlot = async (slotId, currentStatus) => {
    try {
      await api.availability.toggleSlot(slotId, !currentStatus);
      showNotice(`Slot #${slotId} status toggled.`);
      const updatedSlots = await api.availability.getSlots();
      setSlots(updatedSlots.data || []);
    } catch (err) {
      showNotice('Error toggling slot: ' + err.message, true);
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = !searchQuery.trim() || 
      (a.customer_name && a.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.customer_email && a.customer_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.service_type && a.service_type.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesRisk = riskFilter === 'ALL' || a.risk_level === riskFilter;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  const highRiskList = appointments.filter(a => a.risk_level === 'HIGH' && a.status !== 'CANCELLED' && a.status !== 'COMPLETED');

  const kpi = analytics ? analytics.kpi : {
    totalAppointments: 0,
    totalCustomers: 0,
    confirmedCount: 0,
    unconfirmedCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    noShowCount: 0,
    highRiskUpcomingCount: 0,
    confirmationRate: 0,
    noShowRate: 0,
    cancellationRate: 0
  };

  return (
    <div className="main-layout">
      {/* Admin Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ padding: '0 0.5rem 1rem 0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Admin Control Center
          </h4>
        </div>

        <button 
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={18} /> Executive Overview
        </button>

        <button 
          className={`nav-item ${activeTab === 'high-risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('high-risk')}
        >
          <ShieldAlert size={18} /> High-Risk Control ({highRiskList.length})
        </button>

        <button 
          className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <Calendar size={18} /> All Appointments ({appointments.length})
        </button>

        <button 
          className={`nav-item ${activeTab === 'availability' ? 'active' : ''}`}
          onClick={() => setActiveTab('availability')}
        >
          <Clock size={18} /> Slot Management
        </button>

        <button 
          className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          <Users size={18} /> Customer Directory
        </button>

        <button 
          className={`nav-item ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          <Settings size={18} /> Risk Engine Simulator
        </button>

        <button 
          className={`nav-item ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          <Star size={18} /> Customer Feedback
        </button>
      </aside>

      {/* Main Admin Content Area */}
      <main className="content-area">
        {actionNotice && (
          <div style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            background: actionNotice.isError ? '#fef2f2' : '#ecfdf5',
            color: actionNotice.isError ? '#991b1b' : '#065f46',
            border: `1px solid ${actionNotice.isError ? '#fecaca' : '#a7f3d0'}`,
            fontWeight: 600
          }}>
            {actionNotice.text}
          </div>
        )}

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                  Operational Executive Dashboard
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Real-time analytics, risk indicators, and appointment KPIs.
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={loadAllData}>
                <RefreshCw size={14} /> Refresh Data
              </button>
            </div>

            {/* KPI Cards Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <Calendar size={24} />
                </div>
                <div className="stat-content">
                  <h3>{kpi.totalAppointments}</h3>
                  <p>Total Appointments</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                  <CheckCircle size={24} />
                </div>
                <div className="stat-content">
                  <h3>{kpi.confirmedCount} <span style={{ fontSize: '0.9rem', color: '#059669' }}>({kpi.confirmationRate}%)</span></h3>
                  <p>Confirmed Appointments</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
                  <Clock size={24} />
                </div>
                <div className="stat-content">
                  <h3>{kpi.unconfirmedCount}</h3>
                  <p>Pending / Unconfirmed</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
                  <CheckCircle size={24} />
                </div>
                <div className="stat-content">
                  <h3>{kpi.completedCount}</h3>
                  <p>Completed Visits</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
                  <XCircle size={24} />
                </div>
                <div className="stat-content">
                  <h3>{kpi.cancelledCount} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>({kpi.cancellationRate}%)</span></h3>
                  <p>Cancelled (Slots Released)</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  <AlertTriangle size={24} />
                </div>
                <div className="stat-content">
                  <h3>{kpi.noShowCount} <span style={{ fontSize: '0.9rem', color: '#dc2626' }}>({kpi.noShowRate}%)</span></h3>
                  <p>Historical No-Shows</p>
                </div>
              </div>

              <div className="stat-card" style={{ border: '2px solid #fecaca', background: '#fff5f5' }}>
                <div className="stat-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                  <ShieldAlert size={24} />
                </div>
                <div className="stat-content">
                  <h3 style={{ color: '#b91c1c' }}>{kpi.highRiskUpcomingCount}</h3>
                  <p style={{ color: '#991b1b', fontWeight: 600 }}>High-Risk Upcoming</p>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {/* Appointments Timeline */}
              <div className="card">
                <h3 className="card-title">Appointments by Day</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>Recent appointment volume trends</p>
                <div className="chart-bar-container">
                  {(analytics && analytics.charts.appointmentsByDay || []).map((item, idx) => (
                    <div key={idx} className="chart-bar-col">
                      <div 
                        className="chart-bar" 
                        style={{ height: `${Math.max(item.count * 30, 15)}px` }}
                        title={`${item.date}: ${item.count} appointments`}
                      />
                      <span className="chart-bar-label">{item.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="card">
                <h3 className="card-title">Appointment Status Distribution</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>Current system state distribution</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {analytics && Object.entries(analytics.charts.statusDistribution || {}).map(([key, val]) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span><strong>{key}</strong></span>
                        <span>{val} ({kpi.totalAppointments > 0 ? Math.round((val / kpi.totalAppointments) * 100) : 0}%)</span>
                      </div>
                      <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${kpi.totalAppointments > 0 ? (val / kpi.totalAppointments) * 100 : 0}%`,
                          height: '100%',
                          background: key === 'CONFIRMED' ? '#10b981' : key === 'NO-SHOW' ? '#ef4444' : key === 'CANCELLED' ? '#94a3b8' : '#3b82f6'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Distribution */}
              <div className="card">
                <h3 className="card-title">Explainable Risk Distribution</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>Appointments categorized by risk score bands</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <div>
                      <strong style={{ color: '#065f46' }}>LOW RISK (0 - 30)</strong>
                      <p style={{ fontSize: '0.75rem', color: '#047857' }}>Reliable attendance record & confirmed status</p>
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#065f46' }}>
                      {analytics ? analytics.charts.riskDistribution.LOW : 0}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    <div>
                      <strong style={{ color: '#92400e' }}>MEDIUM RISK (31 - 60)</strong>
                      <p style={{ fontSize: '0.75rem', color: '#b45309' }}>Moderate past cancellations or unconfirmed</p>
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#92400e' }}>
                      {analytics ? analytics.charts.riskDistribution.MEDIUM : 0}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <div>
                      <strong style={{ color: '#991b1b' }}>HIGH RISK (61 - 100)</strong>
                      <p style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Past no-shows, low attendance rate, unconfirmed</p>
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#991b1b' }}>
                      {analytics ? analytics.charts.riskDistribution.HIGH : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HIGH-RISK APPOINTMENTS SECTION */}
        {activeTab === 'high-risk' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <ShieldAlert size={26} color="#ef4444" />
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                  High-Risk Appointments Management
                </h1>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Appointments with a risk score ≥ 61. Take proactive action with automated follow-ups to recover slots and prevent no-shows.
              </p>
            </div>

            {highRiskList.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#334155' }}>No High-Risk Appointments!</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  All scheduled appointments currently meet low or medium risk thresholds.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {highRiskList.map(item => {
                  let reasons = item.risk_reasons;
                  if (typeof reasons === 'string') {
                    try { reasons = JSON.parse(reasons); } catch (e) { reasons = []; }
                  }

                  return (
                    <div key={item.id} className="card" style={{ borderLeft: '5px solid #ef4444' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb' }}>Appointment #{item.id}</span>
                            <span className="badge badge-high">RISK: {item.risk_score}% ({item.risk_level})</span>
                            <span className={`badge badge-${item.status.toLowerCase()}`}>{item.status}</span>
                          </div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>
                            {item.customer_name} — {item.service_type}
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            Email: {item.customer_email} | Phone: {item.customer_phone || 'N/A'}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem', color: '#334155', fontSize: '0.875rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Calendar size={15} color="#2563eb" /> {item.appointment_date}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Clock size={15} color="#2563eb" /> {item.start_time} - {item.end_time}
                            </span>
                            <span>
                              Confirmation: <strong>{item.confirmation_status}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button 
                            className="btn btn-primary btn-sm" 
                            onClick={() => handleSendReminder(item.id)}
                            title="Dispatches high-priority reminder alert"
                          >
                            <Send size={14} /> Send Urgent Reminder
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleUpdateStatus(item.id, 'NO-SHOW')}
                          >
                            Mark as No-Show
                          </button>
                        </div>
                      </div>

                      {/* Explainable Reasons */}
                      <div className="risk-reasons-box">
                        <strong style={{ fontSize: '0.825rem', color: '#9f1239', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <AlertTriangle size={14} /> Explainable Rationale for High Risk Score:
                        </strong>
                        <ul className="risk-reasons-list">
                          {(reasons || []).map((r, i) => (
                            <li key={i}>• {r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ALL APPOINTMENTS MANAGEMENT */}
        {activeTab === 'appointments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                  Appointment Directory
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Search, filter, update appointment lifecycle states, and track customer attendance.
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search name, email, service..." 
                  style={{ width: '220px' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />

                <select 
                  className="form-control" 
                  style={{ width: '150px' }} 
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="BOOKED">BOOKED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="NO-SHOW">NO-SHOW</option>
                </select>

                <select 
                  className="form-control" 
                  style={{ width: '130px' }} 
                  value={riskFilter}
                  onChange={e => setRiskFilter(e.target.value)}
                >
                  <option value="ALL">All Risks</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
            </div>

            <div className="card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                      <th>Risk Score</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                          No appointments match selected criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map(a => (
                        <tr key={a.id}>
                          <td>#{a.id}</td>
                          <td>
                            <strong>{a.customer_name}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.customer_email}</div>
                          </td>
                          <td>{a.service_type}</td>
                          <td>
                            <div>{a.appointment_date}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.start_time} - {a.end_time}</div>
                          </td>
                          <td>
                            <span className={`badge badge-${a.status.toLowerCase()}`}>
                              {a.status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${a.risk_level.toLowerCase()}`}>
                              {a.risk_score}% {a.risk_level}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              {a.status !== 'COMPLETED' && (
                                <button 
                                  className="btn btn-secondary btn-sm" 
                                  onClick={() => handleUpdateStatus(a.id, 'COMPLETED')}
                                  title="Mark as Completed"
                                >
                                  Complete
                                </button>
                              )}
                              {a.status !== 'NO-SHOW' && a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && (
                                <button 
                                  className="btn btn-danger btn-sm" 
                                  onClick={() => handleUpdateStatus(a.id, 'NO-SHOW')}
                                  title="Mark as No-Show"
                                >
                                  No-Show
                                </button>
                              )}
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
        )}

        {/* TAB 4: AVAILABILITY & WORKING HOURS */}
        {activeTab === 'availability' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                Availability & Working Hours Management
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Configure appointment slot inventory, define working windows, and toggle slot availability.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              {/* Add New Slot Card */}
              <div className="card">
                <h3 className="card-title">Add Availability Slot</h3>
                <form onSubmit={handleCreateSlot} style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={slotDate} 
                      onChange={e => setSlotDate(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input 
                      type="time" 
                      className="form-control" 
                      value={slotStart} 
                      onChange={e => setSlotStart(e.target.value)} 
                      step="60"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input 
                      type="time" 
                      className="form-control" 
                      value={slotEnd} 
                      onChange={e => setSlotEnd(e.target.value)} 
                      step="60"
                      required 
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    <Plus size={16} /> Add Slot to Inventory
                  </button>
                </form>
              </div>

              {/* Slots List */}
              <div className="card">
                <h3 className="card-title">Active Time Slots ({slots.length})</h3>
                <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  {slots.map(slot => (
                    <div key={slot.id} style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      background: slot.is_available ? '#ffffff' : '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <strong>{slot.date}</strong> &nbsp;
                        <span style={{ color: '#475569', fontSize: '0.85rem' }}>
                          {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className={`badge ${slot.is_available ? 'badge-low' : 'badge-cancelled'}`}>
                          {slot.is_available ? 'OPEN' : 'RESERVED / CLOSED'}
                        </span>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleToggleSlot(slot.id, slot.is_available)}
                        >
                          {slot.is_available ? 'Close' : 'Re-open'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMER DIRECTORY */}
        {activeTab === 'customers' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                Customer Attendance Directory
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Attendance history, historical no-shows, cancellation rates, and attendance reliability metrics.
              </p>
            </div>

            <div className="card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer Name</th>
                      <th>Email / Contact</th>
                      <th>Total Bookings</th>
                      <th>Completed Visits</th>
                      <th>Past No-Shows</th>
                      <th>Cancellations</th>
                      <th>Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c.id}>
                        <td>#{c.id}</td>
                        <td><strong>{c.name}</strong></td>
                        <td>
                          <div>{c.email}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.phone || 'No phone'}</div>
                        </td>
                        <td>{c.totalAppointments}</td>
                        <td><span style={{ color: '#059669', fontWeight: 600 }}>{c.completedCount}</span></td>
                        <td>
                          <span style={{ color: c.noShowCount > 0 ? '#dc2626' : '#64748b', fontWeight: c.noShowCount > 0 ? 700 : 400 }}>
                            {c.noShowCount}
                          </span>
                        </td>
                        <td>{c.cancelledCount}</td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            background: parseInt(c.attendanceRate) >= 90 ? '#ecfdf5' : parseInt(c.attendanceRate) >= 70 ? '#fffbeb' : '#fef2f2',
                            color: parseInt(c.attendanceRate) >= 90 ? '#065f46' : parseInt(c.attendanceRate) >= 70 ? '#92400e' : '#991b1b'
                          }}>
                            {c.attendanceRate}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: EXPLAINABLE RISK SIMULATOR */}
        {activeTab === 'simulator' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={24} color="#2563eb" />
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                  Interactive Rule-Based Risk Simulator
                </h1>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Transparent pedagogical simulator for evaluation and viva demonstration.
                Adjust factors to observe instantaneous score calculation and human-readable reasoning.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
              {/* Factor Controls */}
              <div className="card">
                <h3 className="card-title">Adjust Scoring Factors</h3>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">
                    Previous No-Shows: <strong>{simNoShows}</strong>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="5" 
                    value={simNoShows} 
                    onChange={e => setSimNoShows(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    0 = 0 pts | 1 = 20 pts | 2 = 35 pts | 3+ = 45 pts
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Previous Cancellations: <strong>{simCancellations}</strong>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="5" 
                    value={simCancellations} 
                    onChange={e => setSimCancellations(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    0 = 0 pts | 1-2 = 10 pts | 3+ = 15 pts
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Completed/Attended Appointments: <strong>{simCompleted}</strong>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={simCompleted} 
                    onChange={e => setSimCompleted(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Appointment Confirmation Status</label>
                  <select 
                    className="form-control" 
                    value={simConfirmed} 
                    onChange={e => setSimConfirmed(e.target.value)}
                  >
                    <option value="UNCONFIRMED">UNCONFIRMED (+20 points penalty)</option>
                    <option value="CONFIRMED">CONFIRMED (0 penalty points)</option>
                  </select>
                </div>
              </div>

              {/* Real-time Calculation Result */}
              <div className="card">
                <h3 className="card-title">Real-Time Risk Output</h3>
                {simResult && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{
                      padding: '1.5rem',
                      borderRadius: '12px',
                      background: simResult.level === 'HIGH' ? '#fef2f2' : simResult.level === 'MEDIUM' ? '#fffbeb' : '#ecfdf5',
                      border: `2px solid ${simResult.level === 'HIGH' ? '#fecaca' : simResult.level === 'MEDIUM' ? '#fde68a' : '#a7f3d0'}`,
                      textAlign: 'center',
                      marginBottom: '1.25rem'
                    }}>
                      <div style={{ fontSize: '3rem', fontWeight: 800, color: simResult.level === 'HIGH' ? '#dc2626' : simResult.level === 'MEDIUM' ? '#d97706' : '#10b981', lineHeight: 1 }}>
                        {simResult.score}%
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
                        {simResult.level} RISK CLASSIFICATION
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {simResult.model}
                      </div>
                    </div>

                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                      Explainable Reason Breakdown:
                    </h4>
                    {simResult.reasons.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: '#059669' }}>
                        ✅ Zero penalty factors detected. Customer has reliable attendance profile and confirmed booking.
                      </p>
                    ) : (
                      <ul className="risk-reasons-list">
                        {simResult.reasons.map((r, i) => (
                          <li key={i}>• {r}</li>
                        ))}
                      </ul>
                    )}

                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b' }}>
                      <em>Note: Deterministic rule weights can be re-calibrated in <code>src/config/riskConfig.js</code>.</em>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: FEEDBACK & REVIEWS */}
        {activeTab === 'feedback' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                Customer Ratings & Feedback
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Verified post-appointment service reviews submitted by patients.
              </p>
            </div>

            {feedback && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
                    {feedback.summary.averageRating}
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.25rem' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={18} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Average based on <strong>{feedback.summary.totalReviews}</strong> customer reviews
                    </p>
                  </div>
                </div>

                <div className="card">
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Rating Distribution</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {[5, 4, 3, 2, 1].map(r => (
                      <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <span>{r} Stars</span>
                        <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${feedback.summary.totalReviews > 0 ? (feedback.summary.ratingDistribution[r] / feedback.summary.totalReviews) * 100 : 0}%`,
                            height: '100%',
                            background: '#f59e0b'
                          }} />
                        </div>
                        <span style={{ width: '20px', textAlign: 'right' }}>{feedback.summary.ratingDistribution[r]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <h3 className="card-title">Recent Feedback Reviews</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                {feedback && feedback.data.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No feedback submitted yet.</p>
                ) : (
                  feedback && feedback.data.map(item => (
                    <div key={item.id} style={{ padding: '1rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div>
                          <strong>{item.customer_name}</strong>
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}> • {item.service_type}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.15rem' }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star 
                              key={s} 
                              size={14} 
                              fill={s <= item.rating ? '#f59e0b' : 'none'} 
                              color={s <= item.rating ? '#f59e0b' : '#cbd5e1'} 
                            />
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#334155' }}>
                        "{item.comment || 'No written comment provided.'}"
                      </p>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
