const Gio = imports.gi.Gio;
const Meta = imports.gi.Meta;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const WORKSPACE_COUNT_KEY = 'workspace-count';
const WORKSPACE_INDEX = 'workspace-index';
const WALLPAPER_KEY = 'workspace-wallpapers';
const BACKGROUND_SCHEMA = 'org.gnome.desktop.background';
const CURRENT_WALLPAPER_KEY = 'picture-uri';

let index = global.workspace_manager.get_active_workspace_index(); //initialized here then updated in _changeWallpaper()

function debugLog(s) {
  // log(s);
}

function _changeWallpaper() {
  let pathSettings = Convenience.getSettings();
  let paths = pathSettings.get_strv(WALLPAPER_KEY);
  let backgroundSettings = new Gio.Settings({
    schema_id: BACKGROUND_SCHEMA
  });

  debugLog('Walkpaper change from WS ' + index);

  // Save wallpaper for previous WS if changed.
  let wallpaper = backgroundSettings.get_string(CURRENT_WALLPAPER_KEY);

  paths[index] = wallpaper;

  // Fill in empty entries up to to current, otherwise set_strv fails
  for (let i = 0; i < index; i++) {
    if (typeof paths[i] === 'undefined') {
      paths[i] = wallpaper;
    }
  }
  pathSettings.set_strv(WALLPAPER_KEY, paths);

  // Now get wallpaper for current workspace
  index = global.workspace_manager.get_active_workspace_index();
  debugLog('Walkpaper change WS to ' + index);

  wallpaper = paths[index];
  if (typeof wallpaper === 'undefined' || wallpaper == '') {
    wallpaper = paths[0]; // Default
  }
  debugLog('Walkpaper set wallpaper to  ' + wallpaper);
  backgroundSettings.set_string(CURRENT_WALLPAPER_KEY, wallpaper);
}

function _workspaceNumChanged() {
  let workspaceNum = Meta.prefs_get_num_workspaces();
  let pathSettings = Convenience.getSettings();
  pathSettings.set_int(WORKSPACE_COUNT_KEY, workspaceNum);
}

function init(metadata) {
  log('Walkpaper init');
}

function _restoreWallpaper() {
  let backgroundSettings = new Gio.Settings({
    schema_id: BACKGROUND_SCHEMA
  });
  let pathSettings = Convenience.getSettings();
  let paths = pathSettings.get_strv(WALLPAPER_KEY);
  backgroundSettings.set_string(CURRENT_WALLPAPER_KEY, paths[index]);
}

let wSwitchedSignalId;
let wAddedSignalId;
let wRemovedSignalId;

function enable() {
  log('Walkpaper enable');
  // When system was shut down on workspace other than first
  // it keeps wallpaper from that workspace. After reboot that
  // image will appear on first. So it's necessary to set 
  // default wallpaper on startup.
  _restoreWallpaper();
  _workspaceNumChanged();
  wSwitchedSignalId = global.workspace_manager.connect(
    'workspace-switched',
    _changeWallpaper
  );
  wAddedSignalId = global.workspace_manager.connect(
    'workspace-added',
    _workspaceNumChanged
  );
  wRemovedSignalId = global.workspace_manager.connect(
    'workspace-removed',
    _workspaceNumChanged
  );
}

function disable() {
  log('Walkpaper disable');
  _restoreWallpaper();
  global.workspace_manager.disconnect(wSwitchedSignalId);
  global.workspace_manager.disconnect(wAddedSignalId);
  global.workspace_manager.disconnect(wRemovedSignalId);
}
