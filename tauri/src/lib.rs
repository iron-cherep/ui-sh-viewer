use tauri::menu::{MenuBuilder, SubmenuBuilder};
use tauri::Emitter;

// The HTTP plugin is the whole point of the native shell: it lets the webview's
// MCP requests reach https://ui.sh from Rust, where browser CORS doesn't apply,
// so no proxy is needed. The allowed hosts are locked down in
// `capabilities/default.json` (scoped to https://ui.sh/*).
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            // On macOS the first submenu is shown under the app name (its label
            // is ignored), so it must be the application menu.
            let app_menu = SubmenuBuilder::new(app, "UI.SH Viewer")
                .about(None)
                .separator()
                .services()
                .separator()
                .hide()
                .hide_others()
                .show_all()
                .separator()
                .quit()
                .build()?;

            // "Log Out" lives here now (it used to be a button in the sidebar).
            // Clicking it fires the `logout` menu event handled below.
            let file_menu = SubmenuBuilder::new(app, "File")
                .text("logout", "Log Out")
                .separator()
                .close_window()
                .build()?;

            // Standard editing items — the app has a token field and selectable
            // doc text, so Cut/Copy/Paste/Select All must stay available.
            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;

            let menu = MenuBuilder::new(app)
                .items(&[&app_menu, &file_menu, &edit_menu])
                .build()?;
            app.set_menu(menu)?;

            // The webview owns the sign-out logic (clears the token + cached
            // versions), so bridge the native menu item over the event system.
            app.on_menu_event(move |app_handle, event| {
                if event.id().0.as_str() == "logout" {
                    let _ = app_handle.emit("menu:logout", ());
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
