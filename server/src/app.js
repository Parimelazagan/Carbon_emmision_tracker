import express from 'express'
import cors from 'cors'
import healthRouter from './routes/health.js'
import authRouter from './routes/auth.js'
import organizationsRouter from './routes/organizations.js'
import facilitiesRouter from './routes/facilities.js'
import consumptionRouter from './routes/consumption.js'
import uploadRouter from './routes/upload.js'
import reportsRouter from './routes/reports.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  }),
)
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/organizations', organizationsRouter)
app.use('/api/facilities', facilitiesRouter)
app.use('/api/consumption', consumptionRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/reports', reportsRouter)

app.use(notFound)
app.use(errorHandler)

export default app
