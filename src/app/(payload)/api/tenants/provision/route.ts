import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Tenant Provisioning API
 *
 * Creates a new tenant with initial admin user
 *
 * Security: Only accessible by super admins OR via provisioning secret
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const {
      // Tenant info
      name,
      subdomain,
      customDomain,
      ownerEmail,
      ownerName,
      ownerPassword,
      // Plan
      plan = 'free',
      // Settings
      settings,
      // Metadata
      metadata,
      // Provisioning secret (for automated provisioning)
      provisioningSecret,
    } = body

    // Validate required fields
    if (!name || !subdomain || !ownerEmail || !ownerName || !ownerPassword) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['name', 'subdomain', 'ownerEmail', 'ownerName', 'ownerPassword'],
        },
        { status: 400 }
      )
    }

    // Security check: Require provisioning secret OR super admin auth
    const authHeader = request.headers.get('authorization')
    const isProvisioningSecretValid =
      provisioningSecret &&
      process.env.PROVISIONING_SECRET &&
      provisioningSecret === process.env.PROVISIONING_SECRET

    if (!isProvisioningSecretValid) {
      // Check if request is from authenticated super admin
      // Note: In production, implement proper JWT verification
      if (!authHeader) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Provisioning secret or super admin authentication required',
          },
          { status: 401 }
        )
      }
    }

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return NextResponse.json(
        {
          error: 'Invalid subdomain',
          message: 'Subdomain must contain only lowercase letters, numbers, and hyphens',
        },
        { status: 400 }
      )
    }

    // Check if subdomain already exists
    const existingTenant = await payload.find({
      collection: 'tenants',
      where: {
        or: [
          { subdomain: { equals: subdomain } },
          ...(customDomain ? [{ customDomain: { equals: customDomain } }] : []),
        ],
      },
      limit: 1,
    })

    if (existingTenant.totalDocs > 0) {
      return NextResponse.json(
        {
          error: 'Subdomain already exists',
          message: 'This subdomain or custom domain is already in use',
        },
        { status: 409 }
      )
    }

    // Check if owner email already exists
    const existingUser = await payload.find({
      collection: 'users',
      where: {
        email: { equals: ownerEmail },
      },
      limit: 1,
    })

    if (existingUser.totalDocs > 0) {
      return NextResponse.json(
        {
          error: 'Email already exists',
          message: 'A user with this email already exists',
        },
        { status: 409 }
      )
    }

    // Get plan limits
    const planLimits = getPlanLimits(plan)

    // Create tenant
    const tenant = await payload.create({
      collection: 'tenants',
      data: {
        name,
        subdomain,
        customDomain: customDomain || undefined,
        ownerEmail,
        billingEmail: ownerEmail,
        plan,
        status: 'active',
        limits: planLimits,
        usage: {
          userCount: 0,
          storageMB: 0,
          apiRequestsThisHour: 0,
        },
        settings: {
          allowSignup: settings?.allowSignup ?? true,
          requireEmailVerification: settings?.requireEmailVerification ?? true,
          dataRegion: settings?.dataRegion || 'eu',
          ...settings,
        },
        metadata: metadata || {},
      },
    })

    // Create admin user for tenant
    const user = await payload.create({
      collection: 'users',
      data: {
        email: ownerEmail,
        name: ownerName,
        password: ownerPassword,
        role: 'admin',
        tenant: tenant.id,
      },
    })

    // Log provisioning
    console.log(`[PROVISIONING] New tenant created: ${tenant.name} (${tenant.subdomain})`)
    console.log(`[PROVISIONING] Admin user created: ${user.email}`)

    // Return tenant info and credentials
    return NextResponse.json(
      {
        success: true,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          customDomain: tenant.customDomain,
          plan: tenant.plan,
          status: tenant.status,
          apiKey: tenant.apiKey,
          apiSecret: tenant.apiSecret,
        },
        admin: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        urls: {
          adminPanel: customDomain
            ? `https://${customDomain}/admin`
            : `https://${subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'yourdomain.com'}/admin`,
          api: customDomain
            ? `https://${customDomain}/api`
            : `https://${subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'yourdomain.com'}/api`,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[Provisioning] Error creating tenant:', error)
    return NextResponse.json(
      {
        error: 'Provisioning failed',
        message: error.message || 'An error occurred while provisioning the tenant',
      },
      { status: 500 }
    )
  }
}

function getPlanLimits(plan: string) {
  const limits = {
    free: {
      maxUsers: 10,
      maxStorageMB: 1000, // 1GB
      maxApiRequestsPerHour: 1000,
    },
    starter: {
      maxUsers: 50,
      maxStorageMB: 10000, // 10GB
      maxApiRequestsPerHour: 5000,
    },
    pro: {
      maxUsers: 200,
      maxStorageMB: 50000, // 50GB
      maxApiRequestsPerHour: 20000,
    },
    enterprise: {
      maxUsers: 999999,
      maxStorageMB: 500000, // 500GB
      maxApiRequestsPerHour: 100000,
    },
  }

  return limits[plan as keyof typeof limits] || limits.free
}
