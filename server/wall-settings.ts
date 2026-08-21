import { appleConfigured, demoOAuthEnabled, googleConfigured } from "./identity";
import { storage } from "./storage";
import type { PublicWall, WallSettings } from "@shared/wall";
import { parseNoticeColor, parseNoticeFont, parseNoticeSize, parseNoticeStyle, sanitizeNoticeLinks } from "@shared/wall";

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
    noticeOpen: true,
    notice: "",
    noticeLinks: [],
    noticeStyle: "still",
    noticeFont: "sans",
    noticeSize: "md",
    noticeColor: "muted",
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
    noticeOpen: settings.noticeOpen,
    notice: settings.noticeOpen ? settings.notice.trim() : "",
    noticeLinks: settings.noticeOpen ? sanitizeNoticeLinks(settings.noticeLinks) : [],
    noticeStyle: parseNoticeStyle(settings.noticeStyle),
    noticeFont: parseNoticeFont(settings.noticeFont),
    noticeSize: parseNoticeSize(settings.noticeSize),
    noticeColor: parseNoticeColor(settings.noticeColor),
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
