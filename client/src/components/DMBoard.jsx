import { useState, useRef, useEffect } from "react";
import { api } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

/* ---------- ASSETS: swap these placeholder URLs for your own icons ---------- */
const P = (t) => `https://placehold.co/48x48/3b2a1a/e8d5a3?text=${t}`;
export const ICONS = {
  // left tool bar
  select: P("SEL"), text: P("TXT"), pen: P("DRAW"), box: P("BOX"), arrow: P("ARROW"), shapes: P("SHAPE"),
  // shape picker
  rect: P("RECT"), ellipse: P("OVAL"), diamond: P("DIAM"), triangle: P("TRI"), star: P("STAR"),
  // campaign icons / cards
  npc: P("NPC"), location: P("LOC"), encounter: P("ENC"), loot: P("LOOT"), note: P("NOTE"), image: P("IMG"),
  // bottom bar
  hand: P("HAND"), eraser: P("ERASE"), trash: P("BURN"), undo: P("UNDO"), redo: P("REDO"), copy: P("DUPE"),
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
const nearArrow = (x, y, a, r) => {
  const dx = a.x2 - a.x1, dy = a.y2 - a.y1;
  const t = Math.max(0, Math.min(1, ((x - a.x1) * dx + (y - a.y1) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - (a.x1 + t * dx), y - (a.y1 + t * dy)) < r;
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

export default function DMBoard({ boardId, style }) {
  const { theme, lightMode } = useTheme();
  const dark = theme !== "light" && (!lightMode || theme === "dark");
  const [board, setBoard] = useState(EMPTY);
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const [tool, setTool] = useState("select");
  const [shapeKind, setShapeKind] = useState("rect");
  const [showShapes, setShowShapes] = useState(false);
  const [sel, setSel] = useState([]);
  const [linkFrom, setLinkFrom] = useState(null);
  const [marq, setMarq] = useState(null);
  const [status, setStatus] = useState({ kind: "loading", message: "Unrolling your board…" });
  const [imageError, setImageError] = useState("");
  const [full, setFull] = useState(false);
  const [fresh, setFresh] = useState(null); // newly placed item, focused for typing
  const root = useRef(null), ref = useRef(null), file = useRef(null), drag = useRef(null);
  const persistence = useRef(null);
  const bref = useRef(board); bref.current = board;
  const hist = useRef({ past: [], future: [] });

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
        const result = await api(`/dmboard/${boardId}`, { method: "PUT", body: { board: snapshot, version: state.version } });
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
    api(`/dmboard/${boardId}`).then(({ board: saved, version }) => {
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
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      state.active = false;
      window.removeEventListener("beforeunload", beforeUnload);
      clearTimeout(state.timer);
      state.save();
    };
  }, [boardId]);
  useEffect(() => {
    const state = persistence.current;
    if (!state?.ready) return;
    if (state.baseline === board) { state.baseline = null; return; }
    state.pending = board;
    clearTimeout(state.timer);
    if (!state.failed) {
      setStatus({ kind: "saving", message: "Unsaved changes…" });
      state.timer = setTimeout(state.save, 2000);
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

  /* wheel: pinch/ctrl = fine zoom, plain wheel = zoom (non-passive so the page doesn't scroll) */
  useEffect(() => {
    const el = ref.current;
    const f = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      setView((v) => {
        const z = Math.min(4, Math.max(0.1, v.z * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))));
        return { z, x: mx - ((mx - v.x) / v.z) * z, y: my - ((my - v.y) / v.z) * z };
      });
    };
    el.addEventListener("wheel", f, { passive: false });
    return () => el.removeEventListener("wheel", f);
  }, []);

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
    setFresh(it.type === "image" ? null : id);
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
      links: b.links.filter((l) => !sel.includes(l.from) && !sel.includes(l.to)),
    }));
    setSel([]);
  };
  const dupe = () => {
    const picked = bref.current.items.filter((i) => sel.includes(i.id));
    if (!picked.length) return;
    snap();
    const m = {}, copies = picked.map((i) => ({ ...i, id: (m[i.id] = uid()), x: i.x + 30, y: i.y + 30 }));
    setBoard((b) => ({ ...b, items: [...b.items, ...copies], links: [...b.links, ...b.links.filter((l) => m[l.from] && m[l.to]).map((l) => ({ id: uid(), from: m[l.from], to: m[l.to] }))] }));
    setSel(copies.map((c) => c.id));
  };
  const zoomBy = (f) => { const r = ref.current.getBoundingClientRect(), mx = r.width / 2, my = r.height / 2; setView((v) => { const z = Math.min(4, Math.max(0.1, v.z * f)); return { z, x: mx - ((mx - v.x) / v.z) * z, y: my - ((my - v.y) / v.z) * z }; }); };
  const fit = () => {
    const its = bref.current.items, r = ref.current.getBoundingClientRect();
    if (!its.length) return setView({ x: 0, y: 0, z: 1 });
    const x1 = Math.min(...its.map((i) => i.x)), y1 = Math.min(...its.map((i) => i.y));
    const x2 = Math.max(...its.map((i) => i.x + W(i))), y2 = Math.max(...its.map((i) => i.y + H(i)));
    const z = Math.min(2, Math.max(0.1, Math.min((r.width - 120) / (x2 - x1), (r.height - 200) / (y2 - y1))));
    setView({ z, x: (r.width - (x2 - x1) * z) / 2 - x1 * z, y: (r.height - (y2 - y1) * z) / 2 - y1 * z });
  };

  /* canvas gestures */
  const down = (e) => {
    if (!e.target.dataset.canvas) return;
    root.current.focus(); ref.current.setPointerCapture(e.pointerId);
    setShowShapes(false);
    const p = world(e);
    if (e.button === 1 || tool === "hand") drag.current = { k: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
    else if (tool === "pen") { snap(); const id = uid(); drag.current = { k: "pen", id }; setBoard((b) => ({ ...b, strokes: [...b.strokes, { id, pts: [[p.x, p.y]], c: INK }] })); }
    else if (tool === "eraser") { snap(); drag.current = { k: "erase" }; }
    else if (tool === "text") drag.current = { k: "text", x: p.x, y: p.y }; // placed on release so the new field keeps focus
    else if (tool === "box" || tool === "shape") { drag.current = { k: "make", x: p.x, y: p.y }; setMarq({ x1: p.x, y1: p.y, x2: p.x, y2: p.y }); }
    else if (tool === "arrow") { snap(); const id = uid(); drag.current = { k: "arrow", id }; setBoard((b) => ({ ...b, arrows: [...b.arrows, { id, x1: p.x, y1: p.y, x2: p.x, y2: p.y }] })); }
    else { if (!e.shiftKey) setSel([]); setLinkFrom(null); drag.current = { k: "marq", x: p.x, y: p.y, base: e.shiftKey ? sel : [] }; setMarq({ x1: p.x, y1: p.y, x2: p.x, y2: p.y }); }
  };
  const move = (e) => {
    const p = world(e), d = drag.current;
    if (!d) return;
    if (d.k === "pan") setView((v) => ({ ...v, x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy }));
    if (d.k === "pen") setBoard((b) => ({ ...b, strokes: b.strokes.map((s) => (s.id === d.id ? { ...s, pts: [...s.pts, [p.x, p.y]] } : s)) }));
    if (d.k === "arrow") setBoard((b) => ({ ...b, arrows: b.arrows.map((a) => (a.id === d.id ? { ...a, x2: p.x, y2: p.y } : a)) }));
    if (d.k === "erase") {
      const r = 14 / view.z;
      setBoard((b) => ({
        ...b,
        strokes: b.strokes.filter((s) => !s.pts.some(([x, y]) => Math.hypot(x - p.x, y - p.y) < r)),
        arrows: b.arrows.filter((a) => !nearArrow(p.x, p.y, a, r)),
      }));
    }
    if (d.k === "item") setBoard((b) => ({ ...b, items: b.items.map((i) => (d.s[i.id] ? { ...i, x: d.s[i.id].x + p.x - d.x, y: d.s[i.id].y + p.y - d.y } : i)) }));
    if (d.k === "size") patch(d.id, { w: Math.max(120, d.w + p.x - d.x), h: Math.max(80, d.h + p.y - d.y) });
    if (d.k === "make") setMarq({ x1: d.x, y1: d.y, x2: p.x, y2: p.y });
    if (d.k === "marq") {
      const m = { x1: d.x, y1: d.y, x2: p.x, y2: p.y }; setMarq(m);
      const [ax, bx] = [Math.min(m.x1, m.x2), Math.max(m.x1, m.x2)], [ay, by] = [Math.min(m.y1, m.y2), Math.max(m.y1, m.y2)];
      setSel([...new Set([...d.base, ...bref.current.items.filter((i) => i.x < bx && i.x + W(i) > ax && i.y < by && i.y + H(i) > ay).map((i) => i.id)])]);
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
    e.stopPropagation(); root.current.focus();
    if (tool === "arrow") {
      if (!linkFrom) setLinkFrom(it.id);
      else if (linkFrom !== it.id) { snap(); setBoard((b) => ({ ...b, links: [...b.links, { id: uid(), from: linkFrom, to: it.id }] })); setLinkFrom(null); }
      return;
    }
    if (tool !== "select") return;
    let ids = sel.includes(it.id) ? sel : [it.id];
    if (e.shiftKey) ids = sel.includes(it.id) ? sel.filter((x) => x !== it.id) : [...sel, it.id];
    setSel(ids);
    if (!ids.includes(it.id)) return;
    snap();
    const p = world(e), s = {};
    bref.current.items.forEach((i) => ids.includes(i.id) && (s[i.id] = { x: i.x, y: i.y }));
    drag.current = { k: "item", s, x: p.x, y: p.y };
    ref.current.setPointerCapture(e.pointerId);
  };
  const arrowDown = (e, a) => {
    if (tool !== "select") return;
    e.stopPropagation(); root.current.focus();
    setSel(e.shiftKey ? (sel.includes(a.id) ? sel.filter((x) => x !== a.id) : [...sel, a.id]) : [a.id]);
  };
  const sizeDown = (e, it) => {
    e.stopPropagation(); snap(); const p = world(e);
    drag.current = { k: "size", id: it.id, w: W(it), h: H(it), x: p.x, y: p.y };
    ref.current.setPointerCapture(e.pointerId);
  };

  const key = (e) => {
    if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const m = e.ctrlKey || e.metaKey;
    if (e.key === "Delete" || e.key === "Backspace") del();
    else if (m && e.key === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (m && e.key === "y") { e.preventDefault(); redo(); }
    else if (m && e.key === "d") { e.preventDefault(); dupe(); }
    else if (m && e.key === "a") { e.preventDefault(); setSel(bref.current.items.map((i) => i.id)); }
    else if (e.key === "Escape") { setSel([]); setLinkFrom(null); setTool("select"); setShowShapes(false); }
  };

  const byId = Object.fromEntries(board.items.map((i) => [i.id, i]));
  const ctr = (i) => [i.x + W(i) / 2, i.y + H(i) / 2];
  const gs = (() => { let g = 40; while (g * view.z < 16) g *= 2; return g * view.z; })();
  const single = sel.length === 1 && byId[sel[0]];
  const pick = (t) => { setTool(t); setLinkFrom(null); setShowShapes(false); };
  const tb = (t, l, on, fn, dis) => (
    <button key={l} className={on ? "on" : ""} disabled={dis} onClick={fn} title={l}><Ico s={ICONS[t]} />{l}</button>
  );

  return (
    <div
      ref={root} tabIndex={0} onKeyDown={key} className={"dmb-root" + (full ? " full" : "")} data-mode={dark ? "dark" : "light"} style={style}
      onPaste={(e) => [...e.clipboardData.files].forEach(addImage)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); [...e.dataTransfer.files].forEach(addImage); }}
    >
      <style>{CSS}</style>
      <div
        ref={ref} className="dmb-canvas" data-canvas="1"
        style={{ backgroundSize: `${gs}px ${gs}px, 300px 300px`, backgroundPosition: `${view.x}px ${view.y}px, ${view.x * 0.5}px ${view.y * 0.5}px`, cursor: tool === "hand" ? "grab" : tool === "select" ? "default" : "crosshair" }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up}
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
                <g key={a.id} className={sel.includes(a.id) ? "dmb-sel-arrow" : ""}>
                  <path d={d} className="dmb-link" markerEnd="url(#dmb-arr)" />
                  <path d={d} className="dmb-hit" style={{ pointerEvents: tool === "select" ? "stroke" : "none" }} onPointerDown={(e) => arrowDown(e, a)} />
                </g>
              );
            })}
            {board.strokes.map((s) => <path key={s.id} d={smooth(s.pts)} className="dmb-ink" style={{ stroke: s.c === INK || s.c === "#1d1208" ? "var(--dmb-ink)" : s.c }} />)}
            {marq && <rect x={Math.min(marq.x1, marq.x2)} y={Math.min(marq.y1, marq.y2)} width={Math.abs(marq.x2 - marq.x1)} height={Math.abs(marq.y2 - marq.y1)} className="dmb-marq" vectorEffect="non-scaling-stroke" />}
          </svg>
          {board.items.map((it) => {
            const on = sel.includes(it.id), T = TYPES[it.type];
            const kind = it.type === "image" ? "img" : it.type === "text" ? "txt" : it.type === "shape" ? "shp" : "";
            return (
              <div
                key={it.id}
                className={`dmb-card ${kind}${on ? " sel" : ""}${linkFrom === it.id ? " linking" : ""}`}
                style={{ left: it.x, top: it.y, width: W(it), height: H(it), "--tint": T ? T.tint : undefined }}
                onPointerDown={(e) => cardDown(e, it)}
              >
                {it.type === "shape" && (
                  <svg className="dmb-shape" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {(SHAPES[it.shape] || SHAPES.rect).el}
                  </svg>
                )}
                {T && (
                  <div className="dmb-head">
                    <Ico s={ICONS[it.type]} />
                    <input value={it.title || ""} onFocus={snap} onPointerDown={(e) => e.stopPropagation()} onChange={(e) => patch(it.id, { title: e.target.value })} />
                  </div>
                )}
                {it.type === "image"
                  ? <img src={it.src} alt="" draggable={false} className="dmb-pic" />
                  : <textarea autoFocus={it.id === fresh} placeholder={it.type === "text" ? "Write in ink…" : it.type === "shape" ? "Label…" : "Scribble here…"} value={it.text || ""} onFocus={snap} onPointerDown={(e) => e.stopPropagation()} onChange={(e) => patch(it.id, { text: e.target.value })} />}
                {single && single.id === it.id && <span className="dmb-size" onPointerDown={(e) => sizeDown(e, it)} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="dmb-tl">{tb("undo", "Undo", 0, undo)}{tb("redo", "Redo", 0, redo)}</div>
      <button className="dmb-fs" onClick={toggleFull}>{full ? "✕ Exit fullscreen" : "⤢ Fullscreen"}</button>
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
        {tb("box", "Box", tool === "box", () => pick("box"))}
        {tb("arrow", "Arrow", tool === "arrow", () => pick("arrow"))}
        {tb("shapes", "Shapes", tool === "shape" || showShapes, () => setShowShapes((v) => !v))}
      </div>
      {showShapes && (
        <div className="dmb-pop">
          <div className="dmb-pop-title">Shapes</div>
          <div className="dmb-pop-row">
            {Object.entries(SHAPES).map(([k, s]) => (
              <button key={k} className={tool === "shape" && shapeKind === k ? "on" : ""} title={s.label} onClick={() => { setShapeKind(k); setTool("shape"); setShowShapes(false); }}><Ico s={ICONS[k]} />{s.label}</button>
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
        {tb("eraser", "Erase", tool === "eraser", () => pick("eraser"))}
        <span className="dmb-sep" />
        {tb("copy", "Dupe", 0, dupe, !sel.some((id) => byId[id]))}
        {tb("trash", "Burn", 0, del, !sel.length)}
      </div>
      <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => { [...e.target.files].forEach(addImage); e.target.value = ""; }} />

      <div className="dmb-zoom">
        <button onClick={() => zoomBy(1 / 1.25)}>−</button>
        <span>{Math.round(view.z * 100)}%</span>
        <button onClick={() => zoomBy(1.25)}>+</button>
        <button onClick={fit}>Fit</button>
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=MedievalSharp&display=swap');
.dmb-root{
 --dmb-paper:#ecdcb0;--dmb-ink:#2b1d10;--dmb-edge:#5a3b1c;--dmb-shadow:rgba(60,35,10,.35);
 --dmb-chrome:color-mix(in srgb,var(--gold,#9a7c3a) 14%,#33241a);--dmb-chrome-hi:color-mix(in srgb,var(--gold,#9a7c3a) 30%,#4a3320);
 --dmb-chrome-text:#e8d5a3;--dmb-rim:color-mix(in srgb,var(--gold,#9a7c3a) 55%,#d4af5a);
 --dmb-danger:#8a1c1c;--dmb-link:#6b2b14;--dmb-dot:rgba(90,60,20,.3);--dmb-vig:rgba(80,45,10,.55);
 --dmb-card-img:#f4e8c8;--dmb-card-mix:100%;
 --dmb-noise:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.02 .03' numOctaves='5' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .55  0 0 0 0 .38  0 0 0 0 .15  0 0 0 .35 0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>");
 position:relative;width:100%;height:100%;min-height:480px;outline:0;overflow:hidden;border-radius:8px;background:var(--dmb-chrome);user-select:none}
.dmb-root[data-mode=dark]{
 --dmb-paper:color-mix(in srgb,var(--surface,#1a1c1e) 88%,var(--gold,#c8a060));--dmb-ink:var(--text,#e8e4dc);--dmb-edge:var(--border-strong,#3e4248);--dmb-shadow:rgba(0,0,0,.5);
 --dmb-chrome:var(--surface2,#222528);--dmb-chrome-hi:var(--border,#2e3135);--dmb-chrome-text:var(--text,#e8e4dc);--dmb-rim:var(--gold,#c8a060);
 --dmb-danger:var(--red,#e05050);--dmb-link:var(--gold,#c8a060);--dmb-dot:rgba(255,255,255,.1);--dmb-vig:rgba(0,0,0,.6);
 --dmb-card-img:var(--surface,#1a1c1e);--dmb-card-mix:16%;
 --dmb-noise:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.02 .03' numOctaves='5' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .8  0 0 0 0 .7  0 0 0 0 .5  0 0 0 .1 0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>")}
.dmb-root.full{position:fixed;inset:0;z-index:9999;border-radius:0}
.dmb-canvas{position:absolute;inset:0;overflow:hidden;touch-action:none;font-family:'IM Fell English',Georgia,serif;color:var(--dmb-ink);text-rendering:geometricPrecision;
 background-color:var(--dmb-paper);background-image:radial-gradient(circle,var(--dmb-dot) 1px,transparent 1.6px),var(--dmb-noise);
 box-shadow:inset 0 0 120px var(--dmb-vig),inset 0 14px 18px -10px var(--dmb-vig),inset 0 -14px 18px -10px var(--dmb-vig)}
.dmb-card{position:absolute;box-sizing:border-box;border:2px solid var(--dmb-edge);border-radius:4px 10px 5px 9px;padding:8px;box-shadow:3px 4px 0 var(--dmb-shadow);cursor:grab;pointer-events:auto;display:flex;flex-direction:column;overflow:visible;
 background:color-mix(in srgb,var(--tint,var(--dmb-paper)) var(--dmb-card-mix),var(--surface,var(--dmb-paper)))}
.dmb-root[data-mode=light] .dmb-card{background:var(--tint,var(--dmb-card-img))}
.dmb-card.txt,.dmb-card.shp{background:none!important;border:1px dashed transparent;box-shadow:none}
.dmb-card.txt textarea{font-size:26px;line-height:1.2;font-style:normal}
.dmb-card.shp{padding:0}
.dmb-card.shp textarea{position:relative;text-align:center;padding:14% 18%;box-sizing:border-box;font-size:17px;font-style:normal}
.dmb-shape{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.dmb-shape *{fill:color-mix(in srgb,var(--dmb-ink) 8%,transparent);stroke:color-mix(in srgb,var(--dmb-ink) 70%,transparent);stroke-width:2.5;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.dmb-card.img{padding:6px;background:var(--dmb-card-img)!important}
.dmb-pic{width:100%;height:100%;object-fit:contain;pointer-events:none}
.dmb-card.sel{outline:2px dashed var(--dmb-danger);outline-offset:3px}
.dmb-card.linking{outline:2px solid var(--dmb-rim);outline-offset:3px}
.dmb-head{display:flex;align-items:center;gap:6px;border-bottom:1px solid color-mix(in srgb,var(--dmb-edge) 50%,transparent);padding-bottom:4px;margin-bottom:4px}
.dmb-head img{width:28px;height:28px;border-radius:50%;border:1px solid var(--dmb-edge)}
.dmb-card input,.dmb-card textarea{background:transparent;border:0;outline:0;width:100%;color:var(--dmb-ink);font:inherit;resize:none;user-select:text}
.dmb-card input{font-family:'MedievalSharp',serif;font-size:16px}
.dmb-card textarea{flex:1;min-height:0;font-size:15px;font-style:italic;line-height:1.3}
.dmb-size{position:absolute;right:-8px;bottom:-8px;width:14px;height:14px;background:var(--dmb-danger);border:2px solid var(--dmb-paper);border-radius:3px;cursor:nwse-resize}
.dmb-ink{fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.dmb-link{fill:none;stroke:var(--dmb-link);stroke-width:2.5;stroke-dasharray:7 5;stroke-linecap:round}
.dmb-head-fill{fill:var(--dmb-link)}
.dmb-hit{fill:none;stroke:transparent;stroke-width:16;pointer-events:stroke;cursor:pointer}
.dmb-sel-arrow .dmb-link{stroke:var(--dmb-danger);stroke-width:3.5}
.dmb-marq{fill:color-mix(in srgb,var(--dmb-danger) 10%,transparent);stroke:var(--dmb-danger);stroke-width:1.5;stroke-dasharray:5 4}
.dmb-bar,.dmb-tl,.dmb-zoom,.dmb-tools,.dmb-pop{position:absolute;display:flex;gap:4px;align-items:center;background:var(--dmb-chrome);border:2px solid var(--dmb-rim);border-radius:10px;padding:5px 7px;box-shadow:0 4px 14px rgba(0,0,0,.45)}
.dmb-bar{left:50%;bottom:14px;transform:translateX(-50%);max-width:calc(100% - 24px);overflow-x:auto}
.dmb-tl{left:12px;top:12px}
.dmb-tools{left:12px;top:84px;flex-direction:column;border-radius:34px;padding:8px 5px;max-height:calc(100% - 270px);overflow-y:auto}
.dmb-pop{left:86px;top:84px;flex-direction:column;align-items:stretch;padding:10px;max-width:calc(100% - 100px);z-index:2}
.dmb-pop-row{display:flex;flex-wrap:wrap;gap:4px}
.dmb-pop-title{color:var(--dmb-chrome-text);opacity:.75;font:12px 'MedievalSharp',serif;text-transform:uppercase;letter-spacing:.08em}
.dmb-zoom{left:12px;bottom:84px;color:var(--dmb-chrome-text);font:13px 'MedievalSharp',serif}
.dmb-zoom span{min-width:46px;text-align:center}
.dmb-root button{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:48px;background:none;border:1px solid transparent;border-radius:6px;color:var(--dmb-chrome-text);font:12px 'MedievalSharp',serif;padding:4px 6px;cursor:pointer}
.dmb-root button.on,.dmb-root button:hover:not(:disabled){background:var(--dmb-chrome-hi);border-color:var(--dmb-rim)}
.dmb-root button:disabled{opacity:.35;cursor:default}
.dmb-bar img,.dmb-tl img,.dmb-tools img,.dmb-pop img{width:24px;height:24px}
.dmb-root .dmb-fs{position:absolute;right:12px;top:12px;flex-direction:row;background:var(--dmb-rim);color:#1d1208;border:2px solid var(--dmb-chrome);font-size:15px;padding:8px 14px;box-shadow:0 4px 14px rgba(0,0,0,.45)}
.dmb-root .dmb-fs:hover{background:color-mix(in srgb,var(--dmb-rim) 82%,#fff);border-color:var(--dmb-chrome)}
.dmb-sep{width:1px;align-self:stretch;background:var(--dmb-rim);opacity:.5;margin:0 4px}
.dmb-status{position:absolute;top:76px;right:12px;max-width:min(360px,calc(100% - 24px));padding:7px 10px;border:1px solid var(--dmb-rim);border-radius:6px;background:var(--dmb-chrome);color:var(--dmb-chrome-text);font:14px 'IM Fell English',Georgia,serif}
.dmb-status.error,.dmb-status.conflict,.dmb-status.load-error{border-color:var(--dmb-danger)}
.dmb-status button{display:inline-flex;margin-left:8px;text-decoration:underline}
.dmb-overlay{position:absolute;inset:0;display:grid;place-content:center;padding:24px;text-align:center;background:color-mix(in srgb,var(--dmb-chrome) 90%,transparent);color:var(--dmb-chrome-text);font:20px 'IM Fell English',Georgia,serif;z-index:3}
`;
