export const adminMiddleware = (req, res, next) => {
  if (req.dbUser?.role !== "admin") {
    return res.status(403).json({ message: "Acceso solo para administradores" });
  }
  return next();
};
