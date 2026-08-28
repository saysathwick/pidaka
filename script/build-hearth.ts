import { build as viteBuild } from "vite";
import { rename } from "fs/promises";
import path from "path";

async function buildHearth() {
  console.log("building hearth client...");
  await viteBuild({
    configFile: path.resolve("vite.hearth.config.ts"),
  });
  const outDir = path.resolve("dist/hearth-public");
  await rename(path.join(outDir, "hearth.html"), path.join(outDir, "index.html"));
  console.log("hearth client ready at dist/hearth-public");
}

buildHearth().catch((err) => {
  console.error(err);
  process.exit(1);
});
