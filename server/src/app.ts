import express, { Express, Request, Response } from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import instanceRoutes from './routes/instanceRoutes';
import webhookRoutes from './routes/webhookRoutes';
import toolRoutes from './routes/toolRoutes';
import permissionRoutes from './routes/permissionRoutes';
import campaignRoutes from './routes/campaignRoutes'; // <-- Import the new campaign routes

const app: Express = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/instances', instanceRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/campaigns', campaignRoutes); // <-- Register the new campaign routes

// Public Webhook Route
app.use('/webhooks', webhookRoutes);

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is alive and running!' });
});

export default app;