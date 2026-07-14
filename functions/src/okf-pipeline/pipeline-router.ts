import { Router, Request, Response } from "express";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";
import os from "os";
import { google } from "googleapis";

// Import local pipeline services
import { DriveService } from "./drive-service";
import { ParserService } from "./parser-service";
import { OKFConverter } from "./okf-converter";
import { GitHubService } from "./github-service";
import { VectorService } from "./vector-service";
import { AgentService } from "./agent-service";

const router = Router();

// Lazy instantiations of core pipeline services to prevent load-time initialization side-effects
let _driveService: DriveService | null = null;
const getDriveService = () => _driveService || (_driveService = new DriveService());

let _parserService: ParserService | null = null;
const getParserService = () => _parserService || (_parserService = new ParserService());

let _okfConverter: OKFConverter | null = null;
const getOkfConverter = () => _okfConverter || (_okfConverter = new OKFConverter());

let _githubService: GitHubService | null = null;
const getGithubService = () => _githubService || (_githubService = new GitHubService());

let _vectorService: VectorService | null = null;
const getVectorService = () => _vectorService || (_vectorService = new VectorService());

let _agentService: AgentService | null = null;
const getAgentService = () => _agentService || (_agentService = new AgentService());

// Temp directory for file downloads
const TMP_DIR = path.resolve(os.tmpdir(), "marineworld-tmp");
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

const checkOAuthCredentials = (): { clientId: string; clientSecret: string } => {
  const clientId = process.env.DRIVE_CLIENT_ID;
  const clientSecret = process.env.DRIVE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("❌ Google OAuth2 credentials missing from environment (DRIVE_CLIENT_ID or DRIVE_CLIENT_SECRET)!");
    throw new Error("Google OAuth2 Client Credentials are not configured in environment variables.");
  }

  return { clientId, clientSecret };
};

const getRedirectUri = (req: Request): string => {
  if (process.env.DRIVE_REDIRECT_URI) {
    return process.env.DRIVE_REDIRECT_URI;
  }

  const host = req.get("host") || "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

  if (!isLocalhost) {
    // In production, force the exact callback URL configured in Google Cloud Console
    return "https://marineworld-contracts.web.app/api/auth/google/callback";
  }

  const protocol = req.protocol === "https" ? "https" : "http";
  return `${protocol}://${host}/api/auth/google/callback`;
};


/**
 * OAuth2 Step 1: Redirect user to Google Authorization Consent Screen
 * GET /api/auth/google
 * Query params: companyId (the Firebase user uid)
 */
router.get("/auth/google", (req: Request, res: Response) => {
  const companyId = req.query.companyId as string;
  if (!companyId) {
    return res.status(400).send("Missing companyId parameter.");
  }

  try {
    const { clientId, clientSecret } = checkOAuthCredentials();
    const redirectUri = getRedirectUri(req);
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/drive"],
      prompt: "consent",
      state: companyId, // Pass companyId in state
    });

    return res.redirect(authUrl);
  } catch (error: any) {
    return res.status(500).send(error.message);
  }
});

/**
 * OAuth2 Step 2: Handle Google Redirect callback, exchange code, and provision Drive workspace
 * GET /api/auth/google/callback
 */
router.get("/auth/google/callback", async (req: Request, res: Response): Promise<any> => {
  const code = req.query.code as string;
  const companyId = req.query.state as string;

  if (!code || !companyId) {
    return res.status(400).send("Missing code or state callback parameters.");
  }

  try {
    const { clientId, clientSecret } = checkOAuthCredentials();
    const redirectUri = getRedirectUri(req);
    
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    
    const refreshToken = tokens.refresh_token;
    if (!refreshToken) {
      console.warn("⚠️ Google OAuth did not return a refresh token.");
    }

    const db = getFirestore("ai-studio-6dbfd403-b57c-4e02-8999-633ee65aff51");
    const companyRef = db.collection("companies").doc(companyId);

    // Save refresh token to Firestore
    const updateData: any = {};
    if (refreshToken) {
      updateData.driveRefreshToken = refreshToken;
    }

    // Provision user's own root workspace folder using their refresh token
    const companySnap = await companyRef.get();
    const tokenToUse = refreshToken || companySnap.data()?.driveRefreshToken;
    if (!tokenToUse) {
      throw new Error("No refresh token available to provision folders.");
    }

    const userDriveService = new DriveService(tokenToUse);
    const rootFolderId = await userDriveService.initRootFolder(); // creates "MarineWorld_Workspace"

    // Set up Drive push watch on their new folder
    const watchData = await userDriveService.setupDriveWatch(rootFolderId, companyId);

    let companyName = "Corporate Workspace";
    if (companySnap.exists) {
      companyName = companySnap.data()?.name || companyName;
    } else {
      const userSnap = await db.collection("users").doc(companyId).get();
      companyName = userSnap.exists ? (userSnap.data()?.companyName || companyName) : companyName;
    }

    const slug = companyName.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");

    await companyRef.set({
      id: companyId,
      companySlug: slug,
      subdomain: slug,
      merchantId: companyId,
      name: companyName,
      folderId: rootFolderId,
      driveWatchChannelId: watchData.channelId,
      driveWatchResourceId: watchData.resourceId,
      driveWatchExpiration: watchData.expiration,
      updatedAt: new Date().toISOString(),
      ...updateData
    }, { merge: true });

    console.log(`✅ Multi-Tenant OAuth Drive configured successfully for ${companyName}. Folder ID: ${rootFolderId}`);
    
    return res.redirect("/settings?drive_connected=true");
  } catch (error: any) {
    console.error("❌ OAuth callback provisioning error:", error);
    return res.status(500).send(`OAuth Configuration Failed: ${error.message}`);
  }
});

/**
 * ADIM 1: Şirket Kayıt ve Klasör İzolasyonu (Firebase & Drive)
 * POST /api/companies/register
 * Body: { companyId: string, companyName: string }
 */
router.post("/companies/register", async (req: Request, res: Response): Promise<any> => {
  const { companyId, companyName } = req.body;

  if (!companyId || !companyName) {
    return res.status(400).json({ error: "Missing companyId or companyName in request body." });
  }

  try {
    const db = getFirestore("ai-studio-6dbfd403-b57c-4e02-8999-633ee65aff51");
    console.log(`🏢 Registering company workspace: ${companyName} (${companyId})`);

    // 1. Create company folder in Google Drive under root folder
    const folderId = await getDriveService().createCompanyFolder(companyId, companyName);

    // 2. Set up Drive push notification watch on the new folder
    const watchData = await getDriveService().setupDriveWatch(folderId, companyId);

    // 3. Save details to Firestore companies collection
    const companyRef = db.collection("companies").doc(companyId);
    const slug = companyName.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");
    
    await companyRef.set(
      {
        id: companyId,
        companySlug: slug,
        subdomain: slug, // Matches subdomain tenant resolver
        merchantId: companyId, // Matches subscription resolver
        name: companyName,
        folderId: folderId,
        driveWatchChannelId: watchData.channelId,
        driveWatchResourceId: watchData.resourceId,
        driveWatchExpiration: watchData.expiration,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(`✅ Registration completed successfully for ${companyName}. Folder ID: ${folderId}`);
    return res.json({
      success: true,
      message: "Company folder created and workspace metadata saved in Firestore.",
      companyId,
      folderId,
      watch: watchData,
    });
  } catch (error: any) {
    console.error("❌ Registration Pipeline Error:", error);
    return res.status(500).json({ error: `Registration Failed: ${error.message}` });
  }
});

/**
 * ADIM 2 & 3 & 4 & 5: Google Drive Push Notification Webhook
 * POST /api/drive-webhook
 * Headers containing: x-goog-resource-state, x-goog-channel-token, etc.
 */
router.post("/drive-webhook", async (req: Request, res: Response): Promise<any> => {
  const state = req.headers["x-goog-resource-state"] as string;
  const token = req.headers["x-goog-channel-token"] as string; // Contains metadata e.g. companyId=XYZ
  const channelId = req.headers["x-goog-channel-id"] as string;
  const resourceId = req.headers["x-goog-resource-id"] as string;

  console.log(`🔔 Received Drive Webhook notification. State: ${state}, Channel ID: ${channelId}`);

  // 1. Google Sends a 'sync' notification when a watch is created. Just acknowledge it.
  if (state === "sync") {
    console.log("🔔 Acknowledged sync notification from Google Drive.");
    return res.status(200).send("Sync acknowledged");
  }

  // 2. Respond immediately to Google to prevent timeout/retries
  res.status(200).send("Event received");

  // 3. Process changes asynchronously
  if (state === "update" || state === "add") {
    // Parse company ID from token
    let companyId = "";
    if (token && token.includes("companyId=")) {
      companyId = token.split("companyId=")[1];
    }

    if (!companyId) {
      console.warn("⚠️ Received Drive Webhook without valid companyId token.");
      return;
    }

    try {
      const db = getFirestore("ai-studio-6dbfd403-b57c-4e02-8999-633ee65aff51");
      const companyDoc = await db.collection("companies").doc(companyId).get();
      if (!companyDoc.exists) {
        console.warn(`⚠️ Company with ID ${companyId} does not exist in Firestore.`);
        return;
      }
      const companyData = companyDoc.data()!;
      const folderId = companyData.folderId;

      if (!folderId) {
        console.warn(`⚠️ Company folderId missing in Firestore for company ${companyId}`);
        return;
      }

      console.log(`🔄 Triggering asynchronous pipeline for company: ${companyData.name} (${companyId})`);
      
      // Execute the processing pipeline
      await runProcessingPipeline(companyId, folderId);
    } catch (err: any) {
      console.error("❌ Webhook async task handler failed:", err.message);
    }
  }
});

/**
 * Triggers a full backup of all contracts, invoices, and transactions to Google Drive.
 * POST /api/backup/drive
 * Body: { companyId: string }
 */
router.post("/backup/drive", async (req: Request, res: Response): Promise<any> => {
  const { companyId } = req.body;

  if (!companyId) {
    return res.status(400).json({ error: "Missing companyId in request body." });
  }

  try {
    const { BackupSyncService } = await import("./sync-service");
    const syncService = new BackupSyncService();
    const stats = await syncService.runFullBackup(companyId);

    return res.json({
      success: true,
      message: "Backup completed successfully.",
      stats,
    });
  } catch (error: any) {
    console.error("❌ Full Drive Backup Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Uploads a client-generated PDF file directly to Google Drive.
 * POST /api/backup/upload-pdf
 * Body: { companyId: string, fileName: string, fileData: string (base64) }
 */
router.post("/backup/upload-pdf", async (req: Request, res: Response): Promise<any> => {
  const { companyId, fileName, fileData } = req.body;

  if (!companyId || !fileName || !fileData) {
    return res.status(400).json({ error: "Missing companyId, fileName, or fileData in request body." });
  }

  try {
    const buffer = Buffer.from(fileData, 'base64');
    const db = getFirestore("ai-studio-6dbfd403-b57c-4e02-8999-633ee65aff51");
    
    // Get folderId
    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (!companyDoc.exists) {
      return res.status(404).json({ error: "Company details not found." });
    }
    const folderId = companyDoc.data()?.folderId;
    if (!folderId) {
      return res.status(400).json({ error: "Google Drive folder not provisioned." });
    }

    // Get DriveService
    const refreshToken = companyDoc.data()?.driveRefreshToken;
    if (!refreshToken) {
      return res.status(400).json({ error: "Google Drive not connected." });
    }
    const targetDriveService = new DriveService(refreshToken);

    // Upload/Update file (overwrite since this is direct user save/sign)
    const fileId = await targetDriveService.uploadOrUpdateFile(folderId, fileName, buffer, "application/pdf", false);

    return res.json({
      success: true,
      message: "PDF uploaded successfully.",
      fileId
    });
  } catch (error: any) {
    console.error("❌ PDF Upload to Drive Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * LOCAL TESTING: Trigger the processing pipeline manually
 * POST /api/test/trigger-webhook
 * Body: { companyId: string, fileId?: string }
 */
router.post("/test/trigger-webhook", async (req: Request, res: Response): Promise<any> => {
  const { companyId, fileId } = req.body;

  if (!companyId) {
    return res.status(400).json({ error: "Missing companyId in request body." });
  }

  try {
    const db = getFirestore("ai-studio-6dbfd403-b57c-4e02-8999-633ee65aff51");
    const companyDoc = await db.collection("companies").doc(companyId).get();
    
    if (!companyDoc.exists) {
      return res.status(404).json({ error: `Company with ID ${companyId} not found in Firestore.` });
    }

    const companyData = companyDoc.data()!;
    const folderId = companyData.folderId;

    if (!folderId) {
      return res.status(400).json({ error: `No Drive folder mapped for company ID ${companyId}` });
    }

    console.log(`🧪 Running Manual Pipeline Verification for ${companyData.name}`);
    const results = await runProcessingPipeline(companyId, folderId, fileId);

    return res.json({
      success: true,
      message: "Pipeline completed successfully.",
      results,
    });
  } catch (error: any) {
    console.error("❌ Manual Trigger Pipeline Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * ADIM 6: AI Ajan Filtreleme Katmanı
 * POST /api/agent/query
 * Body: { role: 'sales' | 'technical', companyId: string, query: string, limit?: number }
 */
router.post("/agent/query", async (req: Request, res: Response): Promise<any> => {
  const { role, companyId, query, limit } = req.body;

  if (!role || !companyId || !query) {
    return res.status(400).json({ error: "Missing role, companyId, or query in request body." });
  }

  if (role !== "sales" && role !== "technical") {
    return res.status(400).json({ error: "Role must be either 'sales' or 'technical'." });
  }

  try {
    const results = await getAgentService().queryByAgentRole(
      role,
      companyId,
      query,
      limit ? parseInt(limit.toString()) : 5
    );

    return res.json({
      success: true,
      role,
      companyId,
      results,
    });
  } catch (error: any) {
    console.error(`❌ Agent Search Error (${role}):`, error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Runs the E2E OKF Processing Pipeline.
 * 1. Resolves the latest file (or specific fileId) in the folder.
 * 2. Downloads the file to the local tmp/ folder.
 * 3. Extracts raw text.
 * 4. Transforms text to OKF via Gemini.
 * 5. Commits OKF markdown to GitHub.
 * 6. Vector indexes chunks in Firestore.
 */
async function runProcessingPipeline(companyId: string, folderId: string, specificFileId?: string) {
  const db = getFirestore("ai-studio-6dbfd403-b57c-4e02-8999-633ee65aff51");
  const companyDoc = await db.collection("companies").doc(companyId).get();
  
  let companyDriveService = getDriveService(); // Default fallback to service account
  if (companyDoc.exists) {
    const refreshToken = companyDoc.data()?.driveRefreshToken;
    if (refreshToken) {
      companyDriveService = new DriveService(refreshToken);
    }
  }

  const drive = (companyDriveService as any).drive;
  if (!drive) {
    throw new Error("Dynamic Drive client could not be initialized.");
  }

  let targetFileId = specificFileId;
  let targetFileName = "";
  let targetMimeType = "";

  // 1. Resolve file info
  if (!targetFileId) {
    console.log(`🔍 Querying latest files in Drive Folder ${folderId}...`);
    // Query Google Drive for the most recently updated file inside the folder
    const listRes = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      orderBy: "modifiedTime desc",
      pageSize: 1,
      fields: "files(id, name, mimeType)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = listRes.data.files;
    if (!files || files.length === 0) {
      console.log("ℹ️ No files found in folder to process.");
      return { status: "no_files" };
    }

    targetFileId = files[0].id!;
    targetFileName = files[0].name!;
    targetMimeType = files[0].mimeType!;
  } else {
    // Fetch info of the specific file
    const fileDetails = await companyDriveService.getFileDetails(targetFileId);
    targetFileName = fileDetails.name;
    targetMimeType = fileDetails.mimeType;
  }

  console.log(`📂 Processing file: "${targetFileName}" (MIME: ${targetMimeType}, ID: ${targetFileId})`);

  // 2. Download File
  const fileExtension = path.extname(targetFileName) || getExtensionFromMime(targetMimeType);
  const localFileName = `${targetFileId}${fileExtension}`;
  const localFilePath = path.join(TMP_DIR, localFileName);

  try {
    await companyDriveService.downloadFile(targetFileId!, localFilePath);

    // 3. Extract Text Content
    console.log("📄 Extracting text contents...");
    const rawText = await getParserService().parseFile(localFilePath, targetMimeType);
    console.log(`📄 Extracted ${rawText.length} characters of raw text.`);

    // 4. Translate raw text to OKF using Gemini
    console.log("🤖 Converting text to OKF document structure...");
    const okfDoc = await getOkfConverter().convertToOKF(rawText, targetFileName, companyId);
    console.log(`🤖 Conversion completed. Document Type: ${okfDoc.metadata.type}`);

    // 5. Version document to GitHub
    console.log("🚀 Committing OKF document to GitHub repository...");
    const gitResult = await getGithubService().commitOKFDocument(
      companyId,
      targetFileName,
      okfDoc.rawContent,
      `[OKF Sync] Auto-update corporate file: ${targetFileName} (Type: ${okfDoc.metadata.type})`
    );

    // 6. Vector Index the markdown content
    console.log("🗂️ Ingesting document chunks into Firestore Vector Index...");
    const chunkCount = await getVectorService().indexDocument(
      companyId,
      targetFileName,
      okfDoc.metadata.type,
      okfDoc.markdownBody,
      okfDoc.metadata.tags,
      okfDoc.metadata.last_updated
    );

    return {
      status: "completed",
      fileName: targetFileName,
      type: okfDoc.metadata.type,
      githubUrl: gitResult.htmlUrl,
      chunksIndexed: chunkCount,
    };
  } finally {
    // Cleanup temporary local files
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
        console.log(`🧹 Cleaned up local file: ${localFilePath}`);
      } catch (err) {
        console.warn("⚠️ Local temp cleanup warn:", err);
      }
    }
  }
}

/**
 * Returns folder suffix helper from mime types.
 */
function getExtensionFromMime(mimeType: string): string {
  switch (mimeType) {
    case "application/pdf": return ".pdf";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": return ".docx";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": return ".xlsx";
    case "text/plain": return ".txt";
    case "text/csv": return ".csv";
    case "text/markdown": return ".md";
    default: return ".tmp";
  }
}

export default router;
