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

    def close_app(self):
        if self._window:
            self._window.destroy()

    def minimize_app(self):
        if self._window:
            self._window.minimize()

    def toggle_mini_mode(self, is_mini):
        if not self._window:
            return
        if is_mini and not self._mini_active:
            self._mini_active = True
            # Exit fullscreen first, then shrink to mini size
            self._window.toggle_fullscreen()
            time.sleep(0.15)
            self._window.resize(300, 180)
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
            with socket.create_connection(("127.0.0.1", port), timeout=0.5):
                return True
        except (socket.timeout, ConnectionRefusedError):
            time.sleep(0.5)
    return False

def main():
    print("[SYSTEM] Starting Shadow Player desktop client wrappers...")
    
    # Ensure logs directory exists
    log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    os.makedirs(log_dir, exist_ok=True)
    backend_log = open(os.path.join(log_dir, "backend_server.log"), "w")
    
    creation_flags = 0
    if sys.platform == "win32":
        creation_flags = 0x08000000  # CREATE_NO_WINDOW to prevent flashing CMD shell
    
    # 1. Start the Express Backend Server (now serving both APIs and static dist/client)
    backend_proc = None
    try:
        print("[SYSTEM] Booting Express backend server on port 3001...")
        backend_proc = subprocess.Popen(
            ["npm", "run", "server"],
            shell=True,
            stdout=backend_log,
            stderr=backend_log,
            creationflags=creation_flags
        )
    except Exception as e:
        print(f"[ERROR] Failed to start backend: {e}")
        if sys.platform == "win32":
            ctypes.windll.user32.MessageBoxW(0, f"Failed to start backend: {e}", "SYSTEM ERROR", 16)
        sys.exit(1)
        
    # 2. Wait for Express backend to spin up on port 3001
    print("[SYSTEM] Waiting for backend server to initialize...")
    if not wait_for_port(3001, timeout=20):
        print("[WARNING] Backend server did not respond on port 3001 within timeout.")
        if sys.platform == "win32":
            ctypes.windll.user32.MessageBoxW(0, "Backend server failed to start on port 3001. Please check logs/backend_server.log for details.", "SYSTEM INITIALIZATION FAILED", 16)
        if backend_proc:
            backend_proc.terminate()
        sys.exit(1)
    
    # 3. Initialize pywebview native window wrapper
    print("[SYSTEM] Launching native window...")
    api = Api()
    try:
        # Create pywebview window pointing to Express server serving production build
        window = webview.create_window(
            title="Shadow Player // System Online",
            url="http://127.0.0.1:3001",
            width=1280,
            height=720,
            min_size=(800, 600),
            fullscreen=True,
            frameless=True,
            background_color='#0b0e14',
            js_api=api,
            hidden=True
        )
        api.set_window(window)
 
        def on_loaded():
            window.show()
        window.events.loaded += on_loaded
        
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
        webview.start(debug=False)
        
    finally:
        # 4. Clean up backend process on window close
        print("[SYSTEM] Closing window, terminating backend server...")
        if backend_proc:
            if sys.platform == "win32":
                subprocess.Popen(f"taskkill /F /T /PID {backend_proc.pid}", shell=True, creationflags=0x08000000)
            else:
                os.killpg(os.getpgid(backend_proc.pid), signal.SIGTERM)
        print("[SYSTEM] Cleanup complete. Goodbye, Monarch.")
 
if __name__ == "__main__":
    main()

