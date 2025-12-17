import { Suspense } from 'react';
import SignNDASimpleClient from './SignNDASimpleClient';

export default function SignNDASimplePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <SignNDASimpleClient />
    </Suspense>
  );
}
