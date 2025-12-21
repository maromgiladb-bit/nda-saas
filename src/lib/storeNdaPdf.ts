import { PrismaClient, PdfKind } from '@prisma/client';
import { uploadToS3 } from './s3';

const prisma = new PrismaClient();

/**
 * Store NDA PDF in S3 and database
 * Only called when SignRequest status is SENT or SIGNED
 * 
 * @param signRequestId - ID of the sign request
 * @param kind - Type of PDF (SENT or SIGNED)
 * @param pdfBuffer - PDF file as Buffer
 */
export async function storeNdaPdf({
    signRequestId,
    kind,
    pdfBuffer,
}: {
    signRequestId: string;
    kind: 'SENT' | 'SIGNED';
    pdfBuffer: Buffer;
}): Promise<void> {
    // Look up SignRequest to get organizationId
    const signRequest = await prisma.signRequest.findUnique({
        where: { id: signRequestId },
        select: { organizationId: true },
    });

    if (!signRequest) {
        throw new Error(`SignRequest ${signRequestId} not found`);
    }

    const { organizationId } = signRequest;

    // Generate deterministic S3 key based on kind
    const s3Key = kind === 'SENT'
        ? `org/${organizationId}/sent/${signRequestId}.pdf`
        : `org/${organizationId}/signed/${signRequestId}.pdf`;

    const fileName = `nda-${signRequestId}-${kind.toLowerCase()}.pdf`;
    const fileSize = pdfBuffer.length;

    // Upload to S3
    await uploadToS3({
        key: s3Key,
        body: pdfBuffer,
        contentType: 'application/pdf',
    });

    // Upsert NdaPdf record using unique constraint (signRequestId + kind)
    await prisma.ndaPdf.upsert({
        where: {
            signRequestId_kind: {
                signRequestId,
                kind: kind as PdfKind,
            },
        },
        create: {
            organizationId,
            signRequestId,
            kind: kind as PdfKind,
            s3Key,
            fileName,
            mimeType: 'application/pdf',
            fileSize,
        },
        update: {
            s3Key,
            fileName,
            fileSize,
        },
    });
}
