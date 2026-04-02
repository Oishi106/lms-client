'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';

type AdminPanel = 'overview' | 'users' | 'invoices' | 'create-course' | 'live-courses' | 'hero' | 'faq' | 'categories' | 'manage-team' | 'courses-analytics' | 'ai-chat';

interface AnalyticsData {
  users: number;
  courses: number;
  revenue: number;
  growth: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activePanel, setActivePanel] = useState<AdminPanel>('overview');
  const [chatMsgs, setChatMsgs] = useState<{ from: 'user' | 'ai'; text: string }[]>([
    { from: 'ai', text: 'Hello! I\'m your AI Assistant. I can help you analyze dashboard metrics, user data, and provide insights. What would you like to know?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    setChatMsgs(prev => [...prev, { from: 'user', text: chatInput }]);

    // AI responses based on keywords
    let aiResponse = 'Based on your question, let me analyze the current metrics...';
    if (chatInput.toLowerCase().includes('user')) {
      aiResponse = 'Currently, you have 4,832 active users with a 42% growth this month. Peak activity is between 2-5 PM UTC.';
    } else if (chatInput.toLowerCase().includes('revenue')) {
      aiResponse = '$45,234 revenue generated this month, up 28% from last month. Top performing course: ML Bootcamp 2025.';
    } else if (chatInput.toLowerCase().includes('course')) {
      aiResponse = 'You have 1,247 active courses. The most popular are: 1) ML Bootcamp 2025 2) React Masterclass 3) UI/UX Design Bootcamp.';
    }

    setTimeout(() => {
      setChatMsgs(prev => [...prev, { from: 'ai', text: aiResponse }]);
    }, 500);

    setChatInput('');
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 68px)', marginTop: '68px', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '220px', background: 'var(--bg-surface)', borderRight: '1px solid var(--border-default)', padding: '0', overflowY: 'auto', color: 'var(--text-secondary)', maxHeight: 'calc(100vh - 68px)', display: 'flex', flexDirection: 'column' }}>
        {/* Premium Header */}
        <div style={{ background: `linear-gradient(135deg, rgba(46, 232, 207, 0.08) 0%, rgba(251, 146, 60, 0.04) 100%)`, borderBottom: '2px solid var(--border-default)', padding: '24px 20px', marginBottom: '0', position: 'relative' }}>
          {/* Header Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-display)' }}>ELEARNING</div>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--gold)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              ‹
            </button>
          </div>

          {/* Profile Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
            {/* Avatar */}
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, var(--gold) 0%, var(--teal) 100%)`,
                padding: '2.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(251, 146, 60, 0.15)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: '700',
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {user?.initials?.[0] || 'A'}
              </div>
            </div>

            {/* User Name */}
            <div style={{ paddingTop: '4px' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '3px', letterSpacing: '-0.3px' }}>
                {user?.name || 'Admin User'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                - Admin
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', opacity: 0.7 }}>Main</div>
          <div
            onClick={() => setActivePanel('overview')}
            style={{
              padding: '10px 12px',
              marginBottom: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activePanel === 'overview' ? 'var(--gold-dim)' : 'transparent',
              color: activePanel === 'overview' ? 'var(--gold)' : 'var(--text-secondary)',
              fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            📊 Dashboard
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', opacity: 0.7 }}>Data</div>
          {(['users', 'invoices'] as AdminPanel[]).map(panel => (
            <div
              key={panel}
              onClick={() => setActivePanel(panel)}
              style={{
                padding: '10px 12px',
                marginBottom: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: activePanel === panel ? 'var(--gold-dim)' : 'transparent',
                color: activePanel === panel ? 'var(--gold)' : 'var(--text-secondary)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              {panel === 'users' && '👥'} {panel === 'invoices' && '📄'} {panel === 'users' ? 'Users' : 'Invoices'}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', opacity: 0.7 }}>Content</div>
          {(['create-course', 'live-courses'] as AdminPanel[]).map(panel => (
            <div
              key={panel}
              onClick={() => setActivePanel(panel)}
              style={{
                padding: '10px 12px',
                marginBottom: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: activePanel === panel ? 'var(--gold-dim)' : 'transparent',
                color: activePanel === panel ? 'var(--gold)' : 'var(--text-secondary)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              {panel === 'create-course' && '✏️'} {panel === 'live-courses' && '🎥'} {panel === 'create-course' ? 'Create Course' : 'Live Courses'}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', opacity: 0.7 }}>Customization</div>
          {(['hero', 'faq', 'categories'] as AdminPanel[]).map(panel => (
            <div
              key={panel}
              onClick={() => setActivePanel(panel)}
              style={{
                padding: '10px 12px',
                marginBottom: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: activePanel === panel ? 'var(--gold-dim)' : 'transparent',
                color: activePanel === panel ? 'var(--gold)' : 'var(--text-secondary)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              {panel === 'hero' && '🎯'} {panel === 'faq' && '❓'} {panel === 'categories' && '📂'} {panel === 'hero' ? 'Hero' : panel === 'faq' ? 'FAQ' : 'Categories'}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', opacity: 0.7 }}>Controllers</div>
          <div
            onClick={() => setActivePanel('manage-team')}
            style={{
              padding: '10px 12px',
              marginBottom: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: activePanel === 'manage-team' ? 'var(--gold-dim)' : 'transparent',
              color: activePanel === 'manage-team' ? 'var(--gold)' : 'var(--text-secondary)',
              fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            👨‍💼 Manage Team
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', opacity: 0.7 }}>Analytics</div>
          {(['courses-analytics', 'ai-chat'] as AdminPanel[]).map(panel => (
            <div
              key={panel}
              onClick={() => setActivePanel(panel)}
              style={{
                padding: '10px 12px',
                marginBottom: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: activePanel === panel ? 'var(--gold-dim)' : 'transparent',
                color: activePanel === panel ? 'var(--gold)' : 'var(--text-secondary)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
            >
              {panel === 'courses-analytics' && '📊'} {panel === 'ai-chat' && '🤖'} {panel === 'courses-analytics' ? 'Courses Analytics' : 'AI Assistant'}
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '40px', maxHeight: 'calc(100vh - 68px)' }}>
        {/* Overview */}
        {activePanel === 'overview' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>
              Admin Dashboard
            </h1>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {[
                { label: 'Active Users', value: '4,832', change: '+24%', icon: '👥', color: 'var(--teal)' },
                { label: 'Total Courses', value: '1,247', change: '+12%', icon: '📚', color: 'var(--gold)' },
                { label: 'Revenue', value: '$45.2K', change: '+42%', icon: '💰', color: 'var(--green)' },
                { label: 'Conversion', value: '3.24%', change: '+8%', icon: '📈', color: 'var(--violet)' },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    padding: '24px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px var(--gold-glow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <span style={{ fontSize: '32px' }}>{stat.icon}</span>
                    <span style={{ color: stat.color, fontWeight: '600', fontSize: '14px' }}>{stat.change}</span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
              {/* Users Analytics */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                  Users Analytics
                </h3>
                <div style={{ position: 'relative', height: '180px', background: 'linear-gradient(to top, var(--teal-dim), transparent)', borderRadius: '8px', padding: '20px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                  {[12, 19, 8, 15, 22, 18, 25, 28, 30, 26, 32, 38].map((val, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${(val / 40) * 100}%`,
                        background: `linear-gradient(to top, var(--teal), rgba(20, 184, 166, 0.6))`,
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.7';
                        e.currentTarget.style.transform = 'scaleY(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'scaleY(1)';
                      }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', textAlign: 'center' }}>
                  Last 12 months
                </div>
              </div>

              {/* Orders Analytics */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                  Orders Analytics
                </h3>
                <div style={{ position: 'relative', height: '180px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '20px' }}>
                  {[8, 12, 5, 14, 18, 22, 19, 25, 28, 32, 35, 38].map((val, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${(val / 40) * 100}%`,
                        background: `linear-gradient(to top, var(--gold), rgba(251, 146, 60, 0.6))`,
                        borderRadius: '4px',
                        border: '1px solid rgba(251, 146, 60, 0.3)',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(to top, var(--gold), var(--gold))';
                        e.currentTarget.style.transform = 'scaleY(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `linear-gradient(to top, var(--gold), rgba(251, 146, 60, 0.6))`;
                        e.currentTarget.style.transform = 'scaleY(1)';
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                Recent Transactions
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>Price</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: '#64954...', name: 'Shahdat Hosain', price: '$24.99', created: '23 hours ago' },
                    { id: '#64934b...', name: 'Shahdat Sajeeb', price: '$24.99', created: '23 hours ago' },
                    { id: '#64934a...', name: 'John Doe', price: '$24.99', created: '1 day ago' },
                  ].map((txn, i) => (
                    <tr key={i} style={{ borderBottom: i < 2 ? '1px solid var(--border-default)' : 'none', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gold-dim)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>{txn.id}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>{txn.name}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--gold)', fontWeight: '600' }}>{txn.price}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>{txn.created}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Chat Panel */}
        {activePanel === 'ai-chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: '600px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '20px' }}>
              AI Assistant
            </h1>
            <div
              style={{
                flex: 1,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '20px',
                overflowY: 'auto',
                marginBottom: '16px',
              }}
            >
              {chatMsgs.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: msg.from === 'user' ? 'var(--gold)' : 'var(--border-default)',
                      color: msg.from === 'user' ? 'var(--text-inverse)' : 'var(--text-primary)',
                      fontSize: '14px',
                      lineHeight: '1.5',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about your dashboard..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSendMessage}
                style={{
                  padding: '12px 20px',
                  background: 'var(--gold)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-inverse)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Invoices Panel */}
        {activePanel === 'invoices' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Invoices</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Invoice management features coming soon</p>
            </div>
          </div>
        )}

        {/* Create Course Panel */}
        {activePanel === 'create-course' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Create New Course</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Course creation form coming soon</p>
            </div>
          </div>
        )}

        {/* Live Courses Panel */}
        {activePanel === 'live-courses' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Live Courses</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Live courses management coming soon</p>
            </div>
          </div>
        )}

        {/* Hero Panel */}
        {activePanel === 'hero' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Hero Section</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Hero section customization coming soon</p>
            </div>
          </div>
        )}

        {/* FAQ Panel */}
        {activePanel === 'faq' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>FAQ Management</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>FAQ management features coming soon</p>
            </div>
          </div>
        )}

        {/* Categories Panel */}
        {activePanel === 'categories' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Categories</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Category management features coming soon</p>
            </div>
          </div>
        )}

        {/* Manage Team Panel */}
        {activePanel === 'manage-team' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Manage Team</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Team management features coming soon</p>
            </div>
          </div>
        )}

        {/* Courses Analytics Panel */}
        {activePanel === 'courses-analytics' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '30px' }}>Courses Analytics</h1>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Courses analytics and statistics coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
