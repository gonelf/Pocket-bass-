export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <main style={{ maxWidth: '800px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: '700' }}>
          🎸 Pocket Bass
        </h1>
        <p style={{ fontSize: '1.5rem', color: '#666', marginBottom: '1rem' }}>
          PocketBase-like Backend-as-a-Service
        </p>
        <p style={{ fontSize: '1rem', color: '#999', marginBottom: '3rem' }}>
          Multi-tenant • Serverless • TypeScript-native
        </p>
        <div style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          marginBottom: '3rem',
        }}>
          <div style={{
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
            backgroundColor: '#fafafa',
          }}>
            <h2 style={{ marginBottom: '0.5rem' }}>🏢 Multi-Tenant</h2>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Isolated tenants with subdomain routing and rate limits
            </p>
          </div>
          <div style={{
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
            backgroundColor: '#fafafa',
          }}>
            <h2 style={{ marginBottom: '0.5rem' }}>🔐 Authentication</h2>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Email/password auth, JWT tokens, user verification
            </p>
          </div>
          <div style={{
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
            backgroundColor: '#fafafa',
          }}>
            <h2 style={{ marginBottom: '0.5rem' }}>🗄️ Database</h2>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              SQLite (Turso) or Postgres with auto-migrations
            </p>
          </div>
          <div style={{
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
            backgroundColor: '#fafafa',
          }}>
            <h2 style={{ marginBottom: '0.5rem' }}>📦 Storage</h2>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Cloudflare R2 for files and media
            </p>
          </div>
          <div style={{
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
            backgroundColor: '#fafafa',
          }}>
            <h2 style={{ marginBottom: '0.5rem' }}>🚀 API</h2>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Auto-generated REST & GraphQL APIs
            </p>
          </div>
          <div style={{
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
            backgroundColor: '#fafafa',
          }}>
            <h2 style={{ marginBottom: '0.5rem' }}>⚡ Admin UI</h2>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Beautiful admin panel at /admin
            </p>
          </div>
          <div style={{
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
            backgroundColor: '#fafafa',
          }}>
            <h2 style={{ marginBottom: '0.5rem' }}>☁️ Serverless</h2>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Deploy to Vercel, scales automatically
            </p>
          </div>
        </div>
        <div style={{
          padding: '2rem',
          borderRadius: '8px',
          border: '1px solid #ddd',
          backgroundColor: '#fff',
          textAlign: 'left',
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Quick Start</h2>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.85rem',
          }}>
            {`# Access admin panel
https://your-domain.vercel.app/admin

# REST API endpoint
https://your-domain.vercel.app/api/posts

# GraphQL endpoint
https://your-domain.vercel.app/api/graphql`}
          </pre>
        </div>
        <div style={{ marginTop: '2rem' }}>
          <a
            href="/admin"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              backgroundColor: '#0070f3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '600',
            }}
          >
            Go to Admin Panel →
          </a>
        </div>
      </main>
    </div>
  )
}
