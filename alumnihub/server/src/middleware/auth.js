import { supabase } from "../config/supabase.js";

// Verify JWT and attach user to request
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Fetch user profile with role
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    req.user = user;
    req.profile = profile;
    req.token = token;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(401).json({ error: "Authentication failed" });
  }
}

// Role-based access control
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.profile || !allowedRoles.includes(req.profile.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
