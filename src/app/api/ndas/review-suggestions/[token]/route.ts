import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(
	request: NextRequest,
	{ params }: { params: { token: string } }
) {
	try {
		const { token } = params;

		// Find the review sign request
		const signRequest = await prisma.sign_requests.findUnique({
			where: { token },
			include: {
				signers: {
					include: {
						nda_drafts: true,
					},
				},
			},
		});

		if (!signRequest) {
			return NextResponse.json(
				{ error: "Invalid or expired link" },
				{ status: 404 }
			);
		}

		// Check expiry
		if (new Date() > signRequest.expires_at) {
			return NextResponse.json(
				{ error: "This link has expired" },
				{ status: 410 }
			);
		}

		const draft = signRequest.signers.nda_drafts;
		const payload = signRequest.payload as Record<string, unknown>;
		const suggestions = payload.suggestions as Record<string, string>;
		const party_b_name = payload.party_b_name as string;
		const party_b_email = payload.party_b_email as string;
		const original_token = payload.original_token as string;

		return NextResponse.json({
			draftId: draft.id,
			currentData: draft.data,
			suggestions,
			party_b_name,
			party_b_email,
			original_token,
		});
	} catch (error) {
		console.error("Error loading suggestions:", error);
		return NextResponse.json(
			{ error: "Failed to load suggestions" },
			{ status: 500 }
		);
	}
}
