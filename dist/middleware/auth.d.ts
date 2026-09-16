import { Request, Response, NextFunction } from 'express';
import { AuthPayload } from '../services/auth.service';
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireRole: (role: "user" | "admin") => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
