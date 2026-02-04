# 🛡️ Security

Pocket Bass implements comprehensive security measures for multi-tenant environments.

## Multi-Tenant Security

### Data Isolation

**Row-Level Security**: Every collection has tenant-scoped access control
```typescript
access: {
  read: ({ req: { user } }) => ({
    tenant: { equals: user?.tenant }
  })
}
```

**Storage Isolation**: Files stored with tenant-specific prefixes
```
R2 Bucket Structure:
├── tenant-{id1}/
│   ├── uploads/
│   └── media/
├── tenant-{id2}/
│   ├── uploads/
│   └── media/
```

**Database Isolation**: All queries automatically filtered by tenant
- Users can NEVER access other tenants' data
- Enforced at the collection level
- Super admins can override (with audit logging)

### Rate Limiting

**Per-Tenant Limits**:
- Free: 1,000 requests/hour
- Starter: 5,000 requests/hour
- Pro: 20,000 requests/hour
- Enterprise: 100,000 requests/hour

**Implementation**:
- In-memory store (consider Redis for production)
- Automatic reset every hour
- 429 response when exceeded
- Rate limit headers in all responses

### Authentication & Authorization

**JWT Tokens**:
- 2-hour expiration (configurable)
- Secure httpOnly cookies
- Token refresh flow
- Automatic invalidation on password change

**Role-Based Access Control**:
- Super Admin: Platform-wide access
- Admin: Tenant-wide access
- User: Own data + public content

**Password Security**:
- Bcrypt hashing (cost factor 10)
- Minimum 8 characters
- Password reset via email
- No password hints/recovery questions

### API Key Security

**Generation**:
```typescript
// 64-character random key
apiKey: `pb_${crypto.randomBytes(32).toString('hex')}`
apiSecret: crypto.randomBytes(32).toString('hex')
```

**Storage**:
- API keys stored as-is (needed for lookup)
- API secrets shown only once on creation
- Rotate keys via admin panel
- Never log keys in plaintext

**Usage**:
```bash
# Header-based auth
curl -H "x-api-key: pb_abc123..." /api/posts

# Bearer token
curl -H "Authorization: Bearer pb_abc123..." /api/posts
```

### Input Validation

**Subdomain Validation**:
```typescript
// Only lowercase alphanumeric and hyphens
/^[a-z0-9-]+$/

// Reserved subdomains blocked
['www', 'api', 'admin', 'mail', ...]
```

**SQL Injection Prevention**:
- Parameterized queries via Drizzle ORM
- No raw SQL in application code
- Input sanitization on all fields

**XSS Prevention**:
- Rich text editor sanitized via Lexical
- Output encoding for all user content
- Content Security Policy headers

### CORS & CSRF

**CORS Configuration**:
```typescript
cors: [
  process.env.NEXT_PUBLIC_SERVER_URL,
  // Tenant subdomains added dynamically
]
```

**CSRF Protection**:
- Double-submit cookie pattern
- Same-origin policy enforced
- Referer header validation

### Audit Logging

**Events Logged**:
- Tenant created/updated/suspended
- User role changes
- Unauthorized access attempts
- Rate limit exceeded
- Storage limit exceeded
- Data access/modification

**Log Format**:
```json
{
  "timestamp": "2026-02-04T12:00:00Z",
  "action": "tenant.created",
  "tenantId": "abc123",
  "userId": "xyz789",
  "metadata": {
    "ip": "192.168.1.1",
    "userAgent": "..."
  }
}
```

**Storage**:
- Console logging (development)
- TODO: Send to audit service (DataDog, Splunk, CloudWatch)

### Network Security

**HTTPS Only**:
- Vercel automatic SSL
- HSTS headers
- TLS 1.3 minimum

**DDoS Protection**:
- Vercel Edge Network
- Rate limiting per tenant
- Cloudflare WAF (optional)

**IP Filtering** (optional):
```typescript
// Whitelist tenant IPs
tenant.settings.allowedIPs = ['192.168.1.0/24']
```

### Storage Security

**Cloudflare R2**:
- Private bucket (no public access)
- Signed URLs for file access
- Tenant-specific prefixes
- Automatic encryption at rest

**File Upload Limits**:
- Per-tenant storage quotas
- File type validation
- Max file size: 100MB (configurable)
- Virus scanning (TODO: integrate ClamAV)

### Database Security

**Turso/SQLite**:
- TLS connections
- Encrypted at rest
- Auth tokens rotated periodically
- Backups encrypted

**Access Control**:
- Database credentials in environment variables
- Never exposed in frontend
- Separate read/write credentials (optional)

### Secrets Management

**Environment Variables**:
```bash
# Never commit .env files
# Use Vercel secret storage
vercel env add PAYLOAD_SECRET production
vercel env add DATABASE_URI production
```

**Rotation Schedule**:
- PAYLOAD_SECRET: Every 90 days
- Database tokens: Every 30 days
- API keys: On-demand (user-triggered)

### Monitoring & Alerting

**Security Alerts**:
- Multiple failed login attempts
- Unauthorized access attempts
- Rate limit exceeded (>3 times/hour)
- Unusual data access patterns
- Tenant suspension

**Health Checks**:
```bash
GET /api/health
# Returns system status and basic stats
```

**Metrics to Monitor**:
- Failed authentication rate
- Rate limit hit rate
- Storage usage growth
- API latency (per tenant)
- Error rates

## Vulnerability Reporting

**Report security issues to**: security@yourdomain.com

**Response SLA**:
- Critical: 24 hours
- High: 72 hours
- Medium: 1 week
- Low: 2 weeks

**Do NOT**:
- Disclose publicly before fix
- Test on production without permission
- Exploit vulnerabilities for personal gain

## Security Checklist

### Development
- [ ] Use HTTPS in development
- [ ] Never commit secrets to git
- [ ] Validate all user input
- [ ] Sanitize output
- [ ] Use parameterized queries
- [ ] Implement rate limiting
- [ ] Add audit logging
- [ ] Test access controls

### Deployment
- [ ] Rotate all secrets
- [ ] Set strong PAYLOAD_SECRET (32+ chars)
- [ ] Configure CORS properly
- [ ] Enable HTTPS only
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Test disaster recovery
- [ ] Review IAM permissions

### Operations
- [ ] Monitor audit logs daily
- [ ] Review access patterns weekly
- [ ] Rotate credentials monthly
- [ ] Update dependencies monthly
- [ ] Penetration test quarterly
- [ ] Security training annually
- [ ] Incident response plan ready

## Security Best Practices

### For Super Admins

1. **Use Strong Passwords**: 16+ characters, mixed case, symbols
2. **Enable 2FA**: (TODO: Implement TOTP)
3. **Limit Super Admin Accounts**: Only create when necessary
4. **Audit Regularly**: Review logs for suspicious activity
5. **Rotate Credentials**: Change passwords/keys periodically

### For Tenant Admins

1. **Strong API Keys**: Never share or commit to repositories
2. **Least Privilege**: Give users minimum required permissions
3. **Monitor Usage**: Check dashboard for unusual activity
4. **Backup Data**: Export important data regularly
5. **Update Information**: Keep contact emails current

### For Developers

1. **Keep Dependencies Updated**: Run `npm audit` regularly
2. **Review Code**: Peer review all security-related changes
3. **Test Thoroughly**: Include security test cases
4. **Document Changes**: Note security implications
5. **Follow Guides**: Reference OWASP Top 10

## Compliance

### GDPR

- **Data Portability**: Export API available
- **Right to Deletion**: Cascade delete on user removal
- **Data Minimization**: Only required fields collected
- **Consent**: Email opt-in for marketing
- **DPO Contact**: dpo@yourdomain.com (if applicable)

### SOC 2 (TODO)

- [ ] Access control policies documented
- [ ] Audit logging comprehensive
- [ ] Encryption at rest and in transit
- [ ] Incident response plan
- [ ] Regular security assessments

## Known Limitations

1. **In-Memory Rate Limiting**: Resets on server restart (use Redis in production)
2. **No 2FA**: TOTP/WebAuthn not yet implemented
3. **Basic Audit Logging**: No centralized log storage
4. **No IP Whitelisting**: Feature planned for enterprise
5. **No Virus Scanning**: File uploads not scanned

## Roadmap

- [ ] Implement 2FA (TOTP)
- [ ] Add WebAuthn support
- [ ] Integrate with centralized logging (DataDog/Splunk)
- [ ] Add IP whitelisting
- [ ] Implement virus scanning (ClamAV)
- [ ] Add anomaly detection
- [ ] Create security dashboard
- [ ] Automated security scanning (Snyk)
- [ ] Penetration testing program

---

**Stay secure!** Report issues to security@yourdomain.com
