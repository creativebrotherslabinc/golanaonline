import { Router } from "express";

const router = Router();

// Proxy for Frankfurter (ECB rates) — avoids CORS issues in the browser
router.get("/currency/latest", async (req, res) => {
  const from = (req.query.from as string) || "USD";
  try {
    const upstream = await fetch(`https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}`);
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream rate fetch failed" });
      return;
    }
    const data = await upstream.json();
    // cache for 1 hour — ECB only updates once per business day
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "Could not reach exchange rate provider" });
  }
});

export default router;
