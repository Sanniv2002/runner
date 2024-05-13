//Terminal Manager

import * as pty from "node-pty";

var ptyProcess = pty.spawn("bash", [], {
  name: "xterm-color",
  cols: 120,
  rows: 30,
  cwd: process.env.CWD, //Will put the default directory here
  env: process.env,
});

export default ptyProcess