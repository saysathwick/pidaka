import { appleConfigured, demoOAuthEnabled, googleConfigured } from "./identity";
import { storage } from "./storage";
import type { PublicWall, WallSettings } from "@shared/wall";

export function seedWallSettings(): WallSettings {
  const socialOk = demoOAuthEnabled();
  return {
    googleLogin: googleConfigured() || socialOk,
    appleLogin: appleConfigured() || socialOk,
    phoneLogin: true,
    emailLogin: true,
    registrationsOpen: true,
    postingOpen: true,
    burningOpen: true,
    notice: "",
  };
}

export function toPublicWall(settings: WallSettings): PublicWall {
  const googleReady = googleConfigured() || demoOAuthEnabled();
  const appleReady = appleConfigured() || demoOAuthEnabled();
  return {
    google: settings.googleLogin && googleReady,
    apple: settings.appleLogin && appleReady,
    phone: settings.phoneLogin,
    email: settings.emailLogin,
    registrations: settings.registrationsOpen,
    posting: settings.postingOpen,
    burning: settings.burningOpen,
    notice: settings.notice.trim(),
    googleReady,
    appleReady,
  };
}

export async function readWallSettings() {
  return storage.getWallSettings(seedWallSettings());
}

export async function readPublicWall() {
  return toPublicWall(await readWallSettings());
}
