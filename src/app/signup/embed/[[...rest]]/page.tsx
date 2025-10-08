"use client";
import React, { useEffect } from "react";
import { SignUp, useUser } from "@clerk/nextjs";

export default function SignupEmbedCatchAll() {
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn && typeof window !== "undefined" && window.parent) {
      // Immediately notify parent to close modal and redirect
      try {
        window.parent.postMessage({ type: "clerk:signed_in" }, window.location.origin);
        // Prevent any potential Clerk redirects within iframe
        window.stop?.();
      } catch {
        // ignore
      }
    }
  }, [isSignedIn]);

  // Additional check for successful authentication via URL changes
  useEffect(() => {
    const checkForSuccess = () => {
      if (typeof window !== "undefined" && window.parent && 
          (window.location.pathname.includes('sign-up') || window.location.search.includes('sign_up'))) {
        try {
          window.parent.postMessage({ type: "clerk:signed_in" }, window.location.origin);
        } catch {
          // ignore
        }
      }
    };
    
    // Check immediately and on any navigation
    checkForSuccess();
    const interval = setInterval(checkForSuccess, 100);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-6">
        <SignUp 
          path="/signup/embed" 
          routing="path" 
          redirectUrl="/signup/embed"
          forceRedirectUrl="/signup/embed"
        />
      </div>
    </div>
  );
}
