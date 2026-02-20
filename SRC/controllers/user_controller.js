import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()
const prisma = new PrismaClient()
  

export async function createUser(req, res) {
  try {
    const { name, email, password } = req.body

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    })

    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao criar usuário' })
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({ error: "Email ou senha inválidos" })
    }

    const senhaValida = await bcrypt.compare(password, user.password)

    if (!senhaValida) {
      return res.status(401).json({ error: "Email ou senha inválidos" })
    }

    // 🔥 GERAR TOKEN AQUI
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    const { password: _, ...userWithoutPassword } = user

    res.json({
      user: userWithoutPassword,
      token // 🔥 agora sim
    })

  } catch (error) {
  console.error("ERRO REAL:", error)
  res.status(500).json({ error: error.message })
}
}

export async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    })
    res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar usuários' })
  }
}