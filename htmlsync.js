import { existsSync } from "https://deno.land/std@0.81.0/fs/mod.ts";

console.time("Run Time");
console.log("htmlsync v1.0.0");
const tokens = {
  head: "@SyncTokenHead",
  foot: "@SyncTokenFoot",
};

// Argument Checks
if (Deno.args.length < 1) {
  exitWithError("Source file argument missing");
}

if (Deno.args[0] === "-h" || Deno.args[0] === "--help") {
  printHelp();
  Deno.exit(0);
}

if (!Deno.args[0].endsWith(".html")) {
  exitWithError(`Source file extension invalid: ${Deno.args[0]}`);
}

if (!existsSync(Deno.args[0])) {
  exitWithError(`Source file not found: ${Deno.args[0]}`);
}

console.log(`> Source file: ${Deno.args[0]}`);

let newFile = false;
if (Deno.args.length === 2) {
  newFile = true;
  console.log(`> Creating new HTML file: ${Deno.args[1]}`);
}

if (newFile && existsSync(Deno.args[1])) {
  exitWithError(`New file already exists: ${Deno.args[1]}`);
}

const sourceHtml = await Deno.readTextFile(Deno.args[0]);
const sourceLineIndexes = getTokenLineIndexes(sourceHtml, tokens);

if (sourceLineIndexes.headTokenNextLineIndex < 0) {
  exitWithError(`Head token ${tokens.head} missing`);
}

// Sync HTML Content

let header = sourceHtml.slice(0, sourceLineIndexes.headTokenNextLineIndex);
let footer = "";
if (sourceLineIndexes.footTokenLineIndex > 0) {
  footer = sourceHtml.slice(
    sourceLineIndexes.footTokenLineIndex,
    sourceHtml.length,
  );
}

if (newFile) {
  Deno.writeTextFileSync(Deno.args[1], header + footer);
  console.log("> New HTML file created");
  console.timeEnd("Run Time");
  Deno.exit();
}

const files = Deno.readDirSync(".");
let htmlFiles = [];
for (const item of files) {
  if (
    item.isFile &&
    item.name.endsWith(".html") &&
    item.name !== Deno.args[0]
  ) {
    htmlFiles.push(item.name);
  }
}

for (const htmlFile of htmlFiles) {
  const targetHtml = await Deno.readTextFile(htmlFile);
  const targetLineIndexes = getTokenLineIndexes(targetHtml, tokens);
  let updatedHtml = header;
  if (targetLineIndexes.headTokenNextLineIndex > 0) {
    if (targetLineIndexes.footTokenLineIndex > 0) {
      updatedHtml += targetHtml.slice(
        targetLineIndexes.headTokenNextLineIndex,
        targetLineIndexes.footTokenLineIndex,
      );
      updatedHtml += footer;
    } else {
      updatedHtml += targetHtml.slice(
        targetLineIndexes.headTokenNextLineIndex,
        targetHtml.length,
      );
    }
    Deno.writeTextFileSync(htmlFile, updatedHtml);
    console.log(`> Synchronized file: ${htmlFile}`);
  } else {
    console.log(`> HTML file sync token missing: ${htmlFile}`);
  }
}

function printHelp() {
  console.log(`
  
  htmlsync - Synchronize the HTML header and footer to all your HTML files

  CLI:
    deno run --unstable --allow-read=. --allow-write=. https://raw.githubusercontent.com/grantcarthew/deno-htmlsync/v1.0.0/htmlsync.js [-h | --help] <source file> [new file] 
  
  Usage: htmlsync.js [options] source [new-file]
    [Options]       See the options below
    <source file>   The ".html" file with the header and footer you would like to synchronize
    [new file]      Optional. If present a single new file will be created from the source

  Options:
    -h, --help    Display this help

  `);
}

function exitWithError(message) {
  console.error("> " + message);
  Deno.exit(1);
}

function getTokenLineIndexes(html, tokens) {
  const headTokenIndex = html.indexOf(tokens.head);
  const footTokenIndex = html.lastIndexOf(tokens.foot);
  const result = {
    headTokenNextLineIndex: -1,
    footTokenLineIndex: -1,
  };

  if (headTokenIndex > 0) {
    for (let i = headTokenIndex; i < html.length; i++) {
      if (html[i] === "\n") {
        result.headTokenNextLineIndex = i + 1;
        break;
      }
    }
  }
  if (footTokenIndex > 0) {
    for (let i = footTokenIndex; i > 0; i--) {
      if (html[i] === "\n") {
        result.footTokenLineIndex = i;
        break;
      }
    }
  }
  return result;
}

console.timeEnd("Run Time");
