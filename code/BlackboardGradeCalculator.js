// ==UserScript==
// @name         Blackboard Grade Calculator
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Calculates minimum average needed on remaining Blackboard assignments to finish with A/B/C/D.
// @author       Matt M, Luminal Systems.
// @match        https://online.columbiasouthern.edu/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Instead of default 90/80/70... weighted grading system uses
  // decimal rounding rules. <.4 is rounded down, and anything >.5 is rounded up.
  // Thus a 89.5 will round up to 90. And so on so forth.
  const GRADE_THRESHOLDS = {
    A: 89.5,
    B: 79.5,
    C: 69.5,
    D: 59.5
  };

  function parseWeight(text) {
    const match = text.match(/(\d+(?:\.\d+)?)%\s+of\s+overall\s+grade/i);
    return match ? parseFloat(match[1]) : null;
  }

  function parseScore(text) {
    const match = text.match(/(\d+(?:\.\d+)?)\s*\/\s*100/);
    return match ? parseFloat(match[1]) : null;
  }

  function isNotGraded(text) {
    return /not graded/i.test(text);
  }

  function round2(num) {
    return Math.round(num * 100) / 100;
  }

  function extractAssignments() {
    const allTextNodes = Array.from(document.querySelectorAll('body *'));
    const assignments = [];

    for (let i = 0; i < allTextNodes.length; i++) {
      const el = allTextNodes[i];
      const text = (el.textContent || '').trim();

      if (!/% of overall grade/i.test(text)) continue;

      const weight = parseWeight(text);
      if (weight == null) continue;

      // Try to find nearby assignment name and grade
      const container = el.closest('div, li, section, article') || el.parentElement;
      if (!container) continue;

      const containerText = container.textContent || '';

      const score = parseScore(containerText);
      const notGraded = isNotGraded(containerText);

      // crude name guess: first non-empty line before the weight line
      const lines = containerText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      let name = 'Unknown Assignment';
      for (const line of lines) {
        if (
          !/% of overall grade/i.test(line) &&
          !/not graded/i.test(line) &&
          !/\/\s*100/.test(line) &&
          line.length > 2
        ) {
          name = line;
          break;
        }
      }

      assignments.push({
        name,
        weight,
        score: notGraded ? null : score,
        graded: !notGraded && score !== null
      });
    }

    // Deduplicate similar rows
    const deduped = [];
    const seen = new Set();

    for (const a of assignments) {
      const key = `${a.name}|${a.weight}|${a.score}|${a.graded}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(a);
      }
    }

    return deduped;
  }

  function computeGradeOutlook(assignments) {
    let currentOverall = 0;
    let remainingWeight = 0;

    for (const a of assignments) {
      if (a.graded) {
        currentOverall += (a.score / 100) * a.weight;
      } else {
        remainingWeight += a.weight;
      }
    }

    currentOverall = round2(currentOverall);
    remainingWeight = round2(remainingWeight);

    const outlook = {};

    for (const [letter, threshold] of Object.entries(GRADE_THRESHOLDS)) {
      const pointsNeeded = threshold - currentOverall;

      if (pointsNeeded <= 0) {
        outlook[letter] = {
          status: 'secured',
          neededAverage: 0
        };
      } else if (remainingWeight <= 0) {
        outlook[letter] = {
          status: 'impossible',
          neededAverage: null
        };
      } else {
        const neededAverage = (pointsNeeded / remainingWeight) * 100;

        if (neededAverage > 100) {
          outlook[letter] = {
            status: 'impossible',
            neededAverage: round2(neededAverage)
          };
        } else {
          outlook[letter] = {
            status: 'possible',
            neededAverage: round2(neededAverage)
          };
        }
      }
    }

    return {
      currentOverall,
      remainingWeight,
      gradedAssignments: assignments.filter(a => a.graded),
      ungradedAssignments: assignments.filter(a => !a.graded),
      outlook
    };
  }

  function renderPanel(result) {
    const old = document.getElementById('grade-outlook-panel');
    if (old) old.remove();

    const panel = document.createElement('div');
    panel.id = 'grade-outlook-panel';
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      width: 340px;
      max-height: 80vh;
      overflow: auto;
      background: #111827;
      color: #f9fafb;
      border: 1px solid #374151;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      padding: 16px;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;

    const outlookRows = Object.entries(result.outlook).map(([letter, info]) => {
      let text = '';
      if (info.status === 'secured') {
        text = 'Already secured';
      } else if (info.status === 'impossible') {
        text = info.neededAverage == null
          ? 'No remaining assignments'
          : `Need ${info.neededAverage}% average (not realistically possible)`;
      } else {
        text = `Need ${info.neededAverage}% average on remaining work`;
      }

      return `
        <div style="padding:8px 0; border-bottom:1px solid #374151;">
          <strong>${letter}</strong>: ${text}
        </div>
      `;
    }).join('');

    const remainingList = result.ungradedAssignments.map(a => `
      <li>${escapeHtml(a.name)} — ${a.weight}% remaining</li>
    `).join('');

    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="font-size:16px; font-weight:bold;">Grade Outlook</div>
        <button id="grade-outlook-close" style="
          background:#374151;
          color:white;
          border:none;
          border-radius:6px;
          padding:4px 8px;
          cursor:pointer;
        ">X</button>
      </div>

      <div style="margin-bottom:10px;">
        <div><strong>Current weighted grade:</strong> ${result.currentOverall}</div>
        <div><strong>Remaining weight:</strong> ${result.remainingWeight}%</div>
      </div>

      <div style="margin-bottom:12px;">
        ${outlookRows}
      </div>

      <div>
        <strong>Remaining assignments</strong>
        <ul style="margin-top:8px; padding-left:18px;">
          ${remainingList || '<li>None</li>'}
        </ul>
      </div>
    `;

    document.body.appendChild(panel);

    document.getElementById('grade-outlook-close')?.addEventListener('click', () => {
      panel.remove();
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function run() {
    const assignments = extractAssignments();

    if (!assignments.length) {
      console.warn('Grade Outlook: No assignments found on page.');
      return;
    }

    const result = computeGradeOutlook(assignments);
    console.log('Grade Outlook assignments:', assignments);
    console.log('Grade Outlook result:', result);
    renderPanel(result);
  }

  // Delay a bit in case Blackboard is rendering late
  setTimeout(run, 2000);
})();