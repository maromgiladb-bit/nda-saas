import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(
	request: NextRequest,
	{ params }: { params: { token: string } }
) {
	try {
		const { token } = params;

		// Find the sign request by token
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
				{ error: "Invalid or expired token" },
				{ status: 404 }
			);
		}

		// Check if token is expired
		if (new Date() > signRequest.expires_at) {
			return NextResponse.json(
				{ error: "This link has expired" },
				{ status: 410 }
			);
		}

		// Check if already consumed (for single-use tokens)
		if (signRequest.consumed_at) {
			return NextResponse.json(
				{ error: "This link has already been used" },
				{ status: 410 }
			);
		}

		const draft = signRequest.signers.nda_drafts;
		const formData = draft.data as Record<string, unknown>;

		return NextResponse.json({
			draftId: draft.id,
			templateId: draft.template_id,
			formData,
			scope: signRequest.scope,
			signerEmail: signRequest.signers.email,
			signerRole: signRequest.signers.role,
			status: draft.status,
		});
	} catch (error) {
		console.error("Error loading draft from token:", error);
		return NextResponse.json(
			{ error: "Failed to load NDA" },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { token: string } }
) {
	try {
		const { token } = params;
		const body = await request.json();
		const { formData } = body;

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

		// Check if token allows editing
		if (signRequest.scope === "VIEW") {
			return NextResponse.json(
				{ error: "This link is view-only" },
				{ status: 403 }
			);
		}

		const draft = signRequest.signers.nda_drafts;

		// Update draft with new form data
		const updatedDraft = await prisma.nda_drafts.update({
			where: { id: draft.id },
			data: {
				data: formData,
				updated_at: new Date(),
				last_actor: "RECIPIENT",
			},
		});

		// Create revision record
		await prisma.nda_revisions.create({
			data: {
				draft_id: draft.id,
				number: await getNextRevisionNumber(draft.id),
				actor_role: "RECIPIENT",
				base_form: draft.data || {},
				new_form: formData || {},
				diff: JSON.parse(JSON.stringify(calculateDiff(draft.data, formData))),
				message: "Party B updated their information",
			},
		});

		return NextResponse.json({
			success: true,
			draftId: updatedDraft.id,
		});
	} catch (error) {
		console.error("Error updating draft:", error);
		return NextResponse.json(
			{ error: "Failed to save changes" },
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

function calculateDiff(oldData: unknown, newData: unknown): Record<string, unknown> {
	const old = oldData as Record<string, unknown>;
	const newD = newData as Record<string, unknown>;
	const diff: Record<string, unknown> = {};

	for (const key in newD) {
		if (old[key] !== newD[key]) {
			diff[key] = {
				old: old[key],
				new: newD[key],
			};
		}
	}

	return diff;
}
