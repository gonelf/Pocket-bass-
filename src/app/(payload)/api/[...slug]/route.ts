import { REST_API } from '@payloadcms/next/routes'
import config from '@/payload.config'

export const { GET, POST, PUT, DELETE, PATCH } = REST_API({ config })
