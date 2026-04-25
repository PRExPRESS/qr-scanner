import https from 'https';
import { Server } from 'socket.io';
import selfsigned from 'selfsigned';
import dotenv from 'dotenv';
import {internalIpV4} from 'internal-ip';
import qrcodeTerminal from 'qrcode-terminal';
import { keyboard, Key } from '@nut-tree-fork/nut-js';

dotenv.config();

class Driver {
    private io!: Server;
    private ip: string | undefined = undefined;

    setIp(ip: string | undefined) {
        this.ip = ip;
    }

    async start() {
        const { key, cert } = await this.generateCertificate();
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
    // Create self-signed certificate
    private async generateCertificate() {
        const attrs = [{ name: 'commonName', value: 'localhost' }];
        const days = parseInt(process.env.CERT_EXPR || '30', 10);
        const notAfterDate = new Date();

        notAfterDate.setDate(notAfterDate.getDate() + days);

        const pems = await selfsigned.generate(attrs, { notAfterDate });

        return {
            key: pems.private,
            cert: pems.cert
        };
    }

    // Generate QR code for the scanner URL
    private generateQRCode() {
        const scannerUrl = process.env.SCANNER_URL || `https://${this.ip}:${process.env.PORT || 3000}`;
        qrcodeTerminal.generate(scannerUrl, { small: true });
    }

    // Emulate keyboard input
    async emulateKeyboardInput(text: string) {
        console.log(`[*] Emulating keyboard for: ${text}`);
        try {
            await keyboard.type(text);
            await keyboard.type(Key.Enter);
        } catch (error) {
            console.error(`Error emulating keyboard input: ${error}`);
        }
    }


}

await new Driver().start();