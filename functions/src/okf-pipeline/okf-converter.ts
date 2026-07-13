import { GoogleGenAI } from "@google/genai";

export interface OKFDocument {
  rawContent: string; // The full YAML + Markdown content
  metadata: {
    type: string;
    companyId: string;
    tags: string[];
    related_docs: string[];
    last_updated: string;
  };
  markdownBody: string;
}

export class OKFConverter {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey });
        console.log("✅ Gemini Client Initialized for OKF Converter.");
      } catch (err) {
        console.error("❌ Failed to initialize Gemini Client for OKF Converter:", err);
      }
    } else {
      console.warn("⚠️ GEMINI_API_KEY is missing from environment. OKF Converter will operate in offline mock mode.");
    }
  }

  /**
   * Converts raw text to an OKF (YAML front-matter + Markdown) document using Gemini.
   */
  public async convertToOKF(rawText: string, fileName: string, companyId: string): Promise<OKFDocument> {
    const systemInstruction = `Bu ham metni analiz et. En üste dökümanın türünü (type: Katalog, type: Fiyat Listesi, type: Bakım Kılavuzu vb.), companyId, tags, related_docs ve last_updated bilgilerini içeren bir YAML front-matter bloğu koy. Altına ise dökümanın içeriğini temiz, hiyerarşik bir Markdown gövdesi olarak yapılandır. Çıktı sadece YAML ve Markdown birleşiminden oluşmalı, başka açıklama içermemelidir.

YAML Front-matter formatı tam olarak şu alanları içermelidir (YAML block delimiter '---' kullan):
---
type: "Döküman Türü"
companyId: "${companyId}"
tags: ["etiket1", "etiket2"]
related_docs: []
last_updated: "${new Date().toISOString()}"
---

Ardından Markdown içeriği gelmelidir.`;

    if (!this.ai) {
      console.log("⚠️ Operating in offline mock mode for OKF conversion.");
      return this.generateMockOKF(rawText, fileName, companyId);
    }

    try {
      console.log(`🤖 Sending text from ${fileName} (length: ${rawText.length}) to Gemini API...`);

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `Döküman Adı: ${fileName}\n\nHam Metin:\n${rawText}` }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.1, // Low temperature for high structure retention
        },
      });

      let content = response.text || "";
      
      // Clean up markdown block wrappers if Gemini wrapped the response
      content = this.cleanMarkdownBlockWrappers(content);

      // Parse the metadata and body
      const parsed = this.parseOKFContent(content, companyId);
      return parsed;
    } catch (error: any) {
      console.error("❌ Error in convertToOKF:", error.message);
      // Fallback to local regex-based conversion if API fails
      console.log("⚠️ Falling back to local offline converter parsing.");
      return this.generateMockOKF(rawText, fileName, companyId);
    }
  }

  /**
   * Cleans code block wrappers like ```markdown ... ``` or ```yaml ... ```
   */
  private cleanMarkdownBlockWrappers(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      // Remove starting ```markdown or ```yaml or ```
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "");
      // Remove ending ```
      cleaned = cleaned.replace(/\n```$/, "");
    }
    return cleaned.trim();
  }

  /**
   * Parses the YAML front-matter and markdown body from the raw Gemini response.
   */
  private parseOKFContent(content: string, defaultCompanyId: string): OKFDocument {
    const yamlRegex = /^---\s*([\s\S]*?)\n---\s*/;
    const match = content.match(yamlRegex);

    let type = "Bilinmeyen";
    let companyId = defaultCompanyId;
    let tags: string[] = [];
    let related_docs: string[] = [];
    let last_updated = new Date().toISOString();
    let markdownBody = content;

    if (match) {
      const yamlString = match[1];
      markdownBody = content.replace(match[0], "").trim();

      // Simple regex-based YAML parser (more lightweight than importing yaml just for 5 fields)
      const lines = yamlString.split("\n");
      for (const line of lines) {
        const parts = line.split(":");
        if (parts.length >= 2) {
          const key = parts[0].trim();
          let value = parts.slice(1).join(":").trim();

          // Strip quotes
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }

          if (key === "type") {
            type = value;
          } else if (key === "companyId") {
            companyId = value;
          } else if (key === "last_updated") {
            last_updated = value;
          } else if (key === "tags") {
            try {
              // Parse JSON-like arrays: ["a", "b"]
              tags = JSON.parse(value.replace(/'/g, '"'));
            } catch {
              tags = value.replace(/[\[\]]/g, "").split(",").map(t => t.trim()).filter(Boolean);
            }
          } else if (key === "related_docs") {
            try {
              related_docs = JSON.parse(value.replace(/'/g, '"'));
            } catch {
              related_docs = value.replace(/[\[\]]/g, "").split(",").map(t => t.trim()).filter(Boolean);
            }
          }
        }
      }
    }

    return {
      rawContent: content,
      metadata: {
        type,
        companyId,
        tags,
        related_docs,
        last_updated,
      },
      markdownBody,
    };
  }

  /**
   * Generates a mock OKF structured document (offline/error fallback).
   */
  private generateMockOKF(rawText: string, fileName: string, companyId: string): OKFDocument {
    const isPrice = /fiyat|price|list|tutar|kdv|usd|eur/i.test(fileName) || /fiyat|price|ödeme|tutar/i.test(rawText.substring(0, 1000));
    const isMaintenance = /bakım|repair|manual|kılavuz|servis|service/i.test(fileName) || /bakım|teknik|servis|motor|ariza/i.test(rawText.substring(0, 1000));
    
    let type = "Katalog";
    if (isPrice) {
      type = "Fiyat Listesi";
    } else if (isMaintenance) {
      type = "Bakım Kılavuzu";
    }

    const tags = [type.toLowerCase().replace(" ", "_"), "auto_generated", "fallback"];
    const last_updated = new Date().toISOString();

    const markdownBody = `# ${fileName.replace(/\.[^/.]+$/, "")}\n\n${rawText.trim()}`;
    const rawContent = `---
type: "${type}"
companyId: "${companyId}"
tags: ${JSON.stringify(tags)}
related_docs: []
last_updated: "${last_updated}"
---

${markdownBody}`;

    return {
      rawContent,
      metadata: {
        type,
        companyId,
        tags,
        related_docs: [],
        last_updated,
      },
      markdownBody,
    };
  }
}
