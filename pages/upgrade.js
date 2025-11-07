import Head from 'next/head'
import React from 'react'

export default function Upgrade() {
  return (
    <>
      <Head>
        <title>Upgrade — NovaHunt</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Minimal inline header — avoids importing Nav which caused CI failures */}
      <header style={{
        borderBottom: '1px solid #eaeaea',
        padding: '12px 0',
        background: '#fff'
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <a href="/" style={{ textDecoration: 'none', color: '#000', fontWeight: 700 }}>
            NovaHunt
          </a>
          <div style={{ marginLeft: 'auto' }}>
            {/* intentionally empty / minimal nav placeholder */}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '32px auto', padding: '0 16px' }}>
        <h1>Upgrade</h1>
        <p>
          This page is a minimal stand-in while CI/build issues are resolved. Replace with the
          original content when the Nav/component import is fixed or available in the build environment.
        </p>
      </main>
    </>
  )
}
