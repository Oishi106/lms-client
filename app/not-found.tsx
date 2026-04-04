'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background:
            'radial-gradient(circle, var(--gold) 0%, transparent 70%)',
          borderRadius: '50%',
          top: '-100px',
          right: '-100px',
          opacity: 0.1,
          animation: 'float 6s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          background:
            'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
          borderRadius: '50%',
          bottom: '-50px',
          left: '-50px',
          opacity: 0.1,
          animation: 'float 8s ease-in-out infinite reverse',
        }}
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(30px); }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes rotateGradient {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-container {
          animation: fadeInUp 0.8s ease-out;
        }

        .error-number {
          animation: fadeInUp 0.8s ease-out 0.1s both;
        }

        .error-title {
          animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        .error-description {
          animation: fadeInUp 0.8s ease-out 0.3s both;
        }

        .error-button {
          animation: fadeInUp 0.8s ease-out 0.4s both;
        }

        .hero-emoji {
          font-size: 120px;
          animation: bounce 2s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .button-primary {
          background: linear-gradient(135deg, var(--gold) 0%, #f59e0b 100%);
          color: var(--dark-bg);
          padding: 14px 32px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          box-shadow: 0 8px 24px rgba(251, 146, 60, 0.3);
        }

        .button-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(251, 146, 60, 0.4);
        }

        .button-primary:active {
          transform: translateY(0);
        }

        .button-secondary {
          background: transparent;
          color: var(--text-primary);
          padding: 14px 32px;
          border: 2px solid var(--border-default);
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
        }

        .button-secondary:hover {
          border-color: var(--gold);
          background: rgba(251, 146, 60, 0.05);
        }

        @media (max-width: 768px) {
          .hero-emoji {
            font-size: 80px;
          }

          .error-content {
            padding: 20px;
          }
        }
      `}</style>

      {/* Main Content */}
      <div
        className="error-container"
        style={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
          padding: '40px 20px',
          maxWidth: '600px',
        }}
      >
        {/* Large 404 Number with gradient effect */}
        <div
          className="error-number"
          style={{
            fontSize: '140px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, var(--gold) 0%, #f59e0b 50%, var(--accent-primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '20px',
            letterSpacing: '-8px',
          }}
        >
          404
        </div>

        {/* Animated Emoji */}
        <div className="hero-emoji">🔍</div>

        {/* Error Title */}
        <h1
          className="error-title"
          style={{
            fontSize: '42px',
            fontWeight: '800',
            color: 'var(--text-primary)',
            marginBottom: '16px',
            lineHeight: '1.2',
          }}
        >
          Page Not Found
        </h1>

        {/* Error Description */}
        <p
          className="error-description"
          style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            marginBottom: '40px',
            lineHeight: '1.6',
            maxWidth: '500px',
            margin: '0 auto 40px',
          }}
        >
          Oops! The page you&apos;re looking for has wandered off into the digital void. 
          Let&apos;s get you back on track!
        </p>

        {/* Action Buttons */}
        <div
          className="error-button"
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" className="button-primary">
            ← Back to Home
          </Link>
          <Link href="/explore" className="button-secondary">
            Explore Courses
          </Link>
        </div>

        {/* Additional Info */}
        <div
          style={{
            marginTop: '60px',
            paddingTop: '40px',
            borderTop: '1px solid var(--border-default)',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '20px',
            }}
          >
            Need help? Here are some useful links:
          </p>
          <div
            style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/"
              style={{
                color: 'var(--gold)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'opacity 0.3s ease',
              }}
            >
              Home
            </Link>
            <span style={{ color: 'var(--border-default)' }}>•</span>
            <Link
              href="/explore"
              style={{
                color: 'var(--gold)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'opacity 0.3s ease',
              }}
            >
              Courses
            </Link>
            <span style={{ color: 'var(--border-default)' }}>•</span>
            <Link
              href="/dashboard"
              style={{
                color: 'var(--gold)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'opacity 0.3s ease',
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
