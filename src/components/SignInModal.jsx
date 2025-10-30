import React, { useState, useEffect, useRef } from "react";

const CLOSE_DURATION_MS = 250;

const SignInModal = ({ open, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (open && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && open) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, CLOSE_DURATION_MS);
  };

  if (!open && !isClosing) return null;

  return (
    <div
      className={`modal-backdrop ${isClosing ? "closing" : ""}`}
      onClick={handleClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: isClosing ? 0 : 1,
        transition: `opacity ${CLOSE_DURATION_MS}ms ease`,
        zIndex: 1000,
      }}
    >
      <div
        ref={modalRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          transform: isClosing ? "scale(0.95)" : "scale(1)",
          opacity: isClosing ? 0 : 1,
          transition: `all ${CLOSE_DURATION_MS}ms ease`,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.5rem" }}>Sign In to NovaHunt</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert(`Signed in as ${email}`);
            handleClose();
          }}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <input
            ref={firstInputRef}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "1rem",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "1rem",
            }}
          />
          <button
            type="submit"
            style={{
              background: "#007bff",
              color: "white",
              padding: "0.75rem",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Sign In
          </button>
        </form>
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default SignInModal;
