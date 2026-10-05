import React from 'react';
import { Calendar, AlertTriangle, ShieldCheck, Clock, RefreshCw, BarChart3, Cloud, GitBranch, ArrowRight, Check } from 'lucide-react';

export default function LandingPage({ onOpenAuth }) {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#eff6ff',
          color: '#2563eb',
          padding: '0.4rem 1rem',
          borderRadius: '999px',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1.25rem',
          border: '1px solid #bfdbfe'
        }}>
          🎓 Academic Capstone Project • Agile Development Process & DevOps
        </div>

        <h1 style={{ fontSize: '2.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: '1.25rem' }}>
          Smart Appointment Optimization &<br />
          <span style={{ color: '#2563eb' }}>No-Show Prevention Platform</span>
        </h1>

        <p style={{ fontSize: '1.15rem', color: '#475569', maxWidth: '800px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
          A cloud-ready appointment management platform engineered to reduce missed appointments 
          through <strong>automated multi-tier reminders</strong>, <strong>explainable rule-based risk scoring</strong>, 
          and <strong>real-time slot inventory recovery</strong>.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }} onClick={onOpenAuth}>
            Launch Live Platform <ArrowRight size={18} />
          </button>
          <a href="#architecture" className="btn btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            Explore DevOps & Cloud Architecture
          </a>
        </div>
      </div>

      {/* Problem vs Solution Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AlertTriangle color="#ef4444" size={24} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>The Real-World Problem</h3>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.925rem', lineHeight: 1.6 }}>
            Clinics, consultants, and service providers lose up to <strong>20-30% of scheduled appointments</strong> to unexpected no-shows. 
            This causes wasted practitioner hours, lost operational revenue, and prevents patients on waiting lists from getting timely care.
          </p>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <ShieldCheck color="#10b981" size={24} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Our Engineering Solution</h3>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.925rem', lineHeight: 1.6 }}>
            We combine <strong>explainable rule-based risk scoring</strong>, proactive confirmation workflows, 
            automated 24h & 2h reminders, and <strong>immediate automatic slot recovery</strong> to protect business revenue and optimize scheduling.
          </p>
        </div>
      </div>

      {/* Core Engineering Features */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '2.5rem' }}>
          Core Pillars of the Platform
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <div style={{ background: '#eff6ff', color: '#2563eb', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Calendar size={22} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Double-Booking Prevention</h4>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Real-time slot locking guarantees that no two customers can reserve overlapping time windows, ensuring scheduler consistency.
            </p>
          </div>

          <div className="card">
            <div style={{ background: '#fef3c7', color: '#d97706', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <ShieldCheck size={22} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Explainable Risk Engine</h4>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              A transparent 0-100 rule-based scoring model evaluating historical no-shows, cancellation rates, and confirmation status with human-readable rationale.
            </p>
          </div>

          <div className="card">
            <div style={{ background: '#ecfdf5', color: '#10b981', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Clock size={22} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Multi-Tier Automation</h4>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Background schedulers trigger automated 24h & 2h appointment reminders, unconfirmed high-risk follow-ups, and customer feedback prompts.
            </p>
          </div>

          <div className="card">
            <div style={{ background: '#f5f3ff', color: '#8b5cf6', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <RefreshCw size={22} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Instant Slot Recovery</h4>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              When an appointment is cancelled, the underlying time slot is immediately returned to active inventory, recovering lost operational capacity.
            </p>
          </div>
        </div>
      </div>

      {/* Cloud & DevOps Architecture Section */}
      <div id="architecture" className="card" style={{ background: '#ffffff', padding: '2.5rem', marginBottom: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Agile & DevOps Integration
          </span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.25rem' }}>
            AWS Cloud Architecture & CI/CD Pipeline
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#0f172a' }}>
              <Cloud size={20} color="#2563eb" />
              <strong>Target AWS Infrastructure</strong>
            </div>
            <ul style={{ listStyleType: 'none', fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>• <strong>Compute:</strong> Amazon EC2 running Docker containers</li>
              <li>• <strong>Database:</strong> Amazon RDS PostgreSQL instance</li>
              <li>• <strong>Storage:</strong> Amazon S3 for assets and reports</li>
              <li>• <strong>Notifications:</strong> Amazon SNS (SMS) & SES (Email)</li>
              <li>• <strong>Monitoring:</strong> Amazon CloudWatch Logs & Metrics</li>
            </ul>
          </div>

          <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#0f172a' }}>
              <GitBranch size={20} color="#10b981" />
              <strong>Continuous Integration / Continuous Deployment</strong>
            </div>
            <ul style={{ listStyleType: 'none', fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li>• <strong>VCS:</strong> Git on GitHub with feature branching</li>
              <li>• <strong>CI Runner:</strong> GitHub Actions automated workflow</li>
              <li>• <strong>Quality Gates:</strong> Automated Jest unit & integration tests</li>
              <li>• <strong>Containerization:</strong> Multi-stage Docker builds</li>
              <li>• <strong>Deployment:</strong> Automated deployment to AWS EC2</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={onOpenAuth}>
            Sign In with Demo Credentials to Test
          </button>
        </div>
      </div>

      {/* Student Project Footer */}
      <footer style={{ textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '2rem', color: '#64748b', fontSize: '0.875rem' }}>
        <p><strong>Student Name:</strong> Adarsh Paul . T &nbsp;|&nbsp; <strong>Registration No.:</strong> 24MIS0564</p>
        <p style={{ marginTop: '0.35rem' }}>Subject: Agile Development Process and DevOps &nbsp;•&nbsp; Academic Year 2026</p>
      </footer>
    </div>
  );
}
