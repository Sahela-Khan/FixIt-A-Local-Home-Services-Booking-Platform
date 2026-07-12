const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Not authenticated. Please log in." });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    return next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Session expired or invalid. Please log in again." });
  }
};

const role =
  (...allowed) =>
  (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to perform this action." });
    }
    return next();
  };

module.exports = { auth, role };
