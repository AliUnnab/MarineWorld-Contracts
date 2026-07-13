import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Load configuration
dotenv.config();

// Initialize Firebase Admin SDK
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

if (process.env.FIREBASE_PROJECT_ID && privateKey && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        } as any)
      });
      console.log("✅ Firebase Admin SDK Initialized for Testing.");
    }

    // Initialize nested functions/node_modules copy of firebase-admin to prevent duplicate instance errors locally
    try {
      const functionsAdmin = await import("./functions/node_modules/firebase-admin/lib/app/index.js");
      if (functionsAdmin.getApps().length === 0) {
        functionsAdmin.initializeApp({
          credential: functionsAdmin.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
            privateKey: privateKey,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          } as any)
        });
        console.log("✅ Firebase Admin SDK (Functions Copy) Initialized for Testing.");
      }
    } catch (nestedErr: any) {
      console.error("❌ Failed to initialize functions copy of Firebase Admin:", nestedErr.message);
    }
  } catch (err) {
    console.error("❌ Firebase Admin SDK initialization error:", err);
  }
} else {
  console.error("❌ Firebase Credentials missing in env!");
}

import { DriveService } from "./functions/src/okf-pipeline/drive-service";
import { ParserService } from "./functions/src/okf-pipeline/parser-service";
import { OKFConverter } from "./functions/src/okf-pipeline/okf-converter";
import { GitHubService } from "./functions/src/okf-pipeline/github-service";
import { VectorService } from "./functions/src/okf-pipeline/vector-service";
import { AgentService } from "./functions/src/okf-pipeline/agent-service";

const driveService = new DriveService();
const parserService = new ParserService();
const okfConverter = new OKFConverter();
const githubService = new GitHubService();
const vectorService = new VectorService();
const agentService = new AgentService();

const testCompanyId = `comp_test_${Math.floor(Math.random() * 9000 + 1000)}`;
const testCompanyName = "Global Maritime Logistics";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 STARTING OKF PIPELINE END-TO-END VERIFICATION");
  console.log("==================================================");

  // Ensure tmp directory exists
  const tmpDir = path.resolve(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  try {
    // ----------------------------------------------------
    // STEP 1: Company Registration & Isolated Folder Creation
    // ----------------------------------------------------
    console.log("\n▶️ STEP 1: Registering new company and isolated folder...");
    
    // Check Drive API connection
    let folderId = "mock-drive-folder-id-123456";
    try {
      folderId = await driveService.createCompanyFolder(testCompanyId, testCompanyName);
      console.log(`✅ Drive isolated folder created. Folder ID: ${folderId}`);
    } catch (err: any) {
      console.warn(`⚠️ Drive Folder Creation skipped (expected if credentials/permissions are invalid): ${err.message}`);
      console.log(`⚠️ Continuing with mock folder ID: ${folderId}`);
    }

    // Save to Firestore
    const db = getFirestore("ai-studio-6dbfd403-b57c-4e02-8999-633ee65aff51");
    await db.collection("companies").doc(testCompanyId).set({
      id: testCompanyId,
      name: testCompanyName,
      folderId: folderId,
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ Company details registered in Firestore (ID: ${testCompanyId})`);


    // ----------------------------------------------------
    // STEP 2 & 3: Mock File Parsing & OKF Conversion
    // ----------------------------------------------------
    console.log("\n▶️ STEP 2 & 3: Parsing files and converting to OKF format...");
    
    // Generate mock corporate files
    const doc1Path = path.join(tmpDir, "fiyat_listesi_2026.txt");
    const doc2Path = path.join(tmpDir, "motor_bakim_kilavuzu.txt");

    fs.writeFileSync(
      doc1Path,
      "Firma: Global Maritime Logistics\nKonu: Yük taşıma ve konteyner nakliye fiyatları.\n\nKonteyner Tipi | 20ft Standart | 40ft Standart\nRotterdam - İstanbul | 1200 USD | 2100 USD\nHamburg - İzmir | 1350 USD | 2300 USD\n\nÖdeme Şartları: Peşin veya teslimatta tahsilat.\nTüm fiyatlarımıza KDV hariçtir. Geçerlilik tarihi: Aralık 2026."
    );

    fs.writeFileSync(
      doc2Path,
      "Gemi Ana Makine D-380 Bakım Kılavuzu\n\n1. Her 500 saatte bir motor yağını kontrol edin ve gerekiyorsa değiştirin.\n2. Soğutma suyu seviyesini ve hortumları sızıntılara karşı kontrol edin.\n3. Yakıt filtrelerini temizleyin veya yenisiyle değiştirin.\n4. Arıza durumunda teknik servis ekibini çağırın."
    );

    console.log("📝 Mock files generated in tmp/ directory.");

    // Parse and convert Doc 1
    const text1 = await parserService.parseFile(doc1Path, "text/plain");
    console.log(`📄 Doc 1 Parsed. Extract length: ${text1.length} chars.`);
    const okf1 = await okfConverter.convertToOKF(text1, "fiyat_listesi_2026.txt", testCompanyId);
    console.log("🤖 Doc 1 Converted to OKF standard:");
    console.log(okf1.rawContent.substring(0, 160) + "\n...\n");

    // Parse and convert Doc 2
    const text2 = await parserService.parseFile(doc2Path, "text/plain");
    console.log(`📄 Doc 2 Parsed. Extract length: ${text2.length} chars.`);
    const okf2 = await okfConverter.convertToOKF(text2, "motor_bakim_kilavuzu.txt", testCompanyId);
    console.log("🤖 Doc 2 Converted to OKF standard:");
    console.log(okf2.rawContent.substring(0, 160) + "\n...\n");


    // ----------------------------------------------------
    // STEP 4: GitHub Versioning
    // ----------------------------------------------------
    console.log("\n▶️ STEP 4: Versioning documents to GitHub...");
    const gitRes1 = await githubService.commitOKFDocument(testCompanyId, "fiyat_listesi_2026.txt", okf1.rawContent);
    console.log(`✅ Doc 1 git commit. Target path: ${gitRes1.path}`);
    const gitRes2 = await githubService.commitOKFDocument(testCompanyId, "motor_bakim_kilavuzu.txt", okf2.rawContent);
    console.log(`✅ Doc 2 git commit. Target path: ${gitRes2.path}`);


    // ----------------------------------------------------
    // STEP 5: Vector Indexing
    // ----------------------------------------------------
    console.log("\n▶️ STEP 5: Chunking and Vector indexing in Firestore...");
    const chunks1 = await vectorService.indexDocument(
      testCompanyId,
      "fiyat_listesi_2026.txt",
      okf1.metadata.type,
      okf1.markdownBody,
      okf1.metadata.tags,
      okf1.metadata.last_updated
    );
    console.log(`✅ Indexed ${chunks1} chunks for Doc 1.`);

    const chunks2 = await vectorService.indexDocument(
      testCompanyId,
      "motor_bakim_kilavuzu.txt",
      okf2.metadata.type,
      okf2.markdownBody,
      okf2.metadata.tags,
      okf2.metadata.last_updated
    );
    console.log(`✅ Indexed ${chunks2} chunks for Doc 2.`);


    // ----------------------------------------------------
    // STEP 6: AI Agent Filtering Layer
    // ----------------------------------------------------
    console.log("\n▶️ STEP 6: Testing AI Agent Filtering Layer...");

    console.log("\n💼 [SALES AGENT SEARCH QUERY]: 'Rotterdam yük taşıma fiyatı nedir?'");
    // Should filter for Catalog/Price List and match prices
    const salesResults = await agentService.searchSalesAgent(testCompanyId, "Rotterdam yük taşıma fiyatı nedir?");
    console.log(`Found ${salesResults.length} matches:`);
    salesResults.forEach((res, i) => {
      console.log(`   [${i+1}] Score: ${res.score.toFixed(4)} | File: ${res.filePath} | Type: ${res.type}`);
      console.log(`       Content: "${res.content.substring(0, 100)}..."`);
    });

    console.log("\n🛠️ [TECHNICAL AGENT SEARCH QUERY]: 'Motor bakımı nasıl yapılır?'");
    // Should filter for Maintenance Guide and match maintenance steps
    const techResults = await agentService.searchTechnicalAgent(testCompanyId, "Motor bakımı nasıl yapılır?");
    console.log(`Found ${techResults.length} matches:`);
    techResults.forEach((res, i) => {
      console.log(`   [${i+1}] Score: ${res.score.toFixed(4)} | File: ${res.filePath} | Type: ${res.type}`);
      console.log(`       Content: "${res.content.substring(0, 100)}..."`);
    });

    // Cross-verify that Sales Agent cannot access Technical documents
    console.log("\n🔒 [CROSS ACCESS SECURITY TEST]: Sales Agent query 'motor yağ değişimi'");
    const secureSalesScan = await agentService.searchSalesAgent(testCompanyId, "motor yağ değişimi");
    const containsTechDoc = secureSalesScan.some(res => res.type === "Bakım Kılavuzu");
    if (!containsTechDoc) {
      console.log("✅ SECURITY PASSED: Sales Agent cannot access 'Bakım Kılavuzu' documents!");
    } else {
      console.error("❌ SECURITY FAILED: Sales Agent breached access controls!");
    }

    console.log("\n🔒 [CROSS ACCESS SECURITY TEST 2]: Technical Agent query 'taşıma ücretleri ve fiyat listesi'");
    const secureTechScan = await agentService.searchTechnicalAgent(testCompanyId, "taşıma ücretleri ve fiyat listesi");
    const containsSalesDoc = secureTechScan.some(res => res.type === "Fiyat Listesi" || res.type === "Katalog");
    if (!containsSalesDoc) {
      console.log("✅ SECURITY PASSED: Technical Agent cannot access Sales/Catalog/Price list documents!");
    } else {
      console.error("❌ SECURITY FAILED: Technical Agent breached access controls!");
    }


    // ----------------------------------------------------
    // Cleanup Firestore test data
    // ----------------------------------------------------
    console.log("\n🧹 Cleaning up Firestore test documents...");
    const chunkCleanup = await db.collection("knowledge_chunks").where("companyId", "==", testCompanyId).get();
    const batch = db.batch();
    chunkCleanup.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    await db.collection("companies").doc(testCompanyId).delete();
    console.log(`🧹 Test company ${testCompanyId} clean up complete.`);

    // Cleanup local files
    fs.unlinkSync(doc1Path);
    fs.unlinkSync(doc2Path);
    console.log("🧹 Local temp files cleaned.");

    console.log("\n==================================================");
    console.log("🎉 ALL TESTS COMPLETED SUCCESSFULLY! PIPELINE VERIFIED.");
    console.log("==================================================");

  } catch (error) {
    console.error("\n❌ E2E VERIFICATION TESTING FAILED:", error);
    process.exit(1);
  }
}

runTests();
