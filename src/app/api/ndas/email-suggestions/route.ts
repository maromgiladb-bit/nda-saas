import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Get the search query from URL params
		const searchParams = request.nextUrl.searchParams;
		const query = searchParams.get("q") || "";

		// Find user
		const user = await prisma.users.findUnique({
			where: { external_id: userId },
		});

		if (!user) {
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 }
			);
		}

		// Get all unique emails from signers table where:
		// 1. The user created the draft (sent to someone)
		// 2. The user was a signer (received from someone)
		const sentEmails = await prisma.signers.findMany({
			where: {
				nda_drafts: {
					created_by_id: user.id,
				},
				email: {
					not: user.email, // Exclude own email
					contains: query.toLowerCase(),
				},
			},
			select: {
				email: true,
				role: true,
				signed_at: true,
				created_at: true,
				nda_drafts: {
					select: {
						title: true,
					},
				},
			},
			orderBy: {
				created_at: "desc",
			},
			take: 20, // Limit to recent 20
		});

		const receivedEmails = await prisma.signers.findMany({
			where: {
				user_id: user.id,
				nda_drafts: {
					created_by_id: {
						not: user.id, // Received from others
					},
					users: {
						email: {
							not: user.email,
						},
					},
				},
			},
			select: {
				nda_drafts: {
					select: {
						title: true,
						users: {
							select: {
								email: true,
							},
						},
					},
				},
				signed_at: true,
				created_at: true,
			},
			orderBy: {
				created_at: "desc",
			},
			take: 20,
		});

		// Build unique email list with metadata
		const emailMap = new Map<
			string,
			{
				email: string;
				lastUsed: Date;
				count: number;
				ndaTitles: string[];
				hasSignedBefore: boolean;
			}
		>();

		// Process sent emails
		sentEmails.forEach((signer) => {
			const existing = emailMap.get(signer.email);
			if (existing) {
				existing.count++;
				existing.ndaTitles.push(signer.nda_drafts.title || "Untitled");
				if (signer.signed_at && !existing.hasSignedBefore) {
					existing.hasSignedBefore = true;
				}
				if (signer.created_at && signer.created_at > existing.lastUsed) {
					existing.lastUsed = signer.created_at;
				}
			} else {
				emailMap.set(signer.email, {
					email: signer.email,
					lastUsed: signer.created_at || new Date(),
					count: 1,
					ndaTitles: [signer.nda_drafts.title || "Untitled"],
					hasSignedBefore: !!signer.signed_at,
				});
			}
		});

		// Process received emails
		receivedEmails.forEach((signer) => {
			const senderEmail = signer.nda_drafts.users.email;
			if (senderEmail === user.email) return; // Skip own email

			// Only add if matches query
			if (!senderEmail.toLowerCase().includes(query.toLowerCase())) return;

			const existing = emailMap.get(senderEmail);
			if (existing) {
				existing.count++;
				existing.ndaTitles.push(signer.nda_drafts.title || "Untitled");
				if (signer.created_at && signer.created_at > existing.lastUsed) {
					existing.lastUsed = signer.created_at;
				}
			} else {
				emailMap.set(senderEmail, {
					email: senderEmail,
					lastUsed: signer.created_at || new Date(),
					count: 1,
					ndaTitles: [signer.nda_drafts.title || "Untitled"],
					hasSignedBefore: !!signer.signed_at,
				});
			}
		});

		// Convert to array and sort by last used (most recent first)
		const suggestions = Array.from(emailMap.values())
			.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
			.slice(0, 10) // Limit to top 10 suggestions
			.map((item) => ({
				email: item.email,
				count: item.count,
				lastUsed: item.lastUsed.toISOString(),
				recentNda: item.ndaTitles[0],
				hasSignedBefore: item.hasSignedBefore,
			}));

		return NextResponse.json({ suggestions });
	} catch (error) {
		console.error("Error fetching email suggestions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch suggestions" },
			{ status: 500 }
		);
	}
}
