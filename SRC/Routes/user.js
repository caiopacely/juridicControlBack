import express from 'express'
import {
  createUser,
  getUsers,
  loginUser
} from '../controllers/user_controller.js'

const router = express.Router()

router.post('/', createUser)
router.get('/', getUsers)
router.post('/login', loginUser)

export default router
