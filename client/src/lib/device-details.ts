import { Capacitor } from "@capacitor/core";
import type { DeviceFields } from "@shared/schema";

export type DeviceDetails = DeviceFields;

type UADataBrand = { brand: string; version: string };
type UADataHighEntropy = {
  platform?: string;
  platformVersion?: string;
  model?: string;
  architecture?: string;
  bitness?: string;
  mobile?: boolean;
  fullVersionList?: UADataBrand[];
};
type NavigatorUAData = {
  mobile?: boolean;
  platform?: string;
  brands?: UADataBrand[];
  getHighEntropyValues?: (hints: string[]) => Promise<UADataHighEntropy>;
};
type RichNavigator = Navigator & { userAgentData?: NavigatorUAData; deviceMemory?: number };

const clip = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

function richNavigator(): RichNavigator | undefined {
  return typeof navigator !== "undefined" ? (navigator as RichNavigator) : undefined;
}

/** Best-effort brand from an Android model code (e.g. SM-S918B → Samsung). */
export function brandFromModel(model: string): string {
  const m = model.trim();
  if (!m) return "";
  const rules: Array<[RegExp, string]> = [
    [/^(SM-|GT-|Galaxy)/i, "Samsung"],
    [/^Pixel/i, "Google"],
    [/^(ONEPLUS|(IN|KB|LE|NE|PJ|PH)\d{4})/i, "OnePlus"],
    [/^CPH\d/i, "OPPO / OnePlus"],
    [/^RMX\d/i, "realme"],
    [/^V\d{4}/i, "vivo"],
    [/^(Redmi|POCO|Mi\b|Xiaomi|M\d{4}[A-Z]|2\d{3}[A-Z0-9]{3,}$)/i, "Xiaomi"],
    [/^(moto|XT\d)/i, "Motorola"],
    [/^(Nokia|TA-\d)/i, "Nokia"],
    [/^Infinix/i, "Infinix"],
    [/^TECNO/i, "Tecno"],
    [/^itel/i, "itel"],
    [/^(ASUS|ASUS_)/i, "ASUS"],
    [/^(Nothing|A06[35])/i, "Nothing"],
    [/^(LM-|LG-)/i, "LG"],
    [/^HUAWEI/i, "Huawei"],
    [/^(Lenovo|TB-)/i, "Lenovo"],
  ];
  return rules.find(([re]) => re.test(m))?.[1] ?? "";
}

function windowsVersion(ntVersion: string, platformVersion?: string) {
  if (platformVersion) {
    const major = Number.parseInt(platformVersion.split(".")[0] ?? "", 10);
    if (Number.isFinite(major)) {
      if (major >= 13) return "11";
      if (major > 0) return "10";
      return "7 / 8";
    }
  }
  const map: Record<string, string> = { "10.0": "10 / 11", "6.3": "8.1", "6.2": "8", "6.1": "7" };
  return map[ntVersion] ?? ntVersion;
}

function parseUserAgent(ua: string, touchPoints: number) {
  let os = "";
  let osVersion = "";
  let brand = "";
  let model = "";
  let deviceType: "phone" | "tablet" | "desktop" = "desktop";

  const android = ua.match(/Android\s+([\d.]+)/i);
  const ios = ua.match(/(iPhone|iPad|iPod).*?OS\s+([\d_]+)/i);
  const windows = ua.match(/Windows NT\s+([\d.]+)/i);
  const mac = ua.match(/Mac OS X\s+([\d_.]+)/i);

  if (android) {
    os = "Android";
    osVersion = android[1];
    const code = ua.match(/Android\s+[\d.]+;\s*([^;)]+?)(?:\s+Build\/|\))/i)?.[1]?.trim() ?? "";
    // Chrome's reduced UA sends "K" instead of the real model
    if (code && code !== "K") model = code;
    deviceType = /Mobile/i.test(ua) ? "phone" : "tablet";
  } else if (ios) {
    os = ios[1] === "iPad" ? "iPadOS" : "iOS";
    osVersion = ios[2].replace(/_/g, ".");
    brand = "Apple";
    model = ios[1];
    deviceType = ios[1] === "iPad" ? "tablet" : "phone";
  } else if (mac && touchPoints > 1) {
    // iPad Safari in desktop mode pretends to be a Mac
    os = "iPadOS";
    brand = "Apple";
    model = "iPad";
    deviceType = "tablet";
  } else if (windows) {
    os = "Windows";
    osVersion = windowsVersion(windows[1]);
  } else if (mac) {
    os = "macOS";
    osVersion = mac[1].replace(/_/g, ".");
    brand = "Apple";
    model = "Mac";
  } else if (/CrOS/i.test(ua)) {
    os = "ChromeOS";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  }

  let browser = "";
  let browserVersion = "";
  const pick = (name: string, re: RegExp) => {
    const hit = ua.match(re);
    if (!hit || browser) return;
    browser = name;
    browserVersion = hit[1] ?? "";
  };
  if (/;\s*wv\)/i.test(ua)) pick("Android WebView", /Chrome\/([\d.]+)/);
  pick("Edge", /Edg(?:A|iOS)?\/([\d.]+)/);
  pick("Opera", /OPR\/([\d.]+)/);
  pick("Samsung Internet", /SamsungBrowser\/([\d.]+)/);
  pick("Firefox", /(?:Firefox|FxiOS)\/([\d.]+)/);
  pick("Chrome", /(?:CriOS|Chrome)\/([\d.]+)/);
  pick("Safari", /Version\/([\d.]+).*Safari/);

  return { os, osVersion, brand, model, deviceType, browser, browserVersion };
}

function browserFromBrands(list: UADataBrand[] | undefined) {
  if (!list?.length) return null;
  const real = list.filter((b) => !/not.?a.?brand/i.test(b.brand));
  const specific = real.find((b) => b.brand !== "Chromium") ?? real[0];
  if (!specific) return null;
  const name = specific.brand.replace(/^Google\s+/, "").replace(/^Microsoft\s+/, "");
  return { browser: name, browserVersion: specific.version };
}

async function highEntropyValues(): Promise<UADataHighEntropy | null> {
  const uaData = richNavigator()?.userAgentData;
  if (!uaData?.getHighEntropyValues) return null;
  try {
    return await Promise.race([
      uaData.getHighEntropyValues(["platformVersion", "model", "architecture", "bitness", "fullVersionList"]),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 800)),
    ]);
  } catch {
    return null;
  }
}

/** Sync navigator basics — always available, no permissions. */
export function readDeviceDetails(): DeviceDetails {
  const nav = richNavigator();
  const ua = nav?.userAgent || "";
  const touchPoints = nav?.maxTouchPoints ?? 0;
  const parsed = parseUserAgent(ua, touchPoints);
  const hasWindow = typeof window !== "undefined";

  return {
    source: "web",
    platform: clip(nav?.platform, 40),
    language: clip(nav?.language, 40),
    timezone: clip(Intl.DateTimeFormat().resolvedOptions().timeZone, 80),
    userAgent: clip(ua, 512),
    screen: hasWindow ? `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}` : "",
    viewport: hasWindow ? `${window.innerWidth}x${window.innerHeight}` : "",
    pixelRatio: hasWindow ? clip(Math.round((window.devicePixelRatio || 1) * 100) / 100, 10) : "",
    touch: touchPoints > 0 ? "yes" : "no",
    deviceType: parsed.deviceType,
    brand: clip(parsed.brand || brandFromModel(parsed.model), 40),
    model: clip(parsed.model, 80),
    os: clip(parsed.os, 40),
    osVersion: clip(parsed.osVersion, 40),
    browser: clip(parsed.browser, 40),
    browserVersion: clip(parsed.browserVersion, 40),
    cpuCores: nav?.hardwareConcurrency ? String(nav.hardwareConcurrency) : "",
    memoryGb: nav?.deviceMemory ? String(nav.deviceMemory) : "",
  };
}

async function withClientHints(base: DeviceDetails): Promise<DeviceDetails> {
  const hints = await highEntropyValues();
  if (!hints) return base;
  const next: DeviceDetails = { ...base };

  const fromBrands = browserFromBrands(hints.fullVersionList);
  if (fromBrands && base.browser !== "Android WebView") {
    next.browser = clip(fromBrands.browser, 40);
    next.browserVersion = clip(fromBrands.browserVersion, 40);
  }
  if (hints.architecture) next.architecture = clip(hints.architecture, 20);
  if (hints.bitness) next.bitness = clip(hints.bitness, 10);
  if (typeof hints.mobile === "boolean" && hints.mobile && base.deviceType === "desktop") {
    next.deviceType = "phone";
  }

  const platform = hints.platform ?? "";
  const pv = hints.platformVersion ?? "";
  if (platform === "Windows") {
    next.os = "Windows";
    next.osVersion = windowsVersion("", pv);
  } else if (platform === "macOS" && pv) {
    next.os = "macOS";
    next.osVersion = clip(pv, 40);
  } else if (platform === "Android") {
    next.os = "Android";
    if (pv) next.osVersion = clip(pv.replace(/\.0(\.0)?$/, ""), 40);
  } else if (platform === "Chrome OS" || platform === "ChromeOS") {
    next.os = "ChromeOS";
    if (pv) next.osVersion = clip(pv, 40);
  }

  if (hints.model) {
    next.model = clip(hints.model, 80);
    if (!next.brand) next.brand = clip(brandFromModel(hints.model), 40);
  }
  return next;
}

async function withNativeInfo(base: DeviceDetails): Promise<DeviceDetails> {
  const next: DeviceDetails = { ...base };
  try {
    const { Device } = await import("@capacitor/device");
    const info = await Device.getInfo();
    next.source = info.platform === "ios" ? "ios-app" : "android-app";
    next.platform = clip(info.platform || base.platform, 40);
    const maker = clip(info.manufacturer, 40);
    next.brand = maker ? maker.charAt(0).toUpperCase() + maker.slice(1) : "";
    next.model = clip(info.model, 80);
    next.os = clip(info.operatingSystem === "android" ? "Android" : info.operatingSystem === "ios" ? "iOS" : info.operatingSystem, 40);
    next.osVersion = clip(info.osVersion, 40);
    next.androidSdk = info.androidSDKVersion ? String(info.androidSDKVersion) : "";
    next.webViewVersion = clip(info.webViewVersion, 40);
    next.emulator = info.isVirtual ? "yes" : "no";
  } catch {
    // Device plugin unavailable — keep browser-derived values
  }
  try {
    const { App } = await import("@capacitor/app");
    const app = await App.getInfo();
    next.appVersion = clip(app.build ? `${app.version} (${app.build})` : app.version, 40);
  } catch {
    // app info unavailable
  }
  return next;
}

/** Full picture: navigator + Client Hints on web, Capacitor Device/App info in the native apps. */
export async function collectDeviceDetails(): Promise<DeviceDetails> {
  const base = readDeviceDetails();
  if (Capacitor.isNativePlatform()) return withNativeInfo(base);
  return withClientHints(base);
}

const SOURCE_LABEL: Record<string, string> = {
  "android-app": "Android app",
  "ios-app": "iOS app",
  web: "Web",
};

/** One-line human summary for the Hearth, e.g. "Samsung SM-S918B · Android 14 · Android app 1.2 (12)". */
export function summarizeDevice(stored: Partial<DeviceDetails> & { at?: string }): string {
  // Older records only kept the raw user agent — derive what we can from it
  const derived = stored.userAgent ? parseUserAgent(stored.userAgent, stored.touch === "yes" ? 5 : 0) : null;
  const device: Partial<DeviceDetails> = {
    ...stored,
    os: stored.os || derived?.os,
    osVersion: stored.osVersion || (stored.os ? "" : derived?.osVersion),
    model: stored.model || derived?.model,
    brand: stored.brand || derived?.brand || brandFromModel(stored.model || derived?.model || ""),
    browser: stored.browser || derived?.browser,
    browserVersion: stored.browserVersion || derived?.browserVersion,
    deviceType: stored.deviceType || derived?.deviceType,
  };
  const parts: string[] = [];
  const hardware = [device.brand, device.model].filter(Boolean).join(" ");
  if (hardware) parts.push(hardware);
  else if (device.deviceType) parts.push(device.deviceType === "desktop" ? "Desktop / laptop" : device.deviceType === "tablet" ? "Tablet" : "Phone");
  const os = [device.os, device.osVersion].filter(Boolean).join(" ");
  if (os) parts.push(os);
  if (device.source === "android-app" || device.source === "ios-app") {
    parts.push([SOURCE_LABEL[device.source], device.appVersion].filter(Boolean).join(" "));
  } else if (device.browser) {
    parts.push([device.browser, device.browserVersion?.split(".")[0]].filter(Boolean).join(" "));
  }
  if (device.emulator === "yes") parts.push("Emulator");
  return parts.join(" · ");
}

export function parseDeviceJson(raw: string | null | undefined): (Partial<DeviceDetails> & { at?: string }) | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}
