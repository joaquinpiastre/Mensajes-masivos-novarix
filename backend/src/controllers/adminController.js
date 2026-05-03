import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";

export const listUsers = async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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
  return res.json(users);
};

export const updateUser = async (req, res) => {
  const { name, companyName, role, active } = req.body;
  const targetId = req.params.id;

  if (targetId === req.user.id) {
    if (role === "client") {
      return res.status(400).json({ message: "No podes quitarte el rol admin a vos mismo" });
    }
    if (active === false) {
      return res.status(400).json({ message: "No podes desactivar tu propia cuenta" });
    }
  }

  const data = {};
  if (name !== undefined) data.name = name;
  if (companyName !== undefined) data.companyName = companyName || null;
  if (role !== undefined) {
    if (!["admin", "client"].includes(role)) {
      return res.status(400).json({ message: "Rol invalido" });
    }
    data.role = role;
  }
  if (active !== undefined) data.active = Boolean(active);

  const user = await prisma.user.update({
    where: { id: targetId },
    data,
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

  return res.json(user);
};

export const createUser = async (req, res) => {
  const { name, email, password, companyName, role = "client" } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Nombre, email y contraseña son obligatorios" });
  }
  if (!["admin", "client"].includes(role)) {
    return res.status(400).json({ message: "Rol invalido" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: "Email ya registrado" });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hash,
      companyName: companyName || null,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  return res.status(201).json(user);
};
