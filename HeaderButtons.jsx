import React, { useState } from "react";
import SignInModal from "./SignInModal";

export default function HeaderButtons() {
  const [modalOpen, setModalOpen] = useState(false);
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