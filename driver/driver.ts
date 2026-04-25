import https from 'https';
import fs from 'fs';
import path from 'path';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import {internalIpV4} from 'internal-ip';
import qrcodeTerminal from 'qrcode-terminal';

const execFileAsync = promisify(execFile);

dotenv.config();

class Driver {
    private io!: Server;
    private ip: string | undefined = undefined;

    setIp(ip: string | undefined) {
        this.ip = ip;
    }

    private async startYdotoold() {
        return new Promise<void>((resolve) => {
            // Start ydotoold with input group active so it can open /dev/uinput
            const daemon = spawn('sg', ['input', '-c', 'ydotoold'], {
                detached: true,
                stdio: 'pipe',
            });
            daemon.stdout?.on('data', (data: Buffer) => {
                if (data.toString().includes('listening on socket')) {
                    resolve();
                }
            });
            daemon.on('error', () => resolve()); // if daemon fails, continue anyway
            daemon.unref();
            // Fallback: resolve after 1.5s if no output received
            setTimeout(resolve, 1500);
        });
    }

    async start() {
        await this.startYdotoold();

        // Load mkcert-generated certificates (trusted on LAN via CA install)
        const certDir = path.dirname(new URL(import.meta.url).pathname);
        const key = fs.readFileSync(path.join(certDir, 'key.pem'));
        const cert = fs.readFileSync(path.join(certDir, 'cert.pem'));

        const server = https.createServer({ key, cert });
        this.io = new Server(server, {
            cors: {
                origin: '*'
            }
        });

        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            socket.on('scan_data', async (data) => {
                console.log('Received scan data:', data);
                await this.emulateKeyboardInput(data);
            });

             socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
             });
        });

        const port = process.env.PORT || 3000;
        this.setIp(await internalIpV4());
        server.listen(port, () => {
            console.log(`Driver server is running on https://${this.ip}:${port}`);
            this.generateQRCode();
        });
    }
    // Generate QR code for the scanner URL
    private generateQRCode() {
        const port = 3000;
        const driverUrl = `https://${this.ip}:${port}`;
        const netlifyUrl = 'https://qr-scanner-infinitex.netlify.app';
        const finalQrUrl = `${netlifyUrl}?server=${driverUrl}`;
        
        console.log(`\nScan this QR code to open the scanner app:`);
        qrcodeTerminal.generate(finalQrUrl, { small: true });
    }

    // Emulate keyboard input via ydotool (kernel uinput — works on both X11 and Wayland)
    async emulateKeyboardInput(text: string) {
        console.log(`[*] Emulating keyboard for: ${text}`);
        try {
            await execFileAsync('ydotool', ['type', '--next-delay', '30', '--', text]);
            await execFileAsync('ydotool', ['key', '28:1', '28:0']); // KEY_ENTER press+release
        } catch (error) {
            console.error(`Error emulating keyboard input: ${error}`);
        }
    }


}

await new Driver().start();