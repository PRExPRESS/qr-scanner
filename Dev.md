# Required Packages

## Core Infrastructure
- **`socket.io`**: Provides low-latency, real-time communication via persistent, bi-directional WebSocket connections, essential for handling rapid barcode scans without HTTP overhead.
- **`@nut-tree/nut-js`**: Bridges Node.js to OS-level hardware drivers, enabling safe emulation of keyboard strokes like typing strings and pressing Enter.

## Security & Networking
- **`selfsigned`**: Generates on-the-fly SSL certificates to enable HTTPS and secure WebSockets (wss://) on the local network, complying with mobile browser security policies for camera access.
- **`internal-ip`**: Dynamically retrieves the PC's IPv4 address to avoid hardcoding, ensuring reliable connection instructions for the phone.

## Developer Experience / Client UX
- **`qrcode-terminal`**: Prints the connection URL as a scannable QR code in the terminal, eliminating the need for manual IP/port entry on the phone.

## Build Tooling (Dev Dependency)
- **`pkg`**: Compiles JavaScript files, dependencies, and the Node runtime into a standalone executable, allowing distribution without requiring Node installation on the host machine.

## TODO:
- Install packages.