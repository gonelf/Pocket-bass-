import { CollectionConfig } from 'payload'

export const Waitlist: CollectionConfig = {
  slug: 'waitlist',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'referralCode', 'referralCount', 'createdAt'],
    group: 'Marketing',
  },
  access: {
    read: ({ req: { user } }) => user?.role === 'super-admin',
    create: () => true, // Allow public signup
    update: ({ req: { user } }) => user?.role === 'super-admin',
    delete: ({ req: { user } }) => user?.role === 'super-admin',
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'referralCode',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique referral code for this user',
        readOnly: true,
      },
    },
    {
      name: 'referredBy',
      type: 'text',
      admin: {
        description: 'Referral code of the person who referred this user',
      },
      index: true,
    },
    {
      name: 'referralCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of successful referrals',
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      name: 'notified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Has been notified of approval',
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Generate referral code on create
        if (operation === 'create' && !data.referralCode) {
          data.referralCode = generateReferralCode()
        }

        // Increment referrer's count if referred
        if (operation === 'create' && data.referredBy) {
          const payload = req.payload
          try {
            const referrer = await payload.find({
              collection: 'waitlist',
              where: {
                referralCode: {
                  equals: data.referredBy,
                },
              },
              limit: 1,
            })

            if (referrer.docs.length > 0) {
              await payload.update({
                collection: 'waitlist',
                id: referrer.docs[0].id,
                data: {
                  referralCount: (referrer.docs[0].referralCount || 0) + 1,
                },
              })
            }
          } catch (error) {
            console.error('[Waitlist] Error updating referrer count:', error)
          }
        }

        return data
      },
    ],
  },
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
