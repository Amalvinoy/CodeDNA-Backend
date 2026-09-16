import { User } from '../models';
import { UpdateSettingsInput } from '../validators/settings.validator';

export interface UserSettingsDto {
  name: string;
  email: string;
  avatar: string;
  primaryRole: string;
  engineeringFocus: string;
  preferences: {
    strictMode: boolean;
    autoFix: boolean;
    predictiveAlerts: boolean;
  };
}

export class SettingsService {
  static async getSettings(userId: string): Promise<UserSettingsDto> {
    const user = await User.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      primaryRole: user.primaryRole || 'Fullstack Developer',
      engineeringFocus: user.engineeringFocus || 'TypeScript, Node.js',
      preferences: {
        strictMode: user.preferences?.strictMode ?? true,
        autoFix: user.preferences?.autoFix ?? true,
        predictiveAlerts: user.preferences?.predictiveAlerts ?? true,
      },
    };
  }

  static async updateSettings(
    userId: string,
    data: UpdateSettingsInput
  ): Promise<UserSettingsDto> {
    const updates: Record<string, any> = {};

    if (data.name !== undefined) {
      updates.name = data.name.trim();
    }
    if (data.avatar !== undefined) {
      updates.avatar = data.avatar.trim();
    }
    if (data.primaryRole !== undefined) {
      updates.primaryRole = data.primaryRole.trim();
    }
    if (data.engineeringFocus !== undefined) {
      updates.engineeringFocus = data.engineeringFocus.trim();
    }
    if (data.preferences) {
      if (data.preferences.strictMode !== undefined) {
        updates['preferences.strictMode'] = data.preferences.strictMode;
      }
      if (data.preferences.autoFix !== undefined) {
        updates['preferences.autoFix'] = data.preferences.autoFix;
      }
      if (data.preferences.predictiveAlerts !== undefined) {
        updates['preferences.predictiveAlerts'] = data.preferences.predictiveAlerts;
      }
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      name: updated.name,
      email: updated.email,
      avatar: updated.avatar || '',
      primaryRole: updated.primaryRole || 'Fullstack Developer',
      engineeringFocus: updated.engineeringFocus || 'TypeScript, Node.js',
      preferences: {
        strictMode: updated.preferences?.strictMode ?? true,
        autoFix: updated.preferences?.autoFix ?? true,
        predictiveAlerts: updated.preferences?.predictiveAlerts ?? true,
      },
    };
  }
}
