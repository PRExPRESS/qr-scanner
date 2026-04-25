import asyncio
import os
import select
import ssl
import platform
import subprocess
import shutil
import time
import qrcode
import netifaces
import pyperclip
from aiohttp import web
import socketio
from pynput.keyboard import Key, Controller

# ─────────────────────────────────────────────
#  Keyboard Emulator
# ─────────────────────────────────────────────
class KeyboardEmulator:
    def __init__(self):
        self.system = platform.system()          # 'Linux', 'Windows', 'Darwin'
        self.pynput = Controller()
        self.display = self._detect_display()
        print(f'[kbd] OS={self.system} | display={self.display}')

    def _detect_display(self) -> str:
        if self.system != 'Linux':
            return 'n/a'
        if os.environ.get('WAYLAND_DISPLAY') or \
           'wayland' in os.environ.get('XDG_SESSION_TYPE', '').lower():
            return 'wayland'
        if os.environ.get('DISPLAY'):
            return 'x11'
        return 'unknown'

    # ── public entry point ──────────────────────
    def type(self, text: str):
        if self.system == 'Linux':
            self._type_linux(text)
        else:
            # Windows & macOS → clipboard paste via pynput
            self._type_clipboard(text)

    # ── Linux routing ───────────────────────────
    def _type_linux(self, text: str):
        if shutil.which('ydotool'):
            self._type_ydotool(text)
        elif shutil.which('xdotool') and self.display == 'x11':
            self._type_xdotool(text)
        else:
            print('[kbd] WARNING: ydotool/xdotool not found — falling back to pynput clipboard')
            self._type_clipboard(text)

    def _type_ydotool(self, text: str):
        """Kernel-level uinput. Works on both X11 and Wayland."""
        print(f'[kbd] ydotool → {repr(text)}')
        try:
            subprocess.run(
                ['ydotool', 'type', '--key-delay', '10', '--', text],
                check=True
            )
            subprocess.run(['ydotool', 'key', 'Return'], check=True)  # Enter
        except subprocess.CalledProcessError as e:
            print(f'[kbd] ydotool failed: {e}')
            if shutil.which('xdotool') and self.display == 'x11':
                print('[kbd] retrying with xdotool...')
                self._type_xdotool(text)

    def _type_xdotool(self, text: str):
        """X11 only."""
        print(f'[kbd] xdotool → {repr(text)}')
        try:
            subprocess.run(
                ['xdotool', 'type', '--clearmodifiers', '--delay', '20', '--', text],
                check=True
            )
            subprocess.run(['xdotool', 'key', 'Return'], check=True)
        except subprocess.CalledProcessError as e:
            print(f'[kbd] xdotool failed: {e}')

    # ── Windows / macOS ─────────────────────────
    def _type_clipboard(self, text: str):
        """Paste via clipboard. Reliable on Windows and macOS."""
        print(f'[kbd] clipboard paste → {repr(text)}')
        try:
            prev = pyperclip.paste()
            pyperclip.copy(text)
            time.sleep(0.05)   # let clipboard settle
            mod = Key.cmd if self.system == 'Darwin' else Key.ctrl
            with self.pynput.pressed(mod):
                self.pynput.press('v')
                self.pynput.release('v')
            time.sleep(0.05)
            pyperclip.copy(prev)   # restore original clipboard
        except Exception as e:
            print(f'[kbd] clipboard failed: {e} — falling back to char-by-char')
            self.pynput.type(text)
        finally:
            self.pynput.press(Key.enter)
            self.pynput.release(Key.enter)


# ─────────────────────────────────────────────
#  ydotoold daemon (Linux only)
# ─────────────────────────────────────────────
def start_ydotoold():
    if platform.system() != 'Linux':
        return
    if not shutil.which('ydotoold'):
        print('[daemon] ydotoold not found — skipping')
        return
    print('[daemon] starting ydotoold...')
    proc = subprocess.Popen(
        ['sg', 'input', '-c', 'ydotoold'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    # Wait for daemon to bind, or give up after 1.5s (non-blocking read)
    deadline = time.time() + 1.5
    while time.time() < deadline:
        remaining = deadline - time.time()
        if remaining <= 0:
            break
        ready, _, _ = select.select([proc.stdout], [], [], remaining)
        if ready:
            line = proc.stdout.readline().decode(errors='ignore')
            if 'listening' in line.lower():
                print('[daemon] ydotoold is ready')
                return
        else:
            break
    print('[daemon] ydotoold started (timeout fallback)')


# ─────────────────────────────────────────────
#  Networking helpers
# ─────────────────────────────────────────────
def get_local_ip() -> str:
    for iface in netifaces.interfaces():
        addrs = netifaces.ifaddresses(iface).get(netifaces.AF_INET, [])
        for addr in addrs:
            ip = addr['addr']
            if not ip.startswith('127.'):
                return ip
    return '127.0.0.1'

def generate_qr(url: str):
    print(f'\nScan QR to open the scanner app:\n{url}\n')
    qr = qrcode.QRCode(border=1)
    qr.add_data(url)
    qr.make(fit=True)
    qr.print_ascii(invert=True)


# ─────────────────────────────────────────────
#  Main server
# ─────────────────────────────────────────────
async def main():
    start_ydotoold()
    kbd = KeyboardEmulator()

    sio = socketio.AsyncServer(cors_allowed_origins='*', async_mode='aiohttp')
    app = web.Application()
    sio.attach(app)

    @sio.event
    async def connect(sid, environ):
        print(f'[server] client connected: {sid}')

    @sio.event
    async def disconnect(sid):
        print(f'[server] client disconnected: {sid}')

    @sio.event
    async def scan_data(sid, data: str):
        print(f'[server] scan received: {data}')
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, kbd.type, data)

    port = int(os.getenv('PORT', 3000))
    ip   = get_local_ip()

    ssl_ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_ctx.load_cert_chain('cert.pem', 'key.pem')

    netlify_url = 'https://qr-scanner-infinitex.netlify.app'
    generate_qr(f'{netlify_url}?server=https://{ip}:{port}')
    print(f'[server] running on https://{ip}:{port}')

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', port, ssl_context=ssl_ctx)
    await site.start()

    try:
        await asyncio.Event().wait()   # run forever
    finally:
        await runner.cleanup()


if __name__ == '__main__':
    asyncio.run(main())