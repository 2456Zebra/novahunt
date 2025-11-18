import bcrypt from "bcryptjs";
import { findUserByEmail, createUser } from "../../lib/user-store.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const lower = email.toLowerCase().trim();
    
    // Validate email format
    if (!EMAIL_RE.test(lower)) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    
    const existing = await findUserByEmail(lower);
    if (existing) return res.status(409).json({ error: "User already exists" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(lower, passwordHash, name || "");
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}