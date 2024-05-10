import express from 'express'
import CORS from 'cors'
import { WebSocketServer } from 'ws'
import fs from 'fs/promises';
import path from 'path';
import * as pty from 'node-pty'

interface FileTreeNode {
    id: number;
    name: string;
    type: 'directory' | 'file';
    filePath: string; // Add filePath property
    children?: FileTreeNode[];
}

const PORT = process.env.PORT || 8000

const app = express()
app.use(CORS())
app.use(express.json())

var ptyProcess = pty.spawn('bash', [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.env.INIT_CWD,
  env: process.env
});

const httpServer = app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`)
})

const wss = new WebSocketServer({server: httpServer})

wss.on('connection', ws => {
    let userCommand = ""
    ws.on('message', data => {
        try {
            ptyProcess.write(data.toString() + "\r");
            userCommand = data.toString()
        } catch (error) {
            ws.send(`Error: ${error}`);
        }
    });
    ptyProcess.onData(data => {
        try {
            ws.send(data.toString().replace(userCommand, ''));
        } catch (error) {
            console.error('Error sending data to WebSocket client:', error);
        }
    });
});

app.get('/files', async (_, res) => {
    try {
        const fileTree = await generateFileTree("./")
        res.json({ tree: fileTree })
    } catch (error) {
        res.status(500).json({ error: "Internal server error" })
    }
})

app.get('/file', async (req, res) => {
    const { filePath } = req.query;

    if (!filePath) {
        return res.status(400).send('File name parameter is missing.');
    }

    try{
        await fs.access(filePath as string, fs.constants.R_OK | fs.constants.W_OK)
        const contents = await fs.readFile(filePath as string, { encoding: 'utf8' });
        res.status(200).json({contents})
    }
    catch(e){
        res.status(400).send("File Not Found")
    }
});

async function generateFileTree(dirPath: string): Promise<FileTreeNode[]> {
    const files: string[] = await fs.readdir(dirPath);
    const fileTree: FileTreeNode[] = [];

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        const node: FileTreeNode = {
            id: 1,
            name: file,
            type: stats.isDirectory() ? 'directory' : 'file',
            filePath: filePath, // Set filePath property
        };

        if (stats.isDirectory()) {
            node.children = await generateFileTree(filePath);
        }

        fileTree.push(node);
    }

    return fileTree;
}
