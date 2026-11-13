// Runs axe-core on one page inside a worker thread (started by run-axe.ts).
// The main thread can stop it after a few seconds and cap its memory, so a
// page that makes axe slow cannot tie up the server. Plain CommonJS so Node
// loads it straight from disk, outside the Next bundle.
const { parentPort, workerData } = require('node:worker_threads');
const { JSDOM, VirtualConsole } = require('jsdom');
const axe = require('axe-core');

async function check({ body, contentType, url, rulesOff }) {
  // jsdom reads the charset from the content type or <meta charset>.
  const dom = new JSDOM(Buffer.from(body.buffer, body.byteOffset, body.byteLength), {
    url,
    contentType,
    runScripts: 'outside-only',
    virtualConsole: new VirtualConsole(),
  });
  try {
    const { window } = dom;
    window.eval(axe.source);
    const results = await window.axe.run(window.document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: Object.fromEntries(rulesOff.map((id) => [id, { enabled: false }])),
      resultTypes: ['violations'],
    });

    // Pages built in the browser by JavaScript arrive almost empty.
    const doc = window.document;
    const hasScripts = doc.querySelector('script:not([type="application/ld+json"])') !== null;
    doc.querySelectorAll('script, style, noscript, template').forEach((el) => el.remove());
    const text = (doc.body?.textContent ?? '').replace(/\s+/g, ' ').trim();

    return {
      violations: results.violations.map((v) => ({
        id: v.id,
        impact: v.impact ?? null,
        nodes: v.nodes.length,
      })),
      thin: hasScripts && text.length < 200,
    };
  } finally {
    dom.window.close();
  }
}

check(workerData).then(
  (result) => parentPort.postMessage({ ok: true, ...result }),
  () => parentPort.postMessage({ ok: false }),
);
