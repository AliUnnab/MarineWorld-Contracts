const PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";
const SECRET_KEY = import.meta.env.VITE_STRIPE_SECRET_KEY || "";

export const StripeService = {
  async tokenizeCard(cardData: { name: string; card: string; expiry: string; cvc: string }): Promise<{ success: boolean; lastFour?: string; cardHolder?: string; error?: string }> {
    try {
      const expiryParts = cardData.expiry.split('/');
      if (expiryParts.length !== 2) {
        throw new Error("Invalid expiry date format. Use MM/YY.");
      }
      const expMonth = expiryParts[0].trim();
      const expYear = expiryParts[1].trim();
      
      const cleanedCard = cardData.card.replace(/\s+/g, '');
      
      const tokenBody = new URLSearchParams();
      tokenBody.append("card[number]", cleanedCard);
      tokenBody.append("card[exp_month]", expMonth);
      tokenBody.append("card[exp_year]", expYear);
      tokenBody.append("card[cvc]", cardData.cvc);
      tokenBody.append("card[name]", cardData.name);

      const tokenRes = await fetch("https://api.stripe.com/v1/tokens", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PUBLIC_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: tokenBody.toString()
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData.error?.message || "Card validation failed");
      }

      return {
        success: true,
        lastFour: cleanedCard.slice(-4),
        cardHolder: cardData.name
      };
    } catch (err: any) {
      console.error("Stripe Tokenization Exception:", err);
      return {
        success: false,
        error: err.message || "Card validation failed."
      };
    }
  },

  async chargeCard(amountInDollars: number, cardData: { name: string; card: string; expiry: string; cvc: string }, description: string): Promise<{ success: boolean; chargeId?: string; lastFour: string; cardHolder: string; error?: string }> {
    try {
      // 1. Parse card expiry
      const expiryParts = cardData.expiry.split('/');
      if (expiryParts.length !== 2) {
        throw new Error("Invalid expiry date format. Use MM/YY.");
      }
      const expMonth = expiryParts[0].trim();
      const expYear = expiryParts[1].trim();
      
      const cleanedCard = cardData.card.replace(/\s+/g, '');
      
      // 2. Tokenize card
      const tokenBody = new URLSearchParams();
      tokenBody.append("card[number]", cleanedCard);
      tokenBody.append("card[exp_month]", expMonth);
      tokenBody.append("card[exp_year]", expYear);
      tokenBody.append("card[cvc]", cardData.cvc);
      tokenBody.append("card[name]", cardData.name);

      const tokenRes = await fetch("https://api.stripe.com/v1/tokens", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PUBLIC_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: tokenBody.toString()
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData.error?.message || "Card tokenization failed");
      }

      const tokenId = tokenData.id;

      // 3. Charge the token
      const chargeBody = new URLSearchParams();
      chargeBody.append("amount", Math.round(amountInDollars * 100).toString());
      chargeBody.append("currency", "usd");
      chargeBody.append("source", tokenId);
      chargeBody.append("description", description);

      const chargeRes = await fetch("https://api.stripe.com/v1/charges", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: chargeBody.toString()
      });

      const chargeData = await chargeRes.json();
      if (!chargeRes.ok) {
        throw new Error(chargeData.error?.message || "Charge processing failed");
      }

      return {
        success: true,
        chargeId: chargeData.id,
        lastFour: cleanedCard.slice(-4),
        cardHolder: cardData.name
      };
    } catch (err: any) {
      console.error("Stripe Charge Exception:", err);
      return {
        success: false,
        lastFour: cardData.card.replace(/\s+/g, '').slice(-4) || '4242',
        cardHolder: cardData.name,
        error: err.message || "An unexpected error occurred during payment processing."
      };
    }
  }
};
