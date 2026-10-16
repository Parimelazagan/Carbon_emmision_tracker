import express from 'express'
import cors from 'cors'
import healthRouter from './routes/health.js'
import authRouter from './routes/auth.js'
import organizationsRouter from './routes/organizations.js'
import facilitiesRouter from './routes/facilities.js'
import consumptionRouter from './routes/consumption.js'
import uploadRouter from './routes/upload.js'
import reportsRouter from './routes/reports.js'
import emissionFactorsRouter from './routes/emissionFactors.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

// Dynamic CORS configuration: allows localhost, vercel deployments, and custom CLIENT_ORIGIN
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174']

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true)
      
      // Allow any vercel deployment for this project, localhost, or explicit origins
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true)
      }
      return callback(null, true) // Fallback: allow to avoid preflight blocks
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
app.use('/api/emission-factors', emissionFactorsRouter)

app.use(notFound)
app.use(errorHandler)

export default app
