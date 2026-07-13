"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupSyncService = void 0;
const firestore_1 = require("firebase-admin/firestore");
const drive_service_1 = require("./drive-service");
class BackupSyncService {
    db;
    driveService;
    debounceTimers = new Map();
    unsubscribers = [];
    constructor() {
        this.db = (0, firestore_1.getFirestore)("ai-studio-6dbfd403-b57c-4e02-8999-633ee65aff51");
        this.driveService = new drive_service_1.DriveService();
    }
    /**
     * Starts all real-time Firestore listeners for backup sync
     */
    start() {
        console.log("⚡ Starting BackupSyncService listeners for Google Drive...");
        this.listenToContracts();
        this.listenToInvoices();
        this.listenToTransactions();
    }
    /**
     * Stops all active listeners
     */
    stop() {
        console.log("🔌 Stopping BackupSyncService listeners...");
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
    }
    /**
     * Firestore collection listener: contracts
     */
    listenToContracts() {
        const unsub = this.db.collection("contracts").onSnapshot((snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
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
                            clearTimeout(this.debounceTimers.get(contractId));
                        }
                        console.log(`⏱️ Queued debounced backup for contract draft: "${contractData.title || 'Untitled'}" (ID: ${contractId})`);
                        const timer = setTimeout(async () => {
                            this.debounceTimers.delete(contractId);
                            await this.syncContractToDrive(companyId, contractId, contractData);
                        }, 10000); // 10 seconds debounce cooldown
                        this.debounceTimers.set(contractId, timer);
                    }
                    else {
                        // Upload immediately for deployed/executed contracts
                        if (this.debounceTimers.has(contractId)) {
                            clearTimeout(this.debounceTimers.get(contractId));
                            this.debounceTimers.delete(contractId);
                        }
                        await this.syncContractToDrive(companyId, contractId, contractData);
                    }
                }
            });
        }, (error) => {
            console.error("❌ Contracts Snapshot listener failed:", error);
        });
        this.unsubscribers.push(unsub);
    }
    /**
     * Firestore collection listener: invoices
     */
    listenToInvoices() {
        const unsub = this.db.collection("invoices").onSnapshot((snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === "added") {
                    const invoiceId = change.doc.id;
                    const invoiceData = change.doc.data();
                    const companyId = invoiceData.userId;
                    if (companyId) {
                        await this.syncInvoiceToDrive(companyId, invoiceId, invoiceData);
                    }
                }
            });
        }, (error) => {
            console.error("❌ Invoices Snapshot listener failed:", error);
        });
        this.unsubscribers.push(unsub);
    }
    /**
     * Firestore collection listener: credit_transactions
     */
    listenToTransactions() {
        const unsub = this.db.collection("credit_transactions").onSnapshot((snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === "added") {
                    const txId = change.doc.id;
                    const txData = change.doc.data();
                    const companyId = txData.userId;
                    if (companyId) {
                        await this.syncTransactionToDrive(companyId, txId, txData);
                    }
                }
            });
        }, (error) => {
            console.error("❌ Transactions Snapshot listener failed:", error);
        });
        this.unsubscribers.push(unsub);
    }
    /**
     * Resolves the company folder ID from Firestore
     */
    async getCompanyFolderId(companyId) {
        try {
            const companyDoc = await this.db.collection("companies").doc(companyId).get();
            if (companyDoc.exists) {
                return companyDoc.data().folderId || null;
            }
        }
        catch (err) {
            console.error(`❌ Failed to fetch company details for ID ${companyId}:`, err.message);
        }
        return null;
    }
    /**
     * Instantiates a dynamic DriveService using the company's refresh token
     */
    async getCompanyDriveService(companyId) {
        try {
            const companyDoc = await this.db.collection("companies").doc(companyId).get();
            if (companyDoc.exists) {
                const data = companyDoc.data();
                const refreshToken = data.driveRefreshToken;
                if (refreshToken) {
                    return new drive_service_1.DriveService(refreshToken);
                }
            }
        }
        catch (err) {
            console.error(`❌ Failed to get company Drive token for ${companyId}:`, err.message);
        }
        // Do not fall back to Service Account since Service Accounts do not have storage quota.
        // Return null so we skip the sync for unlinked accounts.
        return null;
    }
    /**
     * Syncs a contract document to Google Drive folder
     */
    async syncContractToDrive(companyId, contractId, contractData) {
        const folderId = await this.getCompanyFolderId(companyId);
        if (!folderId) {
            console.warn(`⚠️ Google Drive folder not provisioned for company ${companyId}. Skipping backup.`);
            return;
        }
        try {
            const title = contractData.title || "Untitled Agreement";
            const statusLabel = contractData.status ? contractData.status.toUpperCase() : "DRAFT";
            const fileName = `${title.replace(/[/\\?%*:|"<>]/g, "-")}.md`;
            console.log(`📁 Backing up contract "${title}" (${statusLabel}) to Google Drive...`);
            const fileContent = this.formatContractToMarkdown(contractId, contractData);
            const targetDriveService = await this.getCompanyDriveService(companyId);
            if (!targetDriveService)
                return;
            await targetDriveService.uploadOrUpdateFile(folderId, fileName, fileContent, "text/markdown");
            console.log(`✅ Backup successfully uploaded to Drive for contract: ${fileName}`);
        }
        catch (err) {
            console.error(`❌ Contract Drive sync failed for contract ${contractId}:`, err.message);
        }
    }
    /**
     * Syncs an invoice document to Google Drive folder /invoices
     */
    async syncInvoiceToDrive(companyId, invoiceId, invoiceData) {
        const folderId = await this.getCompanyFolderId(companyId);
        if (!folderId)
            return;
        try {
            const targetDriveService = await this.getCompanyDriveService(companyId);
            if (!targetDriveService)
                return;
            const invoicesSubfolderId = await targetDriveService.getOrCreateSubfolder(folderId, "invoices");
            const invoiceNum = invoiceData.invoiceNumber || invoiceId;
            const fileName = `${invoiceNum}.json`;
            console.log(`📁 Backing up invoice "${invoiceNum}" to Google Drive...`);
            const fileContent = JSON.stringify({ id: invoiceId, ...invoiceData }, null, 2);
            await targetDriveService.uploadOrUpdateFile(invoicesSubfolderId, fileName, fileContent, "application/json");
            console.log(`✅ Invoice backup successfully uploaded: ${fileName}`);
        }
        catch (err) {
            console.error(`❌ Invoice Drive sync failed for ${invoiceId}:`, err.message);
        }
    }
    /**
     * Syncs a transaction document to Google Drive folder /transactions
     */
    async syncTransactionToDrive(companyId, txId, txData) {
        const folderId = await this.getCompanyFolderId(companyId);
        if (!folderId)
            return;
        try {
            const targetDriveService = await this.getCompanyDriveService(companyId);
            if (!targetDriveService)
                return;
            const txSubfolderId = await targetDriveService.getOrCreateSubfolder(folderId, "transactions");
            const fileName = `${txId}.json`;
            console.log(`📁 Backing up transaction record "${txId}" to Google Drive...`);
            const fileContent = JSON.stringify({ id: txId, ...txData }, null, 2);
            await targetDriveService.uploadOrUpdateFile(txSubfolderId, fileName, fileContent, "application/json");
            console.log(`✅ Transaction backup successfully uploaded: ${fileName}`);
        }
        catch (err) {
            console.error(`❌ Transaction Drive sync failed for ${txId}:`, err.message);
        }
    }
    /**
     * Formats contract fields and structures into a readable markdown document
     */
    formatContractToMarkdown(contractId, data) {
        const title = data.title || "Untitled Agreement";
        const status = data.status ? data.status.toUpperCase() : "DRAFT";
        const parties = [];
        if (data.seller)
            parties.push(`**Party A (Seller):** ${data.seller}`);
        if (data.buyer)
            parties.push(`**Party B (Buyer):** ${data.buyer}`);
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
        }
        else {
            markdown += `*No principal contracting parties defined.*\n`;
        }
        markdown += `\n`;
        // Signatures
        markdown += `## Signature Status\n`;
        markdown += `- **Party A (Seller) Signed:** ${data.partyASigned ? "✅ Yes" : "❌ No"}\n`;
        markdown += `- **Party B (Buyer) Signed:** ${data.partyBSigned ? "✅ Yes" : "❌ No"}\n`;
        if (data.additionalParties && data.additionalParties.length > 0) {
            markdown += `### Additional Parties:\n`;
            data.additionalParties.forEach((p) => {
                const isSigned = data.additionalSigned && data.additionalSigned[p.id];
                markdown += `- **${p.name}** (${p.role || "Participant"}): ${isSigned ? "✅ Signed" : "❌ Pending"}\n`;
            });
        }
        markdown += `\n`;
        // Revisions List
        if (data.revisions && data.revisions.length > 0) {
            markdown += `## Document Revisions & Review Notes\n`;
            data.revisions.forEach((rev) => {
                markdown += `- **[${rev.date || 'Date N/A'}]** **${rev.author || 'Reviewer'}**: ${rev.comment || 'No comment'} *(Status: ${rev.status || 'Pending'})*\n`;
            });
            markdown += `\n`;
        }
        // Agreement Clauses
        markdown += `## Agreement Clauses\n\n`;
        if (data.clauses && data.clauses.length > 0) {
            data.clauses.forEach((clause, index) => {
                markdown += `### Clause ${index + 1}: ${clause.title || "Untitled"}\n`;
                markdown += `${clause.content || "*Empty clause content.*"}\n\n`;
            });
        }
        else {
            markdown += `*No legal clauses loaded into this agreement.*\n`;
        }
        return markdown;
    }
}
exports.BackupSyncService = BackupSyncService;
//# sourceMappingURL=sync-service.js.map