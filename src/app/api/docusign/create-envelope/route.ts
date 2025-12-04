import { NextResponse } from "next/server";
import { getDocuSignClient, getDocuSignAccountId, getDocuSignSDK } from "@/lib/docusign";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const docusign = await getDocuSignSDK();
        const body = await request.json();
        const {
            ndaId,
            htmlContent,
            partyAEmail,
            partyAName,
            partyBEmail,
            partyBName,
            documentName = "Mutual NDA",
            returnUrl, // URL to redirect to after signing
        } = body;

        if (!partyAEmail || !partyAName || !partyBEmail || !partyBName || !htmlContent || !returnUrl) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const apiClient = await getDocuSignClient();
        const accountId = getDocuSignAccountId();
        const envelopesApi = new docusign.EnvelopesApi(apiClient);

        // 1. Create Envelope Definition
        const envelope = new docusign.EnvelopeDefinition();
        envelope.emailSubject = `Please sign: ${documentName}`;
        envelope.status = "sent";

        // Document
        const htmlBase64 = Buffer.from(htmlContent).toString("base64");
        const document = new docusign.Document();
        document.documentBase64 = htmlBase64;
        document.name = documentName;
        document.fileExtension = "html";
        document.documentId = "1";
        envelope.documents = [document];

        // Signers
        // Party A (Sender/Embedded Signer)
        const partyASigner = new docusign.Signer();
        partyASigner.email = partyAEmail;
        partyASigner.name = partyAName;
        (partyASigner as any).clientUserId = "1001"; // Setting this makes it an embedded signer
        partyASigner.recipientId = "1";
        partyASigner.routingOrder = "1";

        // Party A Tabs
        const partyASignTab = new docusign.SignHere();
        partyASignTab.documentId = "1";
        partyASignTab.pageNumber = "1";
        partyASignTab.xPosition = "100";
        partyASignTab.yPosition = "700";

        const partyADateTab = new docusign.DateSigned();
        partyADateTab.documentId = "1";
        partyADateTab.pageNumber = "1";
        partyADateTab.xPosition = "100";
        partyADateTab.yPosition = "750";

        partyASigner.tabs = new docusign.Tabs();
        partyASigner.tabs.signHereTabs = [partyASignTab];
        partyASigner.tabs.dateSignedTabs = [partyADateTab];

        // Party B (Remote Signer)
        const partyBSigner = new docusign.Signer();
        partyBSigner.email = partyBEmail;
        partyBSigner.name = partyBName;
        partyBSigner.recipientId = "2";
        partyBSigner.routingOrder = "2";

        // Party B Tabs
        const partyBSignTab = new docusign.SignHere();
        partyBSignTab.documentId = "1";
        partyBSignTab.pageNumber = "1";
        partyBSignTab.xPosition = "350";
        partyBSignTab.yPosition = "700";

        const partyBDateTab = new docusign.DateSigned();
        partyBDateTab.documentId = "1";
        partyBDateTab.pageNumber = "1";
        partyBDateTab.xPosition = "350";
        partyBDateTab.yPosition = "750";

        partyBSigner.tabs = new docusign.Tabs();
        partyBSigner.tabs.signHereTabs = [partyBSignTab];
        partyBSigner.tabs.dateSignedTabs = [partyBDateTab];

        envelope.recipients = new docusign.Recipients();
        envelope.recipients.signers = [partyASigner, partyBSigner];

        // 2. Create Envelope
        const results = await envelopesApi.createEnvelope(accountId, {
            envelopeDefinition: envelope,
        });
        const envelopeId = results.envelopeId;

        // 3. Create Recipient View (Embedded Signing URL)
        const viewRequest = new (docusign as any).RecipientViewRequest();
        viewRequest.returnUrl = returnUrl;
        viewRequest.authenticationMethod = "none";
        viewRequest.email = partyAEmail;
        viewRequest.userName = partyAName;
        viewRequest.clientUserId = "1001"; // Must match the signer above

        const viewResults = await (envelopesApi as any).createRecipientView(accountId, envelopeId, {
            recipientViewRequest: viewRequest,
        });

        // Update NDA status in database
        await prisma.nda_drafts.update({
            where: { id: ndaId },
            data: { status: 'SENT' }
        });

        return NextResponse.json({
            url: viewResults.url,
            envelopeId: envelopeId,
        });

    } catch (error: any) {
        console.error("DocuSign error:", error);
        return NextResponse.json(
            { error: "Failed to create DocuSign session", details: error.message },
            { status: 500 }
        );
    }
}
