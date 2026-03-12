import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import db, { seedDatabase } from "./src/services/database";
import crypto from "crypto";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Seed the database on startup
  seedDatabase();

  app.use(express.json());

  // PayU Hash Generation
  app.post("/api/payu/hash", (req, res) => {
    const { txnid, amount, productinfo, firstname, email } = req.body;
    const key = process.env.VITE_PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;

    if (!key || !salt) {
      return res.status(500).json({ error: "PayU keys not configured" });
    }

    // Hash Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    res.json({ hash });
  });

  // PayU Success/Failure Callbacks
  app.post("/api/payu/callback", (req, res) => {
    const { status, txnid, hash, amount, productinfo, firstname, email } = req.body;
    const key = process.env.VITE_PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;

    // Verify Hash: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const reverseHashString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const calculatedHash = crypto.createHash('sha512').update(reverseHashString).digest('hex');

    if (calculatedHash !== hash) {
      console.error("PayU Hash Mismatch!");
      return res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}?payment=failed`);
    }

    if (status === 'success') {
      res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}?payment=success&txnid=${txnid}`);
    } else {
      res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}?payment=failed`);
    }
  });

  // API Route for Knowledge Base Retrieval
  app.get("/api/kb", (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.json({ context: "" });

    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
    let context = "KNOWLEDGE BASE CONTEXT:\n";
    const foundIds = { doshas: new Set(), herbs: new Set(), ailments: new Set() };

    for (const word of keywords) {
      const doshas = db.prepare('SELECT * FROM doshas WHERE name LIKE ?').all(`%${word}%`) as any[];
      for (const d of doshas) {
        if (!foundIds.doshas.has(d.id)) {
          context += `Dosha ${d.name}: Elements: ${d.elements}, Qualities: ${d.qualities}, Balancing: ${d.balancing_tips}\n`;
          foundIds.doshas.add(d.id);
        }
      }

      const herbs = db.prepare('SELECT * FROM herbs WHERE name LIKE ? OR sanskrit_name LIKE ?').all(`%${word}%`, `%${word}%`) as any[];
      for (const h of herbs) {
        if (!foundIds.herbs.has(h.id)) {
          context += `Herb ${h.name}: Benefits: ${h.benefits}, Properties: ${h.properties}, Contraindications: ${h.contraindications}\n`;
          foundIds.herbs.add(h.id);
        }
      }

      const ailments = db.prepare('SELECT * FROM ailments WHERE name LIKE ?').all(`%${word}%`) as any[];
      for (const a of ailments) {
        if (!foundIds.ailments.has(a.id)) {
          context += `Ailment ${a.name}: Management: ${a.ayurvedic_management}, Home Remedies: ${a.home_remedies}\n`;
          foundIds.ailments.add(a.id);
        }
      }
    }

    res.json({ context });
  });

  // Email OTP Store (In-memory for demo)
  const otpStore = new Map<string, { otp: string, expires: number }>();

  app.post("/api/auth/send-otp", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 }); // 10 mins

    console.log(`[AUTH] OTP for ${email}: ${otp}`);
    // In a real app, use nodemailer here
    res.json({ success: true, message: "OTP sent to email (check console in this demo)" });
  });

  app.post("/api/auth/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    const stored = otpStore.get(email);

    if (!stored || stored.otp !== otp || stored.expires < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    otpStore.delete(email);
    res.json({ success: true, message: "OTP verified" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
