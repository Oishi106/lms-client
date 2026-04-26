"use client";

import { useState } from "react";

export default function EmailOtpForm({ onVerified }: { onVerified?: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const send = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setMessage("OTP sent — check your email.");
    } catch (err: any) {
      setMessage(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setMessage("Verified — you may continue.");
      onVerified?.();
    } catch (err: any) {
      setMessage(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420 }}>
      <label style={{ display: "block", marginBottom: 8 }}>Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={send} disabled={loading || !email} className="btn btn-primary">
          Send OTP
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", marginBottom: 8 }}>Code</label>
        <input value={code} onChange={(e) => setCode(e.target.value)} style={{ width: "100%" }} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={verify} disabled={loading || !code || !email} className="btn btn-primary">
            Verify OTP
          </button>
        </div>
      </div>

      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}
