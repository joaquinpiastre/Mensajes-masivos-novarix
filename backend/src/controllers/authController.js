import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  companyName: user.companyName,
  role: user.role,
  credits: user.credits,
  createdAt: user.createdAt,
});

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

/** Registro publico deshabilitado: solo el administrador crea cuentas (panel Admin). */
export const register = async (_req, res) =>
  res.status(403).json({
    message:
      "El registro publico esta deshabilitado. Tu administrador debe crear tu cuenta desde el panel.",
  });

/**
 * Creacion del primer administrador (solo si no hay usuarios).
 * Requiere SETUP_SECRET en .env coincidente con el body.
 */
export const bootstrapAdmin = async (req, res) => {
  try {
    const count = await prisma.user.count();
    if (count > 0) {
      return res.status(403).json({ message: "Ya existe un usuario. Usa el login o el panel admin." });
    }

    const secret = process.env.SETUP_SECRET;
    if (!secret || secret.length < 16) {
      return res.status(503).json({
        message:
          "SETUP_SECRET no configurado en el servidor (minimo 16 caracteres). Contacta quien desplego la API.",
      });
    }

    const { setupSecret, name, email, password, companyName } = req.body;
    if (!setupSecret || setupSecret !== secret) {
      return res.status(403).json({ message: "Acceso denegado" });
    }
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Nombre, email y contraseña son obligatorios" });
    }

    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup) return res.status(409).json({ message: "Email ya existe" });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        companyName: companyName || null,
        role: "admin",
      },
    });

    return res.status(201).json({
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Error en configuracion inicial", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Credenciales invalidas" });

    if (!user.active) {
      return res.status(403).json({ message: "Cuenta desactivada. Contacta al administrador." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Credenciales invalidas" });

    return res.json({
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Error al iniciar sesion", error: error.message });
  }
};

export const me = async (req, res) => {
  try {
    return res.json(publicUser(req.dbUser));
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener usuario", error: error.message });
  }
};
