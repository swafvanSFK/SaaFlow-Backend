import express from 'express'
import { agent } from '../controllers/agent.controllers.js'

const router = express.Router()

router.post("/chat", agent)


export default router