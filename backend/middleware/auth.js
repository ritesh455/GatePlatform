const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" })
      }
      return res.status(403).json({ error: "Invalid token" })
    }

    req.user = user
    next()
  })
}

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" })
  }
  next()
}

// Middleware to check if user owns resource or is admin
const requireOwnershipOrAdmin = (userIdField = "userId") => {
  return (req, res, next) => {
    const resourceUserId = req.params[userIdField] || req.body[userIdField]

    if (req.user.role === "admin" || req.user.userId === resourceUserId) {
      next()
    } else {
      res.status(403).json({ error: "Access denied" })
    }
  }
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
}
