import express from 'express'
import { agent } from '../controllers/agent.controllers.js'
import upload from '../config/multer.js'

const router = express.Router()

router.post("/chat", upload.single("file"), agent)


export default router