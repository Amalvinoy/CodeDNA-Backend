import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models';
import { env } from '../config/env';
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

export class AuthService {
  private static readonly BCRYPT_ROUNDS = 10;
  private static readonly TOKEN_EXPIRY = '7d';

  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  static generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: this.TOKEN_EXPIRY,
    });
  }

  static verifyToken(token: string): AuthPayload {
    return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  }

  static async register(input: RegisterInput): Promise<AuthResult> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const error: any = new Error('An account with this email already exists.');
      error.statusCode = 409;
      throw error;
    }

    // 2. Hash password
    const passwordHash = await this.hashPassword(input.password);

    // 3. Create user
    const newUser = await User.create({
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
    });

    const userIdStr = newUser._id.toString();

    // 4. Generate token (Genuine new developer with 0 reviews / clean state)
    const token = this.generateToken({
      userId: userIdStr,
      role: newUser.role,
    });

    return {
      user: {
        id: userIdStr,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
      token,
    };
  }

  static async login(input: LoginInput): Promise<AuthResult> {
    const normalizedEmail = input.email.toLowerCase().trim();

    // 1. Find user with passwordHash
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      const error: any = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // 2. Compare password
    const isValid = await this.comparePassword(input.password, user.passwordHash);
    if (!isValid) {
      const error: any = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const userIdStr = user._id.toString();

    // 3. Generate token
    const token = this.generateToken({
      userId: userIdStr,
      role: user.role,
    });

    return {
      user: {
        id: userIdStr,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }

  static async getCurrentUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      const error: any = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
