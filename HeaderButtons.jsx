import React, { useEffect, useState } from "react";
import SignInModal from "./SignInModal";
import Link from "next/link";

/*
HeaderButtons.jsx
- Robust header that reads client-side markers:
  - nh_user_email
  - nh_usage
  - nh_usage_last_update
- Accepts both usage shapes:
  - { searches, reveals, limitSearches, limitReveals }
  - { searchesUsed, searchesTotal, revealsUsed, revealsTotal }
- Listens for storage events so signup/signin from another page/tab updates header.
- Logout clears the client markers and reloads.
- Keep a backup of your existing HeaderButtons.jsx before replacing.
*/

function normalizeUsage(raw) {
  if (!raw) return null;
  try {
    const u = typeof raw === "string" ? JSON.parse(raw) : raw;
    // New shape
    if (typeof u.searches === "number" || typeof u.reveals === "number") {
      return {
        searches: Number(u.searches || 0),
        reveals: Number(u.reveals || 0),
        limitSearches: Number(u.limitSearches ?? u.searches ?? 0),
        limitReveals: Number(u.limitReveals ?? u.reveals ?? 0),
      };
    }
    // Old shape
    if (typeof u.searchesUsed === "number" || typeof u.searchesTotal === "number") {
      return {
        searches: Number(u.searchesUsed || 0),
        reveals: Number(u.revealsUsed || 0),
        limitSearches: Number(u.searchesTotal || 0),
        limitReveals: Number(u.revealsTotal || 0),
      };
    }
    // Fallback
    return {
      searches: Number(u.searches || u.searchesUsed || 0),
      reveals: Number(u.reveals || u.revealsUsed || 0),
      limitSearches: Number(u.limitSearches || u.searchesTotal || 0),
      limitReveals: Number(u.limitReveals || u.revealsTotal || 0),
    };
  } catch (e) {
    return null;
  }
}

export default function HeaderButtons() {
  const [modalOpen, setModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [usage, setUsage] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const email = localStorage.getItem("nh_user_email");
    const raw = localStorage.getItem("nh_usage");
    setUserEmail(email || null);
    setUsage(normalizeUsage(raw));
  }, []);

  useEffect(() => {
    function onStorage(e) {
      if (!e) return;
      if (e.key === "nh_user_email") {
        setUserEmail(e.newValue || null);
      } else if (e.key === "nh_usage" || e.key === "nh_usage_last_update") {
        setUsage(normalizeUsage(localStorage.getItem("nh_usage")));
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

  const handleLogout = () => {
    try {
      localStorage.removeItem("nh_user_email");
      localStorage.removeItem("nh_usage");
      localStorage.removeItem("nh_usage_last_update");
    } catch (e) {}
    window.location.reload();
  };

  const usageDisplay = () => {
    if (!usage) return null;
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center", color: "#444", fontSize: 13 }}>
        <div>Searches: <strong style={{ color: "#111" }}>{usage.searches ?? 0}</strong> / {usage.limitSearches ?? 0}</div>
        <div>Reveals: <strong style={{ color: "#111" }}>{usage.reveals ?? 0}</strong> / {usage.limitReveals ?? 0}</div>
      </div>
    );
  };

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
                minWidth: 220,
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
