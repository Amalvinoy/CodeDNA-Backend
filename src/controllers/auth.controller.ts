import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { env } from '../config/env';

const COOKIE_NAME = 'token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Zod Validation
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid input data.',
        });
      }

      // 2. Register Service
      const result = await AuthService.register(parsed.data);

      // 3. Set HTTP-only cookie
      res.cookie(COOKIE_NAME, result.token, COOKIE_OPTIONS);

      // 4. Return safe user data + token
      return res.status(201).json({
        success: true,
        message: 'Registration successful.',
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Zod Validation
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid email or password.',
        });
      }

      // 2. Login Service
      const result = await AuthService.login(parsed.data);

      // 3. Set HTTP-only cookie
      res.cookie(COOKIE_NAME, result.token, COOKIE_OPTIONS);

      // 4. Return safe user data + token
      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  static async logout(_req: Request, res: Response) {
    res.clearCookie(COOKIE_NAME, {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }

  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      const user = await AuthService.getCurrentUser(req.user.userId);

      return res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }
}
