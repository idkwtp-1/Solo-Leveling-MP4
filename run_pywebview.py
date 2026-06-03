import subprocess
import time
import sys
import os
import signal
import socket
import ctypes
import webview

# Set unique AppUserModelID to decouple from python.exe/pythonw.exe on Windows taskbar
if sys.platform == "win32":
    try:
        myappid = 'shadowplayer.system.desktop.v1'
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
    except Exception as e:
        print(f"[SYSTEM] AppUserModelID setup warning: {e}")

class Api:
    def __init__(self):
        self._window = None
        self._mini_active = False

    def set_window(self, window):
        self._window = window

    def toggle_mini_mode(self, is_mini):
        if not self._window:
            return
        if is_mini and not self._mini_active:
            self._mini_active = True
            # Exit fullscreen first, then shrink to mini size
            self._window.toggle_fullscreen()
            time.sleep(0.15)
            self._window.resize(360, 240)
            self._window.set_on_top(True)
            print("[SYSTEM] Mini player active.")
        elif not is_mini and self._mini_active:
            self._mini_active = False
            # Restore always-on-top and re-enter fullscreen
            self._window.set_on_top(False)
            time.sleep(0.1)
            self._window.toggle_fullscreen()
            print("[SYSTEM] Fullscreen restored.")

def wait_for_port(port, timeout=20):
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection(("localhost", port), timeout=0.5):
                return True
        except (socket.timeout, ConnectionRefusedError):
            time.sleep(0.5)
    return False

def main():
    print("[SYSTEM] Starting Shadow Player desktop client wrappers...")
    
    # 1. Start the Express Backend Server
    backend_proc = None
    try:
        print("[SYSTEM] Booting Express backend server on port 3001...")
        backend_proc = subprocess.Popen(
            ["npm", "run", "server"],
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception as e:
        print(f"[ERROR] Failed to start backend: {e}")
        sys.exit(1)
        
    # 2. Start the Vite Frontend Dev Server
    frontend_proc = None
    try:
        print("[SYSTEM] Booting Vite frontend dev server on port 8081...")
        frontend_proc = subprocess.Popen(
            ["npm", "run", "dev"],
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception as e:
        print(f"[ERROR] Failed to start frontend: {e}")
        if backend_proc:
            backend_proc.terminate()
        sys.exit(1)
        
    # 3. Wait for Vite server to spin up
    print("[SYSTEM] Waiting for local servers to initialize...")
    if not wait_for_port(8081, timeout=20):
        print("[WARNING] Vite dev server did not respond on port 8081 within timeout.")
    
    # 4. Initialize pywebview native window wrapper
    print("[SYSTEM] Launching native window...")
    api = Api()
    try:
        # Create pywebview window pointing to Vite dev server port
        window = webview.create_window(
            title="Shadow Player // System Online",
            url="http://localhost:8081",
            width=1280,
            height=720,
            min_size=(800, 600),
            fullscreen=True,
            background_color='#0b0e14',
            js_api=api
        )
        api.set_window(window)
        
        def set_custom_icon(*args):
            if sys.platform == "win32":
                try:
                    import clr
                    clr.AddReference('System.Drawing')
                    from System.Drawing import Icon
                    icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "SLPLayer.ico")
                    if os.path.exists(icon_path):
                        # 1. Update WinForms Form Icon
                        window.native.Icon = Icon(icon_path)
                        
                        # 2. Send WM_SETICON message to hWnd for Alt+Tab and taskbar refresh
                        hwnd = int(window.native.Handle)
                        WM_SETICON = 0x0080
                        ICON_BIG = 1
                        ICON_SMALL = 0
                        IMAGE_ICON = 1
                        LR_LOADFROMFILE = 0x00000010
                        
                        user32 = ctypes.windll.user32
                        h_icon = user32.LoadImageW(
                            None,
                            icon_path,
                            IMAGE_ICON,
                            0, 0,
                            LR_LOADFROMFILE
                        )
                        if h_icon:
                            user32.SendMessageW(hwnd, WM_SETICON, ICON_SMALL, h_icon)
                            user32.SendMessageW(hwnd, WM_SETICON, ICON_BIG, h_icon)
                except Exception as ex:
                    print("[SYSTEM] Failed to set custom window icon:", ex)

        window.events.before_show += set_custom_icon
        
        # Start the GUI loop
        webview.start()
        
    finally:
        # 5. Clean up subprocesses on window close
        print("[SYSTEM] Closing window, terminating servers...")
        if frontend_proc:
            if sys.platform == "win32":
                subprocess.Popen(f"taskkill /F /T /PID {frontend_proc.pid}", shell=True)
            else:
                os.killpg(os.getpgid(frontend_proc.pid), signal.SIGTERM)
        if backend_proc:
            if sys.platform == "win32":
                subprocess.Popen(f"taskkill /F /T /PID {backend_proc.pid}", shell=True)
            else:
                os.killpg(os.getpgid(backend_proc.pid), signal.SIGTERM)
        print("[SYSTEM] Cleanup complete. Goodbye, Monarch.")

if __name__ == "__main__":
    main()

