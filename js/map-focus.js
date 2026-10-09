// Bridge between the rest of the app (search) and the dashboard knowledge map.
//
// Search must not import Three.js, and the map may not be mounted yet (it loads
// lazily, only on the dashboard). So a request is stored here: the map reads it
// when it mounts, or is told via an event if it is already on screen.

import { navigate, parse } from './router.js';

export const FOCUS_EVENT = 'studyhub:map-focus';

let pending = null;
let webgl = null;

/** True when the 3D map can render here (WebGL). Any width: phones zoom into one system at a time. */
export function mapSupported() {
  if (webgl === null) {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    webgl = Boolean(gl);
    // Release the probe context: browsers cap how many can be alive at once.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }
  return webgl;
}

/** Ask the map to fly to a subject, opening the dashboard first if needed. */
export function focusOnMap(subjectId) {
  pending = subjectId;
  if (parse().path === '/') document.dispatchEvent(new CustomEvent(FOCUS_EVENT));
  else navigate('#/');
}

/** The map calls this on mount and on FOCUS_EVENT; each request is used once. */
export function takePendingFocus() {
  const id = pending;
  pending = null;
  return id;
}
