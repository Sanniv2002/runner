//Websocket Server for terminal

import { WebSocketServer } from 'ws';
import * as pty from 'node-pty';

const handleWebSocket = (wss: WebSocketServer, ptyProcess: pty.IPty) => {
    wss.on('connection', ws => {
        let userCommand = '';

        ws.on('message', data => {
            try {
                if (data.toString().includes('sudo') || data.toString().includes('rm -r user') || data.toString().includes('rm index.js') || data.toString().includes('rm package.json')) {
                    ptyProcess.write("\r");
                } else {
                    ptyProcess.write(data.toString() + "\r");
                    userCommand = data.toString();
                }
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
};

export default handleWebSocket;
