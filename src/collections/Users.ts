import { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7200, // 2 hours
    verify: {
      generateEmailHTML: ({ token, user }) => {
        return `<p>Hello ${user.email}, verify your account by clicking <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/verify?token=${token}">here</a></p>`
      },
    },
    forgotPassword: {
      generateEmailHTML: ({ token, user }) => {
        return `<p>Hello ${user.email}, reset your password by clicking <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/reset-password?token=${token}">here</a></p>`
      },
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'tenant', 'createdAt'],
    group: 'Users',
  },
  access: {
    // Tenant-scoped access
    read: ({ req: { user } }) => {
      if (!user) return false
      // Super admins can read all users
      if (user.role === 'super-admin') return true
      // Users can only read users in their tenant
      if (user.tenant) {
        return {
          tenant: {
            equals: user.tenant,
          },
        }
      }
      return false
    },
    create: ({ req: { user } }) => {
      // Super admins can create users in any tenant
      if (user?.role === 'super-admin') return true
      // Tenant admins can create users in their tenant
      if (user?.role === 'admin' && user.tenant) return true
      // Allow public signup if tenant allows it (checked in hooks)
      return true
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      // Super admins can update any user
      if (user.role === 'super-admin') return true
      // Admins can update users in their tenant
      if (user.role === 'admin' && user.tenant) {
        return {
          tenant: {
            equals: user.tenant,
          },
        }
      }
      // Users can update themselves
      return {
        id: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      // Super admins can delete any user
      if (user.role === 'super-admin') return true
      // Admins can delete users in their tenant (except themselves)
      if (user.role === 'admin' && user.tenant) {
        return {
          and: [
            {
              tenant: {
                equals: user.tenant,
              },
            },
            {
              id: {
                not_equals: user.id,
              },
            },
          ],
        }
      }
      return false
    },
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
      admin: {
        description: 'The tenant this user belongs to',
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: ({ req: { user } }) => user?.role === 'super-admin',
        update: ({ req: { user } }) => user?.role === 'super-admin',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      access: {
        create: ({ req: { user } }) => {
          // Only super admins can create super admins
          return user?.role === 'super-admin' || user?.role === 'admin'
        },
        update: ({ req: { user } }) => {
          // Only super admins can change roles to super-admin
          return user?.role === 'super-admin' || user?.role === 'admin'
        },
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'bio',
      type: 'textarea',
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-assign tenant from request context on create
        if (operation === 'create' && !data.tenant && req.tenant) {
          data.tenant = req.tenant.id
        }

        // Prevent super-admin role assignment unless by super-admin
        if (data.role === 'super-admin' && req.user?.role !== 'super-admin') {
          throw new Error('Only super admins can create super admin users')
        }

        // Validate tenant user limits
        if (operation === 'create' && data.tenant) {
          const payload = req.payload
          const tenant = await payload.findByID({
            collection: 'tenants',
            id: data.tenant,
          })

          if (tenant.status !== 'active') {
            throw new Error('This tenant is not active')
          }

          // Check user count limit
          if (tenant.usage?.userCount >= tenant.limits?.maxUsers) {
            throw new Error(`User limit reached for this tenant (${tenant.limits.maxUsers} users)`)
          }

          // Check if signup is allowed
          if (!tenant.settings?.allowSignup && req.user?.role !== 'admin' && req.user?.role !== 'super-admin') {
            throw new Error('Signup is disabled for this tenant')
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Update tenant user count
        if (operation === 'create' && doc.tenant) {
          const payload = req.payload
          const tenant = await payload.findByID({
            collection: 'tenants',
            id: doc.tenant,
          })

          await payload.update({
            collection: 'tenants',
            id: doc.tenant,
            data: {
              usage: {
                ...tenant.usage,
                userCount: (tenant.usage?.userCount || 0) + 1,
              },
            },
          })
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        // Decrement tenant user count
        if (doc.tenant) {
          const payload = req.payload
          const tenant = await payload.findByID({
            collection: 'tenants',
            id: doc.tenant,
          })

          await payload.update({
            collection: 'tenants',
            id: doc.tenant,
            data: {
              usage: {
                ...tenant.usage,
                userCount: Math.max(0, (tenant.usage?.userCount || 0) - 1),
              },
            },
          })
        }
      },
    ],
  },
}
