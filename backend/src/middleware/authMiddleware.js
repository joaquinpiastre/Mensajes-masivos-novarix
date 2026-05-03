import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no provisto" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        role: true,
        active: true,
        credits: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }
    if (!user.active) {
      return res.status(403).json({ message: "Cuenta desactivada. Contacta al administrador." });
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    req.dbUser = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Token invalido" });
  }
};
