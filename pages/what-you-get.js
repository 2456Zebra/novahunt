// pages/what-you-get.js
import React from 'react';
import Nav from '../components/Nav';

export default function WhatYouGet() {
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <Nav />
      <main style={{ maxWidth: 760, margin: '32px auto', padding: 20 }}>
        <h1>What You Get When You Upgrade</h1>
        <ul>
          <li>Access to advanced search and filters</li>
          <li>Priority support and faster results</li>
          <li>More exports and saved searches</li>
          <li>Beta features and early access</li>
        </ul>
        <p>Ready to upgrade? <a href="/upgrade">Start here</a>.</p>
      </main>
    </div>
  );
}