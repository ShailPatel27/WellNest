import jwt from "jsonwebtoken";

/**
 * JWT verification middleware.
 * - Expects "Authorization: Bearer <token>"
 * - On success, attaches req.user = { id, email } (whatever you signed)
 */
export default function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Unauthorized: missing token" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Server misconfigured: JWT_SECRET missing" });
    }

    const payload = jwt.verify(token, secret);
    req.user = payload; // e.g., { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: invalid or expired token" });
  }
}
