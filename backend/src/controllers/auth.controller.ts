import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { encrypt, decrypt, hashPassword, verifyPassword } from '../utils/encryption';
import NabdaClient from '../services/nabda.client';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth.middleware';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const nabdaLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const nabdaClient = new NabdaClient(process.env.NABDA_API_KEY || '');
    const authResponse = await nabdaClient.authLogin(email, password);

    if (!authResponse.success || !authResponse.token) {
      res.status(401).json({ error: authResponse.error || 'Authentication failed' });
      return;
    }

    let user = await UserModel.findOne({ email });

    if (!user) {
      const encryptedApiKey = encrypt(process.env.NABDA_API_KEY || '', ENCRYPTION_KEY);
      user = await UserModel.create({
        email,
        nabdaApiKey: encryptedApiKey,
        nabdaSessionToken: authResponse.token,
      });
    } else {
      user.nabdaSessionToken = authResponse.token;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('nabda_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
      },
      token,
    });
  } catch (error: any) {
    console.error('Nabda login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getInstanceInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const decryptedApiKey = decrypt(user.nabdaApiKey, ENCRYPTION_KEY);
    const nabdaClient = new NabdaClient(decryptedApiKey);

    if (user.nabdaSessionToken) {
      nabdaClient.setSessionToken(user.nabdaSessionToken);
    }

    const instanceStatus = await nabdaClient.getInstanceStatus();

    res.json({
      success: true,
      instance: instanceStatus,
      currentInstanceId: user.nabdaInstanceId,
      currentBundleId: user.nabdaBundleId,
    });
  } catch (error: any) {
    console.error('Get instance info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const selectInstance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { instanceId } = req.body;

    if (!instanceId) {
      res.status(400).json({ error: 'Instance ID is required' });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const decryptedApiKey = decrypt(user.nabdaApiKey, ENCRYPTION_KEY);
    const nabdaClient = new NabdaClient(decryptedApiKey);

    if (user.nabdaSessionToken) {
      nabdaClient.setSessionToken(user.nabdaSessionToken);
    }

    const response = await nabdaClient.selectInstance(instanceId);

    if (response.success) {
      user.nabdaInstanceId = instanceId;
      await user.save();
    }

    res.json(response);
  } catch (error: any) {
    console.error('Select instance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getInstances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const decryptedApiKey = decrypt(user.nabdaApiKey, ENCRYPTION_KEY);
    const nabdaClient = new NabdaClient(decryptedApiKey);

    if (user.nabdaSessionToken) {
      nabdaClient.setSessionToken(user.nabdaSessionToken);
    }

    const instances = await nabdaClient.getInstances();

    res.json({
      success: true,
      instances,
    });
  } catch (error: any) {
    console.error('Get instances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBundles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const decryptedApiKey = decrypt(user.nabdaApiKey, ENCRYPTION_KEY);
    const nabdaClient = new NabdaClient(decryptedApiKey);

    if (user.nabdaSessionToken) {
      nabdaClient.setSessionToken(user.nabdaSessionToken);
    }

    const bundles = await nabdaClient.getBundles();

    res.json({
      success: true,
      bundles,
    });
  } catch (error: any) {
    console.error('Get bundles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (user) {
      user.nabdaSessionToken = undefined;
      await user.save();
    }

    res.clearCookie('nabda_session');

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
