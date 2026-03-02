import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import ProgramPageClient from './page-client'

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSupabase()

  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!program) notFound()

  const colors = program.brand_colors || { accent: '#58A6FF', bg: '#0D1117', orange: '#F78166', green: '#3FB950' }

  return <ProgramPageClient program={program} colors={colors} slug={slug} />
}
