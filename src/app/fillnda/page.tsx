import { Suspense } from 'react';
import FillNDAClient from './FillNDAClient';

export default function FillNDAPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="animate-spin h-12 w-12 mx-auto mb-4 border-4 border-teal-600 border-t-transparent rounded-full"></div><p className="text-gray-600">Loading...</p></div></div>}>
      <FillNDAClient />
    </Suspense>
  );
}
