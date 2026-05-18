const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const nodemailer = require("nodemailer");
require("dotenv").config();
const ADMIN_WP = process.env.ADMIN_WP || "8801775113977";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";


const app = express();

// ==================== CORS CONFIGURATION ====================
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:5002",
  "https://backend-production-139f8.up.railway.app",
  process.env.FRONTEND_URL || ""
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For development, you can allow all origins
      if (process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type"],
  maxAge: 86400
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
  pageUrl: { type: String, default: "" },
  storeUrl: { type: String, default: "" },
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
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingSchema);

// ==================== Multer Configuration ====================
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// ==================== WhatsApp Client ====================
let client;
let QR_CODE = "";
let WA_CONNECTED = false;

try {
client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
      "--no-zygote"
    ],
    // রেলওয়েতে যদি ক্রোমিয়াম পাথ সেট করতে হয়
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome' 
  },
});

  client.on("qr", (qr) => {
    QR_CODE = qr;
    console.log("📱 New WhatsApp QR received");
  });

  client.on("ready", () => {
    WA_CONNECTED = true;
    QR_CODE = "";
    console.log("✅ WhatsApp client is ready");
  });

  client.on("disconnected", () => {
    WA_CONNECTED = false;
    console.log("❌ WhatsApp client disconnected");
  });

  client.initialize();
} catch (error) {
  console.error("⚠️ WhatsApp initialization error:", error);
}

// ==================== WP SCANNER ENDPOINTS ====================
// Status endpoint - checks if WP scanner is connected
app.get("/wp/status", (req, res) => {
  try {
    res.json({
      success: true,
      connected: WA_CONNECTED,
      status: WA_CONNECTED ? "connected" : "disconnected",
      message: WA_CONNECTED ? "WhatsApp is connected" : "WhatsApp is not connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Status endpoint error:", error);
    res.status(500).json({
      success: false,
      connected: false,
      message: "Server error",
      error: error.message
    });
  }
});

// Connect endpoint - initiates WP connection and returns QR
app.post("/wp/connect", async (req, res) => {
  try {
    if (WA_CONNECTED) {
      return res.json({
        success: true,
        connected: true,
        message: "WhatsApp is already connected"
      });
    }

    if (QR_CODE) {
      return res.json({
        success: true,
        qr: QR_CODE,
        message: "QR code generated, please scan with WhatsApp"
      });
    }

    // Give it a moment to generate QR
    setTimeout(() => {
      res.json({
        success: true,
        qr: QR_CODE || null,
        message: QR_CODE ? "QR code ready" : "Generating QR code...",
        status: WA_CONNECTED ? "connected" : "pending"
      });
    }, 1000);

  } catch (error) {
    console.error("Connect endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Connection error",
      error: error.message
    });
  }
});

// Disconnect endpoint
app.post("/wp/disconnect", async (req, res) => {
  try {
    if (client) {
      await client.destroy();
      WA_CONNECTED = false;
      QR_CODE = "";
    }
    res.json({
      success: true,
      message: "WhatsApp disconnected"
    });
  } catch (error) {
    console.error("Disconnect error:", error);
    res.status(500).json({
      success: false,
      message: "Disconnection error",
      error: error.message
    });
  }
});

// Get QR code endpoint
app.get("/wp/qr", (req, res) => {
  try {
    if (!QR_CODE && !WA_CONNECTED) {
      return res.json({
        success: false,
        message: "No QR code available"
      });
    }

    if (QR_CODE) {
      return res.json({
        success: true,
        qr: QR_CODE,
        message: "QR code available"
      });
    }

    res.json({
      success: true,
      message: "Already connected",
      connected: true
    });
  } catch (error) {
    console.error("QR endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching QR",
      error: error.message
    });
  }
});

// ==================== UPDATE BROWSER INFO ====================
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

// ==================== HEALTH CHECK ====================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    wpConnected: WA_CONNECTED,
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🗄️  MongoDB: ${MONGODB_URI}`);
});
