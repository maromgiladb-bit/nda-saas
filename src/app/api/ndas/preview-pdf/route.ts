import { NextRequest, NextResponse } from 'next/server';
import { renderNdaHtml } from '@/lib/renderNdaHtml';
import { htmlToPdf } from '@/lib/htmlToPdf';

export const runtime = 'nodejs'; // Required for Puppeteer

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { formData, signatureImage, signerName, signerTitle, signerDate } = body;

        if (!formData) {
            return NextResponse.json(
                { error: 'Missing form data' },
                { status: 400 }
            );
        }

        // Generate HTML
        console.log('📄 Generating PDF preview...');
        let html = await renderNdaHtml(formData);

        // Inject signature if provided
        if (signatureImage) {
            console.log('✍️ Injecting signature into preview...');

            const patterns = [
                /<div class="sign-box" id="party-a-signature">([\s\S]*?)<\/div>/,
                /<div class="line"><\/div>/,
                /<div[^>]*(?:id|class)="[^"]*signature[^"]*"[^>]*>[\s\S]*?<\/div>/i
            ];

            for (const pattern of patterns) {
                if (pattern.test(html)) {
                    const signatureHtml = `
            <div style="margin-top: 10px;">
              <img src="${signatureImage}" alt="Signature" style="max-height: 60px; display: block;" />
              <div style="margin-top: 5px; font-size: 14px;">
                <div><strong>${signerName}</strong></div>
                <div>${signerTitle}</div>
                <div>${signerDate}</div>
              </div>
            </div>
          `;

                    html = html.replace(pattern, (match) => {
                        return match.replace(/<\/div>$/, `${signatureHtml}</div>`);
                    });

                    console.log('✅ Signature injected into preview');
                    break;
                }
            }
        }

        // Generate PDF
        const pdfBuffer = await htmlToPdf(html);
        console.log('📄 Preview PDF generated, size:', pdfBuffer.length, 'bytes');

        // Return PDF as blob
        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="nda-preview.pdf"',
            },
        });
    } catch (error) {
        console.error('Preview PDF error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to generate preview PDF',
            },
            { status: 500 }
        );
    }
}
