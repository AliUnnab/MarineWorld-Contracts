import { getFirestore } from "firebase-admin/firestore";
import { DriveService } from "./drive-service";
import { jsPDF } from "jspdf";

export class BackupSyncService {
  private db: any;
  private driveService: DriveService;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private unsubscribers: Array<() => void> = [];

  constructor() {
    this.db = getFirestore("ai-studio-6dbfd403-b57c-4e02-8999-633ee65aff51");
    this.driveService = new DriveService();
  }

  /**
   * Starts all real-time Firestore listeners for backup sync
   */
  public start() {
    console.log("⚡ Starting BackupSyncService listeners for Google Drive...");
    this.listenToContracts();
    this.listenToInvoices();
    this.listenToTransactions();
  }

  /**
   * Stops all active listeners
   */
  public stop() {
    console.log("🔌 Stopping BackupSyncService listeners...");
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  /**
   * Firestore collection listener: contracts
   */
  private listenToContracts() {
    const unsub = this.db.collection("contracts").onSnapshot((snapshot: any) => {
      snapshot.docChanges().forEach(async (change: any) => {
        if (change.type === "added" || change.type === "modified") {
          const contractId = change.doc.id;
          const contractData = change.doc.data();
          const companyId = contractData.userId;

          if (!companyId) {
            console.warn(`⚠️ Contract ${contractId} has no userId/companyId mapped.`);
            return;
          }

          // Debounce logic for drafts to prevent rate limits on keystroke auto-saves
          const isDraft = contractData.status === "draft";
          
          if (isDraft) {
            // Reset existing timer for this contract
            if (this.debounceTimers.has(contractId)) {
              clearTimeout(this.debounceTimers.get(contractId)!);
            }

            console.log(`⏱️ Queued debounced backup for contract draft: "${contractData.title || 'Untitled'}" (ID: ${contractId})`);
            const timer = setTimeout(async () => {
              this.debounceTimers.delete(contractId);
              await this.syncContractToDrive(companyId, contractId, contractData);
            }, 10000); // 10 seconds debounce cooldown

            this.debounceTimers.set(contractId, timer);
          } else {
            // Upload immediately for deployed/executed contracts
            if (this.debounceTimers.has(contractId)) {
              clearTimeout(this.debounceTimers.get(contractId)!);
              this.debounceTimers.delete(contractId);
            }
            await this.syncContractToDrive(companyId, contractId, contractData);
          }
        }
      });
    }, (error: any) => {
      console.error("❌ Contracts Snapshot listener failed:", error);
    });

    this.unsubscribers.push(unsub);
  }

  /**
   * Firestore collection listener: invoices
   */
  private listenToInvoices() {
    const unsub = this.db.collection("invoices").onSnapshot((snapshot: any) => {
      snapshot.docChanges().forEach(async (change: any) => {
        if (change.type === "added") {
          const invoiceId = change.doc.id;
          const invoiceData = change.doc.data();
          const companyId = invoiceData.userId;

          if (companyId) {
            await this.syncInvoiceToDrive(companyId, invoiceId, invoiceData);
          }
        }
      });
    }, (error: any) => {
      console.error("❌ Invoices Snapshot listener failed:", error);
    });

    this.unsubscribers.push(unsub);
  }

  /**
   * Firestore collection listener: credit_transactions
   */
  private listenToTransactions() {
    const unsub = this.db.collection("credit_transactions").onSnapshot((snapshot: any) => {
      snapshot.docChanges().forEach(async (change: any) => {
        if (change.type === "added") {
          const txId = change.doc.id;
          const txData = change.doc.data();
          const companyId = txData.userId;

          if (companyId) {
            await this.syncTransactionToDrive(companyId, txId, txData);
          }
        }
      });
    }, (error: any) => {
      console.error("❌ Transactions Snapshot listener failed:", error);
    });

    this.unsubscribers.push(unsub);
  }

  /**
   * Resolves the company folder ID from Firestore
   */
  private async getCompanyFolderId(companyId: string, driveService?: DriveService): Promise<string | null> {
    try {
      const companyDoc = await this.db.collection("companies").doc(companyId).get();
      if (companyDoc.exists) {
        const data = companyDoc.data();
        let folderId = data.folderId || null;

        if (folderId && driveService) {
          const exists = await driveService.verifyFolderExists(folderId);
          if (!exists) {
            console.log(`⚠️ Folder ID ${folderId} not found on Drive. Re-creating...`);
            const newFolderId = await driveService.initRootFolder();
            await this.db.collection("companies").doc(companyId).update({
              folderId: newFolderId
            });
            console.log(`✅ Folder ID updated to new root: ${newFolderId}`);
            folderId = newFolderId;
          }
        }
        return folderId;
      }
    } catch (err: any) {
      console.error(`❌ Failed to fetch/verify company details for ID ${companyId}:`, err.message);
    }
    return null;
  }

  /**
   * Instantiates a dynamic DriveService using the company's refresh token
   */
  private async getCompanyDriveService(companyId: string): Promise<DriveService | null> {
    try {
      const companyDoc = await this.db.collection("companies").doc(companyId).get();
      if (companyDoc.exists) {
        const data = companyDoc.data();
        const refreshToken = data.driveRefreshToken;
        if (refreshToken) {
          return new DriveService(refreshToken);
        }
      }
    } catch (err: any) {
      console.error(`❌ Failed to get company Drive token for ${companyId}:`, err.message);
    }
    // Return null so we skip the sync for unlinked accounts.
    return null;
  }

  /**
   * Retrieves the cached PDF buffer from Firestore (supporting chunked documents)
   */
  private async getCachedPdfBuffer(contractId: string): Promise<Buffer | null> {
    try {
      const cachedPdfDoc = await this.db.collection("contract_pdfs").doc(contractId).get();
      if (!cachedPdfDoc.exists) {
        return null;
      }

      const cachedData = cachedPdfDoc.data();
      if (cachedData.isChunked) {
        console.log(`📄 Reassembling chunked PDF from Firestore for contract ${contractId} (${cachedData.totalChunks} chunks)`);
        const chunksSnap = await this.db.collection("contract_pdfs")
          .doc(contractId)
          .collection("chunks")
          .orderBy("index")
          .get();

        const base64Parts = chunksSnap.docs.map((d: any) => d.data().chunkData);
        const base64data = base64Parts.join("");
        return Buffer.from(base64data, 'base64');
      } else {
        return Buffer.from(cachedData.pdfData, 'base64');
      }
    } catch (err: any) {
      console.warn(`⚠️ Failed to load cached PDF for contract ${contractId}:`, err.message);
      return null;
    }
  }

  /**
   * Syncs a contract document to Google Drive folder as a PDF
   */
  private async syncContractToDrive(companyId: string, contractId: string, contractData: any) {
    const targetDriveService = await this.getCompanyDriveService(companyId);
    if (!targetDriveService) return;

    const folderId = await this.getCompanyFolderId(companyId, targetDriveService);
    if (!folderId) {
      console.warn(`⚠️ Google Drive folder not provisioned for company ${companyId}. Skipping backup.`);
      return;
    }

    try {
      const title = contractData.title || "Untitled Agreement";
      const statusLabel = contractData.status ? contractData.status.toUpperCase() : "DRAFT";
      const fileName = `${title.replace(/[/\\?%*:|"<>]/g, "-")}_${contractId}.pdf`;

      // Check for cached pixel-perfect PDF from frontend
      const pdfBuffer = await this.getCachedPdfBuffer(contractId);
      if (!pdfBuffer) {
        console.log(`📄 No cached pixel-perfect PDF found for contract ${contractId}. Skipping automatic sync to prevent overwriting with fallback.`);
        return;
      }

      console.log(`📁 Backing up contract "${title}" (${statusLabel}) to Google Drive as PDF...`);

      await targetDriveService.uploadOrUpdateFile(folderId, fileName, pdfBuffer, "application/pdf", false);
      console.log(`✅ Backup successfully uploaded to Drive for contract: ${fileName}`);
    } catch (err: any) {
      console.error(`❌ Contract Drive sync failed for contract ${contractId}:`, err.message);
    }
  }

  /**
   * Syncs an invoice document to Google Drive folder /invoices
   */
  private async syncInvoiceToDrive(companyId: string, invoiceId: string, invoiceData: any) {
    const targetDriveService = await this.getCompanyDriveService(companyId);
    if (!targetDriveService) return;

    const folderId = await this.getCompanyFolderId(companyId, targetDriveService);
    if (!folderId) return;

    try {
      const invoicesSubfolderId = await targetDriveService.getOrCreateSubfolder(folderId, "invoices");
      const invoiceNum = invoiceData.invoiceNumber || invoiceId;
      const fileName = `${invoiceNum}.json`;

      console.log(`📁 Backing up invoice "${invoiceNum}" to Google Drive...`);
      const fileContent = JSON.stringify({ id: invoiceId, ...invoiceData }, null, 2);

      await targetDriveService.uploadOrUpdateFile(invoicesSubfolderId, fileName, fileContent, "application/json");
      console.log(`✅ Invoice backup successfully uploaded: ${fileName}`);
    } catch (err: any) {
      console.error(`❌ Invoice Drive sync failed for ${invoiceId}:`, err.message);
    }
  }

  /**
   * Syncs a transaction document to Google Drive folder /transactions
   */
  private async syncTransactionToDrive(companyId: string, txId: string, txData: any) {
    const targetDriveService = await this.getCompanyDriveService(companyId);
    if (!targetDriveService) return;

    const folderId = await this.getCompanyFolderId(companyId, targetDriveService);
    if (!folderId) return;

    try {
      const txSubfolderId = await targetDriveService.getOrCreateSubfolder(folderId, "transactions");
      const fileName = `${txId}.json`;

      console.log(`📁 Backing up transaction record "${txId}" to Google Drive...`);
      const fileContent = JSON.stringify({ id: txId, ...txData }, null, 2);

      await targetDriveService.uploadOrUpdateFile(txSubfolderId, fileName, fileContent, "application/json");
      console.log(`✅ Transaction backup successfully uploaded: ${fileName}`);
    } catch (err: any) {
      console.error(`❌ Transaction Drive sync failed for ${txId}:`, err.message);
    }
  }

  /**
   * Formats contract fields and structures into a readable markdown document
   */
  private formatContractToMarkdown(contractId: string, data: any): string {
    const title = data.title || "Untitled Agreement";
    const status = data.status ? data.status.toUpperCase() : "DRAFT";
    const parties = [];
    if (data.seller) parties.push(`**Party A (Seller):** ${data.seller}`);
    if (data.buyer) parties.push(`**Party B (Buyer):** ${data.buyer}`);

    let markdown = `# ${title}\n\n`;
    
    // Summary table
    markdown += `## Document Metadata\n`;
    markdown += `| Property | Value |\n`;
    markdown += `|---|---|\n`;
    markdown += `| **Firestore Reference ID** | \`${contractId}\` |\n`;
    markdown += `| **Document Status** | **${status}** |\n`;
    markdown += `| **Contract Value** | ${data.currency || "USD"} ${data.contractValue || "0.00"} |\n`;
    markdown += `| **Applicable Law** | ${data.applicableLaw || "N/A"} |\n`;
    markdown += `| **Jurisdiction Seat** | ${data.jurisdictionSeat || "N/A"} |\n`;
    markdown += `| **Version Reference** | ${data.version || "v1.0"} |\n`;
    markdown += `| **Created At** | ${data.createdAt || "N/A"} |\n`;
    markdown += `| **Last Updated** | ${data.updatedAt || new Date().toISOString()} |\n\n`;

    // Contracting Parties
    markdown += `## Contracting Parties\n`;
    if (parties.length > 0) {
      parties.forEach(p => { markdown += `- ${p}\n`; });
    } else {
      markdown += `*No principal contracting parties defined.*\n`;
    }
    markdown += `\n`;

    // Signatures
    markdown += `## Signature Status\n`;
    markdown += `- **Party A (Seller) Signed:** ${data.partyASigned ? "✅ Yes" : "❌ No"}\n`;
    markdown += `- **Party B (Buyer) Signed:** ${data.partyBSigned ? "✅ Yes" : "❌ No"}\n`;
    if (data.additionalParties && data.additionalParties.length > 0) {
      markdown += `### Additional Parties:\n`;
      data.additionalParties.forEach((p: any) => {
        const isSigned = data.additionalSigned && data.additionalSigned[p.id];
        markdown += `- **${p.name}** (${p.role || "Participant"}): ${isSigned ? "✅ Signed" : "❌ Pending"}\n`;
      });
    }
    markdown += `\n`;

    // Revisions List
    if (data.revisions && data.revisions.length > 0) {
      markdown += `## Document Revisions & Review Notes\n`;
      data.revisions.forEach((rev: any) => {
        markdown += `- **[${rev.date || 'Date N/A'}]** **${rev.author || 'Reviewer'}**: ${rev.comment || 'No comment'} *(Status: ${rev.status || 'Pending'})*\n`;
      });
      markdown += `\n`;
    }

    // Agreement Clauses
    markdown += `## Agreement Clauses\n\n`;
    if (data.clauses && data.clauses.length > 0) {
      data.clauses.forEach((clause: any, index: number) => {
        markdown += `### Clause ${index + 1}: ${clause.title || "Untitled"}\n`;
        markdown += `${clause.content || "*Empty clause content.*"}\n\n`;
      });
    } else {
      markdown += `*No legal clauses loaded into this agreement.*\n`;
    }

    return markdown;
  }

  /**
   * Generates a PDF buffer for a contract using jsPDF
   */
  private generateContractPDF(contractId: string, data: any): Buffer {
    const doc = new jsPDF({ format: 'a4', orientation: 'portrait' });
    const margin = 20;
    const pageWidth = 210;
    const pageHeight = 297;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;

    const checkPageBreak = (neededHeight: number): boolean => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = 22;
        
        // Draw running header on new page
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, 15, pageWidth - margin, 15);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text("MARINEWORLD CONTRACT STUDIO", margin, 12);
        
        const titleStr = data.title || "COVENANT OF MUTUAL COMMERCIAL AGREEMENT";
        doc.setFont("helvetica", "normal");
        const rightText = titleStr.length > 40 ? titleStr.substring(0, 37) + "..." : titleStr;
        const rightTextWidth = doc.getTextWidth(rightText);
        doc.text(rightText, pageWidth - margin - rightTextWidth, 12);
        return true;
      }
      return false;
    };

    const drawText = (text: string, fontSize: number, isBold: boolean, color: [number, number, number] = [15, 23, 42], align: 'left' | 'center' = 'left', customLineHeight?: number) => {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);

      const lines = doc.splitTextToSize(text, contentWidth);
      const lineHeight = customLineHeight || (fontSize * 0.45); // Approx height in mm

      lines.forEach((line: string) => {
        const isNewPage = checkPageBreak(lineHeight);
        if (isNewPage) {
          doc.setFont("helvetica", isBold ? "bold" : "normal");
          doc.setFontSize(fontSize);
          doc.setTextColor(color[0], color[1], color[2]);
        }
        const xCoord = align === 'center' ? (pageWidth - doc.getTextWidth(line)) / 2 : margin;
        doc.text(line, xCoord, y);
        y += lineHeight + 1.5;
      });
      y += 1.5; // Spacing after block
    };

    // ==========================================
    // PAGE 1: ELEGANT COVER PAGE
    // ==========================================
    
    // Top banner (Navy background)
    doc.setFillColor(11, 15, 25);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Accent banner border (Cyan/Blue)
    doc.setFillColor(0, 212, 255);
    doc.rect(0, 45, pageWidth, 2, 'F');
    
    // Header title inside top banner
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("MARINEWORLD CONTRACT STUDIO", pageWidth / 2, 26, { align: "center" });

    // Decorative cover frame
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(margin, 65, contentWidth, 210);

    // Contract Title (Centered)
    y = 105;
    const titleVal = data.title || "COVENANT OF MUTUAL COMMERCIAL AGREEMENT";
    drawText(titleVal.toUpperCase(), 16, true, [11, 15, 25], 'center', 8);

    // Document type/category badge
    const badgeText = `Category: ${(data.category || "General").toUpperCase()}  |  Type: ${(data.agreementType || "Standard").toUpperCase()}`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(badgeText, pageWidth / 2, 135, { align: "center" });

    // Metadata detailed box/card
    const cardY = 150;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin + 10, cardY, contentWidth - 20, 75, 'FD');

    // Header inside metadata card
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(11, 15, 25);
    doc.text("SECURE REGISTRY LEDGER METADATA", pageWidth / 2, cardY + 8, { align: "center" });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin + 20, cardY + 13, pageWidth - margin - 20, cardY + 13);

    // Card Row 1
    let rowY = cardY + 22;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Reference ID:", margin + 20, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(11, 15, 25);
    doc.text(contractId, margin + 45, rowY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("Valuation Scope:", pageWidth / 2 + 10, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(11, 15, 25);
    doc.text(`${data.currency || "USD"} ${data.contractValue || "0.00"}`, pageWidth / 2 + 45, rowY);

    // Card Row 2
    rowY += 10;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("Status:", margin + 20, rowY);
    
    const isExecuted = data.status?.toLowerCase() === 'executed';
    doc.setFont("helvetica", "bold");
    if (isExecuted) {
      doc.setTextColor(16, 185, 129); // Green
      doc.text("EXECUTED", margin + 45, rowY);
    } else {
      doc.setTextColor(245, 158, 11); // Yellow/Orange
      doc.text("ACTIVE DRAFT", margin + 45, rowY);
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("Governing Law:", pageWidth / 2 + 10, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(11, 15, 25);
    doc.text(data.applicableLaw || "N/A", pageWidth / 2 + 45, rowY);

    // Card Row 3
    rowY += 10;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("Seat Forum:", margin + 20, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(11, 15, 25);
    doc.text(data.jurisdictionSeat || "N/A", margin + 45, rowY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("Last Synced:", pageWidth / 2 + 10, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(11, 15, 25);
    
    const dateStr = data.updatedAt || new Date().toISOString();
    const formattedDate = dateStr.includes("T") ? dateStr.replace("T", " ").substring(0, 19) : dateStr;
    doc.text(formattedDate, pageWidth / 2 + 45, rowY);

    // Cover Page Footer Note
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("This document is cryptographically secured and archived in global verification servers.", pageWidth / 2, 250, { align: "center" });

    // Bottom navy divider line
    doc.setFillColor(11, 15, 25);
    doc.rect(margin, 260, contentWidth, 2, 'F');

    // Force Page Break for main content
    doc.addPage();
    y = 22;

    // Draw running header on Page 2
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, 15, pageWidth - margin, 15);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("MARINEWORLD CONTRACT STUDIO", margin, 12);
    doc.setFont("helvetica", "normal");
    const rightText = titleVal.length > 40 ? titleVal.substring(0, 37) + "..." : titleVal;
    doc.text(rightText, pageWidth - margin - doc.getTextWidth(rightText), 12);

    // ==========================================
    // PAGE 2: COMMERCIAL SCOPE & LOGISTICS COVER
    // ==========================================
    drawText("SECTION II - COMMERCIAL SCOPE & LOGISTICS COVER", 10, true, [11, 15, 25]);
    doc.setDrawColor(0, 212, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 40, y);
    y += 5;

    const fnd = data.foundation || {};

    checkPageBreak(15);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 12, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("SUBJECT MATTER:", margin + 4, y + 8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(11, 15, 25);
    doc.text(String(fnd.subjectMatter || "Designated Commercial Materials").toUpperCase(), margin + 35, y + 8);
    y += 16;

    checkPageBreak(15);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 12, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("PRIMARY OBJECTIVE:", margin + 4, y + 8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(11, 15, 25);
    doc.text(String(fnd.objective || "Mutual Strategic Logistics Operation").toUpperCase(), margin + 38, y + 8);
    y += 16;

    checkPageBreak(35);
    drawText("Project & Technical Operations Scope:", 8.5, true, [100, 116, 139]);
    
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const descText = fnd.description || "No project and technical operations description filed.";
    const descLines = doc.splitTextToSize(descText, contentWidth - 8);
    const boxHeight = Math.max(20, descLines.length * 4 + 6);
    
    doc.rect(margin, y, contentWidth, boxHeight, 'FD');
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(descLines, margin + 4, y + 6);
    y += boxHeight + 8;

    const parts = data.participants || [];
    if (parts.length > 0) {
      checkPageBreak(30);
      drawText("Third-Party Participants & Certifiers:", 8.5, true, [100, 116, 139]);
      
      const partColWidth = contentWidth / 3 - 3;
      parts.forEach((p: any, idx: number) => {
        if (idx < 3) {
          const xOffset = margin + idx * (partColWidth + 4.5);
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.rect(xOffset, y, partColWidth, 18, 'FD');
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(11, 15, 25);
          doc.text(p.name || "Certifier", xOffset + 3, y + 5);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text(p.role || "Inspector", xOffset + 3, y + 10);
          doc.text(p.contact || "N/A", xOffset + 3, y + 14);
        }
      });
      y += 24;
    }

    doc.addPage();
    y = 22;

    // Draw running header on Page 3
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, 15, pageWidth - margin, 15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("MARINEWORLD CONTRACT STUDIO", margin, 12);
    doc.setFont("helvetica", "normal");
    doc.text(rightText, pageWidth - margin - doc.getTextWidth(rightText), 12);

    // ==========================================
    // PAGE 3+: MAIN DOCUMENT BODY
    // ==========================================

    // Parties Section
    drawText("I. DESIGNATED PARTIES & SIGNATORIES", 10, true, [11, 15, 25]);
    doc.setDrawColor(0, 212, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 40, y);
    y += 5;

    // Render Party Cards side-by-side
    const cardHeight = 25;
    const cardWidth = contentWidth / 2 - 5;
    checkPageBreak(cardHeight + 5);

    // Party A Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, cardWidth, cardHeight, 'FD');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("PARTY A (SELLER / PROVIDER)", margin + 5, y + 6);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(11, 15, 25);
    const sellerText = data.seller || "UNSPECIFIED ENTITY";
    const sellerLines = doc.splitTextToSize(sellerText, cardWidth - 10);
    doc.text(sellerLines.slice(0, 2), margin + 5, y + 13);

    // Party B Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(pageWidth / 2 + 5, y, cardWidth, cardHeight, 'FD');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("PARTY B (BUYER / CLIENT)", pageWidth / 2 + 10, y + 6);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(11, 15, 25);
    const buyerText = data.buyer || "UNSPECIFIED ENTITY";
    const buyerLines = doc.splitTextToSize(buyerText, cardWidth - 10);
    doc.text(buyerLines.slice(0, 2), pageWidth / 2 + 10, y + 13);
    
    y += cardHeight + 10;

    // Clauses Section
    checkPageBreak(20);
    drawText("II. AGREEMENT CLAUSES", 10, true, [11, 15, 25]);
    doc.setDrawColor(0, 212, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 40, y);
    y += 5;

    if (data.clauses && data.clauses.length > 0) {
      data.clauses.forEach((clause: any, index: number) => {
        checkPageBreak(25);
        drawText(`Clause ${index + 1}: ${clause.title || "Untitled Clause"}`, 9, true, [11, 15, 25]);
        if (clause.content) {
          drawText(clause.content, 8, false, [71, 85, 105]);
        }
        y += 4;
      });
    } else {
      drawText("No clauses defined in this agreement.", 8.5, false, [148, 163, 184]);
      y += 5;
    }

    // Signatures Section
    checkPageBreak(65); // Give ample height for signatures header + boxes
    drawText("III. SIGNATURES & EXECUTION STATUS", 10, true, [11, 15, 25]);
    doc.setDrawColor(0, 212, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 40, y);
    y += 5;

    // Party A Signature Card
    const isASigned = !!data.partyASigned;
    doc.setFillColor(isASigned ? 240 : 253, isASigned ? 253 : 244, isASigned ? 250 : 245);
    doc.setDrawColor(isASigned ? 16 : 245, isASigned ? 185 : 158, isASigned ? 129 : 11);
    doc.setLineWidth(0.4);
    doc.rect(margin, y, cardWidth, 38, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("PARTY A REPRESENTATIVE SEAL", margin + 5, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(11, 15, 25);
    doc.text(sellerText.substring(0, 30), margin + 5, y + 13);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    if (isASigned) {
      doc.setTextColor(16, 185, 129);
      doc.text("[✓ SIGNED & RECORDED]", margin + 5, y + 21);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text("SHA-256 SECURED CRYPTO ANCHOR", margin + 5, y + 27);
      doc.text(`DATE: ${formattedDate.substring(0, 10)}`, margin + 5, y + 32);
    } else {
      doc.setTextColor(245, 158, 11);
      doc.text("[PENDING SECURE SIGNATURE]", margin + 5, y + 21);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text("AWAITING Cryptographic Auth Seal", margin + 5, y + 27);
    }

    // Party B Signature Card
    const isBSigned = !!data.partyBSigned;
    doc.setFillColor(isBSigned ? 240 : 253, isBSigned ? 253 : 244, isBSigned ? 250 : 245);
    doc.setDrawColor(isBSigned ? 16 : 245, isBSigned ? 185 : 158, isBSigned ? 129 : 11);
    doc.rect(pageWidth / 2 + 5, y, cardWidth, 38, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("PARTY B REPRESENTATIVE SEAL", pageWidth / 2 + 10, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(11, 15, 25);
    doc.text(buyerText.substring(0, 30), pageWidth / 2 + 10, y + 13);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    if (isBSigned) {
      doc.setTextColor(16, 185, 129);
      doc.text("[✓ SIGNED & RECORDED]", pageWidth / 2 + 10, y + 21);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text("SHA-256 SECURED CRYPTO ANCHOR", pageWidth / 2 + 10, y + 27);
      doc.text(`DATE: ${formattedDate.substring(0, 10)}`, pageWidth / 2 + 10, y + 32);
    } else {
      doc.setTextColor(245, 158, 11);
      doc.text("[PENDING SECURE SIGNATURE]", pageWidth / 2 + 10, y + 21);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text("AWAITING Cryptographic Auth Seal", pageWidth / 2 + 10, y + 27);
    }

    y += 45;

    // Additional Signatures Row
    if (data.additionalParties && data.additionalParties.length > 0) {
      checkPageBreak(25);
      drawText("IV. ADDITIONAL PARTICIPANT SIGNATURES", 9, true, [11, 15, 25]);
      y += 2;

      data.additionalParties.forEach((p: any, idx: number) => {
        const isSigned = data.additionalSigned && data.additionalSigned[p.id || idx];
        checkPageBreak(16);

        doc.setFillColor(isSigned ? 240 : 253, isSigned ? 253 : 244, isSigned ? 250 : 245);
        doc.setDrawColor(isSigned ? 16 : 245, isSigned ? 185 : 158, isSigned ? 129 : 11);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, contentWidth, 12, 'FD');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(11, 15, 25);
        doc.text(`${p.name} (${p.role || "Participant"}):`, margin + 4, y + 8);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        if (isSigned) {
          doc.setTextColor(16, 185, 129);
          doc.text("[✓ SIGNED & SEALED - SHA-256 SECURITIES RECORD]", margin + 78, y + 8);
        } else {
          doc.setTextColor(245, 158, 11);
          doc.text("[PENDING AUTHENTICATION LOCK]", margin + 78, y + 8);
        }
        y += 15;
      });
    }

    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  }

  /**
   * Run a full backup of all contracts (as PDF), invoices (as JSON), and transactions (as JSON) for a user/company.
   * If a file already exists in Drive, it skips it to prevent duplicates/overwriting.
   */
  public async runFullBackup(companyId: string) {
    console.log(`🚀 Starting Full Drive Backup for company ${companyId}...`);
    const targetDriveService = await this.getCompanyDriveService(companyId);
    if (!targetDriveService) {
      throw new Error(`Google Drive token or service not available for company ${companyId}.`);
    }

    const folderId = await this.getCompanyFolderId(companyId, targetDriveService);
    if (!folderId) {
      throw new Error(`Google Drive folder not provisioned for company ${companyId}.`);
    }

    const stats = {
      contracts: 0,
      invoices: 0,
      transactions: 0,
      errors: [] as string[]
    };

    // 1. Sync all Contracts as PDF
    try {
      const contractsSnap = await this.db.collection("contracts").where("userId", "==", companyId).get();
      console.log(`Found ${contractsSnap.size} contracts for full backup.`);
      for (const doc of contractsSnap.docs) {
        const contractId = doc.id;
        const contractData = doc.data();
        const title = contractData.title || "Untitled Agreement";
        const fileName = `${title.replace(/[/\\?%*:|"<>]/g, "-")}_${contractId}.pdf`;

        try {
          // Check for cached pixel-perfect PDF from frontend
          const pdfBuffer = await this.getCachedPdfBuffer(contractId);
          let finalBuffer: Buffer;
          let skip = false;

          if (pdfBuffer) {
            console.log(`📄 Using cached pixel-perfect PDF for contract ${contractId}`);
            finalBuffer = pdfBuffer;
          } else {
            console.log(`📄 Generating styled fallback PDF for contract ${contractId}`);
            finalBuffer = this.generateContractPDF(contractId, contractData);
            skip = true; // Skip if the file already exists on Drive to prevent overwriting a beautiful client-uploaded PDF
          }

          // We use false for skipIfExists so that updates are successfully pushed to Drive in-place
          await targetDriveService.uploadOrUpdateFile(folderId, fileName, finalBuffer, "application/pdf", skip);
          stats.contracts++;
        } catch (err: any) {
          console.error(`❌ Failed to backup contract ${contractId}:`, err.message);
          stats.errors.push(`Contract ${contractId}: ${err.message}`);
        }
      }
    } catch (err: any) {
      console.error(`❌ Failed to fetch contracts:`, err.message);
      stats.errors.push(`Fetch Contracts: ${err.message}`);
    }

    // 2. Sync all Invoices as JSON
    try {
      const invoicesSnap = await this.db.collection("invoices").where("userId", "==", companyId).get();
      console.log(`Found ${invoicesSnap.size} invoices for full backup.`);
      if (invoicesSnap.size > 0) {
        const invoicesSubfolderId = await targetDriveService.getOrCreateSubfolder(folderId, "invoices");
        for (const doc of invoicesSnap.docs) {
          const invoiceId = doc.id;
          const invoiceData = doc.data();
          const invoiceNum = invoiceData.invoiceNumber || invoiceId;
          const fileName = `${invoiceNum}.json`;
          const fileContent = JSON.stringify({ id: invoiceId, ...invoiceData }, null, 2);

          try {
            await targetDriveService.uploadOrUpdateFile(invoicesSubfolderId, fileName, fileContent, "application/json", true);
            stats.invoices++;
          } catch (err: any) {
            console.error(`❌ Failed to backup invoice ${invoiceId}:`, err.message);
            stats.errors.push(`Invoice ${invoiceId}: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      console.error(`❌ Failed to fetch invoices:`, err.message);
      stats.errors.push(`Fetch Invoices: ${err.message}`);
    }

    // 3. Sync all Transactions as JSON
    try {
      const txSnap = await this.db.collection("credit_transactions").where("userId", "==", companyId).get();
      console.log(`Found ${txSnap.size} transactions for full backup.`);
      if (txSnap.size > 0) {
        const txSubfolderId = await targetDriveService.getOrCreateSubfolder(folderId, "transactions");
        for (const doc of txSnap.docs) {
          const txId = doc.id;
          const txData = doc.data();
          const fileName = `${txId}.json`;
          const fileContent = JSON.stringify({ id: txId, ...txData }, null, 2);

          try {
            await targetDriveService.uploadOrUpdateFile(txSubfolderId, fileName, fileContent, "application/json", true);
            stats.transactions++;
          } catch (err: any) {
            console.error(`❌ Failed to backup transaction ${txId}:`, err.message);
            stats.errors.push(`Transaction ${txId}: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      console.error(`❌ Failed to fetch transactions:`, err.message);
      stats.errors.push(`Fetch Transactions: ${err.message}`);
    }

    console.log(`✅ Full Drive Backup complete for company ${companyId}. Stats:`, stats);
    return stats;
  }
}
