import { notFound } from 'next/navigation';
import Link from 'next/link';
export default async function ShowPage({ params }: { params: { slug: string } }) {
  return <main><h1>Show: {params.slug}</h1><p>Episodes list. See per-ep e.g. /podcasts/{params.slug}/demo-ep</p><Link href={`/podcasts/${params.slug}/demo-ep`}>Demo Episode</Link></main>;
}