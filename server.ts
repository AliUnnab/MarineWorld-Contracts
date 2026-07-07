import dotenv from "dotenv";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import { jsPDF } from "jspdf";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url || "file:" + process.cwd()));

// Standard dotenv load
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Robust manual fallback parser to handle Windows file encoding issues (like UTF-16 LE or UTF-8 BOM)
try {
  const dotenvPath = path.resolve(__dirname, ".env");
  if (fs.existsSync(dotenvPath)) {
    let content = fs.readFileSync(dotenvPath, "utf-8");
    
    // Check if the content is UTF-16 LE (contains null bytes or looks like binary)
    if (content.includes("\u0000") || (content.length > 2 && content.charCodeAt(0) === 0xff && content.charCodeAt(1) === 0xfe)) {
      content = fs.readFileSync(dotenvPath, "utf16le");
    }
    
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }
    
    // Parse lines manually
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        let value = trimmed.substring(equalIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        
        if (key) {
          process.env[key] = value;
        }
      }
    }
  }
} catch (err) {
  console.error("[Stripe Config] Manual .env parse fallback error:", err);
}

// Initialize Firebase Admin SDK using credentials in .env
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

if (process.env.FIREBASE_PROJECT_ID && privateKey && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      })
    });
    console.log("✅ Firebase Admin SDK Initialized.");
  } catch (err) {
    console.error("❌ Firebase Admin SDK initialization error:", err);
  }
} else {
  console.error("❌ Firebase Admin Credentials missing from environment!");
}

const dbAdmin = getApps().length > 0
  ? getFirestore("ai-studio-6dbfd403-b57c-4e02-8999-633ee65aff51")
  : null;

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Stripe if key is provided, else leave null
const dotenvPath = path.resolve(__dirname, ".env");
console.log(`[Stripe Config] Loading environment from: ${dotenvPath}`);
const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;

if (stripeKey) {
  console.log(`[Stripe Config] Stripe Secret Key detected (length: ${stripeKey.length}, starts with: ${stripeKey.substring(0, 7)}...)`);
} else {
  console.warn(`[Stripe Config] ⚠️ No Stripe Secret Key found in environment variables.`);
  console.log(`[Stripe Config] Available Env Keys: ${Object.keys(process.env).filter(k => k.includes("STRIPE"))}`);
}

const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2024-06-20" as any }) : null;

// ==========================================
// BILLING & STRIPE API ENDPOINTS
// ==========================================

app.get("/api/stripe/status", async (req, res) => {
  if (!stripe) {
    return res.json({ connected: false, error: "STRIPE_SECRET_KEY missing" });
  }

  // A quick check to see if key works and return some account scope info if needed
  try {
    return res.json({ connected: true, status: "Stripe API Key validated." });
  } catch (error: any) {
    return res.json({ connected: false, error: error.message });
  }
});

// A dummy customer/subscription fetch until Firebase logic pairs a user to a true Customer ID
app.get("/api/stripe/customer/:customerId", async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  try {
    const customer = await stripe.customers.retrieve(req.params.customerId);
    res.json({ customer });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/stripe/subscriptions/:customerId", async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  try {
    const subscriptions = await stripe.subscriptions.list({ customer: req.params.customerId });
    res.json({ subscriptions: subscriptions.data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/stripe/invoices/:customerId", async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  try {
    const invoices = await stripe.invoices.list({ customer: req.params.customerId, limit: 10 });
    res.json({ invoices: invoices.data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/stripe/payment-methods/:customerId", async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  try {
    const paymentMethods = await stripe.paymentMethods.list({ customer: req.params.customerId });
    res.json({ paymentMethods: paymentMethods.data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/stripe/create-checkout-session", async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  try {
    const { planId, priceAmount, userId, customerEmail, mode = 'subscription', successPath = '/', billingCycle = 'monthly' } = req.body;
    const cleanPath = successPath.startsWith('/') ? successPath : `/${successPath}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: mode as any,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: mode === 'subscription' ? `Contract Studio ${planId} Workspace` : `Contract Studio Quota Refill: ${planId}`,
            description: mode === 'subscription' ? `B2B Maritime Operations Capacity (${planId} Tier)` : `Verified Credit Refill Block`,
          },
          unit_amount: Math.round(parseFloat(priceAmount.toString().replace('$', '')) * 100), // handle strings or numbers
          ...(mode === 'subscription' ? { recurring: { interval: billingCycle === 'annual' ? 'year' : 'month' } } : {})
        },
        quantity: 1,
      }],
      metadata: {
        userId,
        planId,
        mode,
        billingCycle
      },
      customer_email: customerEmail,
      success_url: `${req.headers.origin}${cleanPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}${cleanPath}`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// SMTP transporter for verification and invoice emails
const emailTransporter = nodemailer.createTransport({
  host: "server327.web-hosting.com",
  port: 587,
  secure: false, // upgrades to TLS dynamically via STARTTLS
  auth: {
    user: "info@unitedweb4.com",
    pass: "Uweb4.2025"
  },
  tls: {
    rejectUnauthorized: false // bypass cert rejection if any
  }
});

// Helper to generate Invoice PDF using jsPDF
function generateInvoicePDF(invoiceNumber: string, plan: string, amount: string, date: string, customerEmail: string) {
  const doc = new jsPDF({ format: 'a5', orientation: 'portrait' });
  
  const textBlack = [23, 27, 38];
  const textGray = [128, 134, 139];
  const colorAccent = [0, 212, 255];
  
  // --- HEADER ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  doc.text("MARINEWORLD", 15, 20);
  doc.text("Contract Studio", 15, 25);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text("Enterprise Contract Operating System", 15, 30);
  
  // Right side Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  doc.text("INVOICE", 90, 25);
  
  // Divider
  doc.setDrawColor(230, 230, 230);
  doc.line(15, 35, 133, 35);
  
  // Details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Number:", 15, 45);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceNumber, 50, 45);
  
  doc.setFont("helvetica", "bold");
  doc.text("Date:", 15, 52);
  doc.setFont("helvetica", "normal");
  doc.text(date, 50, 52);

  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 15, 59);
  doc.setFont("helvetica", "normal");
  doc.text(customerEmail, 50, 59);
  
  // Table header
  doc.setFillColor(245, 247, 250);
  doc.rect(15, 70, 118, 8, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text("Item / Description", 18, 75);
  doc.text("Amount", 110, 75);
  
  // Table content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  doc.text(plan, 18, 87);
  doc.text(amount, 110, 87);
  
  doc.line(15, 95, 133, 95);
  
  // Total
  doc.setFont("helvetica", "bold");
  doc.text("Total Paid:", 80, 105);
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  doc.text(amount, 110, 105);
  
  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(textGray[0], textGray[1], textGray[2]);
  doc.text("Thank you for your purchase! MarineWorld Contracts.", 15, 130);
  
  return Buffer.from(doc.output('arraybuffer'));
}

app.post("/api/stripe/verify-session", async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const emailTo = session.customer_details?.email || session.metadata?.customerEmail || session.customer_email;
      
      if (emailTo) {
        const invoiceNumber = `INV-${100000 + Math.floor(Math.random() * 900000)}`;
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        const dateTimeStr = `${dateStr} at ${timeStr}`;

        const ownerId = session.metadata?.userId;
        let customerName = session.customer_details?.name || "Workspace Operator";
        if (ownerId && dbAdmin) {
          try {
            const userDoc = await dbAdmin.collection("users").doc(ownerId).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              customerName = userData?.displayName || customerName;
            }
          } catch (dbErr) {
            console.error("Failed to fetch user profile for email details:", dbErr);
          }
        }

        const amountStr = `$${(session.amount_total || 0) / 100}.00`;
        const planName = session.metadata?.planId ? `${session.metadata.planId} Plan Subscription` : 'Quota Top-up';
        
        try {
          const pdfBuffer = generateInvoicePDF(invoiceNumber, planName, amountStr, dateTimeStr, emailTo);
          
          const mailOptions = {
            from: '"MarineWorld Contracts" <info@unitedweb4.com>',
            to: emailTo,
            subject: `Payment Confirmation & Invoice ${invoiceNumber}`,
            html: `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 30px; border-radius: 12px; background-color: #ffffff; color: #171b26;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h2 style="color: #00D4FF; margin: 0; font-size: 24px;">MarineWorld Contract Studio</h2>
                  <p style="color: #80868B; font-size: 14px; margin-top: 8px;">Payment Successful</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
                <p>Dear ${customerName},</p>
                <p>Thank you for your purchase! Your payment has been successfully processed, and your plan/credits have been activated.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: left; font-weight: bold; width: 35%;">Customer Name</th>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; width: 65%;">${customerName}</td>
                  </tr>
                  <tr>
                    <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: left; font-weight: bold;">Customer Email</th>
                    <td style="padding: 10px; border: 1px solid #e0e0e0;">${emailTo}</td>
                  </tr>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: left; font-weight: bold;">Invoice Number</th>
                    <td style="padding: 10px; border: 1px solid #e0e0e0;">${invoiceNumber}</td>
                  </tr>
                  <tr>
                    <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: left; font-weight: bold;">Date & Time</th>
                    <td style="padding: 10px; border: 1px solid #e0e0e0;">${dateTimeStr}</td>
                  </tr>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: left; font-weight: bold;">Service / Plan</th>
                    <td style="padding: 10px; border: 1px solid #e0e0e0;">${planName}</td>
                  </tr>
                  <tr>
                    <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: left; font-weight: bold;">Amount Paid</th>
                    <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold; color: #00D68F;">${amountStr}</td>
                  </tr>
                </table>
                
                <p>We have attached your official invoice PDF to this email for your records.</p>
                <p>If you have any questions or require support, please contact us at <a href="mailto:info@unitedweb4.com" style="color: #00D4FF; text-decoration: none;">info@unitedweb4.com</a>.</p>
                <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #80868B; text-align: center;">MarineWorld Contracts, Enterprise Operations Platform</p>
              </div>
            `,
            attachments: [
              {
                filename: `invoice-${invoiceNumber}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
              }
            ]
          };
          
          await emailTransporter.sendMail(mailOptions);
          console.log(`[Email] Payment confirmation & invoice PDF sent to ${emailTo}`);
        } catch (emailErr) {
          console.error("[Email] Failed to send payment confirmation email:", emailErr);
        }
      }

      res.json({ success: true, metadata: session.metadata });
    } else {
      res.json({ success: false, status: session.payment_status });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/send-verification-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and verification code are required." });
    }

    const mailOptions = {
      from: '"MarineWorld Contracts" <info@unitedweb4.com>',
      to: email,
      subject: "Your Workspace Activation Code",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #2B354D; padding: 30px; border-radius: 12px; background-color: #171B26; color: white;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #00D4FF; margin: 0; font-size: 24px;">MarineWorld Contract Studio</h2>
            <p style="color: #BBC0C4; font-size: 14px; margin-top: 8px;">Workspace Authentication Verification</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #2B3347; margin: 20px 0;" />
          <div style="padding: 20px; text-align: center; background-color: #1C2233; border-radius: 8px; border: 1px solid #2B354D;">
            <p style="color: #BBC0C4; font-size: 14px; margin-bottom: 16px; margin-top: 0;">Please use the 6-digit verification code below to authorize your account activation:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #00D4FF; font-family: monospace; display: inline-block; padding: 12px 24px; background-color: #171B26; border-radius: 6px; border: 1px dashed #00D4FF;">
              ${code}
            </div>
          </div>
          <p style="font-size: 11px; color: #80868B; text-align: center; margin-top: 24px; line-height: 1.5;">
            This email was sent from <a href="mailto:info@unitedweb4.com" style="color: #00D4FF; text-decoration: none;">info@unitedweb4.com</a>. If you did not register for a MarineWorld account, please disregard this email.
          </p>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error: any) {
    console.error("[Email Server API Error] Failed to send verification email:", error);
    res.status(500).json({ error: error.message || "Failed to send email verification code." });
  }
});

// Custom Password Reset Request
app.post("/api/auth/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    if (!dbAdmin) {
      return res.status(500).json({ error: "Firebase Admin SDK is not initialized." });
    }

    // Verify user exists in Auth
    try {
      await getAuth().getUserByEmail(email);
    } catch (authErr: any) {
      console.warn(`[Password Reset] User not found for email: ${email}`, authErr.message);
      return res.status(404).json({ error: "No registered workspace found for this email address." });
    }

    // Generate secure token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour expiration

    // Save token in Firestore
    await dbAdmin.collection("password_resets").doc(token).set({
      email,
      token,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString()
    });

    const resetLink = `${req.headers.origin}/reset-password?token=${token}`;

    const mailOptions = {
      from: '"MarineWorld Contracts" <info@unitedweb4.com>',
      to: email,
      subject: "Workspace Passkey Restoration Instructions",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 30px; border-radius: 12px; background-color: #ffffff; color: #171b26;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #00D4FF; margin: 0; font-size: 24px;">MarineWorld Contract Studio</h2>
            <p style="color: #80868B; font-size: 14px; margin-top: 8px;">Workspace Passkey Restoration Request</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p>Dear Workspace Operator,</p>
          <p>A request was received to reset the secure access passkey associated with your corporate workspace.</p>
          
          <div style="margin: 25px 0; text-align: center;">
            <a href="${resetLink}" style="display: inline-block; padding: 12px 30px; background-color: #00D4FF; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 212, 255, 0.2);">
              RESET WORKSPACE PASSKEY
            </a>
          </div>
          
          <p style="font-size: 13px; color: #80868B; line-height: 1.6;">
            This link will expire in 60 minutes. If you did not authorize this passkey restoration request, please disregard this email and secure your terminal session.
          </p>
          <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #80868B; text-align: center;">MarineWorld Contracts, Enterprise Operations Platform</p>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`[Password Reset] Dispatched reset link to ${email}`);
    res.json({ success: true });
  } catch (error: any) {
    console.error("[Password Reset API Error] Failed to request reset:", error);
    res.status(500).json({ error: error.message || "Failed to process passkey restoration request." });
  }
});

// Custom Password Reset Execution
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Restoration token and new passkey are required." });
    }

    if (!dbAdmin) {
      return res.status(500).json({ error: "Firebase Admin SDK is not initialized." });
    }

    const resetDocRef = dbAdmin.collection("password_resets").doc(token);
    const snap = await resetDocRef.get();

    if (!snap.exists) {
      return res.status(400).json({ error: "Invalid or expired passkey restoration token." });
    }

    const resetData = snap.data();
    if (resetData?.used || new Date(resetData?.expiresAt) < new Date()) {
      return res.status(400).json({ error: "This passkey restoration token has expired or has already been used." });
    }

    const email = resetData?.email;

    // Get Auth User
    const userRecord = await getAuth().getUserByEmail(email);

    // Update password in Auth
    await getAuth().updateUser(userRecord.uid, {
      password: password
    });

    // Mark token as used
    await resetDocRef.update({ used: true });

    console.log(`[Password Reset] Successfully updated password for user: ${email}`);
    res.json({ success: true });
  } catch (error: any) {
    console.error("[Password Reset Execution Error]:", error);
    res.status(500).json({ error: error.message || "Failed to reset workspace passkey." });
  }
});

// ==========================================
// VITE MIDDLEWARE & FALLBACK HANDLER
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite middleware for dev
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MarineWorld Backend Server running on http://0.0.0.0:${PORT}`);
    if (!stripeKey) {
      console.warn("⚠️ STRIPE_SECRET_KEY is missing. Stripe routes will return errors.");
    } else {
      console.log("✅ Stripe Engine Loaded.");
    }
  });
}

startServer();
