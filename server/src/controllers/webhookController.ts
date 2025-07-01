import { Request, Response } from 'express';
import { query } from '../db';
import { emitToUser } from '../services/socketService';

export const handleEvolutionWebhook = async (req: Request, res: Response) => {
  const eventData = req.body;
  console.log('[Webhook]: Received event:', JSON.stringify(eventData, null, 2));

  res.sendStatus(200);

  switch (eventData.event) {
    case 'connection.update':
      try {
        const { instanceName, data } = eventData;
        const newStatus = data.state;

        if (instanceName && newStatus) {
          const updateResult = await query(
            'UPDATE instances SET status = $1 WHERE system_name = $2 RETURNING owner_id',
            [newStatus, instanceName]
          );

          if (updateResult.rows.length > 0) {
            const { owner_id } = updateResult.rows[0];
            console.log(`[Webhook]: About to emit to owner_id: ${owner_id}`); 
            emitToUser(owner_id, 'instance_status_update', {
              instanceName,
              status: newStatus
            });
          }
        }
      } catch (error) {
        console.error('[Webhook]: Error processing connection.update event:', error);
      }
      break;
    
    default:
      break;
  }
};