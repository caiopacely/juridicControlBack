import express from 'express'
import { authMiddleware } from '../middlewares/auth.js'
import {
  createProcess,
  getUserProcesses,
  deleteProcess
} from '../controllers/process_controller.js'

const router = express.Router()

router.post('/', authMiddleware, createProcess)
router.get('/', authMiddleware, getUserProcesses)
router.delete('/:id', deleteProcess)

export default router