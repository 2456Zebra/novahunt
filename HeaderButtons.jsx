import React, { useEffect, useState } from "react";
import SignInModal from "./SignInModal";
import Link from "next/link";

/*
HeaderButtons.jsx
- Reads nh_user_email, nh_usage from localStorage.
- Shows an authenticated dropdown with email, searches/reveals, Account and Logout.
- Listens to storage events so signup/signin in another tab (or redirect) updates the header.
- Fallback UI keeps the existing Import Records + Sign In button and SignInModal.
*/

function parseUsage(raw) {
  try {
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export default function HeaderButtons() {
  const [modalOpen, setModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [usage, setUsage] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(false);

  // Read initial state from localStorage
  useEffect(() => {
    const email = typeof window !== "undefined" ? localStorage.getItem("nh_user_email") : null;
    const rawUsage = typeof window !== "undefined" ? localStorage.getItem("nh_usage") : null;
    setUserEmail(email || null);
    setUsage(parseUsage(rawUsage));
  }, []);

  // Listen for storage events (other tabs / pages updating localStorage)
  useEffect(() => {
    function onStorage(e) {
      if (!e) return;
      if (e.key === "nh_user_email") {
        setUserEmail(e.newValue || null);
      } else if (e.key === "nh_usage" || e.key === "nh_usage_last_update") {
        setUsage(parseUsage(localStorage.getItem("nh_usage")));
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
      }
    };
  }, []);

  // Helper: sign out locally (clears the same keys created at signup/signin)
  const handleLogout = () => {
    try {
      localStorage.removeItem("nh_user_email");
      localStorage.removeItem("nh_usage");
      localStorage.removeItem("nh_usage_last_update");
    } catch (e) {
      // ignore
    }
    // force header refresh
    setUserEmail(null);
    setUsage(null);
    // optional: if you also have server-side session, call logout endpoint here
    // fetch('/api/logout', { method: 'POST' }).finally(() => window.location.reload());
    window.location.reload();
  };

  // Small presentational helper
  const usageDisplay = () => {
    if (!usage) return null;
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center", color: "#444", fontSize: 13 }}>
        <div>Searches: <strong style={{ color: "#111" }}>{usage.searches ?? 0}</strong></div>
        <div>Reveals: <strong style={{ color: "#111" }}>{usage.reveals ?? 0}</strong></div>
      </div>
    );
  };

  // Authenticated view
  if (userEmail) {
    return (
      <div style={{ position: "relative", display: "flex", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ color: "#666", fontSize: 13 }}>{userEmail}</div>
          {usageDisplay()}
        </div>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setOpenDropdown((s) => !s)}
            style={{
              background: "none",
              border: "1px solid #e6e6e6",
              color: "#111",
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            aria-haspopup="true"
            aria-expanded={openDropdown}
          >
            Account ▾
          </button>

          {openDropdown && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 12,
                minWidth: 200,
                boxShadow: "0 6px 18px rgba(20,20,20,0.08)",
                zIndex: 60,
              }}
            >
              <div style={{ marginBottom: 8, color: "#666", fontSize: 13 }}>{userEmail}</div>
              <div style={{ marginBottom: 8 }}>{usageDisplay()}</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link href="/account"><a style={{ color: "#0b74ff", fontWeight: 600 }}>Account</a></Link>
                <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#111", textAlign: "left", padding: 0, cursor: "pointer" }}>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Unauthenticated / existing UI
  return (
    <>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <button
          onClick={() => alert("Import Records - Coming soon!")}
          style={{
            background: "none",
            border: "1px solid #007bff",
            color: "#007bff",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Import Records
        </button>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: "#007bff",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Sign In
        </button>
      </div>
      <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
