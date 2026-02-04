import React from 'react'
import '@payloadcms/next/css'
import './custom.scss'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
