import { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'tenant', 'createdAt'],
    group: 'Content',
  },
  access: {
    read: ({ req: { user } }) => {
      // Super admins can read all posts
      if (user?.role === 'super-admin') return true

      // Build tenant-scoped query
      const tenantFilter = user?.tenant ? {
        tenant: {
          equals: user.tenant,
        },
      } : false

      // Public posts are readable by everyone (within tenant if specified)
      if (!user) {
        if (!tenantFilter) return false
        return {
          and: [
            tenantFilter,
            {
              status: {
                equals: 'published',
              },
            },
          ],
        }
      }

      // Admins can read all posts in their tenant
      if (user.role === 'admin' && tenantFilter) {
        return tenantFilter
      }

      // Users can read their own posts and published posts in their tenant
      return {
        and: [
          tenantFilter,
          {
            or: [
              {
                status: {
                  equals: 'published',
                },
              },
              {
                author: {
                  equals: user.id,
                },
              },
            ],
          },
        ],
      }
    },
    create: ({ req: { user } }) => !!user && !!user.tenant,
    update: ({ req: { user } }) => {
      if (!user || !user.tenant) return false
      // Super admins can update any post
      if (user.role === 'super-admin') return true
      // Admins can update posts in their tenant
      if (user.role === 'admin') {
        return {
          tenant: {
            equals: user.tenant,
          },
        }
      }
      // Users can update their own posts
      return {
        and: [
          {
            tenant: {
              equals: user.tenant,
            },
          },
          {
            author: {
              equals: user.id,
            },
          },
        ],
      }
    },
    delete: ({ req: { user } }) => {
      if (!user || !user.tenant) return false
      // Super admins can delete any post
      if (user.role === 'super-admin') return true
      // Admins can delete posts in their tenant
      if (user.role === 'admin') {
        return {
          tenant: {
            equals: user.tenant,
          },
        }
      }
      // Users can delete their own posts
      return {
        and: [
          {
            tenant: {
              equals: user.tenant,
            },
          },
          {
            author: {
              equals: user.id,
            },
          },
        ],
      }
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
        description: 'The tenant this post belongs to',
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: ({ req: { user } }) => user?.role === 'super-admin',
        update: ({ req: { user } }) => user?.role === 'super-admin',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: 'Brief description of the post',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
      },
      defaultValue: ({ user }: any) => user?.id,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData.status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-assign tenant and author on create
        if (operation === 'create') {
          if (req.user) {
            data.author = req.user.id
          }
          if (!data.tenant && req.tenant) {
            data.tenant = req.tenant.id
          }
          if (!data.tenant && req.user?.tenant) {
            data.tenant = req.user.tenant
          }
        }

        // Prevent cross-tenant data leakage
        if (operation === 'update' && req.user?.role !== 'super-admin') {
          if (data.tenant && req.user?.tenant && data.tenant !== req.user.tenant) {
            throw new Error('Cannot move posts between tenants')
          }
        }

        return data
      },
    ],
  },
}
