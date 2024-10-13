//Terminal Manager

import * as pty from "node-pty";

const fileBasePath = process.env.FILE_BASE_PATH || '/app/files';
var ptyProcess = pty.spawn("bash", [], {
  name: "xterm-color",
  cols: 120,
  rows: 30,
  cwd: fileBasePath, //Put the default directory here
  env: process.env,
});

export default ptyProcess