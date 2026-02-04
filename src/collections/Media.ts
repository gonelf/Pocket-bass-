import { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'tenant', 'createdAt'],
    group: 'Content',
  },
  access: {
    read: ({ req: { user } }) => {
      // Super admins can read all media
      if (user?.role === 'super-admin') return true
      // Public media is readable (tenant-scoped)
      if (user?.tenant) {
        return {
          tenant: {
            equals: user.tenant,
          },
        }
      }
      return true
    },
    create: ({ req: { user } }) => !!user && !!user.tenant,
    update: ({ req: { user } }) => {
      if (!user || !user.tenant) return false
      // Super admins can update any media
      if (user.role === 'super-admin') return true
      // Admins can update media in their tenant
      if (user.role === 'admin') {
        return {
          tenant: {
            equals: user.tenant,
          },
        } as any
      }
      // Users can update their own uploads
      return {
        tenant: {
          equals: user.tenant,
        },
        uploadedBy: {
          equals: user.id,
        },
      } as any
    },
    delete: ({ req: { user } }) => {
      if (!user || !user.tenant) return false
      // Super admins can delete any media
      if (user.role === 'super-admin') return true
      // Admins can delete media in their tenant
      if (user.role === 'admin') {
        return {
          tenant: {
            equals: user.tenant,
          },
        } as any
      }
      // Users can delete their own uploads
      return {
        tenant: {
          equals: user.tenant,
        },
        uploadedBy: {
          equals: user.id,
        },
      } as any
    },
  },
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined,
        position: 'centre',
      },
    ],
    mimeTypes: ['image/*', 'application/pdf', 'video/*'],
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
      admin: {
        description: 'The tenant this media belongs to',
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: ({ req: { user } }) => user?.role === 'super-admin',
        update: ({ req: { user } }) => user?.role === 'super-admin',
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
      },
      defaultValue: ({ user }: any) => user?.id,
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-assign tenant and uploader on create
        if (operation === 'create') {
          if (req.user) {
            data.uploadedBy = req.user.id
          }
          if (!data.tenant && (req as any).tenant) {
            data.tenant = (req as any).tenant.id
          }
          if (!data.tenant && req.user?.tenant) {
            data.tenant = req.user.tenant
          }

          // Check storage limits
          if (data.tenant) {
            const payload = req.payload
            const tenant = await payload.findByID({
              collection: 'tenants',
              id: data.tenant,
            })

            // Estimate file size (filesize is in bytes, convert to MB)
            const fileSizeMB = (data.filesize || 0) / (1024 * 1024)
            const currentUsage = tenant.usage?.storageMB || 0
            const maxStorage = tenant.limits?.maxStorageMB || 1000

            if (currentUsage + fileSizeMB > maxStorage) {
              throw new Error(
                `Storage limit exceeded. Current: ${currentUsage.toFixed(2)}MB, Limit: ${maxStorage}MB`
              )
            }
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Update tenant storage usage
        if (operation === 'create' && doc.tenant && doc.filesize) {
          const payload = req.payload
          const tenant = await payload.findByID({
            collection: 'tenants',
            id: doc.tenant,
          })

          const fileSizeMB = doc.filesize / (1024 * 1024)

          await payload.update({
            collection: 'tenants',
            id: doc.tenant,
            data: {
              usage: {
                ...tenant.usage,
                storageMB: (tenant.usage?.storageMB || 0) + fileSizeMB,
              },
            },
          })
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        // Decrement tenant storage usage
        if (doc.tenant && doc.filesize) {
          const payload = req.payload
          const tenant = await payload.findByID({
            collection: 'tenants',
            id: doc.tenant,
          })

          const fileSizeMB = doc.filesize / (1024 * 1024)

          await payload.update({
            collection: 'tenants',
            id: doc.tenant,
            data: {
              usage: {
                ...tenant.usage,
                storageMB: Math.max(0, (tenant.usage?.storageMB || 0) - fileSizeMB),
              },
            },
          })
        }
      },
    ],
  },
}
