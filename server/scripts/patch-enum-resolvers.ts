import fs from "fs";
import path from "path";

// Configurable enums - easy to add more here
const ENUMS_TO_PATCH = ["UserRole"];

const filePath = path.resolve("src/schema/resolvers.generated.ts");
let content = fs.readFileSync(filePath, "utf8");

// 1. Insert enum imports after the auto-generated comment
const importMarker =
  "/* This file was automatically generated. DO NOT UPDATE MANUALLY. */";
const enumImports = [
  `import { ${ENUMS_TO_PATCH.join(", ")} } from "@prisma/client";`,
].join("\n");

if (!content.includes(`from "@prisma/client"`)) {
  content = content.replace(importMarker, `${importMarker}\n${enumImports}`);
}

// 2. Add enums to the resolvers object if not already there
content = content.replace(
  /export const resolvers: Resolvers = {([\s\S]*?)\n};/,
  (match, inner) => {
    let updatedInner = inner.trimEnd();
    const enumEntries = ENUMS_TO_PATCH.map(
      (enumName) => `${enumName}: ${enumName},`
    );

    // Avoid duplicates
    for (const entry of enumEntries) {
      if (!updatedInner.includes(entry)) {
        updatedInner += `\n  ${entry}`;
      }
    }

    return `export const resolvers: Resolvers = {\n${updatedInner}\n};`;
  }
);

// 3. Save the patched file
fs.writeFileSync(filePath, content, "utf8");
console.log(`✅ Patched enum resolvers into ${filePath}`);
