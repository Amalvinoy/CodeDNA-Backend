import { RegisterInput, LoginInput } from '../validators/auth.validator';
export interface AuthPayload {
    userId: string;
    role: string;
}
export interface AuthResult {
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    };
    token: string;
}
export declare class AuthService {
    private static readonly BCRYPT_ROUNDS;
    private static readonly TOKEN_EXPIRY;
    static hashPassword(password: string): Promise<string>;
    static comparePassword(password: string, hash: string): Promise<boolean>;
    static generateToken(payload: AuthPayload): string;
    static verifyToken(token: string): AuthPayload;
    static register(input: RegisterInput): Promise<AuthResult>;
    static login(input: LoginInput): Promise<AuthResult>;
    static getCurrentUser(userId: string): Promise<{
        id: any;
        name: any;
        email: any;
        avatar: any;
        role: any;
        createdAt: any;
        updatedAt: any;
    }>;
}
