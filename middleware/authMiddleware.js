import { supabase } from '../config/supabase.js';

export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Unauthorized" });

  // Attach user and role to request
  req.user = user;
  next();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.user_metadata.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: `Role ${userRole} is not authorized` });
    }
    next();
  };
};