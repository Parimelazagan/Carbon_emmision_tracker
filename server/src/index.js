import 'dotenv/config'
import app from './app.js'
import { connectDB } from './lib/mongoose.js'

const PORT = Number(process.env.PORT) || 3001

async function start() {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`)
  })
}

start()
