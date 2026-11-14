const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const rateLimit = require("express-rate-limit");

admin.initializeApp();
const app = express();

// Trust proxy so express-rate-limit reads 'x-forwarded-for' (same as kc-rhythm)
app.set("trust proxy", true);

// Max 8 requests per 15 minutes per IP address
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { error: "Too many requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

app.use(limiter);

app.post("*splat", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send({ error: "Unauthorized: Missing token." });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userIP = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = String(req.headers["user-agent"] || "").slice(0, 200);

    // Stored under the user so reads are a cheap, index-free subcollection query.
    await admin.firestore().collection("users").doc(uid).collection("security_log").add({
      ipAddress: userIP,
      userAgent,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({ success: true, ipAddress: userIP });
  } catch (error) {
    console.error("Error logging user IP:", error);
    res.status(403).send({ error: "Forbidden: Invalid token validation." });
  }
});

exports.logUserIP = onRequest(app);
