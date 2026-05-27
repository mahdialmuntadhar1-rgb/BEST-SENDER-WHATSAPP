import express from "express";
import cors from "cors";
import multer from "multer";
import csvParser from "csv-parser";
import Database from "better-sqlite3";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directories exist
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ========== CONFIG ==========
let NABDA_URL = process.env.NABDA_URL || "https://api.nabdaotp.com/api/v1/messages/send";
let NABDA_API_KEY = process.env.NABDA_API_KEY || "sk_5487e268757e4c51af85df5f34978852";
let GLOBAL_DELAY_MS = 1000; // 1s default delay between messages to respect rate limits safely

// ========== Database Setup ==========
let db: Database.Database;
try {
  db = new Database("campaigns.db");
  // Test write permission
  db.exec("CREATE TABLE IF NOT EXISTS _permission_check (id INTEGER PRIMARY KEY)");
  db.exec("DROP TABLE IF EXISTS _permission_check");
} catch (err) {
  console.warn("Could not write campaigns.db in active workspace directory, falling back to /tmp/campaigns.db to prevent connection blocks:", err);
  db = new Database("/tmp/campaigns.db");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT,
    status TEXT DEFAULT 'pending',
    total INTEGER DEFAULT 0,
    sent INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id TEXT,
    phone TEXT,
    name TEXT,
    governorate TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    error TEXT,
    FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_messages_campaign ON messages(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
`);

// ========== Background Campaign Sender Engine (Pure JS, No Redis required!) ==========
let isWorkerRunning = false;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to call NABDA API
async function sendToNabda(phone: string, text: string, customApiKey?: string) {
  try {
    const apiKey = customApiKey || NABDA_API_KEY;
    const response = await axios.post(
      NABDA_URL,
      {
        phone: phone,
        message: text,
      },
      {
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        timeout: 25000,
      }
    );

    if (response.data && response.data.success !== false) {
      return { success: true, messageId: response.data.messageId || "sent-ok" };
    } else {
      return { success: false, error: response.data.message || "Rejected by external gateway" };
    }
  } catch (err: any) {
    const errMsg = err.response?.data?.message || err.message || "Gateway request timeout";
    return { success: false, error: errMsg };
  }
}

// Background loop to process campaign queue sequentially
async function startCampaignWorker() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  console.log("[Worker] Sequential queue runner active");

  while (true) {
    try {
      // Find the next active campaign
      const activeCampaign = db
        .prepare("SELECT * FROM campaigns WHERE status = 'running' LIMIT 1")
        .get() as any;

      if (!activeCampaign) {
        // No running campaigns, sleep a bit and check later
        await sleep(1500);
        continue;
      }

      // Check if there are any pending messages for this active campaign
      const nextMessage = db
        .prepare(
          "SELECT * FROM messages WHERE campaign_id = ? AND status = 'pending' ORDER BY id ASC LIMIT 1"
        )
        .get(activeCampaign.id) as any;

      if (!nextMessage) {
        // No pending messages for this running campaign. Let's see if there are failed messages
        // that are still being retried, or check if we are fully complete.
        const pendingCount = db
          .prepare("SELECT count(*) as count FROM messages WHERE campaign_id = ? AND status = 'pending'")
          .get(activeCampaign.id) as any;

        const countVal = pendingCount ? pendingCount.count : 0;

        if (countVal === 0) {
          // Verify actual counts
          const stats = db
            .prepare(
              `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed
              FROM messages WHERE campaign_id = ?`
            )
            .get(activeCampaign.id) as any;

          const finalSent = (stats && stats.sent) || 0;
          const finalFailed = (stats && stats.failed) || 0;

          db.prepare("UPDATE campaigns SET status = 'completed', sent = ?, failed = ? WHERE id = ?")
            .run(finalSent, finalFailed, activeCampaign.id);
          
          console.log(`[Worker] Campaign ${activeCampaign.name} marked as COMPLETED.`);
        }
        await sleep(500);
        continue;
      }

      // We have a pending message to send
      console.log(`[Worker] Processing target: ${nextMessage.phone} for Campaign: ${activeCampaign.name}`);
      
      // Attempt to send
      const result = await sendToNabda(nextMessage.phone, nextMessage.message);

      if (result.success) {
        // Update message to sent
        db.prepare(
          "UPDATE messages SET status = 'sent', attempts = attempts + 1, error = NULL WHERE id = ?"
        ).run(nextMessage.id);
        
        // Update campaign accumulators
        db.prepare("UPDATE campaigns SET sent = sent + 1 WHERE id = ?").run(activeCampaign.id);
      } else {
        const nextAttempts = nextMessage.attempts + 1;
        const errStr = result.error || "Gateway reject";
        
        if (nextAttempts >= 2) {
          // Hard fail after 2 retries (safe to prevent excessive spam/drain)
          db.prepare(
            "UPDATE messages SET status = 'failed', attempts = ?, error = ? WHERE id = ?"
          ).run(nextAttempts, errStr, nextMessage.id);

          db.prepare("UPDATE campaigns SET failed = failed + 1 WHERE id = ?").run(activeCampaign.id);
        } else {
          // Increment attempts, but keep state as pending to retry on next cycle
          db.prepare(
            "UPDATE messages SET attempts = ?, error = ? WHERE id = ?"
          ).run(nextAttempts, errStr, nextMessage.id);
        }
      }

      // Safe pause between API calls to honor Rate Limits (1000ms adjustable)
      await sleep(GLOBAL_DELAY_MS);
    } catch (err) {
      console.error("[Worker Error]", err);
      await sleep(2000);
    }
  }
}

// Start background worker
startCampaignWorker().catch((err) => console.error("Worker lifecycle failure:", err));

// ========== Express API Setup ==========
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  const upload = multer({ dest: "uploads/" });

  // Normalizer for Iraqi mobile numbers
  function normalizePhone(phone: any): string {
    if (!phone) return "";
    let p = phone.toString().replace(/\s+/g, "").replace(/^00/, "+");
    if (p.startsWith("07")) return "+964" + p.slice(1);
    if (p.startsWith("964") && !p.startsWith("+")) return "+" + p;
    if (p.match(/^\d{10}$/)) return "+964" + p;
    return p;
  }

  const KURDISH_GOVS = new Set(["sulaymaniyah", "erbil", "duhok", "halabja", "kirkuk"]);
  const MSG_AR = (name: string) =>
    `مرحباً ${name}! 👋\nنحن فريق *Iraq Compass* — دليل الأعمال العراقي الشامل.\nندعوكم لإضافة نشاطكم التجاري مجاناً على:\n🌐 https://iraq-compass.pages.dev\nأجيبوا على هذه الرسالة للتسجيل.`;
  const MSG_KU = (name: string) =>
    `سڵاو ${name}! 👋\nئێمە تیمی *Iraq Compass* ین — دەفتەری بازرگانی عێراق.\nبەخۆشی دەتانخوازین بازرگانیەکەتان بەخۆڕایی زیاد بکەن:\n🌐 https://iraq-compass.pages.dev\nوەڵامی ئەم پەیامە بدەوە بۆ تۆمارکردن.`;

  // --- API Endpoints ---

  // Get current global config
  app.get("/api/config", (req, res) => {
    res.json({
      nabdaUrl: NABDA_URL,
      nabdaApiKey: NABDA_API_KEY ? `${NABDA_API_KEY.substring(0, 6)}...` : "",
      delayMs: GLOBAL_DELAY_MS,
    });
  });

  // Update current global config
  app.post("/api/config", (req, res) => {
    const { url, apiKey, delay } = req.body;
    if (url) NABDA_URL = url;
    if (apiKey) NABDA_API_KEY = apiKey;
    if (typeof delay === "number") GLOBAL_DELAY_MS = Math.max(100, delay);
    
    res.json({
      success: true,
      config: {
        nabdaUrl: NABDA_URL,
        nabdaApiKey: NABDA_API_KEY ? `${NABDA_API_KEY.substring(0, 6)}...` : "",
        delayMs: GLOBAL_DELAY_MS,
      },
    });
  });

  // CSV Upload & Campaign init
  app.post("/api/upload", upload.single("file"), (req, res) => {
    try {
      const { campaignName, governorates } = req.body;
      const govFilter = governorates
        ? governorates
            .split(",")
            .map((g: string) => g.trim().toLowerCase())
            .filter((g: string) => g.length > 0)
        : null;

      if (!req.file) {
        return res.status(400).json({ error: "Missing CSV file asset" });
      }

      const filePath = req.file.path;
      const campaignId = "camp_" + Date.now().toString();
      const rows: Array<{ phone: string; name: string; governorate: string; message: string }> = [];

      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row: any) => {
          // Normalize columns keys to lower case for case-insensitive matches
          const normalizedRow: any = {};
          for (const key of Object.keys(row)) {
            normalizedRow[key.toLowerCase().trim()] = row[key];
          }

          const rawPhone = normalizedRow.phone || normalizedRow.mobile || normalizedRow.number || "";
          const phone = normalizePhone(rawPhone);
          
          if (!phone.startsWith("+964")) return;

          const rawGov = normalizedRow.governorate || normalizedRow.gov || normalizedRow.city || "";
          const gov = rawGov.trim().toLowerCase();

          // Apply filter if specified
          if (govFilter && govFilter.length > 0 && !govFilter.includes(gov)) {
            return;
          }

          const name = normalizedRow.name || normalizedRow.business_name || normalizedRow["business name"] || "عميل";
          const message = KURDISH_GOVS.has(gov) ? MSG_KU(name) : MSG_AR(name);

          rows.push({ phone, name, governorate: gov, message });
        })
        .on("end", () => {
          if (rows.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: "No matching Iraqi recipients filtered from this CSV file" });
          }

          // Insert Campaign record
          db.prepare("INSERT INTO campaigns (id, name, total, status) VALUES (?, ?, ?, 'running')").run(
            campaignId,
            campaignName || `Campaign ${new Date().toLocaleDateString()}`,
            rows.length
          );

          // Batch insert messages inside transaction
          const insertMsg = db.prepare(
            "INSERT INTO messages (campaign_id, phone, name, governorate, message, status) VALUES (?, ?, ?, ?, ?, 'pending')"
          );
          
          const insertMany = db.transaction((messageList) => {
            for (const r of messageList) {
              insertMsg.run(campaignId, r.phone, r.name, r.governorate, r.message);
            }
          });

          insertMany(rows);

          // Clean up file
          fs.unlinkSync(filePath);
          res.json({ campaignId, total: rows.length });
        })
        .on("error", (err) => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          res.status(500).json({ error: "Failed to parse CSV upload: " + err.message });
        });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get stats for all campaigns
  app.get("/api/campaigns", (req, res) => {
    try {
      const campaigns = db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC").all() as any[];
      res.json(campaigns);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get status of specific campaign
  app.get("/api/campaign/:id", (req, res) => {
    try {
      const camp = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id) as any;
      if (!camp) return res.status(404).json({ error: "Campaign not found" });

      const stats = db
        .prepare(
          `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) as sent,
            SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending
          FROM messages WHERE campaign_id = ?`
        )
        .get(req.params.id) as any;

      // Also get the last 15 message logs (rich feed data for the live view)
      const feed = db
        .prepare(
          `SELECT phone, name, governorate, status, error, attempts 
           FROM messages 
           WHERE campaign_id = ? 
           ORDER BY id DESC LIMIT 15`
        )
        .all(req.params.id) as any[];

      res.json({
        ...camp,
        total: stats.total || 0,
        sent: stats.sent || 0,
        failed: stats.failed || 0,
        pending: stats.pending || 0,
        feed,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Resume or start processing a paused/failed campaign
  app.post("/api/campaign/:id/resume", (req, res) => {
    try {
      const { id } = req.params;
      const camp = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(id) as any;
      if (!camp) return res.status(404).json({ error: "Campaign not found" });

      // Reset any hard-failed messages or failed states to 'pending' to retry
      db.prepare(
        "UPDATE messages SET status = 'pending', attempts = 0, error = NULL WHERE campaign_id = ? AND status = 'failed'"
      ).run(id);

      db.prepare("UPDATE campaigns SET status = 'running' WHERE id = ?").run(id);

      res.json({ success: true, message: "Campaign delivery resumed" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Pause campaign
  app.post("/api/campaign/:id/pause", (req, res) => {
    try {
      const { id } = req.params;
      db.prepare("UPDATE campaigns SET status = 'paused' WHERE id = ?").run(id);
      res.json({ success: true, message: "Campaign delivery paused" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete campaign
  app.delete("/api/campaign/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.prepare("DELETE FROM messages WHERE campaign_id = ?").run(id);
      db.prepare("DELETE FROM campaigns WHERE id = ?").run(id);
      res.json({ success: true, message: "Campaign deleted completely" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Health Indicator
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", active: true });
  });

  // --- Serve frontend using Vite middleware or Static files ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Guaranteed HTML fallback in development to transform and serve index.html properly
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api")) {
        return next();
      }
      try {
        const htmlPath = path.resolve(process.cwd(), "index.html");
        let template = fs.readFileSync(htmlPath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Standard Multi-Governorate delivery core running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
