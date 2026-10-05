import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Star, Plus, RefreshCw, Send, Bell } from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  // Booking Modal State
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [serviceType, setServiceType] = useState('General Health Checkup');
  const [bookingNotes, setBookingNotes] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Feedback Modal State
  const [feedbackAppt, setFeedbackAppt] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Reschedule State
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [rescheduleSlotId, setRescheduleSlotId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [apptRes, notifRes] = await Promise.all([
        api.appointments.getMy(),
        api.notifications.getMy()
      ]);
      setAppointments(apptRes.data || []);
      setNotifications(notifRes.data || []);
    } catch (err) {
      console.error('Error loading customer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch slots whenever booking date changes
  useEffect(() => {
    async function fetchSlots() {
      if (bookingDate) {
        try {
          const res = await api.availability.getSlots(bookingDate);
          setAvailableSlots(res.data || []);
        } catch (err) {
          console.error('Error loading slots:', err);
        }
      }
    }
    fetchSlots();
  }, [bookingDate]);

  const showNotification = (msg, isError = false) => {
    setActionMessage({ text: msg, isError });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Actions
  const handleConfirm = async (id) => {
    try {
      await api.appointments.confirm(id);
      showNotification('✅ Attendance confirmed! Your no-show risk score has been lowered.');
      loadData();
    } catch (err) {
      showNotification('Error confirming: ' + err.message, true);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel? Your slot will be automatically released for others.')) return;
    try {
      await api.appointments.cancel(id, 'Cancelled by customer');
      showNotification('♻️ Appointment cancelled and slot automatically released.');
      loadData();
    } catch (err) {
      showNotification('Error cancelling: ' + err.message, true);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlotId) {
      alert('Please select an available time slot.');
      return;
    }
    try {
      setSubmittingBooking(true);
      await api.appointments.book({
        slot_id: Number(selectedSlotId),
        service_type: serviceType,
        notes: bookingNotes
      });
      setShowBookModal(false);
      setSelectedSlotId('');
      setBookingNotes('');
      showNotification('🎉 Appointment booked successfully! Reminder dispatched.');
      loadData();
    } catch (err) {
      alert('Booking failed: ' + err.message);
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleSlotId) {
      alert('Please select a new time slot.');
      return;
    }
    try {
      await api.appointments.reschedule(rescheduleAppt.id, {
        new_slot_id: Number(rescheduleSlotId)
      });
      setRescheduleAppt(null);
      setRescheduleSlotId('');
      showNotification('📅 Appointment rescheduled successfully!');
      loadData();
    } catch (err) {
      alert('Rescheduling failed: ' + err.message);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      setSubmittingFeedback(true);
      await api.feedback.submit({
        appointment_id: feedbackAppt.id,
        rating,
        comment
      });
      setFeedbackAppt(null);
      setComment('');
      showNotification('🌟 Thank you for your feedback rating!');
    } catch (err) {
      alert('Feedback submission error: ' + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Filter upcoming vs past
  const nowStr = new Date().toISOString().split('T')[0];
  const upcomingAppointments = appointments.filter(a => 
    (a.status === 'BOOKED' || a.status === 'CONFIRMED') && a.appointment_date >= nowStr
  );
  const featuredAppointment = upcomingAppointments[0];
  const pastAppointments = appointments.filter(a => a.id !== (featuredAppointment && featuredAppointment.id));

  return (
    <div className="content-area">
      {/* Action Banner */}
      {actionMessage && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          background: actionMessage.isError ? '#fef2f2' : '#ecfdf5',
          color: actionMessage.isError ? '#991b1b' : '#065f46',
          border: `1px solid ${actionMessage.isError ? '#fecaca' : '#a7f3d0'}`,
          fontWeight: 600
        }}>
          {actionMessage.text}
        </div>
      )}

      {/* Header with Quick Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            Welcome back, {user ? user.name : 'Customer'} 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Manage your appointments, track confirmations, and review your visits.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowBookModal(true)}>
          <Plus size={16} /> Quick Book Appointment
        </button>
      </div>

      {/* KPI Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>{upcomingAppointments.length}</h3>
            <p>Upcoming Appointments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{appointments.filter(a => a.status === 'CONFIRMED' || a.confirmation_status === 'CONFIRMED').length}</h3>
            <p>Confirmed Visits</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{appointments.filter(a => a.status === 'COMPLETED').length}</h3>
            <p>Completed Visits</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Bell size={24} />
          </div>
          <div className="stat-content">
            <h3>{notifications.length}</h3>
            <p>In-App Notifications</p>
          </div>
        </div>
      </div>

      {/* Featured Upcoming Appointment Card */}
      {featuredAppointment ? (
        <div className="card" style={{ marginBottom: '2.5rem', borderLeft: '5px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.04em' }}>
                ⭐ Next Scheduled Appointment
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                {featuredAppointment.service_type}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: '#475569', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={16} color="#2563eb" /> {featuredAppointment.appointment_date}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={16} color="#2563eb" /> {featuredAppointment.start_time} - {featuredAppointment.end_time}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className={`badge badge-${featuredAppointment.status.toLowerCase()}`}>
                {featuredAppointment.status}
              </span>
              <span className={`badge badge-${featuredAppointment.risk_level.toLowerCase()}`}>
                Risk: {featuredAppointment.risk_score}% ({featuredAppointment.risk_level})
              </span>
            </div>
          </div>

          {/* Explainable Risk Details */}
          {featuredAppointment.risk_level !== 'LOW' && (
            <div className="risk-reasons-box">
              <strong style={{ fontSize: '0.85rem', color: '#9f1239', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={15} /> Explainable Risk Assessment ({featuredAppointment.risk_score}% {featuredAppointment.risk_level} RISK)
              </strong>
              <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                Our transparent prototype model flagged this appointment based on rule thresholds:
              </p>
              <ul className="risk-reasons-list">
                {(() => {
                  let reasons = featuredAppointment.risk_reasons;
                  if (typeof reasons === 'string') {
                    try { reasons = JSON.parse(reasons); } catch (e) { reasons = []; }
                  }
                  return (reasons || []).map((r, i) => (
                    <li key={i}>• {r}</li>
                  ));
                })()}
              </ul>
            </div>
          )}

          {/* Action Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            {featuredAppointment.confirmation_status !== 'CONFIRMED' && (
              <button 
                className="btn btn-success btn-sm" 
                onClick={() => handleConfirm(featuredAppointment.id)}
              >
                <CheckCircle size={15} /> Confirm Attendance (Reduces Risk Score)
              </button>
            )}

            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => {
                setRescheduleAppt(featuredAppointment);
                setBookingDate(featuredAppointment.appointment_date);
              }}
            >
              <RefreshCw size={15} /> Reschedule
            </button>

            <button 
              className="btn btn-danger btn-sm" 
              onClick={() => handleCancel(featuredAppointment.id)}
            >
              <XCircle size={15} /> Cancel Appointment (Auto Slot Release)
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', marginBottom: '2.5rem' }}>
          <Calendar size={48} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#334155' }}>No upcoming appointments</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            You do not currently have any scheduled visits.
          </p>
          <button className="btn btn-primary" onClick={() => setShowBookModal(true)}>
            <Plus size={16} /> Book Your First Appointment
          </button>
        </div>
      )}

      {/* Appointment History Table */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <h3 className="card-title">All Appointment Records</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Service</th>
                <th>Date</th>
                <th>Time Window</th>
                <th>Status</th>
                <th>Confirmation</th>
                <th>Risk Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No appointment records found.
                  </td>
                </tr>
              ) : (
                appointments.map(a => (
                  <tr key={a.id}>
                    <td>#{a.id}</td>
                    <td><strong>{a.service_type}</strong></td>
                    <td>{a.appointment_date}</td>
                    <td>{a.start_time} - {a.end_time}</td>
                    <td>
                      <span className={`badge badge-${a.status.toLowerCase()}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: a.confirmation_status === 'CONFIRMED' ? '#059669' : '#d97706'
                      }}>
                        {a.confirmation_status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${a.risk_level.toLowerCase()}`}>
                        {a.risk_score}% {a.risk_level}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {a.status === 'COMPLETED' && (
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => setFeedbackAppt(a)}
                            title="Rate experience"
                          >
                            <Star size={13} color="#f59e0b" /> Review
                          </button>
                        )}

                        {(a.status === 'BOOKED' || a.status === 'CONFIRMED') && (
                          <>
                            {a.confirmation_status !== 'CONFIRMED' && (
                              <button 
                                className="btn btn-success btn-sm" 
                                onClick={() => handleConfirm(a.id)}
                                title="Confirm"
                              >
                                Confirm
                              </button>
                            )}
                            <button 
                              className="btn btn-danger btn-sm" 
                              onClick={() => handleCancel(a.id)}
                              title="Cancel"
                            >
                              Cancel
                            </button>
                          </>
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

      {/* In-App Notifications History */}
      <div className="card">
        <h3 className="card-title">
          <span>Recent Automated Reminders & Alerts</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>
            Dispatched by Automation Engine & SNS Mock
          </span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          {notifications.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No notifications received yet.</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: n.type.includes('HIGH_RISK') ? '#fee2e2' : '#e0e7ff',
                      color: n.type.includes('HIGH_RISK') ? '#991b1b' : '#3730a3',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      {n.type}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(n.sent_at).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#1e293b' }}>{n.message}</p>
                </div>
                <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>
                  {n.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="modal-overlay" onClick={() => setShowBookModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>
              Book an Appointment
            </h2>
            <form onSubmit={handleBook}>
              <div className="form-group">
                <label className="form-label">Service Type</label>
                <select 
                  className="form-control" 
                  value={serviceType} 
                  onChange={e => setServiceType(e.target.value)}
                >
                  <option value="General Health Checkup">General Health Checkup</option>
                  <option value="Dental Consultation">Dental Consultation</option>
                  <option value="Cardiology Follow-up">Cardiology Follow-up</option>
                  <option value="Physiotherapy Session">Physiotherapy Session</option>
                  <option value="Routine Wellness Check">Routine Wellness Check</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={bookingDate} 
                  onChange={e => setBookingDate(e.target.value)} 
                  min={nowStr}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Available Time Slots ({availableSlots.filter(s => s.is_available).length} Open)
                </label>
                {availableSlots.filter(s => s.is_available).length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#ef4444' }}>
                    No open slots available for this date. Please choose another date or contact admin.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {availableSlots.filter(s => s.is_available).map(slot => (
                      <button
                        type="button"
                        key={slot.id}
                        className={`btn ${selectedSlotId === String(slot.id) ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={() => setSelectedSlotId(String(slot.id))}
                        style={{ width: '100%' }}
                      >
                        {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Notes for Practitioner (Optional)</label>
                <textarea 
                  className="form-control" 
                  rows={2} 
                  placeholder="Reason for visit or special requirements..." 
                  value={bookingNotes}
                  onChange={e => setBookingNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submittingBooking || !selectedSlotId}
                >
                  {submittingBooking ? 'Reserving Slot...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleAppt && (
        <div className="modal-overlay" onClick={() => setRescheduleAppt(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a' }}>
              Reschedule Appointment #{rescheduleAppt.id}
            </h2>
            <form onSubmit={handleReschedule}>
              <div className="form-group">
                <label className="form-label">Select New Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={bookingDate} 
                  onChange={e => setBookingDate(e.target.value)} 
                  min={nowStr}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select New Open Time Slot</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {availableSlots.filter(s => s.is_available).map(slot => (
                    <button
                      type="button"
                      key={slot.id}
                      className={`btn ${rescheduleSlotId === String(slot.id) ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      onClick={() => setRescheduleSlotId(String(slot.id))}
                      style={{ width: '100%' }}
                    >
                      {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRescheduleAppt(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!rescheduleSlotId}>
                  Save Rescheduled Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackAppt && (
        <div className="modal-overlay" onClick={() => setFeedbackAppt(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
              Rate Your Experience
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Appointment #{feedbackAppt.id} - {feedbackAppt.service_type} on {feedbackAppt.appointment_date}
            </p>

            <form onSubmit={handleSubmitFeedback}>
              <div className="form-group">
                <label className="form-label">Rating (1 to 5 Stars)</label>
                <div style={{ display: 'flex', gap: '0.5rem', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star} 
                      size={28} 
                      fill={star <= rating ? '#f59e0b' : 'none'} 
                      color={star <= rating ? '#f59e0b' : '#cbd5e1'}
                      onClick={() => setRating(star)} 
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Comments (Optional)</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  placeholder="Share details of your experience..." 
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setFeedbackAppt(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingFeedback}>
                  {submittingFeedback ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
