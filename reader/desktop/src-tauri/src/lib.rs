use std::sync::Mutex;
use tauri::{Emitter, Manager};

/// Files passed on the command line (Windows "Open with") or by macOS before the page was ready.
#[derive(Default)]
struct Pending(Mutex<Vec<String>>);

fn file_args<I: IntoIterator<Item = String>>(args: I) -> Vec<String> {
    args.into_iter()
        .skip(1)
        .filter(|a| !a.starts_with('-') && std::path::Path::new(a).is_file())
        .collect()
}

#[tauri::command]
fn take_pending(state: tauri::State<Pending>) -> Vec<String> {
    std::mem::take(&mut *state.0.lock().unwrap())
}

#[tauri::command]
fn read_file(path: String) -> Result<tauri::ipc::Response, String> {
    std::fs::read(&path)
        .map(tauri::ipc::Response::new)
        .map_err(|e| format!("{path}: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            let files = file_args(argv);
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
            if !files.is_empty() {
                let _ = app.emit("open-files", files);
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .manage(Pending(Mutex::new(file_args(std::env::args()))))
        .invoke_handler(tauri::generate_handler![take_pending, read_file])
        .build(tauri::generate_context!())
        .expect("error while building 墨阅")
        .run(|_app, _event| {
            #[cfg(target_os = "macos")]
            {
                if let tauri::RunEvent::Opened { urls } = _event {
                    let files: Vec<String> = urls
                        .into_iter()
                        .filter_map(|u| u.to_file_path().ok())
                        .map(|p| p.to_string_lossy().into_owned())
                        .collect();
                    if let Some(st) = _app.try_state::<Pending>() {
                        st.0.lock().unwrap().extend(files.iter().cloned());
                    }
                    let _ = _app.emit("open-files", files);
                }
            }
        });
}
