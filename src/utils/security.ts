/**
 * Security utilities for multi-tenant isolation
 */

/**
 * Sanitizes tenant input to prevent injection attacks
 */
export function sanitizeTenantInput(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 63) // Max subdomain length
}

/**
 * Validates tenant isolation - ensures user can only access their tenant's data
 */
export function validateTenantAccess(
  userTenantId: string | undefined,
  resourceTenantId: string,
  userRole: string
): boolean {
  // Super admins can access any tenant
  if (userRole === 'super-admin') {
    return true
  }

  // Users must belong to a tenant
  if (!userTenantId) {
    return false
  }

  // User can only access resources in their tenant
  return userTenantId === resourceTenantId
}

/**
 * Generates a secure random API key
 */
export function generateApiKey(): string {
  const crypto = require('crypto')
  return `pb_${crypto.randomBytes(32).toString('hex')}`
}

/**
 * Generates a secure random secret
 */
export function generateSecret(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Reserved subdomains that cannot be used by tenants
 */
export const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'admin',
  'app',
  'mail',
  'ftp',
  'smtp',
  'pop',
  'imap',
  'localhost',
  'staging',
  'dev',
  'test',
  'demo',
  'sandbox',
  'beta',
  'alpha',
  'internal',
  'system',
  'root',
  'support',
  'help',
  'docs',
  'blog',
  'cdn',
  'static',
  'assets',
  'media',
  'files',
  'uploads',
]

/**
 * Checks if a subdomain is reserved
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())
}

/**
 * Audit log entry types
 */
export enum AuditAction {
  TENANT_CREATED = 'tenant.created',
  TENANT_UPDATED = 'tenant.updated',
  TENANT_SUSPENDED = 'tenant.suspended',
  TENANT_DELETED = 'tenant.deleted',
  USER_CREATED = 'user.created',
  USER_DELETED = 'user.deleted',
  ROLE_CHANGED = 'role.changed',
  DATA_ACCESSED = 'data.accessed',
  DATA_MODIFIED = 'data.modified',
  RATE_LIMIT_EXCEEDED = 'rate_limit.exceeded',
  STORAGE_LIMIT_EXCEEDED = 'storage_limit.exceeded',
  UNAUTHORIZED_ACCESS = 'security.unauthorized_access',
}

/**
 * Log audit event (extend this to write to a proper audit log)
 */
export function logAuditEvent(
  action: AuditAction,
  tenantId: string | undefined,
  userId: string | undefined,
  metadata?: Record<string, any>
) {
  const event = {
    timestamp: new Date().toISOString(),
    action,
    tenantId,
    userId,
    metadata,
  }

  // Log to console (in production, send to audit log service)
  console.log('[AUDIT]', JSON.stringify(event))

  // TODO: Send to audit log service (e.g., DataDog, Splunk, CloudWatch)
}

/**
 * IP-based rate limiting helpers
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Calculate hash for secure comparisons (constant-time)
 */
export function secureCompare(a: string, b: string): boolean {
  const crypto = require('crypto')
  if (a.length !== b.length) {
    return false
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}
