import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function createProcess(req, res) {
  try {
    const {
      numeroProcesso,
      tipo,
      autor,
      reu,
      vara,
      comarca,
      status,
      dataDistribuicao,
      valorCausa,
      descricao
    } = req.body

    const dataFormatada = dataDistribuicao
      ? new Date(dataDistribuicao)
      : null

    if (dataFormatada && isNaN(dataFormatada.getTime())) {
      return res.status(400).json({ error: "Data inválida" })
    }

    const process = await prisma.process.create({
      data: {
        numeroProcesso,
        tipo: tipo?.nome || tipo || null, // caso venha objeto do CNJ
        autor,
        reu,
        vara,
        comarca,
        status,
        dataDistribuicao: dataFormatada,
        valorCausa,
        descricao,

        // 🔥 RELAÇÃO CORRETA COM USER
        user: {
          connect: {
            id: req.userId
          }
        }
      }
    })

    res.status(201).json(process)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}

export async function getUserProcesses(req, res) {
  try {
    const processes = await prisma.process.findMany({
      where: {
        userId: req.userId
      }
    })

    res.json(processes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}



export async function deleteProcess(req, res) {
  const { id } = req.params

  await prisma.process.delete({
    where: { id }
  })

  res.json({ message: 'Processo deletado' })
}