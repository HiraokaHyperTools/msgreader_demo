// for package maintenance: commit and push
// usage: node up.js

const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function run() {
  await exec("git commit . -m \"Update deps\"", {});
  await exec("git push", {});
  console.info("OK!");
}

run();
