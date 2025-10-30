import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { sendEmail, getAppUrl } from "@/lib/email";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

export async function POST(
	request: NextRequest,
	{ params }: { params: { token: string } }
) {
	try {
		const { token } = params;
		const body = await request.json();
		const { suggestions, party_b_email, party_b_name } = body;

		if (!suggestions || Object.keys(suggestions).length === 0) {
			return NextResponse.json(
				{ error: "No suggestions provided" },
				{ status: 400 }
			);
		}

		// Find the sign request
		const signRequest = await prisma.sign_requests.findUnique({
			where: { token },
			include: {
				signers: {
					include: {
						nda_drafts: {
							include: {
								users: true, // Get the owner
							},
						},
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

		const draft = signRequest.signers.nda_drafts;
		const owner = draft.users;

		// Store suggestions in a revision record
		await prisma.nda_revisions.create({
			data: {
				draft_id: draft.id,
				number: await getNextRevisionNumber(draft.id),
				actor_role: "RECIPIENT",
				base_form: draft.data || {},
				new_form: suggestions,
				diff: suggestions,
				message: `Party B (${party_b_name}) suggested changes`,
				comments: {
					party_b_email,
					party_b_name,
					suggestions,
				},
			},
		});

		// Update draft status to PENDING_OWNER_REVIEW
		await prisma.nda_drafts.update({
			where: { id: draft.id },
			data: {
				status: "PENDING_OWNER_REVIEW",
				last_actor: "RECIPIENT",
				updated_at: new Date(),
			},
		});

		// Generate review token for Party A
		const reviewToken = generateReviewToken();
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for owner to review

		// Create a new sign request for owner review (reusing signers table pattern)
		// Note: We're creating a temporary signer entry for the owner to review
		const ownerSigner = await prisma.signers.create({
			data: {
				draft_id: draft.id,
				email: owner.email,
				role: "Owner Review",
				status: "PENDING",
				user_id: owner.id,
			},
		});

		await prisma.sign_requests.create({
			data: {
				signer_id: ownerSigner.id,
				token: reviewToken,
				scope: "REVIEW",
				expires_at: expiresAt,
				payload: {
					suggestions,
					party_b_email,
					party_b_name,
					original_token: token,
				},
			},
		});

		// Send email to Party A (owner)
		const reviewLink = `${getAppUrl()}/review-suggestions/${reviewToken}`;
		
		await sendEmail({
			to: owner.email,
			subject: `${party_b_name} has suggested changes to your NDA – ${draft.title || 'NDA'}`,
			html: generateOwnerReviewEmail(
				draft.title || "Untitled NDA",
				party_b_name,
				party_b_email,
				suggestions,
				reviewLink
			),
		});

		console.log("✅ Suggestions sent to owner for review");

		return NextResponse.json({
			success: true,
			message: "Suggestions sent to Party A for review",
		});
	} catch (error) {
		console.error("Error sending suggestions:", error);
		return NextResponse.json(
			{ error: "Failed to send suggestions" },
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

function generateReviewToken(): string {
	return randomBytes(32).toString("hex");
}

function generateOwnerReviewEmail(
	docTitle: string,
	partyBName: string,
	partyBEmail: string,
	suggestions: Record<string, string>,
	reviewLink: string
): string {
	const suggestionsList = Object.entries(suggestions)
		.filter(([, value]) => value && value.trim())
		.map(([key, value]) => {
			const fieldName = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
			return `<li><strong>${fieldName}:</strong> ${value}</li>`;
		})
		.join("");

	return `
<!DOCTYPE html>
<html>
<head>
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
		.content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
		.suggestions { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
		.suggestions h3 { margin-top: 0; color: #856404; }
		.suggestions ul { margin: 10px 0; padding-left: 20px; }
		.button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
		.footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>📋 Review Requested</h1>
		</div>
		<div class="content">
			<p>Hello,</p>
			
			<p><strong>${partyBName}</strong> (${partyBEmail}) has reviewed your NDA <strong>"${docTitle}"</strong> and suggested some changes to the information you provided.</p>
			
			<div class="suggestions">
				<h3>💡 Suggested Changes:</h3>
				<ul>
					${suggestionsList}
				</ul>
			</div>
			
			<p>You can review these suggestions and choose to:</p>
			<ul>
				<li>✅ <strong>Accept</strong> the suggestions and update the NDA</li>
				<li>✏️ <strong>Edit</strong> the information yourself</li>
				<li>❌ <strong>Keep</strong> your original information</li>
			</ul>
			
			<center>
				<a href="${reviewLink}" class="button">
					Review Suggestions
				</a>
			</center>
			
			<p style="margin-top: 30px; font-size: 14px; color: #666;">
				This link will expire in 7 days. After reviewing, you can send the updated NDA back to ${partyBName} for final signature.
			</p>
		</div>
		<div class="footer">
			<p>This is an automated message from your NDA management system.</p>
		</div>
	</div>
</body>
</html>
	`;
}
