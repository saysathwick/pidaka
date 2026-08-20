export type WallSettings = {
  googleLogin: boolean;
  appleLogin: boolean;
  phoneLogin: boolean;
  emailLogin: boolean;
  registrationsOpen: boolean;
  postingOpen: boolean;
  burningOpen: boolean;
  notice: string;
};

export type PublicWall = {
  google: boolean;
  apple: boolean;
  phone: boolean;
  email: boolean;
  registrations: boolean;
  posting: boolean;
  burning: boolean;
  notice: string;
  googleReady: boolean;
  appleReady: boolean;
};

export type AdminPidaka = {
  id: string;
  content: string;
  createdAt: string;
  expiresAt: string;
  creatorUserId: string;
  anonymousName: string;
};

export type AdminUser = {
  id: string;
  email: string;
  anonymousName: string;
  authProvider: string;
  createdAt: string;
};

export type AdminStats = {
  users: number;
  pidakas: number;
  burns: number;
};

export const WALL_SETTINGS_ID = "wall";

export function settingsHaveADoor(settings: WallSettings) {
  return settings.googleLogin || settings.appleLogin || settings.phoneLogin || settings.emailLogin;
}
