import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Relay — Account Transition Engine'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 50%, #1e1b4b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #10b981, #14b8a6)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '32px', color: 'white', fontWeight: 'bold' }}>R</span>
          </div>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>Relay</span>
        </div>
        <p style={{ fontSize: '28px', color: '#a1a1aa', maxWidth: '600px', textAlign: 'center', lineHeight: 1.4 }}>
          Account Transition Engine
        </p>
        <p style={{ fontSize: '18px', color: '#71717a', marginTop: '12px' }}>
          AI-powered briefs · Smart assignments · Zero revenue loss
        </p>
      </div>
    ),
    { ...size }
  )
}
