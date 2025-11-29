import React from 'react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>© 2026 NovaHunt · <a href="/contact">Contact</a></div>
      <style jsx>{`
        .site-footer{ padding:12px 20px; text-align:center; border-top:1px solid #eee; color:#333; font-size:14px; }
        .site-footer a{ color:#0645AD; text-decoration:underline; }
      `}</style>
    </footer>
  );
}
