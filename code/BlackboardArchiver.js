// ==UserScript==
// @name         CSU Blackboard Archiver v5
// @namespace    http://tampermonkey.net/
// @version      5.0.0
// @description  Personal archival tool for Blackboard Ultra: grades, rubrics, feedback, announcements, content, discussions. JSON + HTML exports.
// @author       Matt M., Luminal Systems
// @match        https://online.columbiasouthern.edu/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ── Config ───────────────────────────────────────────────────────────────────
  // Must be absolute URL — SPA is served from CDN, relative paths resolve there.
  const API = 'https://online.columbiasouthern.edu/learn/api/v1';
  const PAGE = 100;
  const DELAY = 80;

  // ── State ────────────────────────────────────────────────────────────────────
  let _userId = null;
  let _stop = false;
  const _cache = new Map();

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function ts() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  function esc(v) {
    return String(v ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Handle body fields that may be string, {rawText, displayText}, or null
  function bodyHtml(v) {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object') return v.rawText || v.displayText || v.text || '';
    return '';
  }

  function bodyText(v) {
    const html = bodyHtml(v);
    if (!html) return '';
    const d = document.createElement('div');
    d.innerHTML = html;
    return (d.textContent || d.innerText || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function fmtDate(iso) {
    if (!iso) return 'Unknown';
    // Handle epoch ms (Blackboard sometimes sends this)
    const n = Number(iso);
    const d = !isNaN(n) && n > 1e12 ? new Date(n) : new Date(iso);
    return isNaN(d) ? String(iso) : d.toLocaleString();
  }

  function safeName(s) {
    return String(s || 'file').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
  }

  function getCourseId() {
    let m = location.href.match(/\/courses\/(_\d+_\d+)/);
    if (m) return m[1];
    m = location.href.match(/[?&]course_id=(_\d+_\d+)/i);
    if (m) return m[1];
    const dom = document.body?.innerHTML?.match(/"courseId":"(_\d+_\d+)"/);
    if (dom) return dom[1];
    return null;
  }

  function setStatus(msg, color = '#94a3b8') {
    const el = document.getElementById('bba-status');
    if (el) { el.textContent = msg; el.style.color = color; }
    console.log('[BBA]', msg);
  }

  function download(name, content, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  function dlJson(name, data) {
    download(name, JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
  }

  function flatCount(nodes) {
    let n = (nodes || []).length;
    for (const nd of nodes || []) n += flatCount(nd.children);
    return n;
  }

  // ── API layer ────────────────────────────────────────────────────────────────

  async function get(path, noCache = false) {
    if (_stop) throw new Error('Stopped by user');
    const key = API + path;
    if (!noCache && _cache.has(key)) return _cache.get(key);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(key, {
          credentials: 'include',
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error(`${res.status} ${path}`);
        const json = await res.json();
        if (!noCache) _cache.set(key, json);
        await sleep(DELAY);
        return json;
      } catch (e) {
        if (attempt === 2) throw e;
        await sleep(300 * (attempt + 1));
      }
    }
  }

  async function getAll(path, size = PAGE) {
    const results = [];
    let offset = 0;
    while (true) {
      const sep = path.includes('?') ? '&' : '?';
      const data = await get(`${path}${sep}limit=${size}&offset=${offset}`, true);
      const chunk = data.results || [];
      results.push(...chunk);
      if (chunk.length < size) break;
      offset += chunk.length;
    }
    return results;
  }

  async function getUserId() {
    if (_userId) return _userId;
    const data = await get('/users/me');
    _userId = data.id || data.userId;
    if (!_userId) throw new Error('Could not resolve user ID');
    return _userId;
  }

  // ── Collectors ───────────────────────────────────────────────────────────────

  async function collectMeta(courseId) {
    const c = await get(`/courses/${courseId}`);
    return { id: c.id, courseId: c.courseId, name: c.name, raw: c };
  }

  async function collectAnnouncements(courseId) {
    setStatus('Fetching announcements...');
    const items = await getAll(
      `/courses/${courseId}/announcements?sort=startDateRestriction&order=desc`
    );
    return items.map(a => ({
      id: a.id,
      title: a.title || 'Untitled',
      bodyHtml: bodyHtml(a.body),
      bodyText: bodyText(a.body),
      // startDateRestriction is the posted/visible date
      startDate: a.startDateRestriction || a.createdDate || a.created,
      modified: a.modifiedDate || a.modified,
      raw: a
    }));
  }

  async function collectGrades(courseId) {
    setStatus('Fetching grades...');
    const userId = await getUserId();

    // This endpoint returns grade objects WITHOUT embedded column info on some BB versions.
    // We fetch column detail separately to get the name, due date, and rubric.
    const grades = await getAll(
      `/courses/${courseId}/gradebook/grades?userId=${userId}`
    );

    const results = [];

    for (let i = 0; i < grades.length; i++) {
      const g = grades[i];
      const colId = g.columnId;
      const attemptId = g.lastAttemptId;

      setStatus(`Grades ${i + 1}/${grades.length}...`);

      // ── Column detail (name, due date, rubric definition) ──────────────────
      let colDetail = null;
      try {
        colDetail = await get(
          `/courses/${courseId}/gradebook/columns/${colId}?expand=associatedRubrics`
        );
      } catch (e) {
        colDetail = { error: e.message };
      }

      const title = colDetail?.columnName || colDetail?.effectiveColumnName ||
                    colDetail?.localizedColumnName?.rawValue ||
                    g.column?.columnName || `Assignment ${i + 1}`;
      const dueDate = colDetail?.dueDate || g.column?.dueDate || null;

      setStatus(`Grades ${i + 1}/${grades.length}: ${title}`);

      // ── Attempt detail (feedback + rubric evaluation) ──────────────────────
      let attemptDetail = null;
      try {
        if (attemptId && colId) {
          attemptDetail = await get(
            `/courses/${courseId}/gradebook/attempts/${attemptId}?columnId=${colId}&expand=rubricEvaluation`
          );
        }
      } catch (e) {
        attemptDetail = { error: e.message };
      }

      // Feedback lives in attempt.feedbackToUser (not grade.instructorFeedback on this BB version)
      const feedbackRaw = attemptDetail?.feedbackToUser ||
                          g.instructorFeedback || // fallback for other BB versions
                          null;

      // ── Build rubric summary ───────────────────────────────────────────────
      let rubric = null;
      const rubricDef = colDetail?.rubricAssociations?.[0]?.rubricDefinition;
      const rubricEval = attemptDetail?.rubricEvaluation;

      if (rubricDef && rubricEval?.cells?.length) {
        const evalMap = Object.fromEntries(
          (rubricEval.cells || []).map(c => [c.rubricRowId, c])
        );

        // Build cellId -> description map
        const cellDescMap = {};
        for (const row of rubricDef.rows || []) {
          for (const cell of row.cells || []) {
            const cid = cell.id || cell.rubricCellId;
            if (cid) cellDescMap[cid] = bodyText(cell.description);
          }
        }

        const rows = (rubricDef.rows || [])
          .filter(r => r.rowPoints > 0) // skip internal-only 0-pt rows
          .map(r => {
            const ev = evalMap[r.id];
            const earned = ev ? parseFloat((ev.selectedPercent * r.rowPoints).toFixed(1)) : null;
            const cellId = ev?.rubricCellId;
            return {
              criterion: r.header,
              possible: r.rowPoints,
              earned,
              pct: ev ? Math.round(ev.selectedPercent * 100) : null,
              levelDesc: cellId ? (cellDescMap[cellId] || '') : '',
              feedback: bodyText(ev?.feedback)
            };
          });

        rubric = {
          title: rubricDef.title || '',
          total: rubricEval.totalScore,
          max: rubricEval.maxScore,
          rows
        };
      }

      results.push({
        title,
        columnId: colId,
        attemptId,
        score: g.displayGrade?.score ?? null,
        possible: g.pointsPossible || colDetail?.possible || null,
        status: g.status || g.submissionStatus?.status || 'UNKNOWN',
        dueDate,
        feedbackText: bodyText(feedbackRaw),
        feedbackHtml: bodyHtml(feedbackRaw),
        rubric,
        raw: g
      });
    }

    return results;
  }

  async function collectContent(courseId, parentId = null, depth = 0) {
    // Blackboard Ultra uses /contents/ROOT/children for the top level,
    // not /contents directly. ROOT is a virtual node.
    const path = parentId
      ? `/courses/${courseId}/contents/${parentId}/children`
      : `/courses/${courseId}/contents/ROOT/children`;

    let items = [];
    try {
      items = await getAll(path);
    } catch (e) {
      // Fall back to /contents if ROOT fails (some BB versions differ)
      if (!parentId) {
        try { items = await getAll(`/courses/${courseId}/contents`); } catch (_) {}
      }
    }

    const nodes = [];

    for (const item of items) {
      const handler = item.contentHandler?.id || item.contentHandler || '';
      const type = typeof handler === 'string' ? handler : 'content';
      const title = item.title || 'Untitled';
      setStatus(`Content [${depth}]: ${title}`);

      // hasChildren is unreliable (often null). Detect containers by type.
      const isContainer = /lesson|folder|module|container|unit/i.test(type) ||
                          item.contentDetail?.['resource/x-bb-lesson'] !== undefined;

      const node = {
        id: item.id,
        parentId,
        depth,
        title,
        type,
        dueDate: item.dueDate || null,
        descriptionHtml: bodyHtml(item.description || item.body),
        descriptionText: bodyText(item.description || item.body),
        isContainer,
        raw: item,
        children: []
      };

      if (isContainer) {
        try {
          node.children = await collectContent(courseId, item.id, depth + 1);
        } catch (e) {
          node.childError = e.message;
        }
      }

      nodes.push(node);
    }

    return nodes;
  }

  async function collectDiscussions(courseId) {
    setStatus('Fetching discussions...');

    // Forums live under INTERACTIVE virtual node
    let interactiveItems = [];
    try {
      interactiveItems = await getAll(
        `/courses/${courseId}/contents/INTERACTIVE/children`
      );
    } catch (_) {}

    const forumItems = interactiveItems.filter(item => {
      const keys = Object.keys(item.contentDetail || {});
      return keys.some(k => k.toLowerCase().includes('forum'));
    });

    const discussions = [];

    for (const fi of forumItems) {
      const detail = fi.contentDetail || {};
      const key = Object.keys(detail).find(k => k.toLowerCase().includes('forum'));
      const meta = detail[key] || {};
      const forumId = meta.id || meta.forumId || null;

      const disc = {
        contentId: fi.id,
        forumId,
        title: fi.title || 'Untitled',
        bodyText: bodyText(fi.description || fi.body),
        dueDate: fi.dueDate || null,
        messages: [],
        error: null
      };

      if (!forumId) {
        disc.error = 'No forumId found';
        discussions.push(disc);
        continue;
      }

      setStatus(`Discussion: ${disc.title}`);

      try {
        // sort by postDate only — "draft" sort field is invalid on this BB version
        const msgs = await getAll(
          `/courses/${courseId}/discussionboards/default/forums/${forumId}/messages?sort=postDate`
        );

        for (const m of msgs) {
          let replies = [];
          try {
            replies = await getAll(
              `/courses/${courseId}/discussionboards/default/forums/${forumId}/messages/${m.id}/replies?sort=postDate`
            );
          } catch (_) {}

          disc.messages.push({
            id: m.id,
            author: m.postedName ||
                    [m.givenName, m.familyName].filter(Boolean).join(' ') ||
                    'Unknown',
            created: m.createdDate || m.postDate || null,
            bodyText: bodyText(m.body),
            replies: replies.map(r => ({
              id: r.id,
              author: r.postedName ||
                      [r.givenName, r.familyName].filter(Boolean).join(' ') ||
                      'Unknown',
              created: r.createdDate || r.postDate || null,
              bodyText: bodyText(r.body)
            }))
          });
        }
      } catch (e) {
        disc.error = e.message;
      }

      discussions.push(disc);
    }

    return discussions;
  }

  // ── HTML Renderers ────────────────────────────────────────────────────────────

  function wrap(title, body) {
    return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
*{box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px;line-height:1.6}
h1{color:#a78bfa;border-bottom:2px solid #4c1d95;padding-bottom:8px}
h2{color:#7dd3fc;margin-top:28px}
h3{color:#86efac;margin-top:16px;margin-bottom:4px}
.card{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:16px;margin:12px 0}
.meta{color:#94a3b8;font-size:.88em}
.score{display:inline-block;background:#166534;color:#86efac;border-radius:999px;padding:3px 12px;font-weight:700}
.pending{display:inline-block;background:#374151;color:#cbd5e1;border-radius:999px;padding:3px 12px}
.feedback{background:#0b1220;border-left:3px solid #a78bfa;padding:10px 14px;border-radius:0 6px 6px 0;white-space:pre-wrap;margin:8px 0}
.rb-row{display:grid;grid-template-columns:180px 70px 1fr;gap:10px;padding:8px 0;border-bottom:1px solid #334155}
.rb-row:last-child{border:none}
.rb-crit{font-weight:600}
.rb-pts{color:#86efac;font-weight:700;text-align:center}
.rb-desc{color:#94a3b8;font-size:.88em}
.rb-fb{color:#fde68a;font-size:.88em;margin-top:3px}
.tag{display:inline-block;background:#1d4ed8;color:#bfdbfe;border-radius:4px;padding:1px 8px;font-size:.8em}
hr{border:none;border-top:1px solid #334155;margin:20px 0}
ul{padding-left:20px} li{margin:6px 0}
a{color:#7dd3fc}
.toc a{display:block;padding:2px 0;text-decoration:none;color:#7dd3fc}
.toc a:hover{color:#a78bfa}
pre{white-space:pre-wrap;word-break:break-word;background:#020617;padding:12px;border-radius:6px;font-size:.85em}
</style></head><body>${body}</body></html>`;
  }

  function renderAnnouncements(meta, items) {
    const cards = items.map(a => `
      <div class="card">
        <h3>${esc(a.title)}</h3>
        <div class="meta">Posted: ${esc(fmtDate(a.startDate))}</div>
        <div style="margin-top:10px;white-space:pre-wrap;">${esc(a.bodyText)}</div>
      </div>`).join('');

    return wrap(`Announcements – ${meta.name}`, `
      <h1>📢 Announcements — ${esc(meta.name)}</h1>
      <div class="meta">${items.length} announcements · ${new Date().toLocaleString()}</div>
      ${cards || '<div class="card">None found.</div>'}`);
  }

  function renderGrades(meta, grades) {
    let earned = 0, possible = 0;
    const toc = [], cards = [];

    grades.forEach((g, i) => {
      if (g.score != null && g.possible != null) {
        earned += g.score;
        possible += g.possible;
      }
      const anchor = `g${i}`;
      const label = g.score != null ? `${g.score}/${g.possible}` : g.status;
      toc.push(`<a href="#${anchor}">${esc(g.title)} — ${esc(label)}</a>`);

      let rubricHtml = '';
      if (g.rubric?.rows?.length) {
        const rows = g.rubric.rows.map(r => `
          <div class="rb-row">
            <div class="rb-crit">${esc(r.criterion)}<br><span class="meta">${r.possible} pts</span></div>
            <div class="rb-pts">${r.earned ?? '?'}<br><span class="meta">${r.pct != null ? r.pct + '%' : ''}</span></div>
            <div>
              ${r.levelDesc ? `<div class="rb-desc">${esc(r.levelDesc.slice(0, 240))}</div>` : ''}
              ${r.feedback ? `<div class="rb-fb">💬 ${esc(r.feedback)}</div>` : ''}
            </div>
          </div>`).join('');
        rubricHtml = `
          <h3>Rubric: ${esc(g.rubric.title)} (${g.rubric.total}/${g.rubric.max})</h3>
          <div class="card">${rows}</div>`;
      }

      cards.push(`
        <div class="card" id="${anchor}">
          <h2>${esc(g.title)}</h2>
          <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
            ${g.score != null
              ? `<span class="score">${g.score} / ${g.possible}</span>`
              : `<span class="pending">${esc(g.status)}</span>`}
            ${g.dueDate ? `<span class="meta">Due: ${esc(fmtDate(g.dueDate))}</span>` : ''}
          </div>
          ${g.feedbackText
            ? `<div class="meta">Instructor Feedback</div>
               <div class="feedback">${esc(g.feedbackText)}</div>`
            : ''}
          ${rubricHtml}
          <hr>
        </div>`);
    });

    const pct = possible > 0 ? ((earned / possible) * 100).toFixed(1) : 'N/A';

    return wrap(`Grades – ${meta.name}`, `
      <h1>📊 Grades — ${esc(meta.name)}</h1>
      <div class="card">
        <div class="meta">Overall (graded items)</div>
        <div style="font-size:1.3em;font-weight:700;color:#86efac;">${earned} / ${possible} (${pct}%)</div>
        <div class="meta">Exported: ${new Date().toLocaleString()}</div>
      </div>
      <div class="card toc">${toc.join('')}</div>
      ${cards.join('')}`);
  }

  function renderNodes(nodes) {
    if (!nodes?.length) return '<li><em>Empty</em></li>';
    return nodes.map(n => `
      <li>
        <div class="card" style="margin:6px 0;">
          <strong>${esc(n.title)}</strong>
          <span class="tag" style="margin-left:8px;">${esc(n.type.split('/').pop())}</span>
          ${n.dueDate ? `<span class="meta" style="margin-left:8px;">Due: ${esc(fmtDate(n.dueDate))}</span>` : ''}
          ${n.descriptionText
            ? `<div style="margin-top:6px;color:#cbd5e1;">${esc(n.descriptionText.slice(0, 300))}</div>`
            : ''}
          ${n.childError ? `<div class="meta" style="color:#fca5a5;">⚠ ${esc(n.childError)}</div>` : ''}
        </div>
        ${n.children?.length ? `<ul>${renderNodes(n.children)}</ul>` : ''}
      </li>`).join('');
  }

  function renderContent(meta, tree) {
    return wrap(`Content – ${meta.name}`, `
      <h1>📋 Course Content — ${esc(meta.name)}</h1>
      <div class="meta">${flatCount(tree)} nodes · ${new Date().toLocaleString()}</div>
      <ul style="list-style:none;padding:0;">${renderNodes(tree)}</ul>`);
  }

  function renderDiscussions(meta, discs) {
    const body = discs.map(d => {
      const msgs = (d.messages || []).map(m => `
        <div class="card">
          <strong>${esc(m.author)}</strong>
          <span class="meta" style="margin-left:8px;">${esc(fmtDate(m.created))}</span>
          <div style="margin-top:8px;white-space:pre-wrap;">${esc(m.bodyText)}</div>
          ${(m.replies || []).map(r => `
            <div class="card" style="background:#0b1220;margin-top:8px;">
              <strong>${esc(r.author)}</strong>
              <span class="meta" style="margin-left:8px;">${esc(fmtDate(r.created))}</span>
              <div style="margin-top:6px;white-space:pre-wrap;">${esc(r.bodyText)}</div>
            </div>`).join('')}
        </div>`).join('');

      return `
        <div class="card">
          <h2>${esc(d.title)}</h2>
          ${d.dueDate ? `<div class="meta">Due: ${esc(fmtDate(d.dueDate))}</div>` : ''}
          ${d.error ? `<div style="color:#fca5a5;">⚠ ${esc(d.error)}</div>` : ''}
          ${msgs || '<div class="meta">No messages found.</div>'}
        </div>`;
    }).join('');

    return wrap(`Discussions – ${meta.name}`, `
      <h1>💬 Discussions — ${esc(meta.name)}</h1>
      <div class="meta">${discs.length} discussions · ${new Date().toLocaleString()}</div>
      ${body || '<div class="card">None found.</div>'}`);
  }

  // ── Export runners ────────────────────────────────────────────────────────────

  async function run(label, collect, render, stem) {
    const cid = getCourseId();
    if (!cid) { setStatus('Navigate into a course first.', '#f87171'); return; }
    _stop = false;
    try {
      const meta = await collectMeta(cid);
      const data = await collect(cid);
      const suf = `${cid}_${ts()}`;
      dlJson(`${stem}_${suf}.json`, data);
      download(`${stem}_${suf}.html`, render(meta, data), 'text/html;charset=utf-8');
      setStatus(`✓ ${label} exported`, '#86efac');
    } catch (e) {
      setStatus(`Error: ${e.message}`, '#f87171');
      console.error('[BBA]', e);
    }
  }

  async function runAll() {
    const cid = getCourseId();
    if (!cid) { setStatus('Navigate into a course first.', '#f87171'); return; }
    _stop = false;
    try {
      setStatus('Building full archive...');
      const meta = await collectMeta(cid);

      // Run in sequence to avoid hammering the API
      const ann = await collectAnnouncements(cid);
      const grades = await collectGrades(cid);
      const tree = await collectContent(cid);
      const discs = await collectDiscussions(cid);

      const suf = `${cid}_${ts()}`;
      dlJson(`archive_${suf}.json`, { meta, announcements: ann, grades, contentTree: tree, discussions: discs });
      await sleep(400);
      download(`announcements_${suf}.html`, renderAnnouncements(meta, ann), 'text/html;charset=utf-8');
      await sleep(400);
      download(`grades_${suf}.html`, renderGrades(meta, grades), 'text/html;charset=utf-8');
      await sleep(400);
      download(`content_${suf}.html`, renderContent(meta, tree), 'text/html;charset=utf-8');
      await sleep(400);
      download(`discussions_${suf}.html`, renderDiscussions(meta, discs), 'text/html;charset=utf-8');

      setStatus('✓ Full archive done (JSON + 4 HTML files)', '#86efac');
    } catch (e) {
      setStatus(`Error: ${e.message}`, '#f87171');
      console.error('[BBA]', e);
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────────

  function btn(bg) {
    return `background:${bg};color:#fff;border:none;border-radius:6px;padding:7px 10px;
            cursor:pointer;font-family:monospace;font-size:11px;text-align:left;width:100%`;
  }

  function buildUI() {
    if (document.getElementById('bba-panel')) return;
    const p = document.createElement('div');
    p.id = 'bba-panel';
    p.style.cssText = [
      'position:fixed', 'bottom:20px', 'right:20px', 'z-index:99999',
      'background:#0f172a', 'border:1px solid #4c1d95', 'border-radius:10px',
      'padding:14px 16px', 'font-family:monospace', 'font-size:12px',
      'color:#e2e8f0', 'min-width:260px', 'box-shadow:0 4px 24px rgba(124,58,237,.3)'
    ].join(';');

    p.innerHTML = `
      <div style="font-weight:700;margin-bottom:6px;color:#a78bfa;font-size:13px;">📦 BB Archiver v5</div>
      <div id="bba-status" style="color:#94a3b8;font-size:11px;min-height:16px;margin-bottom:10px;">
        ${getCourseId() ? '✓ Course detected' : 'Navigate to a course'}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <button id="bba-ann"     style="${btn('#0f766e')}">📢 Announcements</button>
        <button id="bba-grades"  style="${btn('#7c3aed')}">📊 Grades + Rubrics + Feedback</button>
        <button id="bba-content" style="${btn('#1d4ed8')}">📋 Course Content Tree</button>
        <button id="bba-disc"    style="${btn('#2563eb')}">💬 Discussions + Replies</button>
        <div style="border-top:1px solid #334155;margin:4px 0;"></div>
        <button id="bba-all"     style="${btn('#92400e')}">💾 Full Archive (all 4)</button>
        <button id="bba-stop"    style="${btn('#991b1b')}">🛑 Stop</button>
        <button id="bba-hide"    style="${btn('#374151')}">✕ Hide</button>
      </div>`;

    document.body.appendChild(p);

    document.getElementById('bba-ann').onclick = () => run('Announcements', collectAnnouncements, renderAnnouncements, 'announcements');
    document.getElementById('bba-grades').onclick = () => run('Grades', collectGrades, renderGrades, 'grades');
    document.getElementById('bba-content').onclick = () => run('Content', collectContent, renderContent, 'content');
    document.getElementById('bba-disc').onclick = () => run('Discussions', collectDiscussions, renderDiscussions, 'discussions');
    document.getElementById('bba-all').onclick = runAll;
    document.getElementById('bba-stop').onclick = () => { _stop = true; setStatus('Stopping...', '#fde68a'); };
    document.getElementById('bba-hide').onclick = () => p.remove();
  }

  setTimeout(buildUI, 1800);
  new MutationObserver(() => {
    if (!document.getElementById('bba-panel')) setTimeout(buildUI, 1500);
  }).observe(document.documentElement, { childList: true, subtree: true });

})();