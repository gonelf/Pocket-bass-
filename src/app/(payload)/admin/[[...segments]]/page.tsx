import { generatePageMetadata } from '@payloadcms/next/views'
import config from '@/payload.config'
import { RootPage } from '@payloadcms/next/views'
import { Metadata } from 'next'
import React from 'react'

export const generateMetadata = ({ params, searchParams }: { params: Promise<{ segments: string[] }>; searchParams: Promise<{ [key: string]: string | string[] }> }): Promise<Metadata> => generatePageMetadata({ config, params, searchParams })

const Page = ({ params, searchParams }: any) => {
  return <RootPage config={config} params={params} searchParams={searchParams} importMap={{}} />
}

export default Page
