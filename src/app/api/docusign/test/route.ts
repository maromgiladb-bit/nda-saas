import { NextResponse } from "next/server";
import { getDocuSignToken, getDocuSignClient, getDocuSignAccountId } from "@/lib/docusign";

/**
 * Test endpoint to verify DocuSign token generation works
 * GET /api/docusign/test
 */
export async function GET() {
  try {
    // Test 1: Get token
    const token = await getDocuSignToken();
    
    // Test 2: Get configured client
    const client = await getDocuSignClient();
    
    // Test 3: Get account ID
    const accountId = getDocuSignAccountId();

    return NextResponse.json({
      success: true,
      message: "DocuSign integration is working!",
      data: {
        tokenPrefix: token.substring(0, 20) + "...",
        accountId: accountId,
        clientConfigured: !!client,
      }
    });
  } catch (error: any) {
    console.error("DocuSign test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
