"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ws_1 = require("ws");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const pty = __importStar(require("node-pty"));
const PORT = process.env.PORT || 8000;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
var ptyProcess = pty.spawn('bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.INIT_CWD,
    env: process.env
});
const httpServer = app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
});
const wss = new ws_1.WebSocketServer({ server: httpServer });
wss.on('connection', ws => {
    ws.on('message', data => {
        try {
            ptyProcess.write(data.toString() + "\r");
        }
        catch (error) {
            ws.send(`Error: ${error}`);
        }
        ptyProcess.onData(data => {
            try {
                ws.send(data.toString().replace(/[\x00-\x1F\x7F-\x9F\u001B\u009B][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[ -\/@-~]/g, ''));
            }
            catch (error) {
                console.error('Error sending data to WebSocket client:', error);
            }
        });
    });
});
app.get('/files', (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fileTree = yield generateFileTree("./");
        res.json({ tree: fileTree });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}));
function generateFileTree(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield promises_1.default.readdir(dirPath);
        const fileTree = [];
        for (const file of files) {
            const filePath = path_1.default.join(dirPath, file);
            const stats = yield promises_1.default.stat(filePath);
            const node = {
                name: file,
                type: stats.isDirectory() ? 'directory' : 'file'
            };
            if (stats.isDirectory()) {
                node.children = yield generateFileTree(filePath);
            }
            fileTree.push(node);
        }
        return fileTree;
    });
}
