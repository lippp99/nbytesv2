// Desktop sidebar (dashboard and admin share it) open/folded state, kept on <html data-sidebar> (read by the `rail:` CSS variant) and in localStorage.
const KEY = "nb-sidebar";
const EVENT = "nb-sidebar-change";

/** Inline in the dashboard layout, so a folded sidebar is folded before first paint instead of flashing open. */
export const sidebarBootScript =
  `try{if(localStorage.getItem("${KEY}")==="collapsed")document.documentElement.dataset.sidebar="collapsed"}catch(e){}`;

export function isCollapsed(): boolean {
  return document.documentElement.dataset.sidebar === "collapsed";
}

export function setCollapsed(collapsed: boolean) {
  const root = document.documentElement;
  if (collapsed) root.dataset.sidebar = "collapsed";
  else delete root.dataset.sidebar;
  try {
    localStorage.setItem(KEY, collapsed ? "collapsed" : "expanded");
  } catch {
    // Storage can be blocked (private mode, policy); the choice then lasts for this page only.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeSidebar(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}
