import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { fileURLToPath } from 'url'

// Collections
import { Tenants } from './collections/Tenants'
import { Users } from './collections/Users'
import { Posts } from './collections/Posts'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- Pocket Bass',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
  },
  collections: [Tenants, Users, Posts, Media],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'your-secret-key-here',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./data/payload.db',
      authToken: process.env.DATABASE_AUTH_TOKEN,
    },
  }),
  plugins: [
    s3Storage({
      collections: {
        media: {
          // Tenant-isolated storage with prefixes
          prefix: ({ doc }: any) => {
            return doc.tenant ? `tenant-${doc.tenant}` : 'global'
          },
        },
      },
      bucket: process.env.R2_BUCKET_NAME || 'pocket-bass-media',
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT || '',
      },
    }),
  ],
  onInit: async (payload) => {
    // Log initialization
    console.log('[Pocket Bass] Multi-tenant mode initialized')

    // Check if super admin exists, if not, log warning
    const superAdmins = await payload.find({
      collection: 'users',
      where: {
        role: {
          equals: 'super-admin',
        },
      },
      limit: 1,
    })

    if (superAdmins.totalDocs === 0) {
      console.warn('[WARNING] No super admin found. Create one via the admin panel.')
    }
  },
  cors: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ].filter(Boolean),
  csrf: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ].filter(Boolean),
})
