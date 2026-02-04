import { generatePageMetadata } from '@payloadcms/next/utilities'
import config from '@/payload.config'
import { RenderAdmin } from '@payloadcms/next/views'
import { Metadata } from 'next'
import React from 'react'

export const generateMetadata = (): Metadata => generatePageMetadata({ config })

const Page = ({ params, searchParams }: any) => {
  return <RenderAdmin config={config} params={params} searchParams={searchParams} />
}

export default Page
