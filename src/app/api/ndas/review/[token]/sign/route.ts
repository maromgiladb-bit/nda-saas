import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(
	request: NextRequest,
	{ params }: { params: { token: string } }
) {
	try {
		const { token } = params;
		const body = await request.json();
		const { party_b_signatory_name, signature_date } = body;

		if (!party_b_signatory_name || !signature_date) {
			return NextResponse.json(
				{ error: "Signature name and date are required" },
				{ status: 400 }
			);
		}

		// Find the sign request
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
				{ error: "Invalid token" },
				{ status: 404 }
			);
		}

		// Check expiry
		if (new Date() > signRequest.expires_at) {
			return NextResponse.json(
				{ error: "Token expired" },
				{ status: 410 }
			);
		}

		// Check if token allows signing
		if (signRequest.scope !== "SIGN" && signRequest.scope !== "REVIEW") {
			return NextResponse.json(
				{ error: "This link does not allow signing" },
				{ status: 403 }
			);
		}

		const draft = signRequest.signers.nda_drafts;
		const currentData = draft.data as Record<string, unknown>;

		// Update draft with signature
		const updatedData = {
			...currentData,
			party_b_signatory_name,
			party_b_signed_at: signature_date,
		};

		await prisma.nda_drafts.update({
			where: { id: draft.id },
			data: {
				data: updatedData,
				updated_at: new Date(),
				last_actor: "RECIPIENT",
				status: "READY_TO_SIGN", // Update status to indicate Party B has signed
				provisional_recipient_signed_at: new Date(),
			},
		});

		// Update signer status
		await prisma.signers.update({
			where: { id: signRequest.signer_id },
			data: {
				status: "SIGNED",
				signed_at: new Date(),
			},
		});

		// Mark token as consumed
		await prisma.sign_requests.update({
			where: { id: signRequest.id },
			data: {
				consumed_at: new Date(),
			},
		});

		// Create revision record
		await prisma.nda_revisions.create({
			data: {
				draft_id: draft.id,
				number: await getNextRevisionNumber(draft.id),
				actor_role: "RECIPIENT",
				base_form: draft.data || {},
				new_form: updatedData,
				diff: { signed: true, signatory: party_b_signatory_name },
				message: `Party B signed the document as ${party_b_signatory_name}`,
			},
		});

		// TODO: Send notification email to Party A (owner)

		return NextResponse.json({
			success: true,
			message: "Document signed successfully",
		});
	} catch (error) {
		console.error("Error signing document:", error);
		return NextResponse.json(
			{ error: "Failed to sign document" },
			{ status: 500 }
		);
	}
}

async function getNextRevisionNumber(draftId: string): Promise<number> {
	const lastRevision = await prisma.nda_revisions.findFirst({
		where: { draft_id: draftId },
		orderBy: { number: "desc" },
	});
	return (lastRevision?.number || 0) + 1;
}
