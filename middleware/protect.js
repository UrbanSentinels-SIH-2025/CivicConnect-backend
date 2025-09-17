import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies["auth-token"];
    if (!token) {
      return res.status(401).json({ message: "Not logged in" });
    }
    

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Attach decoded user info to request object
    req.user = decoded;


    // Continue to the next middleware or route handler
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default protect;
