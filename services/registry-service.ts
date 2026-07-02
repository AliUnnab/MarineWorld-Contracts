export class AgreementRegistryService {
  /**
   * Generates a canonical, deterministically sorted JSON string from an object.
   * This ensures that { "a": 1, "b": 2 } and { "b": 2, "a": 1 } produce the same string.
   */
  static canonicalize(data: any): string {
    if (data === null || typeof data !== 'object') {
      return JSON.stringify(data);
    }
    
    if (Array.isArray(data)) {
      const arrStr = data.map(item => this.canonicalize(item)).join(',');
      return `[${arrStr}]`;
    }

    const sortedKeys = Object.keys(data).sort();
    const objParts = sortedKeys.map(key => {
      // Exclude UI state or temporary fields if they somehow slip in, though we filter before this step.
      const val = data[key];
      if (val === undefined) return ''; // undefined fields are stripped in standard JSON
      return `"${key}":${this.canonicalize(val)}`;
    }).filter(p => p !== '');

    return `{${objParts.join(',')}}`;
  }

  /**
   * Sanitizes contract data, removing undefined, NaN, and normalizing nulls.
   */
  static sanitizeContractData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeContractData(item));
    }
    
    if (data !== null && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value === undefined || Number.isNaN(value)) {
          sanitized[key] = "Not Specified";
        } else if (value === null) {
          sanitized[key] = "Not Specified";
        } else {
          sanitized[key] = this.sanitizeContractData(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Generates a SHA-256 fingerprint for a contract's core data model.
   */
  static async generateFingerprint(contractData: any): Promise<string> {
    // 1. Filter only the relevant business fields, explicitly excluding UI state.
    const relevantData = {
      title: contractData.title || "Not Specified",
      agreementType: contractData.agreementType || "Not Specified",
      seller: contractData.seller || "Not Specified",
      buyer: contractData.buyer || "Not Specified",
      contractValue: contractData.contractValue || "Not Specified",
      currency: contractData.currency || "Not Specified",
      applicableLaw: contractData.applicableLaw || "Not Specified",
      jurisdictionSeat: contractData.jurisdictionSeat || "Not Specified",
      foundation: contractData.foundation || {},
      jurisdiction: contractData.jurisdiction || {},
      partyA: contractData.partyA || {},
      partyB: contractData.partyB || {},
      contractFields: contractData.contractFields || {},
      participants: contractData.participants || [],
      clauses: contractData.clauses || [],
      revisions: contractData.revisions || [],
      identityDocs: contractData.identityDocs || [],
      additionalParties: contractData.additionalParties || []
    };

    // 2. Deep sanitize to convert null/undefined/NaN to "Not Specified"
    const sanitizedData = this.sanitizeContractData(relevantData);

    // 3. Create deterministically sorted canonical JSON
    const canonicalString = this.canonicalize(sanitizedData);

    // 4. Generate SHA-256 Hash
    const msgUint8 = new TextEncoder().encode(canonicalString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return "0x" + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
