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
export declare class SettingsService {
    static getSettings(userId: string): Promise<UserSettingsDto>;
    static updateSettings(userId: string, data: UpdateSettingsInput): Promise<UserSettingsDto>;
}
