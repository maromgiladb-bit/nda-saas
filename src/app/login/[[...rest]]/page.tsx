"use client";
import { SignIn } from "@clerk/nextjs";

export default function LoginCatchAll() {
  return (
    <div className="font-sans min-h-screen bg-white text-[#1a2940] flex flex-col items-center justify-center">
      <main className="flex flex-col gap-8 items-center justify-center min-h-[80vh] p-8 bg-white border border-[#e5e7eb] rounded-xl shadow-md mx-4 mt-8">
        <h1 className="text-3xl font-bold text-[#1a2940] text-center mb-2 mt-2">Login</h1>
        <div className="w-full max-w-md mx-auto bg-[#f3f6fb] border border-[#e0e7ff] rounded-xl p-6 text-center shadow-sm">
          <SignIn path="/login" routing="path" signUpUrl="/signup" afterSignInUrl="/dashboard" />
        </div>
      </main>
    </div>
  );
}
