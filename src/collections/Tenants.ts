import { CollectionConfig } from 'payload'
import crypto from 'crypto'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'subdomain', 'plan', 'status', 'createdAt'],
    group: 'System',
  },
  access: {
    // Only super admins can manage tenants
    read: ({ req: { user } }) => {
      if (!user) return false
      // Super admin can read all
      if (user.role === 'super-admin') return true
      // Tenant admins can only read their own tenant
      if (user.role === 'admin' && user.tenant) {
        return {
          id: {
            equals: user.tenant,
          },
        }
      }
      return false
    },
    create: ({ req: { user } }) => user?.role === 'super-admin',
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super-admin') return true
      // Tenant admins can update their own tenant (limited fields)
      if (user.role === 'admin' && user.tenant) {
        return {
          id: {
            equals: user.tenant,
          },
        }
      }
      return false
    },
    delete: ({ req: { user } }) => user?.role === 'super-admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Organization/company name',
      },
    },
    {
      name: 'subdomain',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique subdomain (e.g., "acme" for acme.yourdomain.com)',
      },
      validate: (value: string) => {
        // Only allow lowercase alphanumeric and hyphens
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Subdomain must contain only lowercase letters, numbers, and hyphens'
        }
        // Reserved subdomains
        const reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost', 'staging', 'dev']
        if (reserved.includes(value)) {
          return 'This subdomain is reserved'
        }
        return true
      },
    },
    {
      name: 'customDomain',
      type: 'text',
      admin: {
        description: 'Optional custom domain (e.g., api.customer.com)',
      },
    },
    {
      name: 'apiKey',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'API key for tenant identification',
        readOnly: true,
      },
      defaultValue: () => {
        return `pb_${crypto.randomBytes(32).toString('hex')}`
      },
    },
    {
      name: 'apiSecret',
      type: 'text',
      required: true,
      admin: {
        description: 'API secret for secure requests',
        readOnly: true,
      },
      defaultValue: () => {
        return crypto.randomBytes(32).toString('hex')
      },
      access: {
        // Only show to super admins and tenant admins
        read: ({ req: { user }, doc }) => {
          if (!user) return false
          if (user.role === 'super-admin') return true
          return user.role === 'admin' && user.tenant === doc?.id
        },
      },
    },
    {
      name: 'plan',
      type: 'select',
      required: true,
      defaultValue: 'free',
      options: [
        { label: 'Free / Hobby', value: 'free' },
        { label: 'Starter / Indie ($7/mo)', value: 'starter' },
        { label: 'Pro / Unlimited ($24/mo)', value: 'pro' },
        { label: 'Lifetime (one-time)', value: 'lifetime' },
      ],
      access: {
        update: ({ req: { user } }) => user?.role === 'super-admin',
      },
    },
    {
      name: 'billingCycle',
      type: 'select',
      admin: {
        description: 'Billing cycle for subscription plans',
        condition: (data) => ['starter', 'pro'].includes(data.plan),
      },
      options: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      access: {
        update: ({ req: { user } }) => user?.role === 'super-admin',
      },
    },
    {
      name: 'limits',
      type: 'group',
      fields: [
        {
          name: 'maxUsers',
          type: 'number',
          defaultValue: 10,
          admin: {
            description: 'Maximum number of users allowed',
          },
        },
        {
          name: 'maxStorageMB',
          type: 'number',
          defaultValue: 1000, // 1GB
          admin: {
            description: 'Maximum storage in MB',
          },
        },
        {
          name: 'maxApiRequestsPerHour',
          type: 'number',
          defaultValue: 1000,
          admin: {
            description: 'API rate limit per hour',
          },
        },
      ],
      access: {
        update: ({ req: { user } }) => user?.role === 'super-admin',
      },
    },
    {
      name: 'usage',
      type: 'group',
      admin: {
        description: 'Current usage statistics',
      },
      fields: [
        {
          name: 'userCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'storageMB',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'apiRequestsThisHour',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'lastApiRequestAt',
          type: 'date',
          admin: {
            readOnly: true,
          },
        },
      ],
      access: {
        update: ({ req: { user } }) => user?.role === 'super-admin',
      },
    },
    {
      name: 'settings',
      type: 'group',
      fields: [
        {
          name: 'allowSignup',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Allow new user signups',
          },
        },
        {
          name: 'requireEmailVerification',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Require email verification for new users',
          },
        },
        {
          name: 'dataRegion',
          type: 'select',
          defaultValue: 'eu',
          options: [
            { label: 'Europe', value: 'eu' },
            { label: 'US', value: 'us' },
            { label: 'Asia', value: 'asia' },
          ],
        },
      ],
    },
    {
      name: 'ownerEmail',
      type: 'email',
      required: true,
      admin: {
        description: 'Primary contact email for this tenant',
      },
    },
    {
      name: 'billingEmail',
      type: 'email',
      admin: {
        description: 'Billing contact email (if different)',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional metadata for the tenant',
      },
    },
    {
      name: 'billing',
      type: 'group',
      admin: {
        description: 'Stripe billing information',
      },
      fields: [
        {
          name: 'stripeCustomerId',
          type: 'text',
          admin: {
            description: 'Stripe customer ID',
            readOnly: true,
          },
          access: {
            read: ({ req: { user } }) => user?.role === 'super-admin',
          },
        },
        {
          name: 'stripeSubscriptionId',
          type: 'text',
          admin: {
            description: 'Stripe subscription ID',
            readOnly: true,
          },
          access: {
            read: ({ req: { user } }) => user?.role === 'super-admin',
          },
        },
        {
          name: 'stripePriceId',
          type: 'text',
          admin: {
            description: 'Stripe price ID for current subscription',
            readOnly: true,
          },
          access: {
            read: ({ req: { user } }) => user?.role === 'super-admin',
          },
        },
        {
          name: 'subscriptionStatus',
          type: 'select',
          admin: {
            description: 'Current subscription status from Stripe',
            readOnly: true,
          },
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Trialing', value: 'trialing' },
            { label: 'Past Due', value: 'past_due' },
            { label: 'Canceled', value: 'canceled' },
            { label: 'Unpaid', value: 'unpaid' },
            { label: 'Incomplete', value: 'incomplete' },
          ],
        },
        {
          name: 'currentPeriodEnd',
          type: 'date',
          admin: {
            description: 'Current billing period end date',
            readOnly: true,
          },
        },
        {
          name: 'cancelAtPeriodEnd',
          type: 'checkbox',
          admin: {
            description: 'Subscription will cancel at end of period',
            readOnly: true,
          },
        },
        {
          name: 'lifetimeAccess',
          type: 'checkbox',
          admin: {
            description: 'Has lifetime access (one-time payment)',
          },
        },
        {
          name: 'lifetimePurchaseDate',
          type: 'date',
          admin: {
            description: 'Date of lifetime purchase',
            readOnly: true,
            condition: (data) => data.billing?.lifetimeAccess,
          },
        },
        {
          name: 'lifetimePricePaid',
          type: 'number',
          admin: {
            description: 'Amount paid for lifetime access',
            readOnly: true,
            condition: (data) => data.billing?.lifetimeAccess,
          },
        },
      ],
      access: {
        update: ({ req: { user } }) => user?.role === 'super-admin',
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Log tenant changes for audit
        if (operation === 'update') {
          console.log(`[AUDIT] Tenant ${data.id} updated by user ${req.user?.id}`)
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create') {
          console.log(`[AUDIT] New tenant created: ${doc.name} (${doc.subdomain})`)
          // TODO: Send welcome email, setup webhooks, etc.
        }
      },
    ],
  },
}
