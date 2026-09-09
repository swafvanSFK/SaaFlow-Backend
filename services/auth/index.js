import express from 'express'
import dotenv from 'dotenv'
import connectDb from './config/db.js'
import './config/firebase.js'
import '../../shared/redis/redis.js'
import router from './routes/auth.route.js'

dotenv.config()

const port = process.env.PORT
const app = express()
app.use(express.json())
app.use("/", router)
app.get("/", (req, res) => {
    res.json({message: "Hello from auth"})
})

app.listen(port, () => {
    console.log(`Auth started at port ${port}`)
    connectDb()
})