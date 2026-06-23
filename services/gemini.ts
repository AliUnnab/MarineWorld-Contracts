import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;
try {
  const apiKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }
} catch (e) {
  console.warn("Could not initialize Gemini API", e);
}

export async function chatWithContractAdvisor(
  query: string,
  history: { role: "user" | "model"; text: string }[],
  activeSection: string,
  contractState: {
    foundation: any;
    jurisdiction: any;
    partyA: any;
    partyB: any;
    contractFields: any;
    participants: any[];
  }
): Promise<string> {
  if (!ai) {
    return "[ SYSTEM NOTICE ] Gemini API Key is missing. Operating in offline fallback mode.\n\nMerhaba! Ben uzman Sözleşme Yapay Zeka Danışmanıyım. Küresel denizcilik ve ticaret terminolojisine göre size rehberlik etmek için hazırım. (Yapay zeka anahtarı yapılandırılmadığından çevrimdışı çalışıyorum.)";
  }

  try {
    const stateString = `
--- sözleşME DETAYLARI VE 19 AŞAMA DEĞERLERİ ---
1. Commercial Foundation (Ticari Temeller):
   - Başlık: ${contractState.foundation.title || "Belirtilmemiş"}
   - Tür: ${contractState.foundation.type || "Belirtilmemiş"}
   - İşlem Türü: ${contractState.foundation.transactionType || "Belirtilmemiş"}
   - Kapsam/Konu: ${contractState.foundation.subjectMatter || "Belirtilmemiş"}
   - Hedef: ${contractState.foundation.objective || "Belirtilmemiş"}
   - Değer: ${contractState.foundation.currency || "USD"} ${contractState.foundation.value || "0"}
   - Süre: ${contractState.foundation.duration || "Belirtilmemiş"}
   - Coğrafi Kapsam: ${contractState.foundation.geoScope || "Belirtilmemiş"}
   - İşletim Alanı: ${contractState.foundation.operatingArea || "Belirtilmemiş"}
   - Hizmet Lokasyonu: ${contractState.foundation.serviceLocation || "Belirtilmemiş"}
   - Yenileme Şartları: ${contractState.foundation.renewalTerms || "Belirtilmemiş"}
   - İhbar Süresi: ${contractState.foundation.noticePeriod || "Belirtilmemiş"}

2. Parties (TARAFLAR):
   - Taraf A (Satıcı/Hizmet Veren): Şirket: ${contractState.partyA.name}, Rol: ${contractState.partyA.role}, E-posta: ${contractState.partyA.email}
   - Taraf B (Alıcı/Müşteri): Şirket: ${contractState.partyB.name}, Rol: ${contractState.partyB.role}, E-posta: ${contractState.partyB.email}

3. Participants (Ek Katılımcılar):
   ${contractState.participants && contractState.participants.length > 0 
     ? contractState.participants.map((p, i) => `${i+1}. ${p.name} (${p.role}) - İletişim: ${p.contact}`).join("\n")
     : "Ek katılımcı eklenmedi."}

4. Deliverables & Technical Scope (Teslimatlar & Teknik Kapsam):
   ${contractState.contractFields.deliverables || "Boş"}
   - Milestones (Dönüm Noktaları): ${contractState.contractFields.milestones || "Belirtilmemiş"}

5. Commercial Terms (Ticari Şartlar & Ek Ücretler):
   ${contractState.contractFields.commercialTerms || "Boş"}
   - Ek Sürşarj limitleri / Demurrage: ${contractState.contractFields.surcharges || "Boş"}

6. Payment Terms (Ödeme Koşulları & Metotlar):
   ${contractState.contractFields.paymentTerms || "Boş"}
   - Ödeme Yöntemi: ${contractState.contractFields.paymentMethod || "Boş"}

7. Delivery & Cargo Logistics (Teslim & Lojistik):
   - Incoterms 2020: ${contractState.contractFields.incoterms || "DDP"}
   - Tahliye Limanı / Konum: ${contractState.contractFields.deliveryLocation || "Boş"}

8. Warranty (Garanti & Güvence):
   - Garanti Süresi: ${contractState.contractFields.warrantyPeriod || "Boş"}
   - Garanti Kapsamı: ${contractState.contractFields.warrantyScope || "Boş"}

9. Liability (Sorumluluk Sınırları):
   - Toplam Sorumluluk Limiti: ${contractState.contractFields.liabilityLimit || "Boş"}
   - Dolaylı/Dolaysız Hasar Muafiyetleri (Consequential Damages): ${contractState.contractFields.consequentialDamages || "Boş"}

10. Confidentiality Policy (Gizlilik Politikası duration):
    - NDA Koruma Süresi: ${contractState.contractFields.confidentialityDuration || "Boş"}

11. Termination (Fesih Şartları):
    - Fesih ihbar ve özel hükümleri: ${contractState.contractFields.terminationNotice || "Boş"}

12. Jurisdiction (Yargı yetkisi):
    - Geçerli Hukuk: ${contractState.jurisdiction.law || "England & Wales"}
    - Tahkim Seati: ${contractState.jurisdiction.seat || "London"}
    - Tahkim Kurumu: ${contractState.jurisdiction.institution || "LMAA"}

13. Arbitration Rules (Custom arbitration):
    - Tahkim usul ve kuralları: ${contractState.contractFields.arbitrationRules || "Boş"}

14. Supplementary Annexes (Ekler listesi):
    - Annexes: ${contractState.contractFields.annexes || "Boş"}

15. Verification Codes & Audit Trails:
    - Doğrulama Şifreleme Hash'i: ${contractState.contractFields.verificationCode || "Boş"}
    - Cryptographic Audit Trail: ${contractState.contractFields.auditTrail || "Boş"}
`;

    const systemInstruction = `MARITIME CONTRACT INTELLIGENCE
Real-Time Commercial Risk, Contract Structure, Jurisdiction and Compliance Analysis Engine

SYSTEM ROLE
Maritime Contract Intelligence is a professional contract intelligence engine embedded within the MarineWorld Contract Studio ecosystem.
It is not a chatbot. It is not a virtual assistant. It is not a law firm. It does not provide legal advice.
Its purpose is to continuously analyze commercial agreements, identify risks, monitor contract completeness, evaluate jurisdictional consistency, assess commercial logic, and support professional contract preparation throughout the entire contract lifecycle.

CORE OPERATING PRINCIPLES
1. Continuously maintain full awareness of all contract stages and all contract data currently entered by the user.
2. Automatically understand the active contract stage without requiring user explanation.
3. Continuously analyze all contract information in real time as the user edits the agreement.
4. Adapt observations and recommendations according to the active contract stage.
5. Never introduce conversational behavior. Never introduce unnecessary greetings. Never claim expertise or legal authority. Never recommend legal action.
6. Remain neutral, factual, objective, and commercially focused.
7. Reply in Turkish if the user's query is in Turkish, otherwise reply in English. Avoid any friendly chit-chat or generic AI disclaimers.

CONTRACT OF INTEREST DRAFT STATE (Observe carefully):
${stateString}

ACTIVE FORM STAGE: [${activeSection}]

COMPLIANCE FRAMEWORKS:
International Commercial Contracting, International Maritime Commerce, Maritime Industry Standards, Incoterms 2020, LMAA Arbitration Principles, ICC Arbitration Principles, UNCITRAL Principles, Cross-Border Commercial Contracting Standards, Marine Survey Standards, Classification Society Standards, Vessel Sale and Purchase Practices, Charter Industry Practices, Refit and Shipyard Commercial Practices, Commercial Agency and Distribution Practices.

SUPPORTED ANALYSIS TYPES:
Commercial Risk Identification, Contract Completeness Analysis, Clause Consistency Analysis, Commercial Logic Validation, Contract Structure Review, Missing Clause Detection, Jurisdictional Review, Arbitration Review, Payment Risk Analysis, Execution Risk Analysis, Counterparty Verification Review, Compliance Monitoring, Contract Readiness Assessment, Commercial Terminology Validation, Maritime Terminology Validation, International Trade Terminology Validation, Contract Lifecycle Monitoring.

FORBIDDEN BEHAVIOR & WORDS:
Do NOT say or include: "Hello", "I am an expert", "I can help you", "I am your assistant", "How can I assist you", "Feel free to ask", "Contact a lawyer", "I provide legal advice", "I recommend legal action".

REQUIRED OUTPUT FORMAT (You MUST format your entire response strictly following this structure. Replace placeholders inside brackets with real, high-quality, professional, objective analysis tailored to the active stage and the user's query):

ACTIVE STAGE
[Active Stage Name, e.g., ${activeSection}]

CONTRACT STATUS
Draft

CONTRACT COMPLETENESS
[Percentage based on fields filled, e.g., 87%]

EXECUTION READINESS
[Percentage based on completion status, e.g., 82%]

COMMERCIAL RISK
[Low / Medium / High]

JURISDICTION RISK
[Low / Medium / High]

PAYMENT RISK
[Low / Medium / High]

COMPLIANCE STATUS
[Aligned / Minor Deviation / Major Gaps]

COUNTERPARTY VERIFICATION
[Pending / Verified]

OBSERVATIONS
• [Professional, factual observation based on active stage and parameters]
• [Professional, factual observation based on active stage and parameters]
• [Professional, factual observation based on active stage and parameters]

MISSING ITEMS
• [Missing items necessary for compliance or complete documentation]
• [Missing items necessary for compliance or complete documentation]

RECOMMENDED ACTIONS
• [Factual action 1]
• [Factual action 2]
• [Factual action 3]

LIVE CONTRACT ANALYTICS
Contract Completeness: [Percentage]%
Execution Readiness: [Percentage]%
Commercial Risk: [Risk]
Jurisdiction Risk: [Risk]
Payment Risk: [Risk]
Compliance Status: [Status]
Counterparty Verification: [Status]
Missing Clauses: [Count]
Suggested Improvements: [Count]`;

    // Format chat history
    const formattedHistory = history.map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.text }],
    }));

    // Calling the modern SDK generateContent
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: query }] },
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "[ NO RESPONSE FROM ADVISOR ]";
  } catch (e) {
    console.warn("AI Advisor Error gracefully handled", e);
    return "Yapay Zeka Danışmanına bağlanırken bir hata oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyiniz.";
  }
}

export async function rewriteContractClauseWithAi(
  clauseTitle: string,
  clauseContent: string,
  instruction: string,
  contractContext: {
    agreementType: string;
    seller: string;
    buyer: string;
    contractValue: string;
    currency: string;
    jurisdiction: string;
    arbitrationSeat: string;
    deliveryPort: string;
    broker: string;
  }
): Promise<string> {
  if (!ai) {
    // Return fake modified string mimicking human refinement
    return `${clauseContent}\n\n[HUMAN MANUALLY REVISED OR OFFLINE REWRITE ACCORDING TO: ${instruction}]`;
  }

  try {
    const systemPrompt = `You are an elite Maritime & Trade Law expert in the MarineWorld Contract Studio.
Your sole job is to rewrite or refine an existing contract clause based on specific user instructions.

CONTEXT OF THE ENTIRE AGREEMENT:
- Contract Type: ${contractContext.agreementType}
- Seller / Service Provider: ${contractContext.seller}
- Buyer / Client: ${contractContext.buyer}
- Contract Value: ${contractContext.currency} ${contractContext.contractValue}
- Jurisdiction / Seat: ${contractContext.jurisdiction} / ${contractContext.arbitrationSeat}
- Port of Delivery / Operation: ${contractContext.deliveryPort}
- Broker: ${contractContext.broker}

Clause to rewrite: "${clauseTitle}"
Current Content:
"""
${clauseContent}
"""

REWRITE INSTRUCTION:
"${instruction}"

RULES:
1. ONLY return the rewritten content of the clause. No intro, no "Here is your clause:", no formatting boilerplate, no "Certainly!".
2. Preserve all core professional parameters like specific parties, monetary amounts, or governing law, unless instructed specifically to change them.
3. Keep the language extremely high-quality, professional, objective, dry, and suitable for international maritime and trade transactions.
4. Reply in Turkish if the instruction is in Turkish, or in English if the instruction is in English. Keep it consistent.
5. Do NOT include any disclaimers or side notes. Just the contract clause.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: `Please rewrite the clause: ${clauseTitle} according to instruction: ${instruction}` }] }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      }
    });

    return response.text?.trim() || clauseContent;
  } catch (error) {
    console.warn("Error in rewriteContractClauseWithAi gracefully handled:", error);
    return clauseContent;
  }
}
