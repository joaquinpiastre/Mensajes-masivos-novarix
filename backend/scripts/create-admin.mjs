/**
 * Crea o promociona a administrador un usuario.
 *
 * Uso:
 *   npm run create-admin
 *
 * Variables en backend/.env (o exportadas):
 *   ADMIN_EMAIL       (obligatorio)
 *   ADMIN_PASSWORD    (obligatorio, min 6 caracteres)
 *   ADMIN_NAME        (opcional, default: Administrador)
 *   ADMIN_COMPANY     (opcional, nombre empresa)
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || "Administrador";
const companyName = process.env.ADMIN_COMPANY?.trim() || null;

async function main() {
  if (!email || !password) {
    console.error("Falta ADMIN_EMAIL o ADMIN_PASSWORD en .env (o en el entorno).");
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("ADMIN_PASSWORD debe tener al menos 6 caracteres.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "admin",
        active: true,
        password: hash,
        name: name || existing.name,
        ...(companyName !== null && { companyName }),
      },
    });
    console.log(`OK: el usuario ${email} ahora es administrador (contraseña actualizada).`);
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hash,
        name,
        companyName,
        role: "admin",
        active: true,
      },
    });
    console.log(`OK: administrador creado: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
