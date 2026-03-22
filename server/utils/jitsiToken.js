// ─────────────────────────────────────────────────────────────────────────────
// Generates signed RS256 JWT tokens for Jitsi as a Service (JaaS / 8x8.vc)
// Follows your existing token.js pattern in server/utils/
//
// Add to your .env:
//   JAAS_APP_ID=vpaas-magic-cookie-xxxxxxxx
//   JAAS_KID=vpaas-magic-cookie-xxxxxxxx/xxxxxx
//   JAAS_PRIVATE_KEY=<base64-encoded RSA private key>
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require("jsonwebtoken");

/**
 * Generate a JaaS JWT for a user joining a specific appointment video call.
 *
 * @param {object} user        - Mongoose User document (from socket.user or req.user)
 * @param {string} appointmentId - The appointment ObjectId (used as room name)
 * @returns {object} { token, roomName, domain, fullRoom }
 */
const generateJitsiToken = (user, appointmentId) => {
  const appId = process.env.JAAS_APP_ID;
  const kid   = process.env.JAAS_KID;

  if (!appId || !kid || !process.env.JAAS_PRIVATE_KEY) {
    throw new Error("Missing Jitsi JaaS configuration. Check JAAS_APP_ID, JAAS_KID, JAAS_PRIVATE_KEY in .env");
  }

  // Decode private key — stored as base64 in env (safe for Vercel/Railway)
  const privateKey = Buffer.from(process.env.JAAS_PRIVATE_KEY, "base64").toString("utf8");

  // Room name: sanitized appointmentId (your rooms are already safe ObjectIds)
  const roomName = `appointment-${appointmentId}`;

  // Determine moderator — doctors control the call
  const isModerator = user.role === "doctor" || (user.roles && user.roles.includes("doctor"));

  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: "chat",
    aud: "jitsi",
    iat: now,
    exp: now + 60 * 60,   // 1 hour — enough for a consultation
    nbf: now - 10,
    sub: appId,
    room: roomName,       // Locks this token to ONLY this appointment's room
    context: {
      user: {
        id:        user._id.toString(),
        name:      user.fullName || "User",
        email:     user.email    || "",
        avatar:    user.image    || "",
        moderator: isModerator,
      },
      features: {
        livestreaming:   false,
        recording:       false,
        "outbound-call": false,
        transcription:   false,
      },
    },
  };

  const token = jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    header: { kid, alg: "RS256" },
  });

  return {
    token,
    roomName,
    domain:   "8x8.vc",
    fullRoom: `${appId}/${roomName}`,
  };
};

module.exports = { generateJitsiToken };
