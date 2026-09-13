import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const INFO_PLIST = path.join("ios", "App", "App", "Info.plist");
const ENTITLEMENTS = path.join("ios", "App", "App", "App.entitlements");

function patchInfoPlist() {
  if (!existsSync(INFO_PLIST)) {
    console.error(`Missing ${INFO_PLIST}. Run: npm run cap:add:ios`);
    process.exit(1);
  }

  let xml = readFileSync(INFO_PLIST, "utf8");
  if (xml.includes("in.pidaka.app")) {
    console.log("Info.plist already has OAuth URL scheme");
    return;
  }

  const urlTypes = `
	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleURLName</key>
			<string>in.pidaka.app.auth</string>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>in.pidaka.app</string>
			</array>
		</dict>
	</array>`;

  xml = xml.replace("</dict>\n</plist>", `${urlTypes}\n</dict>\n</plist>`);
  writeFileSync(INFO_PLIST, xml);
  console.log("Patched Info.plist with in.pidaka.app OAuth scheme");
}

function patchEntitlements() {
  if (!existsSync(ENTITLEMENTS)) {
    console.warn(`Missing ${ENTITLEMENTS}; skipping Associated Domains`);
    return;
  }

  let xml = readFileSync(ENTITLEMENTS, "utf8");
  if (xml.includes("applinks:pidaka.in")) {
    console.log("Entitlements already have applinks:pidaka.in");
    return;
  }

  const domains = `
	<key>com.apple.developer.associated-domains</key>
	<array>
		<string>applinks:pidaka.in</string>
	</array>`;

  xml = xml.replace("<dict>", `<dict>${domains}`);
  writeFileSync(ENTITLEMENTS, xml);
  console.log("Patched App.entitlements with applinks:pidaka.in");
}

patchInfoPlist();
patchEntitlements();
