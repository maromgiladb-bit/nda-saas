"use client";
import { useAuth } from "@clerk/nextjs";
import PrivateToolbar from "@/components/PrivateToolbar";
import PublicToolbar from "@/components/PublicToolbar";

export default function ToolbarSwitcher() {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <PrivateToolbar /> : <PublicToolbar />;
}
