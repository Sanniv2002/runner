//Terminal Manager

import * as pty from "node-pty";

var ptyProcess = pty.spawn("bash", [], {
  name: "xterm-color",
  cols: 120,
  rows: 30,
  cwd: "/home/sanniv/Cloud IDE/user", //Put the default directory here
  env: process.env,
});

export default ptyProcess