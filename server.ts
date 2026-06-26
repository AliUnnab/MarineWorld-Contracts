import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import Stripe from "stripe";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Stripe if key is provided, else leave null
const stripeKey = process.env.STRIPE_SECRET_KEY;
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
    const { planId, priceAmount, userId, customerEmail, mode = 'subscription', successPath = '/' } = req.body;
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
          ...(mode === 'subscription' ? { recurring: { interval: 'month' } } : {})
        },
        quantity: 1,
      }],
      metadata: {
        userId,
        planId,
        mode
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
