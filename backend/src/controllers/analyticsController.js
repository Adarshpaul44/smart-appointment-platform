/**
 * Analytics Controller
 * 
 * Aggregates appointment metrics, operational KPIs,
 * and no-show performance trends for the Admin Dashboard.
 */

const db = require('../db');

class AnalyticsController {
  /**
   * Get executive dashboard analytics
   * Route: GET /api/analytics/dashboard
   */
  static async getDashboardAnalytics(req, res) {
    try {
      // 1. Fetch all appointments
      const apptsResult = await db.query(
        `SELECT a.*, u.name as customer_name 
         FROM appointments a 
         JOIN users u ON a.user_id = u.id`
      );
      const appointments = apptsResult.rows || [];

      // 2. Fetch users/customers count
      const usersResult = await db.query("SELECT id, name, email, role, phone, created_at FROM users WHERE role = 'customer'");
      const customers = usersResult.rows || [];

      // 3. Compute KPI counts
      const totalAppointments = appointments.length;
      const confirmedCount = appointments.filter(a => a.confirmation_status === 'CONFIRMED' || a.status === 'CONFIRMED').length;
      const unconfirmedCount = appointments.filter(a => a.status === 'BOOKED' && a.confirmation_status === 'UNCONFIRMED').length;
      const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;
      const cancelledCount = appointments.filter(a => a.status === 'CANCELLED').length;
      const noShowCount = appointments.filter(a => a.status === 'NO-SHOW').length;

      // High-risk upcoming
      const todayStr = new Date().toISOString().split('T')[0];
      const highRiskUpcoming = appointments.filter(a => 
        a.risk_level === 'HIGH' && 
        (a.status === 'BOOKED' || a.status === 'CONFIRMED') &&
        a.appointment_date >= todayStr
      );

      // Rates
      const concludedCount = completedCount + noShowCount + cancelledCount;
      const noShowRate = concludedCount > 0 
        ? Math.round((noShowCount / (completedCount + noShowCount)) * 100) 
        : 0;
      const confirmationRate = totalAppointments > 0 
        ? Math.round((confirmedCount / totalAppointments) * 100) 
        : 0;
      const cancellationRate = totalAppointments > 0
        ? Math.round((cancelledCount / totalAppointments) * 100)
        : 0;

      // 4. Group by Day (Appointments timeline)
      const dayMap = {};
      appointments.forEach(a => {
        const d = a.appointment_date;
        dayMap[d] = (dayMap[d] || 0) + 1;
      });
      const appointmentsByDay = Object.keys(dayMap)
        .sort()
        .slice(-7) // last 7 recorded days
        .map(date => ({ date, count: dayMap[date] }));

      // 5. Popular Time Slots
      const slotTimeMap = {};
      appointments.forEach(a => {
        const timeKey = a.start_time ? a.start_time.substring(0, 5) : 'Unknown';
        slotTimeMap[timeKey] = (slotTimeMap[timeKey] || 0) + 1;
      });
      const popularTimeSlots = Object.keys(slotTimeMap)
        .sort((a, b) => slotTimeMap[b] - slotTimeMap[a])
        .map(time => ({ time, bookings: slotTimeMap[time] }));

      // 6. Risk Distribution
      const riskDistribution = {
        LOW: appointments.filter(a => a.risk_level === 'LOW').length,
        MEDIUM: appointments.filter(a => a.risk_level === 'MEDIUM').length,
        HIGH: appointments.filter(a => a.risk_level === 'HIGH').length
      };

      // 7. Status Distribution
      const statusDistribution = {
        BOOKED: appointments.filter(a => a.status === 'BOOKED').length,
        CONFIRMED: appointments.filter(a => a.status === 'CONFIRMED').length,
        COMPLETED: completedCount,
        CANCELLED: cancelledCount,
        'NO-SHOW': noShowCount
      };

      return res.status(200).json({
        success: true,
        data: {
          kpi: {
            totalAppointments,
            totalCustomers: customers.length,
            confirmedCount,
            unconfirmedCount,
            completedCount,
            cancelledCount,
            noShowCount,
            highRiskUpcomingCount: highRiskUpcoming.length,
            confirmationRate,
            noShowRate,
            cancellationRate
          },
          charts: {
            appointmentsByDay,
            popularTimeSlots,
            riskDistribution,
            statusDistribution
          },
          highRiskUpcoming
        }
      });
    } catch (err) {
      console.error('[AnalyticsController.getDashboardAnalytics] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate analytics.',
        error: err.message
      });
    }
  }

  /**
   * Admin: List all customers with their attendance stats
   * Route: GET /api/analytics/customers
   */
  static async getCustomersSummary(req, res) {
    try {
      const usersRes = await db.query("SELECT id, name, email, role, phone, created_at FROM users WHERE role = 'customer'");
      const customers = usersRes.rows || [];

      const apptsRes = await db.query('SELECT * FROM appointments');
      const allAppts = apptsRes.rows || [];

      const enrichedCustomers = customers.map(c => {
        const userAppts = allAppts.filter(a => a.user_id === c.id);
        const completed = userAppts.filter(a => a.status === 'COMPLETED').length;
        const noShows = userAppts.filter(a => a.status === 'NO-SHOW').length;
        const cancelled = userAppts.filter(a => a.status === 'CANCELLED').length;
        const total = userAppts.length;
        const past = completed + noShows;
        const attendanceRate = past > 0 ? Math.round((completed / past) * 100) : 100;

        return {
          ...c,
          totalAppointments: total,
          completedCount: completed,
          noShowCount: noShows,
          cancelledCount: cancelled,
          attendanceRate: `${attendanceRate}%`
        };
      });

      return res.status(200).json({
        success: true,
        count: enrichedCustomers.length,
        data: enrichedCustomers
      });
    } catch (err) {
      console.error('[AnalyticsController.getCustomersSummary] Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to load customers summary.',
        error: err.message
      });
    }
  }
}

module.exports = AnalyticsController;
