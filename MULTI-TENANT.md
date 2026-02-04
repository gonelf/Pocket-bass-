# 🏢 Multi-Tenant Guide

Pocket Bass supports **full multi-tenancy**, allowing you to serve multiple customers/organizations from a single deployment. Each tenant has isolated data, separate API keys, and configurable limits.

## Architecture Overview

### Tenant Isolation

- **Data Isolation**: All collections (Users, Posts, Media) are tenant-scoped
- **Storage Isolation**: Files stored in tenant-specific R2 prefixes (`tenant-{id}/`)
- **Rate Limiting**: Per-tenant API rate limits
- **Access Control**: Row-level security prevents cross-tenant access
- **Admin Panels**: Each tenant has isolated admin view

### Tenant Identification

Tenants can be identified via:

1. **Subdomain**: `customer1.yourdomain.com`
2. **Custom Domain**: `api.customer.com`
3. **API Key**: `x-api-key: pb_abc123...`
4. **Header**: `x-tenant-id: tenant-id-here` (for testing)

## Quick Start

### 1. Create First Super Admin

After deploying, create a super admin user:

```bash
# Access admin panel
https://your-domain.vercel.app/admin

# Register with role: super-admin
# (First user can be super-admin, or use Payload CLI)
```

### 2. Provision First Tenant

Use the provisioning API:

```bash
curl -X POST https://your-domain.vercel.app/api/tenants/provision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PROVISIONING_SECRET" \
  -d '{
    "name": "Acme Corp",
    "subdomain": "acme",
    "ownerEmail": "admin@acme.com",
    "ownerName": "John Doe",
    "ownerPassword": "SecurePassword123!",
    "plan": "pro"
  }'
```

Response:
```json
{
  "success": true,
  "tenant": {
    "id": "...",
    "name": "Acme Corp",
    "subdomain": "acme",
    "plan": "pro",
    "apiKey": "pb_abc123...",
    "apiSecret": "xyz789..."
  },
  "admin": {
    "email": "admin@acme.com",
    "name": "John Doe"
  },
  "urls": {
    "adminPanel": "https://acme.yourdomain.com/admin",
    "api": "https://acme.yourdomain.com/api"
  }
}
```

### 3. Use Tenant APIs

Each tenant can access their data via:

**Option A: Subdomain**
```bash
# API automatically detects tenant from subdomain
curl https://acme.yourdomain.com/api/posts
```

**Option B: API Key**
```bash
curl https://yourdomain.com/api/posts \
  -H "x-api-key: pb_abc123..."
```

**Option C: Custom Domain**
```bash
# After setting up custom domain in tenant settings
curl https://api.customer.com/api/posts
```

## Plans & Limits

### Free Plan
- 10 users
- 1GB storage
- 1,000 API requests/hour

### Starter Plan
- 50 users
- 10GB storage
- 5,000 API requests/hour

### Pro Plan
- 200 users
- 50GB storage
- 20,000 API requests/hour

### Enterprise Plan
- Unlimited users
- 500GB storage
- 100,000 API requests/hour

## Tenant Management

### Creating Tenants

**Via Provisioning API** (recommended for automation):

```typescript
const response = await fetch('https://yourdomain.com/api/tenants/provision', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.PROVISIONING_SECRET}`,
  },
  body: JSON.stringify({
    name: 'Customer Name',
    subdomain: 'customer',
    ownerEmail: 'admin@customer.com',
    ownerName: 'Admin User',
    ownerPassword: 'SecurePassword',
    plan: 'starter',
    settings: {
      allowSignup: true,
      requireEmailVerification: true,
      dataRegion: 'eu',
    },
    metadata: {
      industry: 'technology',
      employees: '50-100',
    },
  }),
})
```

**Via Admin Panel** (super admin only):
1. Login as super admin
2. Navigate to Tenants collection
3. Create new tenant
4. Create admin user for that tenant

### Updating Tenant Settings

```typescript
// Only super admins can update plans and limits
await payload.update({
  collection: 'tenants',
  id: tenantId,
  data: {
    plan: 'pro',
    limits: {
      maxUsers: 200,
      maxStorageMB: 50000,
      maxApiRequestsPerHour: 20000,
    },
  },
})
```

### Suspending Tenants

```typescript
await payload.update({
  collection: 'tenants',
  id: tenantId,
  data: {
    status: 'suspended',
  },
})
// All API requests will return 403 Forbidden
```

## User Roles

### Super Admin
- Full access to all tenants
- Can create/manage tenants
- Can change any user's role
- Access: Platform-wide

### Admin (Tenant Admin)
- Full access within their tenant
- Can manage users in their tenant
- Cannot see other tenants
- Access: Single tenant

### User
- Access to their own data
- Can create content in their tenant
- Read public content in their tenant
- Access: Single tenant

## Security Best Practices

### 1. API Key Security

```typescript
// Store API keys securely
// Never commit to git or expose in frontend

// Rotate keys periodically
const newKey = await payload.update({
  collection: 'tenants',
  id: tenantId,
  data: {
    apiKey: generateApiKey(),
  },
})
```

### 2. Rate Limiting

```typescript
// Rate limits are enforced automatically
// Response includes headers:
// X-RateLimit-Limit: 1000
// X-RateLimit-Remaining: 847
// Retry-After: 3600 (if exceeded)
```

### 3. Data Isolation

```typescript
// All queries are automatically tenant-scoped
// Users can NEVER access other tenants' data
// Enforced at collection level via access control
```

### 4. Storage Isolation

```typescript
// Files stored with tenant prefix in R2
// tenant-{tenantId}/uploads/file.jpg
// Prevents cross-tenant file access
```

### 5. Audit Logging

```typescript
import { logAuditEvent, AuditAction } from '@/utils/security'

// Log sensitive operations
logAuditEvent(
  AuditAction.TENANT_CREATED,
  tenantId,
  userId,
  { metadata: 'additional info' }
)
```

## Subdomain Configuration

### Vercel Setup

1. **Add Wildcard Domain**:
   - Vercel Dashboard → Project → Settings → Domains
   - Add: `*.yourdomain.com`
   - Configure DNS: Add CNAME record `*` → `cname.vercel-dns.com`

2. **Update Environment Variables**:
   ```bash
   NEXT_PUBLIC_BASE_DOMAIN=yourdomain.com
   ```

3. **SSL Certificates**:
   - Vercel automatically provisions SSL for wildcard domains
   - All subdomains get HTTPS

### Custom Domains

For tenants with custom domains:

1. **Tenant sets custom domain**:
   ```typescript
   await payload.update({
     collection: 'tenants',
     id: tenantId,
     data: {
       customDomain: 'api.customer.com',
     },
   })
   ```

2. **Add domain in Vercel**:
   - Vercel Dashboard → Domains → Add Domain
   - Enter: `api.customer.com`

3. **Customer configures DNS**:
   - Add CNAME: `api.customer.com` → `cname.vercel-dns.com`

## Monitoring & Analytics

### Usage Tracking

```typescript
// Get tenant usage
const tenant = await payload.findByID({
  collection: 'tenants',
  id: tenantId,
})

console.log({
  users: tenant.usage.userCount,
  storage: `${tenant.usage.storageMB}MB`,
  apiRequests: tenant.usage.apiRequestsThisHour,
})
```

### Health Check

```bash
curl https://your-domain.vercel.app/api/health

{
  "status": "healthy",
  "multiTenant": true,
  "stats": {
    "totalTenants": 42,
    "activeTenants": 40,
    "suspendedTenants": 2
  }
}
```

### Rate Limit Monitoring

```typescript
// Check rate limit headers in API responses
const response = await fetch('https://acme.yourdomain.com/api/posts')
console.log(response.headers.get('X-RateLimit-Remaining'))
```

## Migrations & Upgrades

### Adding New Collections

All new collections should include tenant field:

```typescript
export const NewCollection: CollectionConfig = {
  slug: 'new-collection',
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
    },
    // ... other fields
  ],
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'super-admin') return true
      return { tenant: { equals: user?.tenant } }
    },
  },
}
```

### Data Migration

When migrating to multi-tenant from single-tenant:

```typescript
// Create default tenant
const defaultTenant = await payload.create({
  collection: 'tenants',
  data: {
    name: 'Default Tenant',
    subdomain: 'default',
    // ... other fields
  },
})

// Migrate existing data
const users = await payload.find({ collection: 'users' })
for (const user of users.docs) {
  await payload.update({
    collection: 'users',
    id: user.id,
    data: { tenant: defaultTenant.id },
  })
}
```

## Troubleshooting

### Tenant Not Found

**Problem**: `404 Tenant not found`

**Solutions**:
- Check subdomain spelling
- Verify tenant status is `active`
- Check API key is correct
- Clear tenant cache (restart server)

### Rate Limit Exceeded

**Problem**: `429 Rate limit exceeded`

**Solutions**:
- Wait for rate limit window to reset (1 hour)
- Upgrade tenant plan for higher limits
- Implement client-side request queuing

### Cross-Tenant Access

**Problem**: User can't access data

**Solutions**:
- Verify user belongs to correct tenant
- Check access control rules
- Ensure tenant ID is set on resources

### Storage Limit Exceeded

**Problem**: `Storage limit exceeded`

**Solutions**:
- Delete unused media
- Upgrade tenant plan
- Implement file compression

## Production Checklist

- [ ] Set `PROVISIONING_SECRET` environment variable
- [ ] Configure wildcard domain (`*.yourdomain.com`)
- [ ] Create first super admin user
- [ ] Set up monitoring for tenant usage
- [ ] Configure backup strategy per tenant
- [ ] Set up audit log storage
- [ ] Test rate limiting behavior
- [ ] Verify data isolation
- [ ] Test subdomain routing
- [ ] Configure custom domain workflow
- [ ] Set up billing integration (if applicable)

## Example Integrations

### Stripe Billing

```typescript
// Link tenant to Stripe customer
await payload.update({
  collection: 'tenants',
  id: tenantId,
  data: {
    metadata: {
      stripeCustomerId: 'cus_abc123',
      stripePriceId: 'price_pro_monthly',
    },
  },
})
```

### Analytics

```typescript
// Track tenant events
analytics.track('tenant.user_created', {
  tenantId: tenant.id,
  tenantName: tenant.name,
  plan: tenant.plan,
})
```

### Webhooks

```typescript
// Notify tenant on events
await fetch(tenant.metadata.webhookUrl, {
  method: 'POST',
  body: JSON.stringify({
    event: 'user.created',
    data: user,
  }),
})
```

---

**Need help?** Check the [main README](./README.md) or open an issue on GitHub.
