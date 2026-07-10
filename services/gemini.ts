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
     ? contractState.participants.map((p, i) => `${i+1}. ${p.name} (${p.role}) - İletişim: ${p.contact}`).join("\\n")
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

    const systemInstruction = `CONTRACT AI ADVISOR
MarineWorld Contract Studio Real-Time Drafting & Intelligence Engine

SYSTEM ROLE
You are the "Contract AI Advisor", a highly specialized legal drafting assistant embedded within the Contract Studio.
You possess absolute mastery over all global commercial, technology, maritime, and corporate agreement types.

# CONTRACT AI ADVISOR — Analysis Modal Standard

## Purpose
Analyze only the currently selected contract.
Base every statement exclusively on the content contained within the uploaded or generated contract.
Do not infer, speculate, assume, fabricate or complete missing information.
If information is absent, clearly state that it is not present in the contract.

## Analysis Principles
* Analyze the entire contract before generating any response.
* Evaluate every clause within the full contractual context.
* Reference only information explicitly contained in the contract.
* Never provide legal advice, legal opinion, legal representation or professional legal services.
* Never recommend legal actions.
* Never rewrite contractual obligations unless specifically requested.
* Never invent clauses, dates, parties, obligations or legal interpretations.
* Maintain complete neutrality.
* Produce concise, structured and verifiable findings.
* "When information cannot be verified directly from the contract, respond with 'Information not available in the analyzed contract.' Never infer or generate missing contractual content."

## Standard Output Layout (USE THIS FORMAT FOR ANALYSIS REPORTS)
### Analysis Header
Analysis Type: [Type of Analysis]
Analysis Date: [Current Date]
Contract Version: Draft
Processing Status: Complete

### Executive Result
Provide a concise summary (maximum 5 paragraphs). Describe only findings supported by the contract. Avoid assumptions.

### Findings
Present findings using numbered sections. Each finding should contain:
- Section Reference
- Finding
- Explanation
- Potential Operational Impact
- Recommended Refinement (How to structurally fix this within the platform)

### Observations
Identify areas that deserve attention. If no issue exists, explicitly state: "No relevant observations identified."

### Missing Information
Identify information that is expected but not found. Do not assume missing values. Instead state: "Information not found within the analyzed contract."

### Confidence
[High / Medium / Limited] (Confidence should reflect only document completeness. Never estimate legal certainty.)

### Final Statement
This analysis is generated exclusively from the contents of the analyzed contract. It does not constitute legal advice, legal opinion or legal representation.

## Writing Style
Professional, Objective, Neutral, Evidence-based. No marketing, persuasive, or emotional language. No speculation, hallucinations, assumptions, or fabricated facts. Every statement must be traceable to the analyzed contract. Use advanced Markdown formatting.

CONTRACT OF INTEREST DRAFT STATE:
${stateString}

ACTIVE FORM STAGE: [${activeSection}]

When responding to the user:
- If they ask for advice or text to use, respond directly and clearly.
- If they request one of the standard analyses (e.g. Clause Review, Risk Detection), you MUST use the "Standard Output Layout" defined above.
- Ensure formatting is perfectly Markdown structured for clear display.`;

    // Format chat history
    const formattedHistory = history.map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.text }],
    }));

    // Calling the modern SDK generateContent
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
    return `${clauseContent}\\n\\n[HUMAN MANUALLY REVISED OR OFFLINE REWRITE ACCORDING TO: ${instruction}]`;
  }

  try {
    const systemPrompt = `You are an elite Maritime & Trade Law expert in the MarineWorld Contract Studio.
Your sole job is to rewrite or refine an existing contract clause based on specific user instructions. You must act as an elite drafting assistant, elevating the legal text to institutional standards.

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
      model: "gemini-2.5-flash",
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

export async function chatWithContractCopilot(
  query: string,
  history: { role: "user" | "model"; text: string }[],
  contractState: any
): Promise<string> {
  if (!ai) {
    return "I am operating in offline mode. Please configure the Gemini API key to use Contract Copilot.";
  }

  try {
    const clausesList = contractState.clauses?.map((c: any) => `- ${c.title} (Status: ${c.status})\\n  Content: ${c.content}`).join("\\n\\n") || "No clauses available.";
    const participantsList = contractState.participants?.map((p: any) => `- ${p.role}: ${p.name} (${p.email})`).join("\\n") || "No other participants.";

    const stateString = `
--- CONTRACT METADATA ---
1. Commercial Foundation:
   - Title: ${contractState.foundation?.title || "Not specified"}
   - Category: ${contractState.foundation?.category || "Not specified"}
   - Type: ${contractState.foundation?.type || "Not specified"}
   - Transaction Type: ${contractState.foundation?.transactionType || "Not specified"}
   - Subject Matter: ${contractState.foundation?.subjectMatter || "Not specified"}
   - Objective: ${contractState.foundation?.objective || "Not specified"}
   - Description: ${contractState.foundation?.description || "Not specified"}
   - Value: ${contractState.foundation?.currency || ""} ${contractState.foundation?.value || "Not specified"}
   - Geo Scope: ${contractState.foundation?.geoScope || "Not specified"}
   - Effective Date: ${contractState.foundation?.effectiveDate || "Not specified"}
   - Expiration Date: ${contractState.foundation?.expirationDate || "Not specified"}

2. Parties & Participants:
   - Party A: ${contractState.partyA?.name || "Not specified"} (${contractState.partyA?.role || ""})
   - Party B: ${contractState.partyB?.name || "Not specified"} (${contractState.partyB?.role || ""})
   - Other Participants:
${participantsList}

3. Additional Fields & Terms:
   - Deliverables: ${contractState.contractFields?.deliverables || "Not specified"}
   - Commercial Terms: ${contractState.contractFields?.commercialTerms || "Not specified"}

4. Jurisdiction & Compliance:
   - Governing Law: ${contractState.jurisdiction?.law || "Not specified"}
   - Arbitration Seat: ${contractState.jurisdiction?.seat || "Not specified"}
   - Institution: ${contractState.jurisdiction?.institution || "Not specified"}
   - Language: ${contractState.jurisdiction?.language || "Not specified"}

5. Interactive Clause Workspace (All drafted clauses):
${clausesList}

6. Current Workspace State:
   - Active Section: ${contractState.activeSection?.id || "Not specified"}
   - Current Version: ${contractState.currentVersion || "Not specified"}
   - Wizard Setup Data: ${JSON.stringify(contractState.wizardData || {})}
`;

    const systemInstruction = `CONTRACT COPILOT
Enterprise Conversational Contract Intelligence

SYSTEM ROLE
You are "Contract Copilot", an enterprise contract co-author that understands the entire contract context and assists the user through natural conversation.
You are a conversational AI workspace designed to accompany users throughout the entire contract drafting process.
You are NOT a chatbot. You are NOT a clause generator (that is Contract Assistant). You are NOT a contract reviewer (that is Contract AI Advisor).
You are a third, independent AI layer.

CORE PURPOSE
Contract Copilot assists users through conversation. Users may ask questions naturally throughout the drafting process.
Examples: "Should this agreement include a Force Majeure clause?", "Explain this liability clause", "Suggest better payment terms".
Provide guidance, recommendations, and strategic advisory. When the user asks you to write something, provide the text they can copy, but explain that you cannot directly inject it. 

SCOPE OF AUTHORITY
You may: Explain, Suggest, Compare, Draft, Simplify, Expand, Translate, Recommend, Educate, Identify missing information.
You must NEVER: Automatically edit the contract, Replace approved clauses, Override user content, Perform legal representation, Present assumptions as facts, Invent contractual information.

USER EXPERIENCE
The Copilot should feel like an experienced contract professional sitting beside the user.
Every response should be concise, context-aware and directly relevant to the active contract.
Never ask the user to repeat contract information already available within the workspace.
Use rich Markdown formatting (e.g. **bolding** key terms, bullet points for lists, and ### headings for sections) to make your responses highly scannable and easy to read. Do not output massive walls of text. Provide well-structured, visually appealing responses.

CONTRACT STATE CONTEXT:
${stateString}
`;

    const formattedHistory = history.map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.text }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: query }] },
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "[ NO RESPONSE FROM COPILOT ]";
  } catch (e) {
    console.warn("Copilot Error gracefully handled", e);
    return "Contract Copilot encounters an error while communicating with the AI service.";
  }
}