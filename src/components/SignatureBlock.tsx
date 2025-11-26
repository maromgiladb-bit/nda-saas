/**
 * SignatureBlock Component
 * Renders signature fields at the bottom of NDA documents
 * Template-agnostic and reusable across all NDA types
 */

interface SignatureBlockProps {
  partyAName?: string;
  partyBName?: string;
  className?: string;
}

export function SignatureBlock({ partyAName, partyBName, className = "" }: SignatureBlockProps) {
  return (
    <div className={`signature-block mt-12 pt-8 border-t-2 border-gray-300 ${className}`}>
      <h3 className="text-xl font-bold mb-6 text-center">SIGNATURES</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Party A Signature */}
        <div className="signature-field">
          <div className="mb-4">
            <p className="font-semibold mb-2">Party A (Disclosing Party)</p>
            <p className="text-sm text-gray-600">{partyAName || "________________"}</p>
          </div>
          
          <div className="mb-2 pb-1 border-b-2 border-gray-800 min-h-[60px]">
            {/* Signature will go here */}
          </div>
          <p className="text-sm text-gray-600">Signature</p>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2 pb-1 border-b border-gray-400">
                {/* Name field */}
              </div>
              <p className="text-xs text-gray-600">Print Name</p>
            </div>
            
            <div>
              <div className="mb-2 pb-1 border-b border-gray-400">
                {/* Title field */}
              </div>
              <p className="text-xs text-gray-600">Title</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="mb-2 pb-1 border-b border-gray-400">
              {/* Date field */}
            </div>
            <p className="text-xs text-gray-600">Date</p>
          </div>
        </div>

        {/* Party B Signature */}
        <div className="signature-field">
          <div className="mb-4">
            <p className="font-semibold mb-2">Party B (Receiving Party)</p>
            <p className="text-sm text-gray-600">{partyBName || "________________"}</p>
          </div>
          
          <div className="mb-2 pb-1 border-b-2 border-gray-800 min-h-[60px]">
            {/* Signature will go here */}
          </div>
          <p className="text-sm text-gray-600">Signature</p>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2 pb-1 border-b border-gray-400">
                {/* Name field */}
              </div>
              <p className="text-xs text-gray-600">Print Name</p>
            </div>
            
            <div>
              <div className="mb-2 pb-1 border-b border-gray-400">
                {/* Title field */}
              </div>
              <p className="text-xs text-gray-600">Title</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="mb-2 pb-1 border-b border-gray-400">
              {/* Date field */}
            </div>
            <p className="text-xs text-gray-600">Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Utility function to inject signature block HTML into template
 * Can be used when rendering Handlebars templates
 */
export function getSignatureBlockHTML(partyAName?: string, partyBName?: string): string {
  return `
    <div class="signature-block" style="margin-top: 3rem; padding-top: 2rem; border-top: 2px solid #d1d5db;">
      <h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 1.5rem; text-align: center;">SIGNATURES</h3>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <!-- Party A Signature -->
        <div>
          <div style="margin-bottom: 1rem;">
            <p style="font-weight: 600; margin-bottom: 0.5rem;">Party A (Disclosing Party)</p>
            <p style="font-size: 0.875rem; color: #4b5563;">${partyAName || "________________"}</p>
          </div>
          
          <div style="margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 2px solid #1f2937; min-height: 60px;">
            <!-- Signature -->
          </div>
          <p style="font-size: 0.875rem; color: #4b5563;">Signature</p>
          
          <div style="margin-top: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <div style="margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #9ca3af;">
                <!-- Name -->
              </div>
              <p style="font-size: 0.75rem; color: #4b5563;">Print Name</p>
            </div>
            
            <div>
              <div style="margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #9ca3af;">
                <!-- Title -->
              </div>
              <p style="font-size: 0.75rem; color: #4b5563;">Title</p>
            </div>
          </div>
          
          <div style="margin-top: 1rem;">
            <div style="margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #9ca3af;">
              <!-- Date -->
            </div>
            <p style="font-size: 0.75rem; color: #4b5563;">Date</p>
          </div>
        </div>

        <!-- Party B Signature -->
        <div>
          <div style="margin-bottom: 1rem;">
            <p style="font-weight: 600; margin-bottom: 0.5rem;">Party B (Receiving Party)</p>
            <p style="font-size: 0.875rem; color: #4b5563;">${partyBName || "________________"}</p>
          </div>
          
          <div style="margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 2px solid #1f2937; min-height: 60px;">
            <!-- Signature -->
          </div>
          <p style="font-size: 0.875rem; color: #4b5563;">Signature</p>
          
          <div style="margin-top: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <div style="margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #9ca3af;">
                <!-- Name -->
              </div>
              <p style="font-size: 0.75rem; color: #4b5563;">Print Name</p>
            </div>
            
            <div>
              <div style="margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #9ca3af;">
                <!-- Title -->
              </div>
              <p style="font-size: 0.75rem; color: #4b5563;">Title</p>
            </div>
          </div>
          
          <div style="margin-top: 1rem;">
            <div style="margin-bottom: 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #9ca3af;">
              <!-- Date -->
            </div>
            <p style="font-size: 0.75rem; color: #4b5563;">Date</p>
          </div>
        </div>
      </div>
    </div>
  `;
}
