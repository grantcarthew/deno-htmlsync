import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.81.0/testing/asserts.ts";
import { existsSync } from "https://deno.land/std@0.81.0/fs/mod.ts";

const fileNames = [
  "index.html",
  "test1.html",
  "test2.html",
];
const htmlHead = `<head>
</head>
<body>\n`;
const htmlH1 = `<h1>HTML Document</h1>\n`;
const htmlH2 = `<h2>Extra Heading</h2>\n`;
const htmlTokenHead = `<!-- @SyncTokenHead -->\n`;
const htmlContent1 = `<p>Document Content One</p>\n`;
const htmlContent2 = `<p>Document Content Two</p>\n`;
const htmlContent3 = `<p>Document Content Three</p>\n`;
const htmlTokenFoot = `<!-- @SyncTokenFoot -->\n`;
const htmlFoot = `<h2>Document End</h2>
</body>`;

function cleanUp() {
  try {
    for (const file of fileNames) {
      Deno.removeSync(file);
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      console.error(err);
    }
  }
}

async function exec(arg1, arg2) {
  const cmd = [
    "deno",
    "run",
    "--unstable",
    "--allow-read=.",
    "--allow-write=.",
    "htmlsync.js",
  ];
  if (arg1) cmd.push(arg1);
  if (arg2) cmd.push(arg2);
  const ps = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "piped",
  });
  const { success } = await ps.status();
  const output = await ps.output();
  const outStr = new TextDecoder().decode(output);
  const error = await ps.stderrOutput();
  const errStr = new TextDecoder().decode(error);
  ps.close();
  return {
    success,
    outStr,
    errStr,
  };
}

cleanUp();

Deno.test("Missing source file argument", async () => {
  const result = await exec();
  assertEquals(result.success, false);
  assert(result.outStr.includes("htmlsync v"));
  assertEquals(result.errStr, "> Source file argument missing\n");
});

Deno.test("CLI help -h", async () => {
  const result = await exec("-h");
  assertEquals(result.success, true);
  assert(result.outStr.includes("htmlsync v"));
  assert(result.outStr.includes("Usage"));
  assert(result.outStr.includes("Options"));
  assertEquals(result.errStr, "");
});

Deno.test("CLI help --help", async () => {
  const result = await exec("--help");
  assertEquals(result.success, true);
  assert(result.outStr.includes("htmlsync v"));
  assert(result.outStr.includes("Usage"));
  assert(result.outStr.includes("Options"));
  assertEquals(result.errStr, "");
});

Deno.test("Invalid source file extention", async () => {
  const result = await exec("index.nothtml");
  assertEquals(result.success, false);
  assert(result.outStr.includes("htmlsync v"));
  assertEquals(
    result.errStr,
    "> Source file extension invalid: index.nothtml\n",
  );
});

Deno.test("Source file not found", async () => {
  const result = await exec("missing.html");
  assertEquals(result.success, false);
  assert(result.outStr.includes("htmlsync v"));
  assertEquals(result.errStr, "> Source file not found: missing.html\n");
});

Deno.test("Create new file header only", async () => {
  Deno.writeTextFileSync(
    fileNames[0],
    [htmlHead, htmlH1, htmlTokenHead, htmlContent1, htmlFoot].join(""),
  );
  const result = await exec(fileNames[0], fileNames[1]);
  assertEquals(result.success, true);
  assert(result.outStr.includes("htmlsync v"));
  assertEquals(result.errStr, "");
  assert(existsSync(fileNames[1]));
  const html = await Deno.readTextFile(fileNames[1]);
  assertEquals(html, [htmlHead, htmlH1, htmlTokenHead].join(""));
  cleanUp();
});

Deno.test("Create new file header and footer", async () => {
  Deno.writeTextFileSync(
    fileNames[0],
    [htmlHead, htmlH1, htmlTokenHead, htmlContent1, htmlTokenFoot, htmlFoot]
      .join(""),
  );
  const result = await exec(fileNames[0], fileNames[1]);
  assertEquals(result.success, true);
  assert(result.outStr.includes("htmlsync v"));
  assertEquals(result.errStr, "");
  assert(existsSync(fileNames[1]));
  const html = await Deno.readTextFile(fileNames[1]);
  assertEquals(
    html,
    [htmlHead, htmlH1, htmlTokenHead, "\n", htmlTokenFoot, htmlFoot].join(""),
  );
  cleanUp();
});

Deno.test("Sync html header only", async () => {
  Deno.writeTextFileSync(
    fileNames[0],
    [htmlHead, htmlH1, htmlH2, htmlTokenHead, htmlContent1, htmlFoot].join(""),
  );
  Deno.writeTextFileSync(
    fileNames[1],
    [htmlHead, htmlH1, htmlTokenHead, htmlContent2, htmlFoot].join(""),
  );
  Deno.writeTextFileSync(
    fileNames[2],
    [htmlHead, htmlH1, htmlTokenHead, htmlContent2, htmlFoot].join(""),
  );
  const result = await exec(fileNames[0]);
  assertEquals(result.success, true);
  assert(result.outStr.includes("htmlsync v"));
  assertEquals(result.errStr, "");
  let html = await Deno.readTextFile(fileNames[1]);
  const htmlSynced = [
    htmlHead,
    htmlH1,
    htmlH2,
    htmlTokenHead,
    htmlContent2,
    htmlFoot,
  ].join("");
  assertEquals(html, htmlSynced);
  html = await Deno.readTextFile(fileNames[2]);
  assertEquals(html, htmlSynced);
  cleanUp();
});

Deno.test("Sync html header and footer", async () => {
  Deno.writeTextFileSync(
    fileNames[0],
    [
      htmlHead,
      htmlH1,
      htmlH2,
      htmlTokenHead,
      htmlContent1,
      htmlTokenFoot,
      htmlH2,
      htmlFoot,
    ].join(""),
  );
  Deno.writeTextFileSync(
    fileNames[1],
    [htmlHead, htmlH1, htmlTokenHead, htmlContent2, htmlTokenFoot, htmlFoot]
      .join(""),
  );
  Deno.writeTextFileSync(
    fileNames[2],
    [htmlHead, htmlH1, htmlTokenHead, htmlContent3, htmlTokenFoot, htmlFoot]
      .join(""),
  );
  const result = await exec(fileNames[0]);
  assertEquals(result.success, true);
  assert(result.outStr.includes("htmlsync v"));
  assertEquals(result.errStr, "");
  let html = await Deno.readTextFile(fileNames[1]);
  const htmlSynced1 = [
    htmlHead,
    htmlH1,
    htmlH2,
    htmlTokenHead,
    htmlContent2,
    htmlTokenFoot,
    htmlH2,
    htmlFoot,
  ].join("");
  assertEquals(html, htmlSynced1);
  html = await Deno.readTextFile(fileNames[2]);
  const htmlSynced2 = [
    htmlHead,
    htmlH1,
    htmlH2,
    htmlTokenHead,
    htmlContent3,
    htmlTokenFoot,
    htmlH2,
    htmlFoot,
  ].join("");
  assertEquals(html, htmlSynced2);
  cleanUp();
});

Deno.test("Ignore files missing the head token", async () => {
  Deno.writeTextFileSync(
    fileNames[0],
    [
      htmlHead,
      htmlH1,
      htmlH2,
      htmlTokenHead,
      htmlContent1,
      htmlTokenFoot,
      htmlH2,
      htmlFoot,
    ].join(""),
  );
  Deno.writeTextFileSync(
    fileNames[1],
    [htmlHead, htmlH1, htmlTokenHead, htmlContent2, htmlTokenFoot, htmlFoot]
      .join(""),
  );
  Deno.writeTextFileSync(
    fileNames[2],
    [htmlHead, htmlH1, htmlContent3, htmlFoot].join(""),
  );
  const result = await exec(fileNames[0]);
  assertEquals(result.success, true);
  assert(result.outStr.includes("htmlsync v"));
  assertEquals(result.errStr, "");
  let html = await Deno.readTextFile(fileNames[1]);
  const htmlSynced1 = [
    htmlHead,
    htmlH1,
    htmlH2,
    htmlTokenHead,
    htmlContent2,
    htmlTokenFoot,
    htmlH2,
    htmlFoot,
  ].join("");
  assertEquals(html, htmlSynced1);
  html = await Deno.readTextFile(fileNames[2]);
  const htmlSynced2 = [htmlHead, htmlH1, htmlContent3, htmlFoot].join("");
  assertEquals(html, htmlSynced2);
  cleanUp();
});

Deno.test("Ignore syncing the footer if file is missing the foot token", async () => {
  Deno.writeTextFileSync(
    fileNames[0],
    [
      htmlHead,
      htmlH1,
      htmlH2,
      htmlTokenHead,
      htmlContent1,
      htmlTokenFoot,
      htmlH2,
      htmlFoot,
    ].join(""),
  );
  Deno.writeTextFileSync(
    fileNames[1],
    [htmlHead, htmlH1, htmlTokenHead, htmlContent2, htmlTokenFoot, htmlFoot]
      .join(""),
  );
  Deno.writeTextFileSync(
    fileNames[2],
    [htmlHead, htmlH1, htmlTokenHead, htmlContent3, htmlFoot].join(""),
  );
  const result = await exec(fileNames[0]);
  assertEquals(result.success, true);
  assert(result.outStr.includes("htmlsync v"));
  assertEquals(result.errStr, "");
  let html = await Deno.readTextFile(fileNames[1]);
  const htmlSynced1 = [
    htmlHead,
    htmlH1,
    htmlH2,
    htmlTokenHead,
    htmlContent2,
    htmlTokenFoot,
    htmlH2,
    htmlFoot,
  ].join("");
  assertEquals(html, htmlSynced1);
  html = await Deno.readTextFile(fileNames[2]);
  const htmlSynced2 = [
    htmlHead,
    htmlH1,
    htmlH2,
    htmlTokenHead,
    htmlContent3,
    htmlFoot,
  ].join("");
  assertEquals(html, htmlSynced2);
  cleanUp();
});
