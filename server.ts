import dotenv from "dotenv";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import Stripe from "stripe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.post("/api/stripe/verify-session", async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      res.json({ success: true, metadata: session.metadata });
    } else {
      res.json({ success: false, status: session.payment_status });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
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
