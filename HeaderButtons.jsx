import React, { useState } from "react";
import SignInModal from "./SignInModal";

export default function HeaderButtons() {
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <button
          onClick={() => setImportOpen(true)}
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
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Sign In
        </button>
      </div>

      <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {importOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setImportOpen(false)}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "12px",
              maxWidth: "400px",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Import Records</h3>
            <p>CSV upload coming soon!</p>
            <button
              onClick={() => setImportOpen(false)}
              style={{
                background: "#007bff",
                color: "white",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}