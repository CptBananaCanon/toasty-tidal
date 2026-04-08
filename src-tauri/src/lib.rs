use tauri::Emitter;
use std::io::{Read, Write};
use std::net::TcpListener;

const LOOPBACK_PORT: u16 = 8898;

/// Bind the loopback listener immediately (so the port is reserved before
/// the browser opens), then hand it off to a background thread that accepts
/// exactly one connection — the OAuth redirect — responds with a success
/// page, and emits an `oauth-callback` event to the frontend.
#[tauri::command]
fn start_loopback_listener(app: tauri::AppHandle) -> Result<(), String> {
    let addr = format!("127.0.0.1:{LOOPBACK_PORT}");
    let listener =
        TcpListener::bind(&addr).map_err(|e| format!("Failed to bind {addr}: {e}"))?;

    println!("[AUTH] Loopback listener bound on {addr}");

    std::thread::spawn(move || {
        let (mut stream, peer) = match listener.accept() {
            Ok(pair) => pair,
            Err(e) => {
                eprintln!("[AUTH] Loopback accept error: {e}");
                return;
            }
        };

        println!("[AUTH] Loopback connection from {peer}");

        // Read just enough to capture the request line.
        let mut buf = [0u8; 4096];
        let n = stream.read(&mut buf).unwrap_or(0);
        let request = String::from_utf8_lossy(&buf[..n]);

        // "GET /callback?code=…&state=… HTTP/1.1"
        let path = request
            .lines()
            .next()
            .and_then(|line| line.split_whitespace().nth(1))
            .unwrap_or("/");

        println!("[AUTH] Loopback request path: {path}");

        let html = concat!(
            "<!doctype html><html>",
            "<head><title>Login successful</title>",
            // window.close() works when the tab was opened by a redirect;
            // if the browser ignores it the user sees the message below.
            "<script>window.close();</script></head>",
            "<body style='font-family:system-ui;text-align:center;",
            "padding:4rem;background:#111;color:#e8e8e8'>",
            "<h2>Login successful</h2>",
            "<p>You can close this tab and return to the app.</p>",
            "</body></html>"
        );

        let response = format!(
            "HTTP/1.1 200 OK\r\n\
             Content-Type: text/html; charset=utf-8\r\n\
             Content-Length: {}\r\n\
             Connection: close\r\n\
             \r\n\
             {}",
            html.len(),
            html
        );

        let _ = stream.write_all(response.as_bytes());
        drop(stream);

        // Reconstruct the full callback URL and deliver it to the frontend.
        let callback_url = format!("http://127.0.0.1:{LOOPBACK_PORT}{path}");
        println!("[AUTH] Emitting oauth-callback: {callback_url}");

        if let Err(e) = app.emit("oauth-callback", &callback_url) {
            eprintln!("[AUTH] Failed to emit oauth-callback: {e}");
        }
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![start_loopback_listener])
        .plugin(tauri_plugin_shell::init())
        // single-instance must be registered before deep-link so that on
        // Windows/Linux the second process hands its URL to this instance
        // before exiting, and deep-link can fire onOpenUrl / getCurrent here.
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(tauri_plugin_deep_link::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
