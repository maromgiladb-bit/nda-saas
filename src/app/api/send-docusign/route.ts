import { NextResponse } from "next/server";
import { getDocuSignClient, getDocuSignAccountId } from "@/lib/docusign";

/**
 * Send NDA via DocuSign for signature
 * POST /api/send-docusign
 */
export async function POST(request: Request) {
  try {
    // Dynamic import to avoid build issues with AMD modules
    const docusign = await import("docusign-esign");
    
    const body = await request.json();
    const {
      ndaId,
      htmlContent,
      partyAEmail,
      partyAName,
      partyBEmail,
      partyBName,
      documentName = "Mutual NDA",
    } = body;

    // Validate required fields
    if (!partyAEmail || !partyAName || !partyBEmail || !partyBName || !htmlContent) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get DocuSign client and account ID
    const apiClient = await getDocuSignClient();
    const accountId = getDocuSignAccountId();
    const envelopesApi = new docusign.EnvelopesApi(apiClient);

    // Create envelope definition
    const envelope = new docusign.EnvelopeDefinition();
    envelope.emailSubject = `Please sign: ${documentName}`;
    envelope.status = "sent"; // Send immediately

    // Convert HTML to base64 for DocuSign
    const htmlBase64 = Buffer.from(htmlContent).toString("base64");

    // Create document
    const document = new docusign.Document();
    document.documentBase64 = htmlBase64;
    document.name = documentName;
    document.fileExtension = "html";
    document.documentId = "1";

    envelope.documents = [document];

    // Create signers (Party A and Party B)
    const partyASigner = new docusign.Signer();
    partyASigner.email = partyAEmail;
    partyASigner.name = partyAName;
    partyASigner.recipientId = "1";
    partyASigner.routingOrder = "1";

    // Add signature tab for Party A
    const partyASignTab = new docusign.SignHere();
    partyASignTab.documentId = "1";
    partyASignTab.pageNumber = "1"; // Adjust based on your document
    partyASignTab.xPosition = "100";
    partyASignTab.yPosition = "700"; // Bottom of page
    
    const partyADateTab = new docusign.DateSigned();
    partyADateTab.documentId = "1";
    partyADateTab.pageNumber = "1";
    partyADateTab.xPosition = "100";
    partyADateTab.yPosition = "750";

    const partyANameTab = new docusign.FullName();
    partyANameTab.documentId = "1";
    partyANameTab.pageNumber = "1";
    partyANameTab.xPosition = "100";
    partyANameTab.yPosition = "670";

    partyASigner.tabs = new docusign.Tabs();
    partyASigner.tabs.signHereTabs = [partyASignTab];
    partyASigner.tabs.dateSignedTabs = [partyADateTab];
    partyASigner.tabs.fullNameTabs = [partyANameTab];

    // Create Party B signer
    const partyBSigner = new docusign.Signer();
    partyBSigner.email = partyBEmail;
    partyBSigner.name = partyBName;
    partyBSigner.recipientId = "2";
    partyBSigner.routingOrder = "2"; // Party B signs after Party A

    // Add signature tab for Party B
    const partyBSignTab = new docusign.SignHere();
    partyBSignTab.documentId = "1";
    partyBSignTab.pageNumber = "1";
    partyBSignTab.xPosition = "350"; // Right side
    partyBSignTab.yPosition = "700";
    
    const partyBDateTab = new docusign.DateSigned();
    partyBDateTab.documentId = "1";
    partyBDateTab.pageNumber = "1";
    partyBDateTab.xPosition = "350";
    partyBDateTab.yPosition = "750";

    const partyBNameTab = new docusign.FullName();
    partyBNameTab.documentId = "1";
    partyBNameTab.pageNumber = "1";
    partyBNameTab.xPosition = "350";
    partyBNameTab.yPosition = "670";

    partyBSigner.tabs = new docusign.Tabs();
    partyBSigner.tabs.signHereTabs = [partyBSignTab];
    partyBSigner.tabs.dateSignedTabs = [partyBDateTab];
    partyBSigner.tabs.fullNameTabs = [partyBNameTab];

    // Add recipients
    envelope.recipients = new docusign.Recipients();
    envelope.recipients.signers = [partyASigner, partyBSigner];

    // Send the envelope
    const results = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition: envelope,
    });

    console.log("DocuSign envelope created:", results.envelopeId);

    // TODO: Save envelope ID to database with ndaId
    // await prisma.nda.update({
    //   where: { id: ndaId },
    //   data: {
    //     docusignEnvelopeId: results.envelopeId,
    //     status: "SENT_FOR_SIGNATURE",
    //   },
    // });

    return NextResponse.json({
      success: true,
      envelopeId: results.envelopeId,
      status: results.status,
      message: "NDA sent via DocuSign successfully",
    });
  } catch (error: any) {
    console.error("DocuSign envelope creation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to send via DocuSign",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
