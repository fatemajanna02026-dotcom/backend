const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const nodemailer = require("nodemailer");
require("dotenv").config();
const ADMIN_WP = process.env.ADMIN_WP || "8801775113977";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";


const app = express();
app.use(cors());
app.use(express.json());
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");

// ==================== MONGODB CONNECTION ====================
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/nobodeal";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ==================== MODELS ====================
const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");
const Category = require("./models/Category");
const PageLayout = require("./models/PageLayout");

const orderSchema = new mongoose.Schema({
  id: String,
  date: Date,
  status: String,
  userEmail: String,
  userName: String,
  userPhone: String,
  userAddress: String,
  items: Array,
  subtotal: Number,
  deliveryFee: Number,
  deliveryZone: String,
  total: Number,
  paymentMethod: String,
  latitude: Number,
  longitude: Number,
  pageUrl: { type: String, default: "" },   // ✅ যোগ করুন
  storeUrl: { type: String, default: "" },  // ✅ যোগ করুন
});

// ---------- LayoutSection Model ----------
const layoutSectionSchema = new mongoose.Schema({
  id: String,
  type: String,
  title: String,
  enabled: Boolean,
  order: Number,
  bg: { type: String, default: "#ffffff" },
  padding: { type: String, default: "40px 0" },
});
const LayoutSection = mongoose.model("LayoutSection", layoutSectionSchema);

// ---------- Complete Setting Model (Advanced Settings) ----------
const settingSchema = new mongoose.Schema(
  {
    // General
    siteName: { type: String, default: "AI Store" },
    tagline: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    address: { type: String, default: "" },
    currencySymbol: { type: String, default: "$" },
    currencyCode: { type: String, default: "USD" },
    timezone: { type: String, default: "UTC" },
    openRouterApiKey: { type: String, default: "" },
    googleMapsKey: { type: String, default: "" },

    // Design
    primaryColor: { type: String, default: "#e94560" },
    secondaryColor: { type: String, default: "#1a1a2e" },
    accentColor: { type: String, default: "#f39c12" },
    successColor: { type: String, default: "#2ecc71" },
    dangerColor: { type: String, default: "#e74c3c" },
    bgColor: { type: String, default: "#f8f9fa" },
    cardBg: { type: String, default: "#ffffff" },
    textColor: { type: String, default: "#333333" },
    darkMode: { type: Boolean, default: false },
    fontFamily: { type: String, default: "'Poppins', sans-serif" },
    headingFont: { type: String, default: "" },
    baseFontSize: { type: String, default: "16px" },
    lineHeight: { type: String, default: "1.6" },
    borderRadius: { type: String, default: "8px" },
    boxShadow: { type: String, default: "0 4px 12px rgba(0,0,0,0.1)" },
    animationSpeed: { type: String, default: "0.3s" },
    containerMaxWidth: { type: String, default: "1200px" },
    footerText: { type: String, default: "© 2026 AI Store" },

    // SEO & Analytics
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    canonicalUrl: { type: String, default: "" },
    googleAnalyticsId: { type: String, default: "" },
    fbPixelId: { type: String, default: "" },
    tiktokPixelId: { type: String, default: "" },
    hotjarId: { type: String, default: "" },
    sitemapEnabled: { type: Boolean, default: true },
    robotsEnabled: { type: Boolean, default: true },
    schemaEnabled: { type: Boolean, default: false },

    // Payment Methods
    enableCOD: { type: Boolean, default: true },
    enableStripe: { type: Boolean, default: false },
    enablePayPal: { type: Boolean, default: false },
    enableBkash: { type: Boolean, default: false },
    enableNagad: { type: Boolean, default: false },
    enableSSLCommerz: { type: Boolean, default: false },
    stripePublishableKey: { type: String, default: "" },
    stripeSecretKey: { type: String, default: "" },
    bkashAppKey: { type: String, default: "" },
    bkashAppSecret: { type: String, default: "" },
    bkashUsername: { type: String, default: "" },
    bkashPassword: { type: String, default: "" },
    taxRate: { type: Number, default: 0 },
    taxIncluded: { type: Boolean, default: false },

    // Shipping
    defaultShipping: { type: Number, default: 0 },
    freeShippingMinimum: { type: Number, default: 0 },
    dhakaShipping: { type: Number, default: 60 },
    outsideDhakaShipping: { type: Number, default: 120 },
    internationalShipping: { type: Number, default: 500 },
    enableLocalPickup: { type: Boolean, default: false },
    deliveryMin: { type: Number, default: 3 },
    deliveryMax: { type: Number, default: 7 },
    shippingMessage: { type: String, default: "" },

    // Email (SMTP & Notifications)
    smtpHost: { type: String, default: "" },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: "" },
    smtpPassword: { type: String, default: "" },
    fromEmail: { type: String, default: "" },
    fromName: { type: String, default: "" },
    emailOrderConfirm: { type: Boolean, default: true },
    emailShipNotify: { type: Boolean, default: true },
    emailDelivered: { type: Boolean, default: true },
    emailNewUser: { type: Boolean, default: true },
    emailAdminNewOrder: { type: Boolean, default: true },
    emailLowStock: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 5 },

    // Social Media
    facebookUrl: { type: String, default: "" },
    instagramUrl: { type: String, default: "" },
    twitterUrl: { type: String, default: "" },
    youtubeUrl: { type: String, default: "" },
    tiktokUrl: { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
    pinterestUrl: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    telegramUrl: { type: String, default: "" },
    googleLogin: { type: Boolean, default: false },
    googleClientId: { type: String, default: "" },
    facebookLogin: { type: Boolean, default: false },
    facebookAppId: { type: String, default: "" },

    // Popup & Chat
    enableChat: { type: Boolean, default: false },
    chatPosition: { type: String, default: "bottom-right" },
    chatBotName: { type: String, default: "Support Bot" },
    chatWelcome: { type: String, default: "" },
    enablePopup: { type: Boolean, default: false },
    popupTitle: { type: String, default: "" },
    popupMessage: { type: String, default: "" },
    popupDelay: { type: Number, default: 3 },
    showOnExitIntent: { type: Boolean, default: false },
    announcementBar: { type: Boolean, default: false },
    announcementText: { type: String, default: "" },
    announcementBg: { type: String, default: "#e94560" },

    // Store Features
    enableReviews: { type: Boolean, default: true },
    enableWishlist: { type: Boolean, default: true },
    enableCompare: { type: Boolean, default: false },
    enableMultiCurrency: { type: Boolean, default: false },
    enableMultiLanguage: { type: Boolean, default: false },
    enableGuestCheckout: { type: Boolean, default: false },
    enableCoupon: { type: Boolean, default: false },
    enableLoyaltyPoints: { type: Boolean, default: false },
    enableStockAlert: { type: Boolean, default: false },
    enableAffiliate: { type: Boolean, default: false },
    enableProductZoom: { type: Boolean, default: false },
    enableQuickView: { type: Boolean, default: false },
    enableSizeGuide: { type: Boolean, default: false },
    enableReturnPolicy: { type: Boolean, default: false },
    enableMaintenance: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "We'll be back soon!" },

    // Custom Code
    customCSS: { type: String, default: "" },
    customJS: { type: String, default: "" },
    customHTML: { type: String, default: "" },

    // Homepage & Navbar
    navbarMaxVisible: { type: Number, default: 5 },
    featuredProductIds: { type: [Number], default: [] },
    sliderAutoPlay: { type: Boolean, default: true },
    sliderInterval: { type: Number, default: 4500 },
    sliderShowArrows: { type: Boolean, default: true },
    sliderShowDots: { type: Boolean, default: true },
    categoryMessages: { type: Object, default: {} },

    // Additional
    promoBanner: {
      text: { type: String, default: "" },
      bg: { type: String, default: "#e94560" },
      link: { type: String, default: "" },
      visible: { type: Boolean, default: true },
    },
    productsPerRow: { type: String, default: "4" },
    googleFontUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

const Setting = mongoose.model("Setting", settingSchema);



// ==================== ADMIN BOT HELPERS ==================== 

const BD_PHONE_PREFIXES = ["013","014","015","016","017","018","019"];
const HIGH_RISK_CATEGORIES = ["electronics","fashion","mobile","laptop","watch","jewelry"];

const isValidBDPhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  return BD_PHONE_PREFIXES.includes(digits.substring(0, 3));
};

const isValidAddress = (address) => {
  if (!address || typeof address !== "string") return false;
  if (address.length < 15) return false;
  const keywords = ["রোড","সড়ক","লেন","বাড়ি","এপার্টমেন্ট","হাউজিং","আবাসিক","রাস্তা","গলি","স্ট্রিট","এভিনিউ","ব্লক","সেক্টর"];
  const hasKeyword = keywords.some((k) => address.includes(k));
  const words = address.split(/\s+/).filter((w) => w.length > 1);
  return hasKeyword && words.length >= 2;
};

const hasRapidOrders = (timestamps) => {
  if (timestamps.length < 2) return false;
  const sorted = [...timestamps].sort((a, b) => new Date(a) - new Date(b));
  for (let i = 1; i < sorted.length; i++) {
    if (new Date(sorted[i]) - new Date(sorted[i - 1]) < 60000) return true;
  }
  return false;
};

const calculateFraudScore = (data) => {
  let score = 100;
  const { total, returned, codCount, codCancelled, uniqueAddresses, hasRapidOrders: rapid, highRiskCount, invalidAddressCount, invalidPhone, maxEmailPhones, maxIPPhones, maxAddressPhones, hasEmailWith5Plus, maxLocationPhones, maxDevicePhones, maxBrowserPhones, maxOSPhones, maxScreenPhones } = data;
  if (returned >= 3) score -= 15; else if (returned === 2) score -= 10; else if (returned === 1) score -= 5;
  if (total >= 3) { const codPct = (codCount / total) * 100; if (codPct > 80) score -= 8; else if (codPct > 60) score -= 5; }
  if (codCount > 0) { const rate = (codCancelled / codCount) * 100; if (rate > 50) score -= 8; else if (rate > 30) score -= 5; }
  if (uniqueAddresses > 5) score -= 8; else if (uniqueAddresses === 5) score -= 5;
  if (rapid) score -= 8;
  if (total > 0) { const hrPct = (highRiskCount / total) * 100; if (hrPct > 50) score -= 8; else if (hrPct > 30) score -= 5; }
  if (total > 0) { const iaPct = (invalidAddressCount / total) * 100; if (iaPct > 50) score -= 10; else if (iaPct > 33) score -= 5; }
  if (invalidPhone) score -= 50;
  if (maxEmailPhones > 3) score -= 8;
  if (maxIPPhones > 3) score -= 8;
  if (maxAddressPhones > 5) score -= 10; else if (maxAddressPhones >= 3) score -= 8; else if (maxAddressPhones === 2) score -= 5;
  if (hasEmailWith5Plus) score -= 25;
  if (maxLocationPhones > 3) score -= 8;
  if (maxDevicePhones > 2) score -= 10; else if (maxDevicePhones === 2) score -= 5;
  if (maxBrowserPhones > 3) score -= 8;
  if (maxOSPhones > 3) score -= 8;
  if (maxScreenPhones > 3) score -= 5;
  return score;
};

const getFraudulentOrders = async () => {
  const orders = await Order.find().lean();
  if (!orders.length) return [];
  const phoneMap = new Map();
  const emailToPhones = new Map(), ipToPhones = new Map(), addressToPhones = new Map();
  const locationToPhones = new Map(), deviceToPhones = new Map(), browserToPhones = new Map();
  const osToPhones = new Map(), screenToPhones = new Map();

  for (const order of orders) {
    const phone = order.userPhone;
    if (!phone) continue;
    if (!phoneMap.has(phone)) {
      phoneMap.set(phone, {
        total:0, returned:0, codCount:0, codCancelled:0,
        addresses:new Set(), timestamps:[], orders:[],
        highRiskCount:0, invalidAddressCount:0,
        emails:new Set(), ips:new Set(), locations:new Set(),
        devices:new Set(), browsers:new Set(), os:new Set(), screens:new Set()
      });
    }
    const d = phoneMap.get(phone);
    d.total++; d.orders.push(order);
    if (order.userEmail) d.emails.add(order.userEmail);
    if (order.userIP) d.ips.add(order.userIP);
    if (order.userLocation) d.locations.add(order.userLocation);
    if (order.userDevice) d.devices.add(order.userDevice);
    if (order.userBrowser) d.browsers.add(order.userBrowser);
    if (order.userOS) d.os.add(order.userOS);
    if (order.userScreenSize) d.screens.add(order.userScreenSize);
    if (order.userAddress) {
      d.addresses.add(order.userAddress);
      if (!isValidAddress(order.userAddress)) d.invalidAddressCount++;
      if (!addressToPhones.has(order.userAddress)) addressToPhones.set(order.userAddress, new Set());
      addressToPhones.get(order.userAddress).add(phone);
    }
    if (order.date) d.timestamps.push(order.date);
    if (order.status === "Returned" || order.status === "Cancelled") d.returned++;
    if (order.paymentMethod === "COD") {
      d.codCount++;
      if (order.status === "Cancelled" || order.status === "Returned") d.codCancelled++;
    }
    if (order.items) {
      for (const item of order.items) {
        const product = item.product || item;
        if (product.category && HIGH_RISK_CATEGORIES.includes(product.category.toLowerCase())) d.highRiskCount++;
      }
    }
    if (order.userEmail) { if (!emailToPhones.has(order.userEmail)) emailToPhones.set(order.userEmail, new Set()); emailToPhones.get(order.userEmail).add(phone); }
    if (order.userIP) { if (!ipToPhones.has(order.userIP)) ipToPhones.set(order.userIP, new Set()); ipToPhones.get(order.userIP).add(phone); }
    if (order.userLocation) { if (!locationToPhones.has(order.userLocation)) locationToPhones.set(order.userLocation, new Set()); locationToPhones.get(order.userLocation).add(phone); }
    if (order.userDevice) { if (!deviceToPhones.has(order.userDevice)) deviceToPhones.set(order.userDevice, new Set()); deviceToPhones.get(order.userDevice).add(phone); }
    if (order.userBrowser) { if (!browserToPhones.has(order.userBrowser)) browserToPhones.set(order.userBrowser, new Set()); browserToPhones.get(order.userBrowser).add(phone); }
    if (order.userOS) { if (!osToPhones.has(order.userOS)) osToPhones.set(order.userOS, new Set()); osToPhones.get(order.userOS).add(phone); }
    if (order.userScreenSize) { if (!screenToPhones.has(order.userScreenSize)) screenToPhones.set(order.userScreenSize, new Set()); screenToPhones.get(order.userScreenSize).add(phone); }
  }

  const suspicious = [];
  for (const [phone, data] of phoneMap.entries()) {
    let maxEmailPhones = 0, hasEmailWith5Plus = false;
    for (const email of data.emails) { const cnt = emailToPhones.get(email)?.size || 0; if (cnt > maxEmailPhones) maxEmailPhones = cnt; if (cnt >= 5) hasEmailWith5Plus = true; }
    let maxIPPhones = 0; for (const ip of data.ips) { const cnt = ipToPhones.get(ip)?.size || 0; if (cnt > maxIPPhones) maxIPPhones = cnt; }
    let maxAddressPhones = 0; for (const addr of data.addresses) { const cnt = addressToPhones.get(addr)?.size || 0; if (cnt > maxAddressPhones) maxAddressPhones = cnt; }
    let maxLocationPhones = 0; for (const loc of data.locations) { const cnt = locationToPhones.get(loc)?.size || 0; if (cnt > maxLocationPhones) maxLocationPhones = cnt; }
    let maxDevicePhones = 0; for (const dev of data.devices) { const cnt = deviceToPhones.get(dev)?.size || 0; if (cnt > maxDevicePhones) maxDevicePhones = cnt; }
    let maxBrowserPhones = 0; for (const br of data.browsers) { const cnt = browserToPhones.get(br)?.size || 0; if (cnt > maxBrowserPhones) maxBrowserPhones = cnt; }
    let maxOSPhones = 0; for (const o of data.os) { const cnt = osToPhones.get(o)?.size || 0; if (cnt > maxOSPhones) maxOSPhones = cnt; }
    let maxScreenPhones = 0; for (const scr of data.screens) { const cnt = screenToPhones.get(scr)?.size || 0; if (cnt > maxScreenPhones) maxScreenPhones = cnt; }

    const score = calculateFraudScore({
      total: data.total, returned: data.returned, codCount: data.codCount,
      codCancelled: data.codCancelled, uniqueAddresses: data.addresses.size,
      hasRapidOrders: hasRapidOrders(data.timestamps),
      highRiskCount: data.highRiskCount, invalidAddressCount: data.invalidAddressCount,
      invalidPhone: !isValidBDPhone(phone),
      maxEmailPhones, maxIPPhones, maxAddressPhones, hasEmailWith5Plus,
      maxLocationPhones, maxDevicePhones, maxBrowserPhones, maxOSPhones, maxScreenPhones,
    });
    if (score <= 50) suspicious.push({ phone, total: data.total, returned: data.returned, score });
  }
  return suspicious.sort((a,b) => a.score - b.score);
};

// AI Command Parser
const parseCommandWithAI = async (userText, apiKey) => {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5000",
        "X-Title": "NoboDeal Admin Bot"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: `You parse admin commands for NoboDeal e-commerce bot. Output ONLY JSON with "intent" and "params".
Intents: list_orders, list_pending_orders, get_order, update_order_status, delete_order, list_products, delete_product, list_categories, add_category, delete_category, list_users, delete_user, get_stats, check_scammers, check_fraud_phone, get_settings, update_shipping, help.
Examples:
"সব অর্ডার দেখাও" -> {"intent":"list_orders"}
"order ORD-123 delivered" -> {"intent":"update_order_status","params":{"id":"ORD-123","status":"Delivered"}}
"product 69 delete" -> {"intent":"delete_product","params":{"id":"69"}}
"category যোগ করো Electronics" -> {"intent":"add_category","params":{"name":"Electronics"}}
"scammer check" -> {"intent":"check_scammers"}
"01XXXXXXXXX fraud" -> {"intent":"check_fraud_phone","params":{"phone":"01XXXXXXXXX"}}
"dhaka shipping 80" -> {"intent":"update_shipping","params":{"zone":"dhaka","amount":80}}` },
          { role: "user", content: userText }
        ],
        temperature: 0.1,
        max_tokens: 256
      })
    });
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) return null;
    return JSON.parse(m[0]);
  } catch (e) {
    console.error("AI parse error:", e);
    return null;
  }
};

// Command Executor
const executeCommand = async (intent, params = {}, originalText = "") => {
  switch (intent) {
    case "list_orders": {
      const orders = await Order.find().sort({ date: -1 }).limit(15).lean();
      if (!orders.length) return "📦 কোনো অর্ডার নেই।";
      return `📦 *সর্বশেষ অর্ডার:*\n\n` + orders.map(o => `• *${o.id}* | ${o.userName||"N/A"} | ${o.userPhone||""} | ${o.status} | ৳${o.total}`).join("\n");
    }
    case "list_pending_orders": {
      const orders = await Order.find({ status: "Pending" }).sort({ date: -1 }).limit(15).lean();
      if (!orders.length) return "✅ কোনো pending অর্ডার নেই।";
      return `🆕 *Pending অর্ডার:*\n\n` + orders.map(o => `• *${o.id}* | ${o.userName||"N/A"} | 📞 ${o.userPhone||""} | ৳${o.total}\n📍 ${o.userAddress||"N/A"}`).join("\n\n");
    }
    case "get_order": {
      const id = params?.id || originalText.match(/ORD-\d+/i)?.[0];
      if (!id) return "❌ Order ID দিন।";
      const o = await Order.findOne({ id: id.toUpperCase() }).lean();
      if (!o) return `❌ ${id} পাওয়া যায়নি।`;
      const items = (o.items||[]).map(item => {
        const p = item.product || item;
        return `• ${p.name||"Unknown"} x${item.quantity||1} = ৳${(p.price||0)*(item.quantity||1)}`;
      }).join("\n");
      return `📦 *${o.id}*\n👤 ${o.userName||"N/A"}\n📞 ${o.userPhone||"N/A"}\n📍 ${o.userAddress||"N/A"}\n💰 ৳${o.total} | ${o.paymentMethod||"COD"}\n🚚 ${o.deliveryZone==="inside"?"ঢাকার ভেতরে":"ঢাকার বাইরে"}\n📌 Status: *${o.status}*\n🕐 ${o.date?new Date(o.date).toLocaleString("bn-BD"):"N/A"}\n\n🛍️ পণ্য:\n${items}`;
    }
    case "update_order_status": {
      const id = params?.id || originalText.match(/ORD-\d+/i)?.[0];
      let status = params?.status;
      if (!status) {
        const s = originalText.match(/(delivered|shipped|processing|pending|cancelled|cancel)/i)?.[1];
        if (s) status = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        if (status === "Cancel") status = "Cancelled";
      }
      if (!id || !status) return "❌ Order ID এবং status দিন।";
      await Order.findOneAndUpdate({ id: id.toUpperCase() }, { status });
      return `✅ *${id}* → *${status}* করা হয়েছে।`;
    }
    case "delete_order": {
      const id = params?.id || originalText.match(/ORD-\d+/i)?.[0];
      if (!id) return "❌ Order ID দিন।";
      await Order.deleteOne({ id: id.toUpperCase() });
      return `🗑️ *${id}* মুছে ফেলা হয়েছে।`;
    }
    case "list_products": {
      const products = await Product.find().sort({ createdAt: -1 }).limit(20).lean();
      if (!products.length) return "🛍️ কোনো প্রোডাক্ট নেই।";
      return `🛍️ *প্রোডাক্ট লিস্ট:*\n\n` + products.map(p => `• [${p.id}] *${p.name}* — ৳${p.price} (${p.category})`).join("\n");
    }
    case "delete_product": {
      const id = parseInt(params?.id || originalText.match(/product\s+(\d+)/i)?.[1]);
      if (!id) return "❌ Product ID দিন।";
      await Product.deleteOne({ id });
      return `🗑️ Product [${id}] মুছে ফেলা হয়েছে।`;
    }
    case "list_categories": {
      const cats = await Category.find().lean();
      return `📂 *Categories:*\n` + cats.map((c,i) => `${i+1}. ${c.name}`).join("\n");
    }
    case "add_category": {
      const name = params?.name || originalText.replace(/.*যোগ করো\s+/i, "").replace(/.*add\s+/i, "").trim();
      if (!name) return "❌ Category নাম দিন।";
      const exists = await Category.findOne({ name: new RegExp(`^${name}$`, "i") });
      if (exists) return `⚠️ "${name}" আগে থেকেই আছে।`;
      await new Category({ name }).save();
      return `✅ "${name}" category যোগ হয়েছে।`;
    }
    case "delete_category": {
      const name = params?.name || originalText.replace(/.*মুছো\s+/i, "").replace(/.*delete\s+/i, "").trim();
      if (!name) return "❌ Category নাম দিন।";
      if (name === "Home") return "❌ Home category মুছা যাবে না।";
      await Category.deleteOne({ name });
      return `🗑️ "${name}" category মুছে ফেলা হয়েছে।`;
    }
    case "list_users": {
      const users = await User.find().select("-password").limit(15).lean();
      return `👥 *Users (${users.length} জন):*\n\n` + users.map(u => `• ${u.name||"N/A"} | ${u.email} | ${u.role} | Orders: ${u.orderCount||0}`).join("\n");
    }
    case "delete_user": {
      const email = params?.email || originalText.match(/[^\s]+@[^\s]+/)?.[0];
      if (!email) return "❌ Email দিন।";
      await User.deleteOne({ email: email.toLowerCase() });
      return `🗑️ User ${email} মুছে ফেলা হয়েছে।`;
    }
    case "get_stats": {
      const [totalUsers, totalProducts, totalOrders] = await Promise.all([
        User.countDocuments(), Product.countDocuments(), Order.countDocuments()
      ]);
      const revenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]);
      const totalRevenue = revenue[0]?.total || 0;
      return `📊 *Dashboard Stats:*\n\n👥 মোট User: ${totalUsers}\n🛍️ মোট Product: ${totalProducts}\n📦 মোট Order: ${totalOrders}\n💰 মোট Revenue: ৳${totalRevenue}`;
    }
    case "check_scammers": {
      const suspicious = await getFraudulentOrders();
      if (!suspicious.length) return "✅ কোনো suspicious activity পাওয়া যায়নি।";
      return `🚨 *Suspicious Accounts (${suspicious.length}টি):*\n\n` + suspicious.slice(0,10).map(s => `• ${s.phone} | Score: ${s.score}/100 | Orders: ${s.total} | Returned: ${s.returned}`).join("\n");
    }
    case "check_fraud_phone": {
      const phone = params?.phone || originalText.match(/01\d{9}/)?.[0];
      if (!phone) return "❌ 11-digit phone number দিন।";
      const all = await getFraudulentOrders();
      const found = all.find(a => a.phone === phone);
      if (!found) return `✅ ${phone} — Risk Score: 100/100 (Safe)`;
      return `🚨 *${phone} Fraud Report:*\nRisk Score: ${found.score}/100\nTotal Orders: ${found.total}\nReturned/Cancelled: ${found.returned}\n⚠️ High Risk!`;
    }
    case "get_settings": {
      const s = await Setting.findOne().lean() || {};
      return `⚙️ *Settings:*\n🏪 ${s.siteName||"N/A"}\n📞 ${s.contactPhone||"N/A"}\n📧 ${s.contactEmail||"N/A"}\n🚚 Dhaka: ৳${s.dhakaShipping||60} | Outside: ৳${s.outsideDhakaShipping||120}`;
    }
    case "update_shipping": {
      const zone = params?.zone || (originalText.match(/dhaka|ঢাকা/i) ? "dhaka" : "outside");
      const amount = parseInt(params?.amount || originalText.match(/\d+/)?.[0]);
      if (!amount) return "❌ Amount দিন।";
      const update = zone === "dhaka" ? { dhakaShipping: amount } : { outsideDhakaShipping: amount };
      await Setting.findOneAndUpdate({}, update, { upsert: true });
      return `✅ ${zone === "dhaka" ? "ঢাকার" : "ঢাকার বাইরের"} shipping ৳${amount} করা হয়েছে।`;
    }
    case "help":
      return `🛠️ *Commands:*\norders | pending | order ORD-123 | deliver ORD-123 | cancel ORD-123 | delete ORD-123 | products | delete product 123 | categories | add category X | delete category X | users | delete user email | stats | scammer check | fraud 01XXXXXXXXX | settings | dhaka shipping 60 | help`;
    default:
      return null;
  }
};




// ==================== MULTER (memory storage) ====================
const upload = multer({ storage: multer.memoryStorage() });

// ==================== NODEMAILER TRANSPORTER ====================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const otpStore = {};

// ==================== WHATSAPP WEB BOT ====================
// ==================== WHATSAPP WEB BOT ====================
let wpClient = null;
let wpQRCode = null;
let wpStatus = "disconnected"; 
 
const initWPClient = () => {
  if (wpClient) {
    try { wpClient.destroy(); } catch (e) {}
    wpClient = null;
  }
 
  wpClient = new Client({
    authStrategy: new LocalAuth({ dataPath: "./.wp-session" }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    },
  });
 
  wpStatus = "connecting";
 
  wpClient.on("qr", async (qr) => {
    wpStatus = "qr";
    wpQRCode = await qrcode.toDataURL(qr);
    console.log("📱 WhatsApp QR Code ready — Admin Panel থেকে scan করুন");
  });
 
  wpClient.on("authenticated", () => {
    wpStatus = "authenticated";
    wpQRCode = null;
    console.log("🔐 WhatsApp authenticated!");
  });
 
  wpClient.on("ready", () => {
    wpStatus = "connected";
    wpQRCode = null;
    console.log("✅ WhatsApp Bot সফলভাবে connected!");
 
    // ── Auto Order Alert to Admin ──
    app.locals.sendNewOrderWPAlert = async (order) => {
      try {
        const settings = (await Setting.findOne()) || {};
        const chatId = `${ADMIN_WP}@c.us`;
        const baseUrl = order.storeUrl || order.pageUrl || process.env.FRONTEND_URL || "";

        const itemsList = (order.items || [])
          .map((item) => {
            const p = item.product || item;
            const productId = p.id || p._id;
            const productLink = (baseUrl && productId) ? `${baseUrl}/product/${productId}` : "Link unavailable";
            return `  • *${p.name || "Unknown"}* x${item.quantity || 1} — ৳${(p.price || 0) * (item.quantity || 1)}\n    🔗 ${productLink}`;
          })
          .join("\n\n");

        const sourceLink = order.pageUrl || order.storeUrl || process.env.FRONTEND_URL || "N/A";

        const message =
          `📦 *নতুন অর্ডার এসেছে! (${settings.siteName || "NoboDeal"})*\n\n` +
          `🆔 *Order ID:* ${order.id}\n` +
          `👤 *নাম:* ${order.userName || "N/A"}\n` +
          `📞 *ফোন:* ${order.userPhone || "N/A"}\n` +
          `📍 *ঠিকানা:* ${order.userAddress || "N/A"}\n\n` +
          `🛍️ *পণ্য তালিকা:*\n${itemsList}\n\n` +
          `🔗 *অর্ডার করা হয়েছে এই পেজ থেকে:* \n${sourceLink}\n\n` +
          `💵 *Total: ৳${order.total || 0}*`;

        if (wpClient && wpStatus === "connected") {
          await wpClient.sendMessage(chatId, message);
          console.log("✅ Order Alert Sent to Admin!");
        }
      } catch (err) {
        console.error("❌ WP Alert Error:", err.message);
      }
    };

    // ── Customer Confirmation ──
    app.locals.sendOrderConfirmationToCustomer = async (order) => {
      try {
        const settings = (await Setting.findOne()) || {};
        const customerPhone = order.userPhone?.replace(/\D/g, "");
        if (!customerPhone) return;
        const chatId = `${customerPhone}@c.us`;
        const message =
          `🙏 *ধন্যবাদ ${order.userName || "Customer"}!*\n\n` +
          `আপনার অর্ডার *${settings.siteName || "NoboDeal"}* তে সফলভাবে গৃহীত হয়েছে।\n\n` +
          `📦 *Order ID:* ${order.id}\n` +
          `💵 *Total: ৳${order.total || 0}*\n` +
          `🚛 *Delivery:* ${order.deliveryZone === "inside" ? "ঢাকার ভিতরে" : "ঢাকার বাইরে"} (৳${order.deliveryFee || 0})\n\n` +
          `⏳ আমরা শীঘ্রই আপনার অর্ডার প্রসেস করবো।\n` +
          `📞 প্রয়োজনে যোগাযোগ করুন: ${settings.contactPhone || ADMIN_WP}`;

        if (wpClient && wpStatus === "connected") {
          await wpClient.sendMessage(chatId, message);
          console.log("✅ Confirmation sent to customer!");
        }
      } catch (err) {
        console.error("❌ Customer WP Error:", err.message);
      }
    };

    // ── ADMIN CHATBOT COMMAND HANDLER ──
    wpClient.on("message", async (msg) => {
      const adminChatId = `${ADMIN_WP}@c.us`;
      if (msg.from !== adminChatId) return; // শুধু Admin এর মেসেজ রিসিভ করবে
      const txt = msg.body.trim();
      if (!txt) return;

      console.log("📩 Admin CMD:", txt);
      let reply = "";
      const lower = txt.toLowerCase();

      // Fast direct matches (no API cost)
      if (lower === "help" || lower === "সাহায্য" || lower === "কমান্ড" || lower.includes("কী কী করতে পারো")) {
        reply = `🛠️ *NoboDeal Admin Bot*

📦 *Orders:*
• "সব অর্ডার" / "all orders"
• "pending" / "নতুন অর্ডার"
• "order ORD-123" — details
• "deliver ORD-123" / "cancel ORD-123" / "delete ORD-123"

🛍️ *Products:*
• "products" / "সব প্রোডাক্ট"
• "delete product 123"

📂 *Category:*
• "add category Electronics"
• "delete category Electronics"

👥 *Users:*
• "users" / "সব user"
• "delete user abc@email.com"

📊 *Stats:*
• "stats" / "dashboard"

🚨 *Fraud:*
• "scammer check"
• "fraud 01XXXXXXXXX"

⚙️ *Settings:*
• "settings"
• "dhaka shipping 60"

Bangla/English মিক্স করে লিখতে পারেন। AI বুঝে নিবে।`;
      } else if (lower.includes("সব অর্ডার") || (lower.includes("all") && lower.includes("order"))) {
        reply = await executeCommand("list_orders");
      } else if (lower.includes("pending") || lower.includes("নতুন অর্ডার")) {
        reply = await executeCommand("list_pending_orders");
      }

      // If no direct match → use OpenRouter AI parser
      if (!reply) {
        const settings = await Setting.findOne() || {};
        const key = settings.openRouterApiKey || process.env.OPENROUTER_API_KEY;
        if (key) {
          const parsed = await parseCommandWithAI(txt, key);
          if (parsed && parsed.intent && parsed.intent !== "unknown") {
            reply = await executeCommand(parsed.intent, parsed.params, txt);
          }
        }
      }

      // Final fallback regex for order actions if AI fails
      if (!reply) {
        const orderActionMatch = txt.match(/(delivered|deliver|ship|processing|pending|cancelled|cancel|delete)\s+(ORD-\d+)/i);
        if (orderActionMatch) {
          const actionRaw = orderActionMatch[1].toLowerCase();
          const id = orderActionMatch[2].toUpperCase();
          if (actionRaw === "delete") {
            await Order.deleteOne({ id });
            reply = `🗑️ *${id}* মুছে ফেলা হয়েছে।`;
          } else {
            let status = actionRaw.charAt(0).toUpperCase() + actionRaw.slice(1);
            if (status === "Cancel") status = "Cancelled";
            if (status === "Deliver") status = "Delivered";
            if (status === "Ship") status = "Shipped";
            await Order.findOneAndUpdate({ id }, { status });
            reply = `✅ *${id}* → *${status}* করা হয়েছে।`;
          }
        }
      }

      if (!reply) reply = "❌ বুঝতে পারিনি। *help* লিখে command list দেখুন।";
      await wpClient.sendMessage(adminChatId, reply);
    });

    console.log("🤖 WhatsApp Admin ChatBot active — send 'help' to your own number");
  });
 
  wpClient.on("auth_failure", (msg) => {
    wpStatus = "disconnected";
    wpQRCode = null;
    wpClient = null;
    app.locals.sendNewOrderWPAlert = null;
    app.locals.sendOrderConfirmationToCustomer = null;
    console.log("❌ WhatsApp Auth Failed:", msg);
  });
 
  wpClient.on("disconnected", (reason) => {
    wpStatus = "disconnected";
    wpQRCode = null;
    wpClient = null;
    app.locals.sendNewOrderWPAlert = null;
    app.locals.sendOrderConfirmationToCustomer = null;
    console.log("📴 WhatsApp disconnected:", reason);
  });
 
  wpClient.initialize();
}; 
// ==================== WP API ENDPOINTS ====================
 
// Status check
app.get("/wp/status", (req, res) => {
  res.json({
    status: wpStatus,
    qr: wpQRCode,
    connected: wpStatus === "connected",
  });
});
 
// Connect
app.post("/wp/connect", (req, res) => {
  if (wpStatus === "connected") {
    return res.json({ success: true, message: "Already connected" });
  }
  if (wpStatus === "connecting" || wpStatus === "qr") {
    return res.json({ success: true, message: "Already connecting..." });
  }
  try {
    initWPClient();
    res.json({ success: true, message: "Connecting..." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// Disconnect
app.post("/wp/disconnect", async (req, res) => {
  try {
    if (wpClient) {
      await wpClient.destroy();
      wpClient = null;
    }
    wpStatus = "disconnected";
    wpQRCode = null;
    app.locals.sendNewOrderWPAlert = null;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// Send message
app.post("/wp/send", async (req, res) => {
  const { phone, message } = req.body;
 
  if (wpStatus !== "connected" || !wpClient) {
    return res.status(400).json({
      success: false,
      message: "WhatsApp connected নেই। QR scan করুন।",
    });
  }
 
  if (!phone || !message) {
    return res.status(400).json({
      success: false,
      message: "Phone ও message required",
    });
  }
 
  try {
    const digits = phone.replace(/\D/g, "");
    const chatId = digits + "@c.us";
    await wpClient.sendMessage(chatId, message);
    res.json({ success: true, message: "Message sent!" });
  } catch (err) {
    console.error("WP send error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// Bulk send (multiple phones)
app.post("/wp/send-bulk", async (req, res) => {
  const { phones, message } = req.body;
 
  if (wpStatus !== "connected" || !wpClient) {
    return res.status(400).json({ success: false, message: "WP not connected" });
  }
 
  const results = [];
  for (const phone of phones) {
    try {
      const chatId = phone.replace(/\D/g, "") + "@c.us";
      await wpClient.sendMessage(chatId, message);
      results.push({ phone, success: true });
      await new Promise((r) => setTimeout(r, 1000)); // 1s delay between messages
    } catch (err) {
      results.push({ phone, success: false, error: err.message });
    }
  }
 
  res.json({ success: true, results });
});
 
// ==================== USER ROUTES ====================
app.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;
    email = email.toLowerCase().trim();
    const existing = await User.findOne({ email });
    if (existing)
      return res.json({ success: false, message: "Email already exists!" });

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const role = email === "sabbirmolla801@gmail.com" ? "admin" : "user";
    const newUser = new User({
      name,
      email,
      password,
      role,
      loginCount: 0,
      lastLogin: null,
      lastIp: ip,
      orderCount: 0,
      profilePicture: "",
      defaultAddress: "",
      defaultPhone: "",
    });
    await newUser.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase().trim();
    const user = await User.findOne({ email, password });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    user.lastIp = ip;
    user.loginCount += 1;
    user.lastLogin = new Date();
    await user.save();

    const { password: pwd, ...safeUser } = user.toObject();
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/forgot-password", async (req, res) => {
  try {
    let { email } = req.body;
    email = email.toLowerCase().trim();
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is: ${otp}`,
    });
    res.json({ success: true, message: "OTP sent to your email!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/reset-password", async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;
    email = email.toLowerCase().trim();
    if (otpStore[email] !== otp)
      return res.status(400).json({ success: false, message: "Invalid OTP!" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });

    user.password = newPassword;
    await user.save();
    delete otpStore[email];
    res.json({ success: true, message: "Password updated!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/user/sync", (req, res) => res.json({ success: true }));

// ==================== PRODUCT ROUTES ====================
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/add-product", async (req, res) => {
  try {
    const newProduct = new Product({
      id: Date.now(),
      name: req.body.name,
      price: req.body.price,
      originalPrice: req.body.originalPrice || req.body.price,
      category: req.body.category,
      img: req.body.img,
      images: req.body.images || [],
      description: req.body.description || "",
      inStock: req.body.inStock !== undefined ? req.body.inStock : true,
      sold: req.body.sold || 0,
      type: req.body.type || "simple",
      sizes: req.body.sizes || [],
      createdAt: new Date(),
    });
    await newProduct.save();
    res.json({ success: true, product: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/edit-product/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const product = await Product.findOne({ id });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    Object.assign(product, req.body);
    product.images = req.body.images || product.images || [];
    product.type = req.body.type || product.type || "simple";
    product.sizes = req.body.sizes || product.sizes || [];
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/delete-product/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await Product.deleteOne({ id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== CATEGORIES ====================
app.get("/categories", async (req, res) => {
  try {
    let categories = await Category.find();
    if (categories.length === 0) {
      const defaultCats = ["Home", "Cloth", "Gadget", "Book"];
      await Category.insertMany(defaultCats.map((name) => ({ name })));
      categories = await Category.find();
    }
    res.json(categories.map((c) => c.name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/update-categories", async (req, res) => {
  try {
    const catNames = req.body;
    if (!Array.isArray(catNames))
      return res.status(400).json({ success: false });

    await Category.deleteMany({});
    await Category.insertMany(catNames.map((name) => ({ name })));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== ORDERS ====================
app.put("/cancel-order/:orderId", async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.orderId, { status: "Cancelled" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/place-order", async (req, res) => {
  try {
    const newOrder = new Order({
      id: "ORD-" + Date.now(),
      date: new Date(),
      status: "Pending",
      userEmail: req.body.userEmail,
      userName: req.body.userName,
      userPhone: req.body.userPhone,
      userAddress: req.body.userAddress,
      items: req.body.items,
      subtotal: req.body.subtotal,
      deliveryFee: req.body.deliveryFee,
      deliveryZone: req.body.deliveryZone,
      total: req.body.total,
      paymentMethod: req.body.paymentMethod,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      pageUrl: req.body.pageUrl || "",
      storeUrl: req.body.storeUrl || "",
    });
    await newOrder.save();

    const user = await User.findOne({ email: req.body.userEmail });
    if (user) {
      user.orderCount = (user.orderCount || 0) + 1;
      await user.save();
    }

    // ✅ Admin কে alert পাঠানো
    if (app.locals.sendNewOrderWPAlert) {
      app.locals.sendNewOrderWPAlert(newOrder).catch(() => {});
    }

    // ✅ Customer কে confirmation পাঠানো (নতুন যোগ করুন)
    if (app.locals.sendOrderConfirmationToCustomer) {
      app.locals.sendOrderConfirmationToCustomer(newOrder).catch(() => {});
    }

    const storeUrl = req.body.storeUrl || process.env.FRONTEND_URL;
    const pageUrl = req.body.pageUrl || storeUrl;

    const itemsList = (req.body.items || [])
      .map((item) => {
        const product = item.product || item;
        const productId = product.id || product._id;
        const productLink = storeUrl ? `${storeUrl}/product/${productId}` : `#`;
        return `• ${product.name} x${item.quantity || 1} = ৳${(product.price || 0) * (item.quantity || 1)}\n🔗 Link: ${productLink}`;
      })
      .join("\n\n");

    const wpMessage =
      `🛒 *নতুন অর্ডার!*\n\n` +
      `📦 Order ID: ${newOrder.id}\n` +
      `👤 নাম: ${req.body.userName || "N/A"}\n` +
      `📞 ফোন: ${req.body.userPhone || "N/A"}\n` +
      `📍 ঠিকানা: ${req.body.userAddress || "N/A"}\n\n` +
      `🛍️ পণ্য:\n${itemsList}\n\n` + 
      `💰 Subtotal: ৳${req.body.subtotal || 0}\n` +
      `🚛 Delivery: ৳${req.body.deliveryFee || 0}\n` +
      `💵 *Total: ৳${req.body.total || 0}*\n` +
      (req.body.latitude ? `\n📍 Location: https://www.google.com/maps?q=${req.body.latitude},${req.body.longitude}` : "");

    res.json({ success: true, order: newOrder, wpMessage });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/user/orders/:email", async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.params.email });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/admin/update-order/:id", async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ success: false });
    order.status = req.body.status;
    await order.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/admin/order/:id", async (req, res) => {
  try {
    await Order.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== STATS ====================
app.get("/admin/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const orders = await Order.find();
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0,
    );
    res.json({ totalUsers, totalProducts, totalOrders, totalRevenue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== USERS (for Admin) ====================
app.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    const orders = await Order.find();
    const usersWithOrderCount = users.map((u) => {
      const userOrders = orders.filter((o) => o.userEmail === u.email).length;
      return { ...u.toObject(), orderCount: u.orderCount || userOrders };
    });
    res.json(usersWithOrderCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/users/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ success: false });
    Object.assign(user, req.body);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/users/:email", async (req, res) => {
  try {
    await User.deleteOne({ email: req.params.email });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== SETTINGS (with full schema) ====================
const getSettings = async () => {
  let settings = await Setting.findOne();
  if (!settings) {
    const defaultSettings = new Setting({});
    await defaultSettings.save();
    return defaultSettings;
  }
  return settings;
};

app.get("/settings", async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/update-settings", async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== PROFILE UPDATE ====================
app.post("/update-profile", async (req, res) => {
  try {
    let {
      currentEmail,
      currentPassword,
      newEmail,
      newPassword,
      profilePicture,
      defaultAddress,
      defaultPhone,
      name,
    } = req.body;
    currentEmail = currentEmail?.toLowerCase().trim();
    const user = await User.findOne({ email: currentEmail });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    const wantsToChangeEmail =
      newEmail && newEmail.toLowerCase().trim() !== currentEmail;
    const wantsToChangePassword = newPassword && newPassword.length > 0;

    if (wantsToChangeEmail || wantsToChangePassword) {
      if (!currentPassword || user.password !== currentPassword) {
        return res.status(401).json({
          success: false,
          message: "বর্তমান পাসওয়ার্ড ভুল বা দেয়া হয়নি।",
        });
      }
    }

    if (wantsToChangeEmail) {
      const newEmailLower = newEmail.toLowerCase().trim();
      const existingUser = await User.findOne({ email: newEmailLower });
      if (existingUser)
        return res.status(400).json({
          success: false,
          message: "এই ইমেইল ইতিমধ্যে ব্যবহৃত হচ্ছে।",
        });
      user.email = newEmailLower;
    }

    if (wantsToChangePassword) user.password = newPassword;

    if (name !== undefined) user.name = name;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (defaultAddress !== undefined) user.defaultAddress = defaultAddress;
    if (defaultPhone !== undefined) user.defaultPhone = defaultPhone;

    await user.save();

    const { password, ...updatedUser } = user.toObject();
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== PHONE LOGIN ====================
app.post("/phone-login", async (req, res) => {
  try {
    let { phone, name } = req.body;
    phone = phone.trim();
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let user = await User.findOne({ email: phone });
    if (!user) {
      const newUser = new User({
        name: name || "Phone User",
        email: phone,
        password: "",
        role: "user",
        loginCount: 1,
        lastLogin: new Date(),
        lastIp: ip,
        orderCount: 0,
        profilePicture: "",
        defaultAddress: "",
        defaultPhone: phone,
      });
      await newUser.save();
      user = newUser;
    } else {
      user.loginCount += 1;
      user.lastLogin = new Date();
      user.lastIp = ip;
      await user.save();
    }
    const { password, ...safeUser } = user.toObject();
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== LOCATIONS ====================
app.post("/update-location", async (req, res) => {
  try {
    const { email, latitude, longitude } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email required" });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.latitude = latitude;
    user.longitude = longitude;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== BROWSER INFORMATION ====================
app.post("/update-browser-info", async (req, res) => {
  try {
    const { email, browserInfo } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email required" });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.browserInfo = browserInfo;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== NOTIFICATION PERMISSION ====================
app.post("/update-notification-permission", async (req, res) => {
  try {
    const { email, permission } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email required" });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.notificationPermission = permission;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== GOOGLE LOGIN ====================
app.post("/google-login", async (req, res) => {
  try {
    let { email, name } = req.body;
    email = email.toLowerCase().trim();
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    let user = await User.findOne({ email });
    if (!user) {
      const role = email === "sabbirmolla801@gmail.com" ? "admin" : "user";
      const newUser = new User({
        name,
        email,
        password: "",
        role,
        loginCount: 1,
        lastLogin: new Date(),
        lastIp: ip,
        orderCount: 0,
        profilePicture: "",
        defaultAddress: "",
        defaultPhone: "",
      });
      await newUser.save();
      user = newUser;
    } else {
      user.loginCount += 1;
      user.lastLogin = new Date();
      user.lastIp = ip;
      await user.save();
    }
    const { password, ...safeUser } = user.toObject();
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== UPLOAD to ImgBB ====================
app.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  try {
    const base64Image = req.file.buffer.toString("base64");
    const body = new URLSearchParams();
    body.append("key", process.env.IMGBB_API_KEY.trim());
    body.append("image", base64Image);

    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: body,
    });

    const result = await response.json();

    if (result.success) {
      return res.json({ success: true, imageUrl: result.data.url });
    } else {
      console.error("ImgBB upload failed:", result);
      return res
        .status(500)
        .json({ success: false, message: "Image upload failed" });
    }
  } catch (error) {
    console.error("🔥 Upload error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error during upload" });
  }
});

// ==================== LAYOUT SECTIONS (Builder) ====================
app.get("/layout-sections", async (req, res) => {
  try {
    let sections = await LayoutSection.find().sort("order");
    if (sections.length === 0) {
      const defaultSections = [
        {
          id: "featured",
          type: "featured",
          title: "Featured Products",
          enabled: true,
          order: 0,
          bg: "#ffffff",
          padding: "40px 0",
        },
        {
          id: "newArrivals",
          type: "newArrivals",
          title: "New Arrivals",
          enabled: true,
          order: 1,
          bg: "#f8f9fa",
          padding: "40px 0",
        },
        {
          id: "bestSellers",
          type: "bestSellers",
          title: "Best Sellers",
          enabled: true,
          order: 2,
          bg: "#ffffff",
          padding: "40px 0",
        },
        {
          id: "whyChoose",
          type: "whyChoose",
          title: "Why Choose AI Store?",
          enabled: true,
          order: 3,
          bg: "#f8f9fa",
          padding: "60px 0",
        },
        {
          id: "categories",
          type: "categories",
          title: "Shop by Category",
          enabled: true,
          order: 4,
          bg: "#ffffff",
          padding: "40px 0",
        },
      ];
      await LayoutSection.insertMany(defaultSections);
      sections = defaultSections;
    }
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/layout-sections", async (req, res) => {
  try {
    const sections = req.body;
    await LayoutSection.deleteMany({});
    const toInsert = sections.map((s, idx) => ({ ...s, order: idx }));
    await LayoutSection.insertMany(toInsert);
    res.json({ success: true, message: "Layout saved" });
  } catch (err) {
    console.error("Error saving layout:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== PAGE LAYOUT (Page Builder) ====================
app.get("/page-layout", async (req, res) => {
  try {
    const doc = await PageLayout.findOne();
    res.json(doc ? doc.layout : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/page-layout", async (req, res) => {
  try {
    const layout = req.body;
    let doc = await PageLayout.findOne();
    if (!doc) {
      doc = new PageLayout({ layout });
    } else {
      doc.layout = layout;
    }
    await doc.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));