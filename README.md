# 🎸 Pocket Bass

A **PocketBase-like** Backend-as-a-Service (BaaS) built with **Payload CMS**, designed to run on **Vercel** with **Cloudflare R2** storage and **Turso** (SQLite) database.

This project replicates ~80-90% of PocketBase's simplicity while being fully serverless and TypeScript-native.

## ✨ Features

- 🏢 **Multi-Tenant**: Full multi-tenancy with data isolation, per-tenant limits, and subdomain routing
- 💳 **Stripe Billing**: Complete subscription management with 4 pricing tiers and progressive lifetime pricing
- 📧 **Viral Waitlist**: Beautiful waitlist system with referral links and position tracking
- 🔐 **Authentication**: Email/password auth, JWT tokens, user verification, password reset
- 🗄️ **Database**: SQLite (Turso) with optional Postgres support (Neon)
- 📦 **Storage**: Cloudflare R2 (S3-compatible) with tenant-isolated prefixes
- 🚀 **Auto-generated APIs**: REST & GraphQL endpoints out of the box
- ⚡ **Admin UI**: Beautiful admin panel at `/admin` with tenant-scoped access
- 🎨 **Collections**: Pre-built Tenants, Users, Posts, and Media collections
- 🔒 **Access Control**: Row-level security with tenant isolation
- 🛡️ **Rate Limiting**: Per-tenant API rate limits and usage tracking
- 🌍 **EU Region**: Optimized for low-latency in Europe (Frankfurt/Lisbon)
- ☁️ **Serverless**: Scales automatically on Vercel's infrastructure

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS)
- npm or pnpm
- Vercel account (free tier available)
- Cloudflare account (for R2 storage)
- Turso account (for database) or use local SQLite

### Local Development

1. **Clone and install**:
   ```bash
   git clone <your-repo-url>
   cd pocket-bass-clone
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials:
   - `PAYLOAD_SECRET`: A random 32+ character string
   - `DATABASE_URI`: Turso URL or `file:./data/payload.db` for local SQLite
   - `R2_*`: Cloudflare R2 credentials (optional for local dev)

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin
   - REST API: http://localhost:3000/api
   - GraphQL: http://localhost:3000/api/graphql

5. **Create your first super admin user**:
   - Go to http://localhost:3000/admin
   - Fill in the registration form
   - Select role: **super-admin**
   - You're ready to provision tenants!

6. **Provision your first tenant** (optional - see [Multi-Tenant Guide](./MULTI-TENANT.md)):
   ```bash
   curl -X POST http://localhost:3000/api/tenants/provision \
     -H "Content-Type: application/json" \
     -d '{
       "name": "My Company",
       "subdomain": "mycompany",
       "ownerEmail": "admin@mycompany.com",
       "ownerName": "Admin User",
       "ownerPassword": "SecurePassword123!",
       "plan": "free",
       "provisioningSecret": "your-provisioning-secret"
     }'
   ```

## 📦 Database Setup

### Option 1: Turso (Recommended for Production)

[Turso](https://turso.tech) is a serverless SQLite database perfect for edge deployments.

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Sign up
turso auth signup

# Create database
turso db create pocket-bass

# Get database URL
turso db show pocket-bass --url

# Generate auth token
turso db tokens create pocket-bass

# Add to .env.local
DATABASE_URI=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=your-token-here
```

### Option 2: Local SQLite (Development)

```bash
# In .env.local
DATABASE_URI=file:./data/payload.db
```

### Option 3: Postgres (Neon)

For PostgreSQL, switch to `@payloadcms/db-postgres` in `package.json` and update the config.

## 📤 Storage Setup (Cloudflare R2)

1. **Create R2 bucket**:
   - Go to Cloudflare Dashboard → R2
   - Create a new bucket (e.g., `pocket-bass-media`)
   - Note the bucket name

2. **Generate API credentials**:
   - Go to R2 → Manage R2 API Tokens
   - Create a new token with read/write permissions
   - Copy Access Key ID and Secret Access Key

3. **Configure environment**:
   ```bash
   R2_ACCESS_KEY_ID=your-access-key-id
   R2_SECRET_ACCESS_KEY=your-secret-access-key
   R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   R2_BUCKET_NAME=pocket-bass-media
   ```

**Free Tier**: Cloudflare R2 includes 10GB storage + 1M reads/month for free.

## 🚢 Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add PAYLOAD_SECRET
vercel env add DATABASE_URI
vercel env add DATABASE_AUTH_TOKEN
vercel env add R2_ACCESS_KEY_ID
vercel env add R2_SECRET_ACCESS_KEY
vercel env add R2_ENDPOINT
vercel env add R2_BUCKET_NAME
vercel env add NEXT_PUBLIC_SERVER_URL

# Deploy to production
vercel --prod
```

### Option 2: Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/new)
3. Import your repository
4. Add environment variables in Settings → Environment Variables
5. Deploy!

### Environment Variables for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `PAYLOAD_SECRET` | Secret key for Payload (32+ chars) | `your-secret-key-here` |
| `DATABASE_URI` | Turso database URL | `libsql://your-db.turso.io` |
| `DATABASE_AUTH_TOKEN` | Turso auth token | `your-turso-token` |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key | `your-access-key` |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key | `your-secret-key` |
| `R2_ENDPOINT` | Cloudflare R2 endpoint | `https://xxx.r2.cloudflarestorage.com` |
| `R2_BUCKET_NAME` | R2 bucket name | `pocket-bass-media` |
| `NEXT_PUBLIC_SERVER_URL` | Your Vercel domain | `https://your-app.vercel.app` |

| Variable | Example |
|----------|---------|
| `PAYLOAD_SECRET` | `your-secret-key-here` |
| `DATABASE_URI` | `libsql://your-db.turso.io` |
| `DATABASE_AUTH_TOKEN` | `your-turso-token` |
| `R2_ACCESS_KEY_ID` | `your-access-key` |
| `R2_SECRET_ACCESS_KEY` | `your-secret-key` |
| `R2_ENDPOINT` | `https://xxx.r2.cloudflarestorage.com` |
| `R2_BUCKET_NAME` | `pocket-bass-media` |
| `NEXT_PUBLIC_SERVER_URL` | `https://your-app.vercel.app` |

## 📚 Collections

### Users
- Email/password authentication
- User roles (admin, user)
- Avatar uploads
- Bio field

### Posts
- Title, content (rich text), excerpt
- Featured image
- Author relationship
- Status (draft, published, archived)
- Tags
- Access control (public read for published, authenticated write)

### Media
- File uploads to Cloudflare R2
- Image resizing (thumbnail, card, tablet)
- Alt text and captions
- User ownership tracking

## 🔧 API Usage

### REST API

```bash
# Get all posts
GET /api/posts

# Get single post
GET /api/posts/:id

# Create post (authenticated)
POST /api/posts
{
  "title": "My Post",
  "content": "Post content",
  "status": "published"
}

# Update post (authenticated)
PATCH /api/posts/:id

# Delete post (authenticated)
DELETE /api/posts/:id

# Login
POST /api/users/login
{
  "email": "user@example.com",
  "password": "password"
}
```

### GraphQL

```graphql
# Query posts
query {
  Posts {
    docs {
      id
      title
      content
      author {
        name
        email
      }
    }
  }
}

# Create post
mutation {
  createPost(data: {
    title: "My Post"
    content: "Post content"
    status: "published"
  }) {
    id
    title
  }
}
```

## 🎯 PocketBase Comparison

| Feature | PocketBase | Pocket Bass |
|---------|-----------|-------------|
| Runtime | Go (single binary) | Node.js (serverless) |
| Database | SQLite | SQLite (Turso) or Postgres |
| Storage | Local filesystem | Cloudflare R2 (S3) |
| Admin UI | Built-in | Built-in (React) |
| APIs | Auto REST | Auto REST + GraphQL |
| Auth | ✅ | ✅ |
| Real-time | ✅ (WebSocket) | ⚠️ (via webhooks/polling) |
| Deployment | Self-hosted VPS | Vercel (serverless) |
| TypeScript | ❌ | ✅ Native |
| Scaling | Vertical | Horizontal (auto) |

## 💰 Cost Estimate

**Free Tier** (suitable for hobby projects):
- Vercel: 100GB bandwidth, 100 hours compute/month
- Turso: 8GB storage, 1B row reads/month
- Cloudflare R2: 10GB storage, 1M reads/month

**Production** (~€10-30/month for small-medium apps):
- Vercel Pro: €20/month (unlimited projects, team features)
- Turso: €5-15/month (depends on usage)
- R2: Pay-as-you-go (very cheap)

## 🛠️ Customization

### Adding New Collections

Create a new file in `src/collections/`:

```typescript
import { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
    },
  ],
}
```

Add to `src/payload.config.ts`:

```typescript
import { Products } from './collections/Products'

export default buildConfig({
  collections: [Users, Posts, Media, Products],
  // ...
})
```

### Adding Hooks

```typescript
export const Posts: CollectionConfig = {
  // ...
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create') {
          data.createdAt = new Date()
        }
        return data
      },
    ],
    afterChange: [
      ({ doc }) => {
        console.log('Post changed:', doc)
      },
    ],
  },
}
```

## 🔒 Security

- Row-level access control on all collections
- JWT-based authentication
- CSRF protection enabled
- CORS configured for your domain
- Vercel edge functions for DDoS protection
- Cloudflare WAF integration available

## 📖 Resources

- [Payload CMS Docs](https://payloadcms.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Turso Docs](https://docs.turso.tech)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2)
- [Next.js Docs](https://nextjs.org/docs)

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📝 License

MIT

## 🙏 Acknowledgments

- Inspired by [PocketBase](https://pocketbase.io)
- Built with [Payload CMS](https://payloadcms.com)
- Deployed on [Vercel](https://vercel.com)

---

**Built with ❤️ for the serverless era**
