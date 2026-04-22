// // // @ts-check
// // import { join } from "path";
// // import { readFileSync } from "fs";
// // import express from "express";
// // import serveStatic from "serve-static";

// // // custom TS additions
// // import { connectDB } from "./db.js";
// // import logger from "./logger.js";
// // import { Timer } from "./models/Timer.js";
// // import { timerValidationSchema } from "./validation.js";

// // // @ts-ignore
// // import shopify from "./shopify.js";
// // // @ts-ignore
// // import productCreator from "./product-creator.js";
// // // @ts-ignore
// // import PrivacyWebhookHandlers from "./privacy.js";

// // const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);

// // const STATIC_PATH =
// //   process.env.NODE_ENV === "production"
// //     ? `${process.cwd()}/frontend/dist`
// //     : `${process.cwd()}/frontend/`;

// // const app = express();

// // // Set up Shopify authentication and webhook handling
// // app.get(shopify.config.auth.path, shopify.auth.begin());
// // app.get(
// //   shopify.config.auth.callbackPath,
// //   shopify.auth.callback(),
// //   shopify.redirectToShopifyOrAppRoot()
// // );
// // app.post(
// //   shopify.config.webhooks.path,
// //   shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
// // );

// // app.use(express.json());

// // // --- STOREFRONT API --- (Must be placed before validateAuthenticatedSession)
// // // This is publicly accessible but scoped by ?shop= & cors protected
// // app.get("/api/storefront/timers", async (req, res) => {
// //   try {
// //     const { shop, productId } = req.query;
// //     if (!shop) {
// //       return res.status(400).json({ error: "Shop parameter is required" });
// //     }

// //     // Find active timers for the shop
// //     const activeTimers = await Timer.find({ shop, status: 'active' });

// //     // Evaluate matching timers
// //     let matchedTimers = activeTimers.filter(timer => {
// //       // Return true if it targets this specific product
// //       if (timer.targetType === 'products' && timer.targetIds.includes(`gid://shopify/Product/${productId}`)) return true;
// //       // Or if it targets all products
// //       if (timer.targetType === 'all') return true;
// //       return false;
// //     });

// //     // Sort: Specific products timers first, then 'all' products timers
// //     matchedTimers = matchedTimers.sort((a, b) => {
// //       if (a.targetType === 'products' && b.targetType !== 'products') return -1;
// //       if (b.targetType === 'products' && a.targetType !== 'products') return 1;
// //       return 0;
// //     });

// //     res.set('Cache-Control', 'public, max-age=60'); // aggressive caching as requested for <200ms
// //     res.status(200).json({ timers: matchedTimers });
// //   } catch (err) {
// //     logger.error("Storefront API fetch error:", err);
// //     res.status(500).json({ error: "Server error fetching timers" });
// //   }
// // });

// // app.post("/api/storefront/timers/impression", async (req, res) => {
// //   try {
// //     const { timerId } = req.body;
// //     if (timerId) {
// //       await Timer.findByIdAndUpdate(timerId, { $inc: { impressions: 1 } });
// //     }
// //     res.status(200).send({ success: true });
// //   } catch(err) {
// //     logger.error("Error updating impression:", err);
// //     res.status(500).send({ success: false });
// //   }
// // });

// // // All routes after this point require Shopify authentication
// // app.use("/api/*", shopify.validateAuthenticatedSession());

// // // --- ADMIN TIMER API ---
// // app.get("/api/timers", async (req, res) => {
// //   try {
// //     // @ts-ignore
// //     const session = res.locals.shopify.session;
// //     const timers = await Timer.find({ shop: session.shop }).sort({ createdAt: -1 });
// //     res.status(200).json(timers);
// //   } catch (err) {
// //     logger.error("Error fetching timers:", err);
// //     res.status(500).json({ error: "Failed to fetch timers" });
// //   }
// // });

// // app.get("/api/timers/:id", async (req, res) => {
// //   try {
// //     // @ts-ignore
// //     const session = res.locals.shopify.session;
// //     const timer = await Timer.findOne({ _id: req.params.id, shop: session.shop });
// //     if (!timer) return res.status(404).json({ error: "Timer not found" });
// //     res.status(200).json(timer);
// //   } catch (err) {
// //     logger.error("Error fetching timer:", err);
// //     res.status(500).json({ error: "Failed to fetch timer" });
// //   }
// // });

// // app.post("/api/timers", async (req, res) => {
// //   try {
// //     // @ts-ignore
// //     const session = res.locals.shopify.session;

// //     // Sanitize & Validate input
// //     const { error, value } = timerValidationSchema.validate(req.body);
// //     if (error) {
// //        return res.status(400).json({ error: error.details[0].message });
// //     }

// //     const timer = new Timer({
// //       ...value,
// //       shop: session.shop
// //     });

// //     await timer.save();
// //     logger.info(`Timer created for ${session.shop}`);
// //     res.status(201).json(timer);
// //   } catch(err) {
// //     logger.error("Error creating timer:", err);
// //     res.status(500).json({ error: "Failed to create timer" });
// //   }
// // });

// // app.put("/api/timers/:id", async (req, res) => {
// //   try {
// //     // @ts-ignore
// //     const session = res.locals.shopify.session;
// //     // Sanitize & Validate input
// //     const { error, value } = timerValidationSchema.validate(req.body);
// //     if (error) {
// //        return res.status(400).json({ error: error.details[0].message });
// //     }

// //     const timer = await Timer.findOneAndUpdate({ _id: req.params.id, shop: session.shop }, value, { new: true });
// //     res.status(200).json(timer);
// //   } catch(err) {
// //     logger.error("Error updating timer:", err);
// //     res.status(500).json({ error: "Failed to update timer" });
// //   }
// // });

// // app.delete("/api/timers/:id", async (req, res) => {
// //   try {
// //     // @ts-ignore
// //     const session = res.locals.shopify.session;
// //     await Timer.findOneAndDelete({ _id: req.params.id, shop: session.shop });
// //     res.status(200).json({ success: true });
// //   } catch(err) {
// //     logger.error("Error deleting timer:", err);
// //     res.status(500).json({ error: "Failed to delete timer" });
// //   }
// // });

// // app.get("/api/products/count", async (_req, res) => {
// //   // @ts-ignore
// //   const client = new shopify.api.clients.Graphql({
// //     // @ts-ignore
// //     session: res.locals.shopify.session,
// //   });

// //   const countData = await client.request(`
// //     query shopifyProductCount {
// //       productsCount {
// //         count
// //       }
// //     }
// //   `);

// //   // @ts-ignore
// //   res.status(200).send({ count: countData.data.productsCount.count });
// // });

// // app.post("/api/products", async (_req, res) => {
// //   let status = 200;
// //   let error = null;

// //   try {
// //     // @ts-ignore
// //     await productCreator(res.locals.shopify.session);
// //   } catch (e: any) {
// //     logger.error(`Failed to process products/create: ${e.message}`);
// //     status = 500;
// //     error = e.message;
// //   }
// //   res.status(status).send({ success: status === 200, error });
// // });

// // app.use(shopify.cspHeaders());
// // app.use(serveStatic(STATIC_PATH, { index: false }));

// // app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
// //   return res
// //     .status(200)
// //     .set("Content-Type", "text/html")
// //     .send(
// //       readFileSync(join(STATIC_PATH, "index.html"))
// //         .toString()
// //         .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
// //     );
// // });

// // // Connect to MongoDB then start Express Server
// // connectDB().then(() => {
// //   app.listen(PORT, () => {
// //     logger.info(`Server listening on port ${PORT}`);
// //   });
// // });


// // @ts-check
// import { join } from "path";
// import { readFileSync } from "fs";
// import express from "express";
// import serveStatic from "serve-static";

// import { connectDB } from "./db.js";
// import logger from "./logger.js";
// import { Timer } from "./models/Timer.js";
// import { timerValidationSchema } from "./validation.js";

// // @ts-ignore
// import shopify from "./shopify.js";
// // @ts-ignore
// import productCreator from "./product-creator.js";
// // @ts-ignore
// import PrivacyWebhookHandlers from "./privacy.js";

// const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);

// const STATIC_PATH =
//   process.env.NODE_ENV === "production"
//     ? `${process.cwd()}/frontend/dist`
//     : `${process.cwd()}/frontend/`;

// const app = express();

// app.get(shopify.config.auth.path, shopify.auth.begin());
// app.get(
//   shopify.config.auth.callbackPath,
//   shopify.auth.callback(),
//   shopify.redirectToShopifyOrAppRoot()
// );
// app.post(
//   shopify.config.webhooks.path,
//   shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
// );

// app.use(express.json());

// // ─────────────────────────────────────────────────────────────────────────────
// // STOREFRONT API — Called via Shopify App Proxy
// //
// // How App Proxy routing works:
// //   shopify.app.toml:  url = "https://YOUR_HOST/api/storefront"
// //                      subpath = "countdown", prefix = "apps"
// //
// //   Storefront JS calls:  /apps/countdown/timers
// //   Shopify proxies to:   YOUR_HOST/api/storefront/timers
// //
// //   Storefront JS calls:  /apps/countdown/timers/impression  
// //   Shopify proxies to:   YOUR_HOST/api/storefront/timers/impression
// //
// // These routes MUST be BEFORE validateAuthenticatedSession()
// // ─────────────────────────────────────────────────────────────────────────────

// app.use("/api/storefront", (_req, res, next) => {
//   res.set("Access-Control-Allow-Origin", "*");
//   res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   res.set("Access-Control-Allow-Headers", "Content-Type");
//   next();
// });

// app.options("/api/storefront/*", (_req, res) => res.status(200).end());

// app.get("/api/storefront/timers", async (req, res) => {
//   try {
//     const { shop, productId } = req.query as { shop?: string; productId?: string };

//     if (!shop) return res.status(400).json({ error: "shop is required" });

//     const activeTimers = await Timer.find({ shop, status: "active" });

//     const rawId = String(productId || "").replace("gid://shopify/Product/", "");
//     const gid = `gid://shopify/Product/${rawId}`;

//     let matched = activeTimers.filter((t) => {
//       if (t.targetType === "all") return true;
//       if (t.targetType === "products") {
//         return t.targetIds.includes(gid) || t.targetIds.includes(rawId);
//       }
//       return false;
//     });

//     // Specific-product timers take priority
//     matched.sort((a, b) => {
//       if (a.targetType === "products" && b.targetType !== "products") return -1;
//       if (b.targetType === "products" && a.targetType !== "products") return 1;
//       return 0;
//     });

//     res.set("Cache-Control", "public, max-age=60");
//     return res.status(200).json({ timers: matched });
//   } catch (err) {
//     logger.error("Storefront timers error:", err);
//     return res.status(500).json({ error: "Server error" });
//   }
// });

// app.post("/api/storefront/timers/impression", async (req, res) => {
//   try {
//     const { timerId } = req.body;
//     if (timerId) await Timer.findByIdAndUpdate(timerId, { $inc: { impressions: 1 } });
//     return res.status(200).json({ success: true });
//   } catch (err) {
//     logger.error("Impression error:", err);
//     return res.status(500).json({ success: false });
//   }
// });

// // ─────────────────────────────────────────────────────────────────────────────
// // All routes below require Shopify session auth
// // ─────────────────────────────────────────────────────────────────────────────
// app.use("/api/*", shopify.validateAuthenticatedSession());

// app.get("/api/timers", async (_req, res) => {
//   try {
//     // @ts-ignore
//     const session = res.locals.shopify.session;
//     const timers = await Timer.find({ shop: session.shop }).sort({ createdAt: -1 });
//     res.status(200).json(timers);
//   } catch (err) {
//     logger.error("Error fetching timers:", err);
//     res.status(500).json({ error: "Failed to fetch timers" });
//   }
// });

// app.get("/api/timers/:id", async (req, res) => {
//   try {
//     // @ts-ignore
//     const session = res.locals.shopify.session;
//     const timer = await Timer.findOne({ _id: req.params.id, shop: session.shop });
//     if (!timer) return res.status(404).json({ error: "Timer not found" });
//     res.status(200).json(timer);
//   } catch (err) {
//     logger.error("Error fetching timer:", err);
//     res.status(500).json({ error: "Failed to fetch timer" });
//   }
// });

// app.post("/api/timers", async (req, res) => {
//   try {
//     // @ts-ignore
//     const session = res.locals.shopify.session;
//     const { error, value } = timerValidationSchema.validate(req.body);
//     if (error) return res.status(400).json({ error: error.details[0].message });
//     const timer = new Timer({ ...value, shop: session.shop });
//     await timer.save();
//     logger.info(`Timer created for ${session.shop}`);
//     res.status(201).json(timer);
//   } catch (err) {
//     logger.error("Error creating timer:", err);
//     res.status(500).json({ error: "Failed to create timer" });
//   }
// });

// app.put("/api/timers/:id", async (req, res) => {
//   try {
//     // @ts-ignore
//     const session = res.locals.shopify.session;
//     const { error, value } = timerValidationSchema.validate(req.body);
//     if (error) return res.status(400).json({ error: error.details[0].message });
//     const timer = await Timer.findOneAndUpdate(
//       { _id: req.params.id, shop: session.shop }, value, { new: true }
//     );
//     res.status(200).json(timer);
//   } catch (err) {
//     logger.error("Error updating timer:", err);
//     res.status(500).json({ error: "Failed to update timer" });
//   }
// });

// app.delete("/api/timers/:id", async (req, res) => {
//   try {
//     // @ts-ignore
//     const session = res.locals.shopify.session;
//     await Timer.findOneAndDelete({ _id: req.params.id, shop: session.shop });
//     res.status(200).json({ success: true });
//   } catch (err) {
//     logger.error("Error deleting timer:", err);
//     res.status(500).json({ error: "Failed to delete timer" });
//   }
// });

// app.get("/api/products/count", async (_req, res) => {
//   // @ts-ignore
//   const client = new shopify.api.clients.Graphql({ session: res.locals.shopify.session });
//   const countData = await client.request(`
//     query { productsCount { count } }
//   `);
//   // @ts-ignore
//   res.status(200).send({ count: countData.data.productsCount.count });
// });

// app.post("/api/products", async (_req, res) => {
//   let status = 200, error = null;
//   try {
//     // @ts-ignore
//     await productCreator(res.locals.shopify.session);
//   } catch (e: any) {
//     logger.error(`Failed to process products/create: ${e.message}`);
//     status = 500; error = e.message;
//   }
//   res.status(status).send({ success: status === 200, error });
// });

// app.use(shopify.cspHeaders());
// app.use(serveStatic(STATIC_PATH, { index: false }));

// app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
//   return res.status(200).set("Content-Type", "text/html").send(
//     readFileSync(join(STATIC_PATH, "index.html")).toString()
//       .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
//   );
// });

// connectDB().then(() => {
//   app.listen(PORT, () => logger.info(`Server listening on port ${PORT}`));
// });


// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import { connectDB } from "./db.js";
import logger from "./logger.js";
import { Timer } from "./models/Timer.js";
import { timerValidationSchema } from "./validation.js";

// @ts-ignore
import shopify from "./shopify.js";
// @ts-ignore
import productCreator from "./product-creator.js";
// @ts-ignore
import PrivacyWebhookHandlers from "./privacy.js";

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// ── Auth + Webhooks ──────────────────────────────────────────────────────────
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

app.use(express.json());

// ── Auto-expiry: mark fixed timers as expired if endDate has passed ──────────
// Runs every 5 minutes — keeps status field accurate without a cron library
setInterval(async () => {
  try {
    const now = new Date();

    // Mark fixed timers as expired if endDate has passed
    const expiredResult = await (Timer as any).updateMany(
      { type: 'fixed', status: 'active', endDate: { $lt: now } },
      { $set: { status: 'expired' } }
    );
    if (expiredResult.modifiedCount > 0) {
      logger.info(`Auto-expired ${expiredResult.modifiedCount} timer(s)`);
    }
  } catch (err) {
    logger.error('Auto-expiry error:', err);
  }
}, 5 * 60 * 1000);

// ── In-memory response cache for storefront API (<200ms target) ───────────────
// Key: `${shop}:${productId}`, TTL: 60s
// Invalidated on timer create/update/delete for that shop
const storefrontCache = new Map<string, { data: object; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

function getCached(key: string) {
  const entry = storefrontCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { storefrontCache.delete(key); return null; }
  return entry.data;
}
function setCache(key: string, data: object) {
  storefrontCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}
function invalidateShopCache(shop: string) {
  for (const key of storefrontCache.keys()) {
    if (key.startsWith(`${shop}:`)) storefrontCache.delete(key);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STOREFRONT API — via Shopify App Proxy
// shopify.app.toml: url = HOST/api/storefront, subpath = countdown, prefix = apps
// /apps/countdown/timers → HOST/api/storefront/timers
// MUST be BEFORE validateAuthenticatedSession
// ─────────────────────────────────────────────────────────────────────────────
app.use("/api/storefront", (_req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.options("/api/storefront/*", (_req, res) => res.status(200).end());

app.get("/api/storefront/timers", async (req, res) => {
  const t0 = Date.now();
  try {
    const { shop, productId } = req.query as { shop?: string; productId?: string };
    if (!shop) return res.status(400).json({ error: "shop is required" });

    // ── Cache hit ────────────────────────────────────────────────────────────
    const cacheKey = `${shop}:${productId || ''}`;
    const cached = getCached(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      res.set('X-Response-Time', `${Date.now() - t0}ms`);
      return res.status(200).json(cached);
    }

    // ── DB query — lean() returns plain objects (~2x faster than full docs) ──
    const rawId = String(productId || '').replace('gid://shopify/Product/', '');
    const gid = `gid://shopify/Product/${rawId}`;

    // Uses compound index { shop, status } — very fast
    const activeTimers = await Timer
      .find({ shop, status: 'active' })
      .lean()
      .exec();

    const nowMs = Date.now();

    let matched = activeTimers.filter((t: any) => {
      // ── startDate guard: don't show timer before its scheduled start ────────
      if (t.startDate && new Date(t.startDate).getTime() > nowMs) {
        return false;
      }

      // ── Targeting filter ────────────────────────────────────────────────────
      if (t.targetType === 'all') return true;
      if (t.targetType === 'products') {
        return t.targetIds.includes(gid) || t.targetIds.includes(rawId);
      }
      // Note: collection matching requires Shopify Admin API lookup to resolve
      // which collections a product belongs to — omitted for performance.
      // Merchants can use "Specific products" targeting as the precise option.
      return false;
    });

    // Specific-product timers first
    matched.sort((a, b) => {
      if (a.targetType === 'products' && b.targetType !== 'products') return -1;
      if (b.targetType === 'products' && a.targetType !== 'products') return 1;
      return 0;
    });

    const payload = { timers: matched };
    setCache(cacheKey, payload);

    res.set('X-Cache', 'MISS');
    res.set('X-Response-Time', `${Date.now() - t0}ms`);
    res.set('Cache-Control', 'public, max-age=60');
    return res.status(200).json(payload);
  } catch (err) {
    logger.error("Storefront timers error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/storefront/timers/impression", async (req, res) => {
  try {
    const { timerId } = req.body;
    if (timerId) {
      // updateOne is faster than findByIdAndUpdate for fire-and-forget
      await Timer.updateOne({ _id: timerId }, { $inc: { impressions: 1 } });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error("Impression error:", err);
    return res.status(500).json({ success: false });
  }
});

// ── All routes below require Shopify session auth ────────────────────────────
app.use("/api/*", shopify.validateAuthenticatedSession());

// ── Admin Timer CRUD ─────────────────────────────────────────────────────────
app.get("/api/timers", async (_req, res) => {
  try {
    // @ts-ignore
    const session = res.locals.shopify.session;
    const timers = await Timer.find({ shop: session.shop })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    res.status(200).json(timers);
  } catch (err) {
    logger.error("Error fetching timers:", err);
    res.status(500).json({ error: "Failed to fetch timers" });
  }
});

app.get("/api/timers/:id", async (req, res) => {
  try {
    // @ts-ignore
    const session = res.locals.shopify.session;
    const timer = await Timer.findOne({ _id: req.params.id, shop: session.shop }).lean();
    if (!timer) return res.status(404).json({ error: "Timer not found" });
    res.status(200).json(timer);
  } catch (err) {
    logger.error("Error fetching timer:", err);
    res.status(500).json({ error: "Failed to fetch timer" });
  }
});

app.post("/api/timers", async (req, res) => {
  try {
    // @ts-ignore
    const session = res.locals.shopify.session;
    const { error, value } = timerValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const timer = new Timer({ ...value, shop: session.shop });
    await timer.save();
    invalidateShopCache(session.shop);
    logger.info(`Timer created for ${session.shop}`);
    res.status(201).json(timer);
  } catch (err) {
    logger.error("Error creating timer:", err);
    res.status(500).json({ error: "Failed to create timer" });
  }
});

app.put("/api/timers/:id", async (req, res) => {
  try {
    // @ts-ignore
    const session = res.locals.shopify.session;
    const { error, value } = timerValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const timer = await Timer.findOneAndUpdate(
      { _id: req.params.id, shop: session.shop },
      value,
      { new: true }
    );
    if (!timer) return res.status(404).json({ error: "Timer not found" });
    invalidateShopCache(session.shop);
    res.status(200).json(timer);
  } catch (err) {
    logger.error("Error updating timer:", err);
    res.status(500).json({ error: "Failed to update timer" });
  }
});

app.delete("/api/timers/:id", async (req, res) => {
  try {
    // @ts-ignore
    const session = res.locals.shopify.session;
    await Timer.findOneAndDelete({ _id: req.params.id, shop: session.shop });
    invalidateShopCache(session.shop);
    res.status(200).json({ success: true });
  } catch (err) {
    logger.error("Error deleting timer:", err);
    res.status(500).json({ error: "Failed to delete timer" });
  }
});

// ── Duplicate a timer (useful for recreating expired ones) ───────────────────
app.post("/api/timers/:id/duplicate", async (req, res) => {
  try {
    // @ts-ignore
    const session = res.locals.shopify.session;
    const original = await Timer.findOne({ _id: req.params.id, shop: session.shop }).lean();
    if (!original) return res.status(404).json({ error: "Timer not found" });

    const { _id, createdAt, updatedAt, impressions, ...rest } = original as any;
    const copy = new Timer({
      ...rest,
      name: `${rest.name} (copy)`,
      status: 'active',
      impressions: 0,
      shop: session.shop,
    });
    await copy.save();
    invalidateShopCache(session.shop);
    res.status(201).json(copy);
  } catch (err) {
    logger.error("Error duplicating timer:", err);
    res.status(500).json({ error: "Failed to duplicate timer" });
  }
});

app.get("/api/products/count", async (_req, res) => {
  // @ts-ignore
  const client = new shopify.api.clients.Graphql({ session: res.locals.shopify.session });
  const countData = await client.request(`query { productsCount { count } }`);
  // @ts-ignore
  res.status(200).send({ count: countData.data.productsCount.count });
});

app.post("/api/products", async (_req, res) => {
  let status = 200, error = null;
  try {
    // @ts-ignore
    await productCreator(res.locals.shopify.session);
  } catch (e: any) {
    logger.error(`Failed to process products/create: ${e.message}`);
    status = 500; error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res.status(200).set("Content-Type", "text/html").send(
    readFileSync(join(STATIC_PATH, "index.html")).toString()
      .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
  );
});

connectDB().then(() => {
  app.listen(PORT, () => logger.info(`Server listening on port ${PORT}`));
});