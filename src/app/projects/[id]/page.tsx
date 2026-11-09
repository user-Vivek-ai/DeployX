'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProjectRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/?p=${params.id}`);
    } else {
      router.replace('/');
    }
  }, [params?.id, router]);

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center text-white">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  );
}
