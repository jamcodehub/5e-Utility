import { useState, useRef, useEffect } from "react";
import { api } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

// Rounded pointer arrow: the Select tool's icon and the board's mouse cursor. A thick round-joined stroke rounds the corners.
const ARROW_POINTS = "M38 18 L185 90 L115 115 L68 180 Z";
const ARROW_ICON = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 212 204'><path d='${ARROW_POINTS}' fill='#000' stroke='#000' stroke-width='26' stroke-linejoin='round'/></svg>`)}`;
// Same arrow as a cursor, with a light outline so it stays visible on dark boards; the hotspot is the tip.
const ARROW_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='28' height='27' viewBox='0 0 212 204'><path d='${ARROW_POINTS}' fill='#1f1f1f' stroke='#f4e8c8' stroke-width='26' stroke-linejoin='round' paint-order='stroke'/></svg>`)}") 5 4, default`;

/* ---------- ASSETS: swap these placeholder URLs for your own icons ---------- */
export const ICONS = {
  // left tool bar
  select: ARROW_ICON, text: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794570299/i-cursor-solid-full.svg", pen: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794569910/feather-pointed-solid-full-4.svg", box: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794570353/square-regular-full.svg", arrow: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794570443/arrow-right-long-solid-full.svg", shapes: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794570543/shapes-solid-full.svg",
  // shape picker
  rect: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794570353/square-regular-full.svg", ellipse: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794570762/circle-regular-full.svg", star: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794570765/star-regular-full.svg",
  // campaign icons / cards
  npc: "https://res.cloudinary.com/crcbzpw6/image/upload/v1791791397/circle-user-solid-full.svg", location: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794570914/location-dot-solid-full.svg", encounter: "https://res.cloudinary.com/crcbzpw6/image/upload/v1791791401/dragon-solid-full.svg", loot: "https://res.cloudinary.com/crcbzpw6/image/upload/v1791791414/ring-solid-full.svg", note: "https://res.cloudinary.com/crcbzpw6/image/upload/v1791791415/scroll-solid-full.svg", image: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794571034/image-regular-full.svg",
  // bottom bar
  hand: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794571079/hand-regular-full.svg", eraser: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794571142/eraser-solid-full.svg", trash: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794571210/fire-solid-full.svg", undo: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794571148/arrow-rotate-left-solid-full.svg", redo: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794571241/arrow-rotate-right-solid-full.svg", copy: "https://res.cloudinary.com/crcbzpw6/image/upload/v1794571158/copy-regular-full.svg",
};

const TYPES = {
  npc: { label: "NPC", tint: "#e9d3a0" },
  location: { label: "Location", tint: "#d9dfb4" },
  encounter: { label: "Encounter", tint: "#e6bfa0" },
  loot: { label: "Loot", tint: "#eadb94" },
  note: { label: "Note", tint: "#e8d5a3" },
};

const SHAPES = {
  rect: { label: "Rectangle", el: <rect x="1" y="1" width="98" height="98" rx="3" /> },
  ellipse: { label: "Ellipse", el: <ellipse cx="50" cy="50" rx="49" ry="49" /> },
  diamond: { label: "Diamond", el: <polygon points="50,1 99,50 50,99 1,50" /> },
  triangle: { label: "Triangle", el: <polygon points="50,2 99,98 1,98" /> },
  star: { label: "Star", el: <polygon points="50,2 61,36 98,36 68,58 79,94 50,72 21,94 32,58 2,36 39,36" /> },
};

// Feather-quill cursor, flipped vertically so the quill nib points up-left; the light outline keeps it visible on dark themes.
const QUILL_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 640 640'><path transform='translate(0 640) scale(1 -1)' fill='#1f1f1f' stroke='#f4e8c8' stroke-width='28' stroke-linejoin='round' paint-order='stroke' d='M539.3 64.1C549.2 63.3 558.9 67.1 565.9 74.1C572.9 81.1 576.7 90.8 575.9 100.7C571.9 150 558.5 226.9 529.6 300.4C527.8 304.9 524.1 308.3 519.4 309.7L438.5 334C434.6 335.2 432 338.7 432 342.8C432 347.9 436.1 352 441.2 352L479.8 352C491.8 352 499.5 364.8 493.3 375.1C489.3 381.8 485 388.3 480.6 394.7C478.6 397.6 475.6 399.7 472.2 400.8L374.5 430C370.6 431.2 368 434.7 368 438.8C368 443.9 372.1 448 377.2 448L393.2 448C407.8 448 414.2 465.4 402 473.4C334 518.4 264.3 516.7 219.6 504.7C206.9 501.3 195.6 494.8 185.2 486.8L112 560C103.2 568.8 88.8 568.8 80 560C71.2 551.2 71.2 536.8 80 528L160 448L160.5 448.5C161.2 447.2 162.1 446 163.2 444.9L320 288C328.8 279.2 328.8 264.8 320 256C311.2 247.2 296.8 247.2 288 256L153.7 390.2C144.8 399.1 129.7 394.6 128.7 382C124.4 328.8 138 258.9 201.3 195.6C292.4 104.5 455.5 70.9 539.2 64.1Z'/></svg>`)}") 4 4, crosshair`;

const uid = () => Math.random().toString(36).slice(2, 9);
const EMPTY = { items: [], links: [], strokes: [], arrows: [] };
const W = (i) => i.w || 220, H = (i) => i.h || 130;
const INK = "ink"; // resolved from the active theme at render time
const smooth = (p) => {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 1; i < p.length - 1; i++) d += `Q${p[i][0]},${p[i][1]} ${(p[i][0] + p[i + 1][0]) / 2},${(p[i][1] + p[i + 1][1]) / 2}`;
  const l = p[p.length - 1];
  return d + `L${l[0]},${l[1]}`;
};
const Ico = ({ s }) => <img src={s} alt="" onError={(e) => (e.currentTarget.style.display = "none")} />;

// Downscale uploads so synced boards stay light; returns {src,w,h}
const readImage = (file) => new Promise((res, reject) => {
  const r = new FileReader();
  r.onerror = () => reject(new Error("Could not read the image."));
  r.onload = () => {
    const im = new Image();
    im.onerror = () => reject(new Error("Could not decode the image."));
    im.onload = () => {
      try {
        const s = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = im.width * s; c.height = im.height * s;
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        const k = Math.min(1, 360 / c.width);
        res({ src: c.toDataURL("image/jpeg", 0.85), w: c.width * k, h: c.height * k });
      } catch (error) { reject(error); }
    };
    im.src = r.result;
  };
  r.readAsDataURL(file);
});

const rad = (d) => (d * Math.PI) / 180;
const rot2 = (x, y, d) => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [x * c - y * s, x * s + y * c]; };
const ctr = (i) => [i.x + W(i) / 2, i.y + H(i) / 2];
const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};
const inItem = (i, x, y, pad) => {
  const [cx, cy] = ctr(i), [lx, ly] = rot2(x - cx, y - cy, -(i.rot || 0));
  return Math.abs(lx) <= W(i) / 2 + pad && Math.abs(ly) <= H(i) / 2 + pad;
};
const HANDLES = [[-1, -1], [1, -1], [-1, 1], [1, 1]];

function BoardCanvas({ campaignId, boardId, style, topRight, children }) {
  const { theme, lightMode } = useTheme();
  const dark = theme !== "light" && (!lightMode || theme === "dark");
  const [board, setBoard] = useState(EMPTY);
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const [tool, setTool] = useState("select");
  const [shapeKind, setShapeKind] = useState("rect");
  const [showShapes, setShowShapes] = useState(false);
  const [sel, setSel] = useState([]);
  const [editing, setEditing] = useState(null); // item whose text is being edited
  const [linkFrom, setLinkFrom] = useState(null);
  const [marq, setMarq] = useState(null);
  const [status, setStatus] = useState({ kind: "loading", message: "Unrolling your board…" });
  const [imageError, setImageError] = useState("");
  const [full, setFull] = useState(false);
  const root = useRef(null), ref = useRef(null), file = useRef(null), drag = useRef(null), lastTap = useRef({ id: null, t: 0 });
  const persistence = useRef(null);
  const bref = useRef(board); bref.current = board;
  const hist = useRef({ past: [], future: [] });
  const api_ = `/dmboard/${campaignId}/boards/${boardId}`;

  useEffect(() => {
    const state = { active: true, ready: false, pending: null, saving: false, failed: false, version: 0, timer: null };
    persistence.current = state;
    const report = (kind, message) => { if (state.active) setStatus({ kind, message }); };
    state.save = async () => {
      clearTimeout(state.timer);
      if (!state.ready || state.saving || !state.pending || state.failed) return;
      const snapshot = state.pending;
      state.saving = true;
      report("saving", "Saving…");
      try {
        const result = await api(api_, { method: "PUT", body: { board: snapshot, version: state.version } });
        state.version = result.version;
        if (state.pending === snapshot) state.pending = null;
        state.saving = false;
        if (state.pending) state.save();
        else report("saved", "Saved");
      } catch (error) {
        state.saving = false;
        state.failed = true;
        const message = error.status === 413 ? "Board exceeds the 8 MB save limit. Remove some images and retry." : error.message;
        report(error.status === 409 ? "conflict" : "error", `${message} Your changes are not saved.`);
      }
    };
    api(api_).then(({ board: saved, version }) => {
      if (!state.active) return;
      const loaded = { ...EMPTY, ...saved };
      state.version = version;
      state.baseline = loaded;
      state.ready = true;
      setBoard(loaded);
      report("saved", "Saved");
    }).catch((error) => report("load-error", `Could not load board: ${error.message}`));
    const beforeUnload = (event) => {
      if (state.pending || state.saving) { event.preventDefault(); event.returnValue = ""; }
    };
    const flush = () => state.save();
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("pagehide", flush);
    return () => {
      state.active = false;
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("pagehide", flush);
      clearTimeout(state.timer);
      state.save();
    };
  }, [api_]);
  useEffect(() => {
    const state = persistence.current;
    if (!state?.ready) return;
    if (state.baseline === board) { state.baseline = null; return; }
    state.pending = board;
    clearTimeout(state.timer);
    if (!state.failed) {
      setStatus({ kind: "saving", message: "Unsaved changes…" });
      state.timer = setTimeout(state.save, 1000);
    }
  }, [board]);

  /* fullscreen (real API, with CSS fallback for iOS) */
  useEffect(() => {
    const f = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  const toggleFull = async () => {
    if (document.fullscreenElement) return document.exitFullscreen();
    if (full) return setFull(false);
    if (root.current.requestFullscreen) { try { await root.current.requestFullscreen(); return; } catch {} }
    setFull(true);
  };

  /* wheel: a mouse wheel zooms towards the cursor; a trackpad two-finger scroll pans (any direction);
     pinch or ctrl/cmd+wheel always zooms. Mouse wheels send large, whole-number, vertical-only steps,
     trackpads send streams of small or sideways deltas, so that tells them apart (a stream that has
     started as a trackpad stays one so momentum scrolling doesn't flip into zooming).
     Listening on the whole board and cancelling every wheel/gesture stops the browser zooming or
     scrolling the page when the pointer is over the toolbars. */
  useEffect(() => {
    const el = root.current, canvas = ref.current;
    let lastTrackpad = 0;
    const f = (e) => {
      const zoom = e.ctrlKey || e.metaKey;
      if (!zoom && e.target.closest?.(".dmb-panel")) return; // let the boards list scroll
      e.preventDefault();
      const now = performance.now();
      const mouse = e.deltaMode !== 0 || (e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 50);
      if (!zoom && !mouse) lastTrackpad = now;
      if (zoom || (mouse && now - lastTrackpad > 120)) {
        const r = canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        setView((v) => {
          const z = Math.min(4, Math.max(0.1, v.z * Math.exp(-Math.max(-100, Math.min(100, d)) * (zoom ? 0.01 : 0.0015))));
          return { z, x: mx - ((mx - v.x) / v.z) * z, y: my - ((my - v.y) / v.z) * z };
        });
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };
    const block = (e) => e.preventDefault(); // Safari pinch gestures
    el.addEventListener("wheel", f, { passive: false });
    ["gesturestart", "gesturechange", "gestureend"].forEach((t) => el.addEventListener(t, block));
    return () => {
      el.removeEventListener("wheel", f);
      ["gesturestart", "gesturechange", "gestureend"].forEach((t) => el.removeEventListener(t, block));
    };
  }, []);

  /* focus the text field of the item being edited */
  useEffect(() => {
    if (!editing) return;
    const card = root.current?.querySelector(`[data-id="${editing}"]`);
    const el = card && (card.querySelector("textarea") || card.querySelector("input"));
    if (el) { el.focus(); el.setSelectionRange?.(el.value.length, el.value.length); }
  }, [editing]);

  /* history */
  const snap = () => { const h = hist.current; h.past.push(bref.current); if (h.past.length > 100) h.past.shift(); h.future = []; };
  const undo = () => { const h = hist.current; if (h.past.length) { h.future.push(bref.current); setBoard(h.past.pop()); } };
  const redo = () => { const h = hist.current; if (h.future.length) { h.past.push(bref.current); setBoard(h.future.pop()); } };

  const world = (e) => {
    const r = ref.current.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.x) / view.z, y: (e.clientY - r.top - view.y) / view.z };
  };
  const patch = (id, p) => setBoard((b) => ({ ...b, items: b.items.map((i) => (i.id === id ? { ...i, ...p } : i)) }));
  const centre = () => {
    const r = ref.current.getBoundingClientRect();
    return { x: (r.width / 2 - view.x) / view.z, y: (r.height / 2 - view.y) / view.z };
  };
  // `at` is an optional {x,y,w,h} top-left rectangle; otherwise the item lands near the view centre.
  const add = (it, at) => {
    snap();
    const id = uid(), w = at?.w || it.w || 220, h = at?.h || it.h || 130;
    let x, y;
    if (at) ({ x, y } = at);
    else { const c = centre(); x = c.x - w / 2 + Math.random() * 40; y = c.y - h / 2 + Math.random() * 40; }
    setBoard((b) => ({ ...b, items: [...b.items, { ...it, id, x, y, w, h }] }));
    setSel([id]); setTool("select"); setShowShapes(false);
    setEditing(it.type === "image" ? null : id);
  };
  const addImage = async (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    try { setImageError(""); add({ type: "image", ...(await readImage(f)) }); }
    catch (error) { setImageError(error.message); }
  };
  const del = () => {
    if (!sel.length) return;
    snap();
    setBoard((b) => ({
      ...b,
      items: b.items.filter((i) => !sel.includes(i.id)),
      arrows: b.arrows.filter((a) => !sel.includes(a.id)),
      strokes: b.strokes.filter((s) => !sel.includes(s.id)),
      links: b.links.filter((l) => !sel.includes(l.from) && !sel.includes(l.to)),
    }));
    setSel([]); setEditing(null);
  };
  const dupe = () => {
    const b = bref.current;
    const items = b.items.filter((i) => sel.includes(i.id)), arrows = b.arrows.filter((a) => sel.includes(a.id)), strokes = b.strokes.filter((s) => sel.includes(s.id));
    if (!items.length && !arrows.length && !strokes.length) return;
    snap();
    const m = {}, o = 30;
    const itemCopies = items.map((i) => ({ ...i, id: (m[i.id] = uid()), x: i.x + o, y: i.y + o }));
    const arrowCopies = arrows.map((a) => ({ ...a, id: uid(), x1: a.x1 + o, y1: a.y1 + o, x2: a.x2 + o, y2: a.y2 + o }));
    const strokeCopies = strokes.map((s) => ({ ...s, id: uid(), pts: s.pts.map(([x, y]) => [x + o, y + o]) }));
    setBoard((c) => ({
      ...c,
      items: [...c.items, ...itemCopies], arrows: [...c.arrows, ...arrowCopies], strokes: [...c.strokes, ...strokeCopies],
      links: [...c.links, ...c.links.filter((l) => m[l.from] && m[l.to]).map((l) => ({ id: uid(), from: m[l.from], to: m[l.to] }))],
    }));
    setSel([...itemCopies, ...arrowCopies, ...strokeCopies].map((c) => c.id));
  };
  const zoomBy = (f) => { const r = ref.current.getBoundingClientRect(), mx = r.width / 2, my = r.height / 2; setView((v) => { const z = Math.min(4, Math.max(0.1, v.z * f)); return { z, x: mx - ((mx - v.x) / v.z) * z, y: my - ((my - v.y) / v.z) * z }; }); };
  const fit = () => {
    const b = bref.current, r = ref.current.getBoundingClientRect();
    // Bounds of everything on the board: cards (rotated corners included), arrows and ink.
    const xs = [], ys = [];
    b.items.forEach((i) => {
      const [cx, cy] = ctr(i);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
        const [dx, dy] = rot2((sx * W(i)) / 2, (sy * H(i)) / 2, i.rot || 0);
        xs.push(cx + dx); ys.push(cy + dy);
      });
    });
    b.arrows.forEach((a) => { xs.push(a.x1, a.x2); ys.push(a.y1, a.y2); });
    b.strokes.forEach((s) => s.pts.forEach(([x, y]) => { xs.push(x); ys.push(y); }));
    if (!xs.length) return setView({ x: 0, y: 0, z: 1 });
    const x1 = Math.min(...xs), y1 = Math.min(...ys), x2 = Math.max(...xs), y2 = Math.max(...ys);
    const w = Math.max(x2 - x1, 1), h = Math.max(y2 - y1, 1);
    const z = Math.min(2, Math.max(0.1, Math.min((r.width - 160) / w, (r.height - 200) / h)));
    setView({ z, x: (r.width - w * z) / 2 - x1 * z, y: (r.height - h * z) / 2 - y1 * z });
  };

  /* eraser: removes anything under the pointer (cards, ink, arrows and the links between cards) */
  const eraseAt = (p) => {
    const r = 12 / view.z;
    setBoard((b) => {
      const dead = new Set(b.items.filter((i) => inItem(i, p.x, p.y, r * 0.5)).map((i) => i.id));
      const strokes = b.strokes.filter((s) => !s.pts.some((q, k) => Math.hypot(q[0] - p.x, q[1] - p.y) < r || (k && segDist(p.x, p.y, s.pts[k - 1][0], s.pts[k - 1][1], q[0], q[1]) < r)));
      const arrows = b.arrows.filter((a) => segDist(p.x, p.y, a.x1, a.y1, a.x2, a.y2) >= r);
      const byId = Object.fromEntries(b.items.map((i) => [i.id, i]));
      const links = b.links.filter((l) => {
        if (dead.has(l.from) || dead.has(l.to)) return false;
        const a = byId[l.from], c = byId[l.to];
        if (!a || !c) return true;
        const [x1, y1] = ctr(a), [x2, y2] = ctr(c), mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 20;
        return segDist(p.x, p.y, x1, y1, mx, my) >= r && segDist(p.x, p.y, mx, my, x2, y2) >= r;
      });
      if (!dead.size && strokes.length === b.strokes.length && arrows.length === b.arrows.length && links.length === b.links.length) return b;
      return { ...b, items: b.items.filter((i) => !dead.has(i.id)), strokes, arrows, links };
    });
  };
  const startErase = (e) => {
    snap(); ref.current.setPointerCapture(e.pointerId);
    drag.current = { k: "erase" };
    eraseAt(world(e));
  };

  /* moving a selection: cards, arrows and ink move together */
  const startMove = (ids, e) => {
    const b = bref.current, p = world(e), s = { items: {}, arrows: {}, strokes: {} };
    b.items.forEach((i) => ids.includes(i.id) && (s.items[i.id] = { x: i.x, y: i.y }));
    b.arrows.forEach((a) => ids.includes(a.id) && (s.arrows[a.id] = { ...a }));
    b.strokes.forEach((st) => ids.includes(st.id) && (s.strokes[st.id] = st.pts));
    snap();
    drag.current = { k: "move", s, x: p.x, y: p.y };
    ref.current.setPointerCapture(e.pointerId);
  };

  /* canvas gestures */
  const beginTool = (e) => {
    root.current.focus(); ref.current.setPointerCapture(e.pointerId);
    setShowShapes(false); setEditing(null);
    const p = world(e);
    if (e.button === 1 || tool === "hand") drag.current = { k: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
    else if (tool === "pen") { snap(); const id = uid(); drag.current = { k: "pen", id }; setBoard((b) => ({ ...b, strokes: [...b.strokes, { id, pts: [[p.x, p.y]], c: INK }] })); }
    else if (tool === "eraser") startErase(e);
    else if (tool === "text") drag.current = { k: "text", x: p.x, y: p.y }; // placed on release so the new field keeps focus
    else if (tool === "box" || tool === "shape") { drag.current = { k: "make", x: p.x, y: p.y }; setMarq({ x1: p.x, y1: p.y, x2: p.x, y2: p.y }); }
    else if (tool === "arrow") { snap(); const id = uid(); drag.current = { k: "arrow", id }; setBoard((b) => ({ ...b, arrows: [...b.arrows, { id, x1: p.x, y1: p.y, x2: p.x, y2: p.y }] })); }
    else { if (!e.shiftKey) setSel([]); setLinkFrom(null); drag.current = { k: "marq", x: p.x, y: p.y, base: e.shiftKey ? sel : [] }; setMarq({ x1: p.x, y1: p.y, x2: p.x, y2: p.y }); }
  };
  // Right/middle button drags pan from anywhere, including over cards (capture runs before card handlers).
  const panDown = (e) => {
    if (e.button !== 2 && e.button !== 1) return;
    e.preventDefault(); e.stopPropagation();
    root.current.focus(); ref.current.setPointerCapture(e.pointerId);
    drag.current = { k: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
  };
  const down = (e) => { if (e.target.dataset.canvas) beginTool(e); };
  const move = (e) => {
    const p = world(e), d = drag.current;
    if (!d) return;
    if (d.k === "pan") setView((v) => ({ ...v, x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy }));
    if (d.k === "pen") setBoard((b) => ({ ...b, strokes: b.strokes.map((s) => (s.id === d.id ? { ...s, pts: [...s.pts, [p.x, p.y]] } : s)) }));
    if (d.k === "arrow") setBoard((b) => ({ ...b, arrows: b.arrows.map((a) => (a.id === d.id ? { ...a, x2: p.x, y2: p.y } : a)) }));
    if (d.k === "erase") eraseAt(p);
    if (d.k === "move") {
      const dx = p.x - d.x, dy = p.y - d.y;
      setBoard((b) => ({
        ...b,
        items: b.items.map((i) => (d.s.items[i.id] ? { ...i, x: d.s.items[i.id].x + dx, y: d.s.items[i.id].y + dy } : i)),
        arrows: b.arrows.map((a) => { const o = d.s.arrows[a.id]; return o ? { ...a, x1: o.x1 + dx, y1: o.y1 + dy, x2: o.x2 + dx, y2: o.y2 + dy } : a; }),
        strokes: b.strokes.map((s) => { const o = d.s.strokes[s.id]; return o ? { ...s, pts: o.map(([x, y]) => [x + dx, y + dy]) } : s; }),
      }));
    }
    if (d.k === "size") {
      // Work in the card's own (rotated) frame so the opposite corner stays put.
      const [lx, ly] = rot2(p.x - d.ox, p.y - d.oy, -d.rot);
      const w = Math.max(60, d.sx * lx), h = Math.max(40, d.sy * ly);
      const [ox, oy] = rot2((d.sx * w) / 2, (d.sy * h) / 2, d.rot);
      const cx = d.ox + ox, cy = d.oy + oy;
      patch(d.id, { w, h, x: cx - w / 2, y: cy - h / 2, ...(d.fs ? { fs: Math.max(8, Math.round(d.fs * (h / d.h))) } : {}) });
    }
    if (d.k === "rot") {
      let deg = d.r0 + ((Math.atan2(p.y - d.cy, p.x - d.cx) - d.a0) * 180) / Math.PI;
      if (e.shiftKey) deg = Math.round(deg / 15) * 15;
      patch(d.id, { rot: Math.round(deg * 10) / 10 });
    }
    if (d.k === "make") setMarq({ x1: d.x, y1: d.y, x2: p.x, y2: p.y });
    if (d.k === "marq") {
      const m = { x1: d.x, y1: d.y, x2: p.x, y2: p.y }; setMarq(m);
      const [ax, bx] = [Math.min(m.x1, m.x2), Math.max(m.x1, m.x2)], [ay, by] = [Math.min(m.y1, m.y2), Math.max(m.y1, m.y2)];
      const b = bref.current;
      const ids = [
        ...b.items.filter((i) => i.x < bx && i.x + W(i) > ax && i.y < by && i.y + H(i) > ay).map((i) => i.id),
        ...b.arrows.filter((a) => Math.max(a.x1, a.x2) > ax && Math.min(a.x1, a.x2) < bx && Math.max(a.y1, a.y2) > ay && Math.min(a.y1, a.y2) < by).map((a) => a.id),
        ...b.strokes.filter((s) => s.pts.some(([x, y]) => x > ax && x < bx && y > ay && y < by)).map((s) => s.id),
      ];
      setSel([...new Set([...d.base, ...ids])]);
    }
  };
  const up = (e) => {
    const d = drag.current;
    drag.current = null; setMarq(null);
    if (d?.k === "make") {
      const p = world(e), shape = tool === "shape";
      let w = Math.abs(p.x - d.x), h = Math.abs(p.y - d.y), x = Math.min(p.x, d.x), y = Math.min(p.y, d.y);
      if (w < 24 && h < 24) { w = shape ? 160 : 220; h = shape ? 120 : 130; x = d.x - w / 2; y = d.y - h / 2; }
      w = Math.max(w, 80); h = Math.max(h, 60);
      add(shape ? { type: "shape", shape: shapeKind, text: "" } : { type: "note", title: "Note", text: "" }, { x, y, w, h });
    }
    if (d?.k === "text") add({ type: "text", text: "" }, { x: d.x, y: d.y, w: 260, h: 90 });
    if (d?.k === "arrow") setBoard((b) => ({ ...b, arrows: b.arrows.filter((a) => a.id !== d.id || Math.hypot(a.x2 - a.x1, a.y2 - a.y1) > 12) }));
  };

  const cardDown = (e, it) => {
    if (e.button !== 0) return;
    e.stopPropagation(); root.current.focus();
    if (editing === it.id) return; // typing inside the card
    if (tool === "eraser") return startErase(e);
    if (tool === "arrow") {
      if (!linkFrom) setLinkFrom(it.id);
      else if (linkFrom !== it.id) { snap(); setBoard((b) => ({ ...b, links: [...b.links, { id: uid(), from: linkFrom, to: it.id }] })); setLinkFrom(null); }
      return;
    }
    if (tool !== "select") return beginTool(e);
    // A second tap/click on the same card edits its text; one drag moves it.
    const now = Date.now(), again = lastTap.current.id === it.id && now - lastTap.current.t < 400;
    lastTap.current = { id: it.id, t: now };
    if (again && it.type !== "image") { setSel([it.id]); setEditing(it.id); return; }
    setEditing(null);
    let ids = sel.includes(it.id) ? sel : [it.id];
    if (e.shiftKey) ids = sel.includes(it.id) ? sel.filter((x) => x !== it.id) : [...sel, it.id];
    setSel(ids);
    if (!ids.includes(it.id)) return;
    startMove(ids, e);
  };
  const shapeDown = (e, id) => {
    if (e.button !== 0) return;
    e.stopPropagation(); root.current.focus(); setEditing(null);
    if (tool === "eraser") return startErase(e);
    if (tool !== "select") return;
    let ids = sel.includes(id) ? sel : [id];
    if (e.shiftKey) ids = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id];
    setSel(ids);
    if (ids.includes(id)) startMove(ids, e);
  };
  const handleDown = (e, it, sx, sy) => {
    e.stopPropagation(); snap();
    const rot = it.rot || 0, [cx, cy] = ctr(it), [ox, oy] = rot2((-sx * W(it)) / 2, (-sy * H(it)) / 2, rot);
    drag.current = { k: "size", id: it.id, sx, sy, rot, ox: cx + ox, oy: cy + oy, h: H(it), fs: it.type === "text" ? it.fs || 26 : it.type === "shape" ? it.fs || 17 : 0 };
    ref.current.setPointerCapture(e.pointerId);
  };
  const rotDown = (e, it) => {
    e.stopPropagation(); snap();
    const p = world(e), [cx, cy] = ctr(it);
    drag.current = { k: "rot", id: it.id, cx, cy, a0: Math.atan2(p.y - cy, p.x - cx), r0: it.rot || 0 };
    ref.current.setPointerCapture(e.pointerId);
  };

  const key = (e) => {
    if (/INPUT|TEXTAREA/.test(e.target.tagName)) { if (e.key === "Escape") { e.target.blur(); setEditing(null); } return; }
    const m = e.ctrlKey || e.metaKey;
    if (e.key === "Delete" || e.key === "Backspace") del();
    else if (m && e.key === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (m && e.key === "y") { e.preventDefault(); redo(); }
    else if (m && e.key === "d") { e.preventDefault(); dupe(); }
    else if (m && e.key === "a") { e.preventDefault(); const b = bref.current; setSel([...b.items, ...b.arrows, ...b.strokes].map((i) => i.id)); }
    else if (e.key === "Escape") { setSel([]); setLinkFrom(null); setTool("select"); setShowShapes(false); setEditing(null); }
  };

  const byId = Object.fromEntries(board.items.map((i) => [i.id, i]));
  const single = sel.length === 1 && byId[sel[0]];
  const pick = (t) => { setTool(t); setLinkFrom(null); setShowShapes(false); setEditing(null); };
  const tb = (t, l, on, fn, dis) => (
    <button key={l} className={on ? "on" : ""} disabled={dis} onClick={fn} title={l} aria-label={l}><Ico s={ICONS[t]} /></button>
  );
  const hitStyle = { pointerEvents: tool === "select" || tool === "eraser" ? "stroke" : "none" };
  const hasSel = sel.length > 0;

  return (
    <div
      ref={root} tabIndex={0} onKeyDown={key} className={"dmb-root" + (full ? " full" : "")} data-mode={dark ? "dark" : "light"} style={style}
      onPaste={(e) => [...e.clipboardData.files].forEach(addImage)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); [...e.dataTransfer.files].forEach(addImage); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{CSS}</style>
      <div
        ref={ref} className="dmb-canvas" data-canvas="1"
        style={{ cursor: tool === "hand" ? "grab" : tool === "pen" ? QUILL_CURSOR : ARROW_CURSOR }}
        onPointerDownCapture={panDown} onPointerDown={down} onPointerMove={move} onPointerUp={up}
      >
        {/* world layer: pure DOM + SVG, re-rasterised at every zoom level so it stays sharp */}
        <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${view.x}px,${view.y}px) scale(${view.z})`, transformOrigin: "0 0", pointerEvents: "none" }}>
          <svg style={{ position: "absolute", overflow: "visible", width: 1, height: 1 }}>
            <defs><marker id="dmb-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" className="dmb-head-fill" /></marker></defs>
            {board.links.map((l) => {
              const a = byId[l.from], b = byId[l.to]; if (!a || !b) return null;
              const [x1, y1] = ctr(a), [x2, y2] = ctr(b);
              return <path key={l.id} d={`M${x1},${y1}Q${(x1 + x2) / 2},${(y1 + y2) / 2 - 40} ${x2},${y2}`} className="dmb-link" markerEnd="url(#dmb-arr)" />;
            })}
            {board.arrows.map((a) => {
              const d = `M${a.x1},${a.y1}L${a.x2},${a.y2}`;
              return (
                <g key={a.id}>
                  {sel.includes(a.id) && <path d={d} className="dmb-halo" />}
                  <path d={d} className="dmb-link" markerEnd="url(#dmb-arr)" />
                  <path d={d} className="dmb-hit" style={hitStyle} onPointerDown={(e) => shapeDown(e, a.id)} />
                </g>
              );
            })}
            {board.strokes.map((s) => {
              const d = smooth(s.pts);
              return (
                <g key={s.id}>
                  {sel.includes(s.id) && <path d={d} className="dmb-halo" />}
                  <path d={d} className="dmb-ink" style={{ stroke: s.c === INK || s.c === "#1d1208" ? "var(--dmb-line)" : s.c }} />
                  <path d={d} className="dmb-hit" style={hitStyle} onPointerDown={(e) => shapeDown(e, s.id)} />
                </g>
              );
            })}
            {marq && <rect x={Math.min(marq.x1, marq.x2)} y={Math.min(marq.y1, marq.y2)} width={Math.abs(marq.x2 - marq.x1)} height={Math.abs(marq.y2 - marq.y1)} className="dmb-marq" vectorEffect="non-scaling-stroke" />}
          </svg>
          {board.items.map((it) => {
            const on = sel.includes(it.id), T = TYPES[it.type], ed = editing === it.id;
            const kind = it.type === "image" ? "img" : it.type === "text" ? "txt" : it.type === "shape" ? "shp" : "";
            return (
              <div
                key={it.id} data-id={it.id}
                className={`dmb-card ${kind}${on ? " sel" : ""}${ed ? " edit" : ""}${linkFrom === it.id ? " linking" : ""}`}
                style={{ left: it.x, top: it.y, width: W(it), height: H(it), transform: it.rot ? `rotate(${it.rot}deg)` : undefined, "--tint": T ? T.tint : undefined }}
                onPointerDown={(e) => cardDown(e, it)}
                onMouseDown={(e) => { if (!e.target.matches?.("textarea,input")) e.preventDefault(); }}
                onFocus={(e) => { if (e.target.matches?.("textarea,input")) setEditing(it.id); }}
                onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setEditing((cur) => (cur === it.id ? null : cur)); }}
              >
                {it.type === "shape" && (
                  <svg className="dmb-shape" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {(SHAPES[it.shape] || SHAPES.rect).el}
                  </svg>
                )}
                {T && (
                  <div className="dmb-head">
                    {it.type !== "note" && <Ico s={ICONS[it.type]} />}
                    <input value={it.title || ""} tabIndex={-1} onFocus={snap} onChange={(e) => patch(it.id, { title: e.target.value })} />
                  </div>
                )}
                {it.type === "image"
                  ? <img src={it.src} alt="" draggable={false} className="dmb-pic" />
                  : <textarea tabIndex={-1} style={it.fs ? { fontSize: it.fs } : undefined} placeholder={it.type === "text" ? "Write in ink…" : it.type === "shape" ? "Label…" : "Scribble here…"} value={it.text || ""} onFocus={snap} onChange={(e) => patch(it.id, { text: e.target.value })} />}
                {single && single.id === it.id && !ed && (
                  <>
                    {HANDLES.map(([sx, sy]) => (
                      <span key={`${sx}${sy}`} className="dmb-h" style={{ left: sx < 0 ? -6 : "calc(100% - 6px)", top: sy < 0 ? -6 : "calc(100% - 6px)", cursor: sx * sy > 0 ? "nwse-resize" : "nesw-resize" }} onPointerDown={(e) => handleDown(e, it, sx, sy)} />
                    ))}
                    <span className="dmb-rot" onPointerDown={(e) => rotDown(e, it)} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="dmb-tl">{tb("undo", "Undo", 0, undo)}{tb("redo", "Redo", 0, redo)}</div>
      <div className="dmb-top">
        {topRight}
        <button className="dmb-fs" onClick={toggleFull}>{full ? "✕ Exit fullscreen" : "⤢ Fullscreen"}</button>
      </div>
      <div className={`dmb-status ${status.kind}`} role={status.kind.includes("error") || status.kind === "conflict" ? "alert" : "status"}>
        {status.message}
        {status.kind === "error" && <button onClick={() => { persistence.current.failed = false; persistence.current.save(); }}>Retry save</button>}
        {(status.kind === "error" || status.kind === "conflict") && <button onClick={() => {
          const blob = new Blob([JSON.stringify(bref.current, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob), a = document.createElement("a");
          a.href = url; a.download = "dm-board-unsaved.json"; a.click(); URL.revokeObjectURL(url);
        }}>Export unsaved board</button>}
        {imageError && <div role="alert">{imageError}</div>}
      </div>
      {(status.kind === "loading" || status.kind === "load-error") && <div className="dmb-overlay" role="status">{status.message}{status.kind === "load-error" && " Please leave and reopen the board to retry."}</div>}

      <div className="dmb-tools" role="toolbar" aria-label="Board tools" aria-orientation="vertical">
        {tb("select", "Select", tool === "select", () => pick("select"))}
        {tb("text", "Text", tool === "text", () => pick("text"))}
        {tb("pen", "Draw", tool === "pen", () => pick("pen"))}
        {tb("eraser", "Erase", tool === "eraser", () => pick("eraser"))}
        {tb("box", "Box", tool === "box", () => pick("box"))}
        {tb("arrow", "Arrow", tool === "arrow", () => pick("arrow"))}
        {tb("shapes", "Shapes", tool === "shape" || showShapes, () => setShowShapes((v) => !v))}
      </div>
      {showShapes && (
        <div className="dmb-pop">
          <div className="dmb-pop-title">Shapes</div>
          <div className="dmb-pop-row">
            {Object.entries(SHAPES).map(([k, s]) => (
              <button key={k} className={tool === "shape" && shapeKind === k ? "on" : ""} title={s.label} aria-label={s.label} onClick={() => { setShapeKind(k); setTool("shape"); setShowShapes(false); }}><Ico s={ICONS[k]} /></button>
            ))}
          </div>
          <div className="dmb-pop-title">Icons &amp; cards</div>
          <div className="dmb-pop-row">
            {Object.entries(TYPES).map(([t, c]) => tb(t, c.label, 0, () => add({ type: t, title: c.label, text: "" })))}
            {tb("image", "Image", 0, () => { setShowShapes(false); file.current.click(); })}
          </div>
        </div>
      )}

      <div className="dmb-bar">
        {tb("hand", "Pan", tool === "hand", () => pick("hand"))}
        <span className="dmb-sep" />
        {tb("copy", "Dupe", 0, dupe, !hasSel)}
        {tb("trash", "Burn", 0, del, !hasSel)}
      </div>
      <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { [...e.target.files].forEach(addImage); e.target.value = ""; }} />

      <div className="dmb-zoom">
        <button onClick={() => zoomBy(1 / 1.25)}>−</button>
        <span>{Math.round(view.z * 100)}%</span>
        <button onClick={() => zoomBy(1.25)}>+</button>
        <button onClick={fit}>Fit</button>
      </div>
      {children}
    </div>
  );
}

/* ---------- boards & folders (slide-out menu) ---------- */
// `renaming` and `error` live in the parent: the board canvas is re-created when the active board
// changes, and this panel (rendered inside it) must not lose them.
function BoardsPanel({ campaignId, list, setList, activeId, setActiveId, open, onClose, renaming, setRenaming, error, setError }) {
  const navigate = useNavigate();
  const base = `/dmboard/${campaignId}`;
  const atLimit = list.limit != null && list.boards.length >= list.limit;
  const run = async (fn) => { setError(""); try { await fn(); } catch (e) { setError(e.message); } };

  const addBoard = (folder = null) => run(async () => {
    const b = await api(`${base}/boards`, { method: "POST", body: { name: "Untitled board", folder } });
    setList((l) => ({ ...l, boards: [...l.boards, b] }));
    setActiveId(b._id);
    setRenaming({ kind: "board", id: b._id, value: b.name });
  });
  const addFolder = () => run(async () => {
    const f = await api(`${base}/folders`, { method: "POST", body: { name: "New folder" } });
    setList((l) => ({ ...l, folders: [...l.folders, f] }));
    setRenaming({ kind: "folder", id: f._id, value: f.name });
  });
  const commitRename = () => {
    const r = renaming; setRenaming(null);
    if (!r || !r.value.trim()) return;
    run(async () => {
      if (r.kind === "board") {
        const b = await api(`${base}/boards/${r.id}`, { method: "PATCH", body: { name: r.value } });
        setList((l) => ({ ...l, boards: l.boards.map((x) => (x._id === b._id ? { ...x, name: b.name } : x)) }));
      } else {
        const f = await api(`${base}/folders/${r.id}`, { method: "PATCH", body: { name: r.value } });
        setList((l) => ({ ...l, folders: l.folders.map((x) => (x._id === f._id ? f : x)) }));
      }
    });
  };
  const moveBoard = (id, folder) => run(async () => {
    const b = await api(`${base}/boards/${id}`, { method: "PATCH", body: { folder } });
    setList((l) => ({ ...l, boards: l.boards.map((x) => (x._id === b._id ? { ...x, folder: b.folder } : x)) }));
  });
  const removeBoard = (b) => {
    if (!window.confirm(`Delete "${b.name}"? This can't be undone.`)) return;
    run(async () => {
      const rest = list.boards.filter((x) => x._id !== b._id);
      if (activeId === b._id && rest.length) { setActiveId(rest[0]._id); await new Promise((r) => setTimeout(r, 300)); }
      await api(`${base}/boards/${b._id}`, { method: "DELETE" });
      setList((l) => ({ ...l, boards: l.boards.filter((x) => x._id !== b._id) }));
    });
  };
  const removeFolder = (f) => {
    if (!window.confirm(`Delete the folder "${f.name}"? Its boards move to the top level.`)) return;
    run(async () => {
      await api(`${base}/folders/${f._id}`, { method: "DELETE" });
      setList((l) => ({ ...l, folders: l.folders.filter((x) => x._id !== f._id), boards: l.boards.map((x) => (x.folder === f._id ? { ...x, folder: null } : x)) }));
    });
  };

  const nameField = (kind, id, text) => (renaming && renaming.kind === kind && renaming.id === id
    ? <input className="dmb-rename" autoFocus value={renaming.value} onChange={(e) => setRenaming({ ...renaming, value: e.target.value })} onFocus={(e) => e.target.select()} onBlur={commitRename} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setRenaming(null); }} />
    : text);
  const row = (b) => (
    <div key={b._id} className={"dmb-row" + (b._id === activeId ? " on" : "")}>
      <span className="dmb-row-name" onClick={() => setActiveId(b._id)} onDoubleClick={() => setRenaming({ kind: "board", id: b._id, value: b.name })}>{nameField("board", b._id, b.name)}</span>
      {list.folders.length > 0 && (
        <select title="Move to folder" value={b.folder || ""} onChange={(e) => moveBoard(b._id, e.target.value || null)}>
          <option value="">No folder</option>
          {list.folders.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
      )}
      <button title="Rename" aria-label="Rename" onClick={() => setRenaming({ kind: "board", id: b._id, value: b.name })}>✎</button>
      <button title="Delete" aria-label="Delete" disabled={list.boards.length <= 1} onClick={() => removeBoard(b)}>✕</button>
    </div>
  );

  return (
    <aside className={"dmb-panel" + (open ? " open" : "")} aria-hidden={!open}>
      <div className="dmb-panel-head">
        <strong>Boards</strong>
        <button onClick={onClose} aria-label="Close boards menu">✕</button>
      </div>
      <div className="dmb-panel-actions">
        <button disabled={atLimit} onClick={() => addBoard(null)}>+ Board</button>
        <button disabled={!list.premium} onClick={addFolder}>+ Folder</button>
      </div>
      {!list.premium && (
        <div className="dmb-note">
          Free DMs get one board and no folders.{" "}
          <a href="/premium" onClick={(e) => { e.preventDefault(); navigate("/premium"); }}>Upgrade for unlimited</a>
        </div>
      )}
      {error && <div className="dmb-note err" role="alert">{error}</div>}
      <div className="dmb-panel-list">
        {list.boards.filter((b) => !b.folder).map(row)}
        {list.folders.map((f) => (
          <div key={f._id} className="dmb-folder">
            <div className="dmb-folder-head">
              <span className="dmb-row-name" onDoubleClick={() => setRenaming({ kind: "folder", id: f._id, value: f.name })}>▸ {nameField("folder", f._id, f.name)}</span>
              <button title="New board in folder" aria-label="New board in folder" disabled={atLimit} onClick={() => addBoard(f._id)}>＋</button>
              <button title="Rename folder" aria-label="Rename folder" onClick={() => setRenaming({ kind: "folder", id: f._id, value: f.name })}>✎</button>
              <button title="Delete folder" aria-label="Delete folder" onClick={() => removeFolder(f)}>✕</button>
            </div>
            {list.boards.filter((b) => b.folder === f._id).map(row)}
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function DMBoard({ campaignId, style }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [activeId, setActiveIdRaw] = useState(null);
  const [panel, setPanel] = useState(false);
  const [renaming, setRenaming] = useState(null); // { kind: "board" | "folder", id, value }
  const [panelError, setPanelError] = useState("");
  const storeKey = `dmboard:active:${campaignId}`;
  const setActiveId = (id) => { setActiveIdRaw(id); try { localStorage.setItem(storeKey, id); } catch { /* ignore */ } };

  useEffect(() => {
    let off = false;
    setList(null); setError(""); setActiveIdRaw(null);
    api(`/dmboard/${campaignId}`).then((data) => {
      if (off) return;
      let saved = null;
      try { saved = localStorage.getItem(storeKey); } catch { /* ignore */ }
      setList(data);
      setActiveIdRaw((data.boards.find((b) => b._id === saved) || data.boards[0] || {})._id || null);
    }).catch((e) => { if (!off) setError(e.message); });
    return () => { off = true; };
  }, [campaignId, storeKey]);

  if (error) return <div className="page-content" role="alert">Could not load boards: {error}</div>;
  if (!list || !activeId) return <div className="page-content">Unrolling your boards…</div>;
  const active = list.boards.find((b) => b._id === activeId);
  return (
    <BoardCanvas
      key={activeId} campaignId={campaignId} boardId={activeId} style={style}
      topRight={<button className="dmb-fs dmb-menu-btn" onClick={() => setPanel((v) => !v)} aria-expanded={panel}>☰ {active ? active.name : "Boards"}</button>}
    >
      <BoardsPanel campaignId={campaignId} list={list} setList={setList} activeId={activeId} setActiveId={setActiveId} open={panel} onClose={() => setPanel(false)} renaming={renaming} setRenaming={setRenaming} error={panelError} setError={setPanelError} />
    </BoardCanvas>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=MedievalSharp&display=swap');
.dmb-root{
 --dmb-paper:#efe4c8;--dmb-ink:#2b1d10;--dmb-line:#000;--dmb-edge:#5a3b1c;--dmb-shadow:rgba(60,35,10,.18);
 --dmb-chrome:#f6edd5;--dmb-chrome-hi:#e6d6ae;--dmb-icon-filter:brightness(0);
 --dmb-chrome-text:#2b1d10;--dmb-rim:color-mix(in srgb,var(--gold,#9a7c3a) 70%,#8a6a2a);
 --dmb-danger:#8a1c1c;--dmb-vig:rgba(120,85,40,.22);
 --dmb-card-img:#f4e8c8;--dmb-card-mix:100%;
 position:relative;width:100%;height:100%;min-height:480px;outline:0;overflow:hidden;border-radius:8px;background:var(--dmb-chrome);
 touch-action:none;overscroll-behavior:contain;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
.dmb-root *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.dmb-root[data-mode=dark]{
 --dmb-paper:color-mix(in srgb,var(--surface,#1a1c1e) 88%,var(--gold,#c8a060));--dmb-ink:var(--text,#e8e4dc);--dmb-line:#fff;--dmb-edge:var(--border-strong,#3e4248);--dmb-shadow:rgba(0,0,0,.5);
 --dmb-icon-filter:brightness(0) invert(1);--dmb-chrome:var(--surface2,#222528);--dmb-chrome-hi:var(--border,#2e3135);--dmb-chrome-text:var(--text,#e8e4dc);--dmb-rim:var(--gold,#c8a060);
 --dmb-danger:var(--red,#e05050);--dmb-vig:rgba(0,0,0,.3);
 --dmb-card-img:var(--surface,#1a1c1e);--dmb-card-mix:16%}
.dmb-root.full{position:fixed;inset:0;z-index:9999;border-radius:0}
.dmb-canvas{position:absolute;inset:0;overflow:hidden;touch-action:none;font-family:'IM Fell English',Georgia,serif;color:var(--dmb-ink);text-rendering:geometricPrecision;
 background-color:var(--dmb-paper);box-shadow:inset 0 0 90px var(--dmb-vig)}
.dmb-card{position:absolute;box-sizing:border-box;border:1.5px solid var(--dmb-line);border-radius:8px;padding:8px;box-shadow:0 2px 8px var(--dmb-shadow);cursor:grab;pointer-events:auto;display:flex;flex-direction:column;overflow:visible;
 background:color-mix(in srgb,var(--tint,var(--dmb-paper)) var(--dmb-card-mix),var(--surface,var(--dmb-paper)))}
.dmb-root[data-mode=light] .dmb-card{background:var(--tint,var(--dmb-card-img))}
.dmb-card.txt,.dmb-card.shp{background:none!important;border:1px dashed transparent;box-shadow:none}
.dmb-card.txt textarea{font-size:26px;line-height:1.2;font-style:normal}
.dmb-card.shp{padding:0}
.dmb-card.shp textarea{position:relative;text-align:center;padding:14% 18%;box-sizing:border-box;font-size:17px;font-style:normal}
.dmb-shape{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.dmb-shape *{fill:color-mix(in srgb,var(--dmb-line) 6%,transparent);stroke:var(--dmb-line);stroke-width:2;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.dmb-card.img{padding:6px;background:var(--dmb-card-img)!important}
.dmb-pic{width:100%;height:100%;object-fit:contain;pointer-events:none}
.dmb-card.sel{outline:1.5px dashed var(--dmb-line);outline-offset:5px}
.dmb-card.linking{outline:2px solid var(--dmb-rim);outline-offset:5px}
.dmb-head{display:flex;align-items:center;gap:6px;border-bottom:1px solid color-mix(in srgb,var(--dmb-line) 45%,transparent);padding-bottom:4px;margin-bottom:4px}
.dmb-head img{width:24px;height:24px;filter:var(--dmb-icon-filter);border:0;border-radius:0}
.dmb-card input,.dmb-card textarea{background:transparent;border:0;outline:0;width:100%;color:var(--dmb-ink);font:inherit;resize:none;pointer-events:none}
.dmb-card input{font-family:'MedievalSharp',serif;font-size:16px}
.dmb-card textarea{flex:1;min-height:0;font-size:15px;font-style:italic;line-height:1.3}
.dmb-card.edit{cursor:text}
.dmb-card.edit input,.dmb-card.edit textarea{pointer-events:auto;user-select:text;-webkit-user-select:text}
.dmb-h{position:absolute;width:11px;height:11px;box-sizing:border-box;background:var(--dmb-paper);border:1.5px solid var(--dmb-line);border-radius:2px;z-index:2}
.dmb-rot{position:absolute;left:50%;top:-30px;width:13px;height:13px;margin-left:-6.5px;box-sizing:border-box;border-radius:50%;background:var(--dmb-paper);border:1.5px solid var(--dmb-line);cursor:grab;z-index:2}
.dmb-rot::after{content:'';position:absolute;left:50%;top:100%;width:0;height:17px;border-left:1.5px solid var(--dmb-line)}
.dmb-ink{fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.dmb-link{fill:none;stroke:var(--dmb-line);stroke-width:2;stroke-dasharray:7 5;stroke-linecap:round}
.dmb-head-fill{fill:var(--dmb-line)}
.dmb-halo{fill:none;stroke:var(--dmb-line);stroke-opacity:.22;stroke-width:12;stroke-linecap:round;stroke-linejoin:round}
.dmb-hit{fill:none;stroke:transparent;stroke-width:16;stroke-linecap:round;stroke-linejoin:round;cursor:pointer}
.dmb-marq{fill:color-mix(in srgb,var(--dmb-line) 8%,transparent);stroke:var(--dmb-line);stroke-width:1.2;stroke-dasharray:5 4}
.dmb-bar,.dmb-tl,.dmb-zoom,.dmb-tools,.dmb-pop{position:absolute;display:flex;gap:2px;align-items:center;background:var(--dmb-chrome);border:1px solid color-mix(in srgb,var(--dmb-rim) 60%,transparent);border-radius:10px;padding:4px;box-shadow:0 2px 10px rgba(0,0,0,.25)}
.dmb-bar{padding:3px;left:50%;bottom:14px;transform:translateX(-50%);max-width:calc(100% - 24px);overflow-x:auto}
.dmb-tl{left:12px;top:12px}
.dmb-tools{left:12px;top:64px;flex-direction:column;border-radius:16px;padding:3px;gap:1px;max-height:calc(100% - 240px);overflow-y:auto}
.dmb-pop{left:62px;top:64px;flex-direction:column;align-items:stretch;padding:8px;max-width:calc(100% - 80px);z-index:2}
.dmb-pop-row{display:flex;flex-wrap:wrap;gap:2px}
.dmb-pop-title{color:var(--dmb-chrome-text);opacity:.75;font:12px 'MedievalSharp',serif;text-transform:uppercase;letter-spacing:.08em}
.dmb-zoom{left:12px;bottom:70px;color:var(--dmb-chrome-text);font:13px 'MedievalSharp',serif}
.dmb-zoom span{min-width:46px;text-align:center}
.dmb-root button{display:flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;background:none;border:1px solid transparent;border-radius:6px;color:var(--dmb-chrome-text);font:12px 'MedievalSharp',serif;cursor:pointer}
.dmb-zoom button,.dmb-status button,.dmb-panel button{width:auto;min-width:28px;height:28px;padding:0 7px}
.dmb-root button.on,.dmb-root button:hover:not(:disabled){background:var(--dmb-chrome-hi);border-color:var(--dmb-rim)}
.dmb-root button:disabled{opacity:.35;cursor:default}
.dmb-bar img,.dmb-tl img,.dmb-tools img,.dmb-pop img{width:18px;height:18px;filter:var(--dmb-icon-filter)}
.dmb-top{position:absolute;right:12px;top:12px;display:flex;gap:8px;max-width:calc(100% - 100px)}
.dmb-root .dmb-fs{width:auto;height:auto;padding:7px 12px;background:var(--dmb-rim);color:#1d1208;border:1px solid var(--dmb-chrome);font-size:14px;box-shadow:0 2px 10px rgba(0,0,0,.25);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.dmb-root .dmb-fs:hover{background:color-mix(in srgb,var(--dmb-rim) 82%,#fff);border-color:var(--dmb-chrome)}
.dmb-sep{width:1px;align-self:stretch;background:var(--dmb-rim);opacity:.5;margin:0 3px}
.dmb-status{position:absolute;top:56px;right:12px;max-width:min(360px,calc(100% - 24px));padding:6px 10px;border:1px solid var(--dmb-rim);border-radius:6px;background:var(--dmb-chrome);color:var(--dmb-chrome-text);font:14px 'IM Fell English',Georgia,serif}
.dmb-status.error,.dmb-status.conflict,.dmb-status.load-error{border-color:var(--dmb-danger)}
.dmb-status button{display:inline-flex;margin-left:8px;text-decoration:underline}
.dmb-overlay{position:absolute;inset:0;display:grid;place-content:center;padding:24px;text-align:center;background:color-mix(in srgb,var(--dmb-chrome) 90%,transparent);color:var(--dmb-chrome-text);font:20px 'IM Fell English',Georgia,serif;z-index:3}
.dmb-panel{position:absolute;top:0;right:0;bottom:0;width:min(290px,100%);z-index:6;display:flex;flex-direction:column;gap:8px;padding:12px;box-sizing:border-box;background:var(--dmb-chrome);color:var(--dmb-chrome-text);border-left:1px solid var(--dmb-rim);box-shadow:-6px 0 18px rgba(0,0,0,.25);font:14px 'IM Fell English',Georgia,serif;transform:translateX(105%);transition:transform .22s ease;visibility:hidden}
.dmb-panel.open{transform:none;visibility:visible}
.dmb-panel-head{display:flex;align-items:center;justify-content:space-between;font-family:'MedievalSharp',serif;font-size:16px}
.dmb-panel-actions{display:flex;gap:6px}
.dmb-panel-actions button{border-color:var(--dmb-rim)}
.dmb-note{font-size:12px;line-height:1.4;opacity:.85}
.dmb-note.err{color:var(--dmb-danger);opacity:1}
.dmb-note a{color:inherit;text-decoration:underline}
.dmb-panel-list{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:3px;user-select:none}
.dmb-row,.dmb-folder-head{display:flex;align-items:center;gap:2px;padding:2px 4px;border-radius:6px;border:1px solid transparent}
.dmb-row.on{background:var(--dmb-chrome-hi);border-color:var(--dmb-rim)}
.dmb-row-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;padding:3px 2px}
.dmb-folder{margin-top:6px}
.dmb-folder-head{font-family:'MedievalSharp',serif;opacity:.9}
.dmb-folder .dmb-row{margin-left:14px}
.dmb-panel select{max-width:84px;background:transparent;color:inherit;border:1px solid color-mix(in srgb,var(--dmb-rim) 50%,transparent);border-radius:5px;font-size:11px;height:24px}
.dmb-panel .dmb-rename{width:100%;box-sizing:border-box;background:transparent;color:inherit;border:1px solid var(--dmb-rim);border-radius:4px;padding:2px 4px;font:inherit;user-select:text;-webkit-user-select:text}
`;
