// pages/dashboard.js
// Example Dashboard page that shows the header (which reads session client-side).
// Replace or merge with your current dashboard page — ensure you import and use the Header component.

import Header from '../components/Header';

export default function DashboardPage() {
  return (
    <>
      <Header />
      <main style={{ padding: 24, maxWidth: 1100, margin: '24px auto' }}>
        <h2>Dashboard</h2>
        <p>Welcome to your Dashboard. Your header should now show account info, plan, and progress bars.</p>
      </main>
    </>
  );
}
