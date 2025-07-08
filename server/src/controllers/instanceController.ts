import { Response } from 'express';
import { isAxiosError } from 'axios';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { fetchAllEvolutionInstances } from '../api/evolutionApi';
import {
  createEvolutionInstance,
  deleteEvolutionInstance,
  getInstanceConnectionState,
  connectEvolutionInstance
} from '../api/evolutionApi';
import { query } from '../db';

const findAndVerifyInstanceOwner = async (instanceId: string, userId: string) => {
  const sql = 'SELECT * FROM instances WHERE id = $1 AND owner_id = $2';
  const { rows } = await query(sql, [instanceId, userId]);
  return rows[0] || null;
};

export const getInstancesController = async (req: AuthenticatedRequest, res: Response) => {
  const loggedInUser = req.user;
  if (!loggedInUser) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  try {
    const sql = `
      SELECT 
        id, 
        display_name AS "instanceDisplayName", 
        system_name, 
        phone_number, 
        status, 
        created_at, 
        owner_jid, 
        profile_name 
      FROM instances 
      WHERE owner_id = $1 
      ORDER BY created_at DESC
    `;
    const { rows } = await query(sql, [loggedInUser.id]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('[instanceController]: DB error fetching instances.', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const createInstanceController = async (req: AuthenticatedRequest, res: Response) => {
  const { instanceDisplayName, phoneNumber } = req.body;
  const loggedInUser = req.user;
  if (!loggedInUser) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  if (!instanceDisplayName || !phoneNumber) {
    res.status(400).json({ message: 'instanceDisplayName and phoneNumber are required.' });
    return;
  }
  try {
    const userResult = await query('SELECT role, instance_limit FROM users WHERE id = $1', [loggedInUser.id]);
    const user = userResult.rows[0];
    const countResult = await query('SELECT COUNT(*) FROM instances WHERE owner_id = $1', [loggedInUser.id]);
    const instance_count = parseInt(countResult.rows[0].count, 10);
    if (instance_count >= user.instance_limit) {
      res.status(403).json({ message: `You have reached your limit of ${user.instance_limit} instance(s).` });
      return;
    }
    const instanceNameForApi = instanceDisplayName;
    const evolutionResponse = await createEvolutionInstance(instanceNameForApi, phoneNumber);
    const insertSql = `
      INSERT INTO instances (display_name, system_name, phone_number, api_key, status, service_id, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const newInstanceResult = await query(insertSql, [
        instanceDisplayName,
        evolutionResponse.instance.instanceName,
        phoneNumber,
        evolutionResponse.hash,
        'pending',
        1,
        loggedInUser.id
    ]);
    res.status(201).json({
      message: 'Instance created successfully. Scan the QR code with your WhatsApp.',
      instance: newInstanceResult.rows[0],
      qrCodeBase64: evolutionResponse.qrcode.base64,
    });
  } catch (error) {
    console.error('[instanceController]: DB error creating instance.', error);
    if (isAxiosError(error)) {
        res.status(400).json({ message: 'Failed to create instance on provider. The name may be invalid or already in use.' });
    } else {
        res.status(500).json({ message: 'Internal server error.' });
    }
  }
};

export const deleteInstanceController = async (req: AuthenticatedRequest, res: Response) => {
    const { instanceId } = req.params;
    const loggedInUser = req.user;
    if (!loggedInUser) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    try {
        const instance = await findAndVerifyInstanceOwner(instanceId, loggedInUser.id);
        if (!instance) {
            return res.status(403).json({ message: 'Forbidden: You do not own this instance or it does not exist.' });
        }
        
        try {
            // Attempt to delete from the provider first
            await deleteEvolutionInstance(instance.system_name);
        } catch (error) {
            // --- THIS IS THE FIX ---
            // If the error is a 404 from the provider, we can ignore it and proceed.
            // Any other error should be re-thrown.
            if (isAxiosError(error) && error.response?.status === 404) {
                console.log(`[instanceController]: Instance '${instance.system_name}' not found on provider. Proceeding with local deletion.`);
            } else {
                // If it's another type of error, throw it to the outer catch block.
                throw error;
            }
            // --- END OF FIX ---
        }

        // Whether it succeeded or was already gone, delete it from our database.
        await query('DELETE FROM instances WHERE id = $1 AND owner_id = $2', [instanceId, loggedInUser.id]);
        
        res.status(200).json({ message: `Instance ${instance.display_name} deleted successfully.` });

    } catch (error) {
        console.error('[instanceController]: DB error deleting instance.', error);
        res.status(500).json({ message: 'An unexpected error occurred while deleting the instance.' });
    }
};
export const getConnectionStateController = async (req: AuthenticatedRequest, res: Response) => {
    const { instanceId } = req.params;
    const loggedInUser = req.user;
    if (!loggedInUser) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    try {
        const instance = await findAndVerifyInstanceOwner(instanceId, loggedInUser.id);
        if (!instance) {
            res.status(403).json({ message: 'Forbidden: You do not own this instance or it does not exist.' });
            return;
        }
        const stateData = await getInstanceConnectionState(instance.system_name);
        res.status(200).json(stateData);
    } catch (error) {
        console.error('[instanceController]: Error getting instance status.', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

export const connectInstanceController = async (req: AuthenticatedRequest, res: Response) => {
    const { instanceId } = req.params;
    const loggedInUser = req.user;
    if (!loggedInUser) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    try {
        const instance = await findAndVerifyInstanceOwner(instanceId, loggedInUser.id);
        if (!instance) {
            res.status(403).json({ message: 'Forbidden: You do not own this instance or it does not exist.' });
            return;
        }
        const connectData = await connectEvolutionInstance(instance.system_name);
        res.status(200).json({
            message: 'New QR code fetched. Scan the QR code with your WhatsApp.',
            qrCodeBase64: connectData.base64,
            pairingCode: connectData.pairingCode,
        });
    } catch (error) {
        console.error('[instanceController]: Error fetching new QR code.', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// I noticed this function was added in the previous step but I didn't provide a corrected version.
export const syncInstancesController = async (req: AuthenticatedRequest, res: Response) => {
  const loggedInUser = req.user;
  if (!loggedInUser) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    // Step 1: Fetch all instances from the Evolution API
    const evolutionInstances = await fetchAllEvolutionInstances();

    // Step 2: Get all of the current user's instances from our database
    const dbInstancesResult = await query('SELECT id, system_name FROM instances WHERE owner_id = $1', [loggedInUser.id]);
    const userDbInstances = dbInstancesResult.rows;

    // Step 3: Loop through our instances and update them with data from the API
    for (const dbInstance of userDbInstances) {
      // FIX: Access properties directly from the evoInst object, not a nested 'instance' object.
      const evolutionData = evolutionInstances.find(
        (evoInst: any) => evoInst.name === dbInstance.system_name
      );

      if (evolutionData) {
        // FIX: Use the correct property names from the real API response.
        const { ownerJid, profileName, connectionStatus } = evolutionData;
        
        const updateSql = `
          UPDATE instances 
          SET owner_jid = $1, profile_name = $2, status = $3 
          WHERE id = $4
        `;
        await query(updateSql, [ownerJid, profileName, connectionStatus, dbInstance.id]);
      }
    }
    
    console.log(`[Sync]: Synced instance data for user ${loggedInUser.id}`);

    // Step 4: Fetch the newly updated list from our database and return it
    const finalResult = await query('SELECT * FROM instances WHERE owner_id = $1', [loggedInUser.id]);
    res.status(200).json(finalResult.rows);

  } catch (error) {
    console.error('[instanceController]: DB error syncing instances.', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};