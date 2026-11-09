/* =====================================================================
   MUSTACODE · Build 1
   A courseware website: lessons, 4 minigames, and a class "party mode".
   No accounts, nothing is saved. Plain HTML + CSS + JavaScript.
   ===================================================================== */
'use strict';

/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = n => Math.floor(Math.random() * n);
const int = (a, b) => a + rnd(b - a + 1);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (a, k) => shuffle(a).slice(0, k);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const uid = () => Math.random().toString(36).slice(2, 10);
const clone = o => JSON.parse(JSON.stringify(o));
const LETTERS = 'ABCDEFGH';

/* ---------- tiny syntax highlighter (html / css / js) ---------- */
const HL = {
  html: [/(<!--[\s\S]*?-->)|(<\/?[A-Za-z][\w-]*|\/?>)|("[^"]*"|'[^']*')|([A-Za-z-]+)(?==)/g, ['c', 't', 's', 'a']],
  css: [/(\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(#[0-9a-fA-F]{3,8}\b)|(\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s)?)|([A-Za-z-]+)(?=\s*:)|([.#]?[A-Za-z][\w-]*)(?=\s*[{,(\[])/g, ['c', 's', 'n', 'n', 'p', 't']],
  js: [/(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?|`[^`]*`)|\b(let|const|var|function|return|if|else|for|while|of|in|new|true|false|null|undefined|typeof)\b|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(?=\()/g, ['c', 's', 'k', 'n', 'f']]
};
function hl(code, lang) {
  const spec = HL[lang]; if (!spec) return esc(code);
  const re = new RegExp(spec[0].source, 'g'); let out = '', last = 0, m;
  while ((m = re.exec(code))) {
    if (m[0] === '') { re.lastIndex++; continue; }
    out += esc(code.slice(last, m.index));
    let g = 1; while (m[g] === undefined) g++;
    out += `<span class="tk-${spec[1][g - 1]}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}
const LANGNAME = { html: 'HTML', css: 'CSS', js: 'JavaScript' };
function codeBlock(lines, lang, opt = {}) {
  return `<div class="code ${opt.cls || ''}">` + lines.map((ln, i) =>
    `<div class="ln${opt.hi === i ? ' hi' : ''}" data-ln="${i}"><span class="no">${i + 1}</span><span class="tx">${hl(ln, lang) || '&nbsp;'}</span></div>`).join('') + '</div>';
}

/* ---------- run JavaScript snippets we generated ourselves ---------- */
const fmtVal = v => typeof v === 'string' ? v : Array.isArray(v) ? '[' + v.map(x => typeof x === 'string' ? `"${x}"` : fmtVal(x)).join(', ') + ']' : String(v);
function runJS(code) {
  const logs = [], fake = { log: (...a) => logs.push(a.map(fmtVal).join(' ')) };
  try { new Function('console', code)(fake); } catch (e) { logs.push('Error: ' + e.message); }
  return logs;
}

/* ---------- word banks ---------- */
const WORDS = ['apple', 'mango', 'grape', 'lemon', 'peach', 'melon', 'berry', 'plum', 'kiwi', 'pear'];
const NAMES = ['Ana', 'Ben', 'Chen', 'Dina', 'Eli', 'Farah', 'Gus', 'Hana', 'Iman', 'Jun'];
const COLORS = ['red', 'blue', 'green', 'orange', 'purple', 'teal', 'pink', 'brown', 'navy', 'gold'];
const ordinal = n => ['first', 'second', 'third', 'fourth', 'fifth'][n] || (n + 1) + 'th';

/* =====================================================================
   QUESTION GENERATORS
   Every call builds a brand-new question from random values, so levels
   never repeat. Level = difficulty only (1 easy, 2 medium, 3 hard).
   ===================================================================== */

/* ---- Guess the Output ---- */
function perturb(s) {
  const ms = [...s.matchAll(/\d+/g)];
  if (ms.length) {
    const m = pick(ms), d = pick([-3, -2, -1, 1, 2, 3, 10]);
    return s.slice(0, m.index) + Math.abs(+m[0] + d) + s.slice(m.index + m[0].length);
  }
  if (/true|false/.test(s)) return s.replace(/true|false/, x => x === 'true' ? 'false' : 'true');
  const w = s.split(' ');
  return pick([() => w.slice().reverse().join(' '), () => s + '!', () => w.length > 1 ? w.slice(0, -1).join(' ') : s + 's', () => s.toUpperCase() === s ? s.toLowerCase() : s.toUpperCase(),
    () => w.length > 1 ? [w[w.length - 1], ...w.slice(1, -1), w[0]].join(' ') : s.split('').reverse().join(''), () => s.replace(/\s/g, ''), () => s.slice(1)])();
}
function mkGTO(o) {
  const ans = String(o.answer), wr = new Set();
  (o.wrong || []).forEach(w => { if (String(w) !== ans) wr.add(String(w)); });
  let t = 0; while (wr.size < 3 && t++ < 200) { const p = perturb(ans); if (p !== ans) wr.add(p); }
  const opts = shuffle([ans, ...[...wr].slice(0, 3)]);
  return { pub: { type: 'gto', lang: o.lang, code: o.code, prompt: o.prompt || 'What does this code print?', options: opts }, ans: opts.indexOf(ans), why: o.why };
}
const jsq = (code, why, wrong, prompt) => mkGTO({ lang: 'js', code, prompt, answer: runJS(code).join('\n'), wrong, why });
const htq = (code, prompt, answer, wrong, why) => mkGTO({ lang: 'html', code, prompt, answer, wrong, why });
const csq = (code, prompt, answer, wrong, why) => mkGTO({ lang: 'css', code, prompt, answer, wrong, why });
const q2 = a => a.map(x => `"${x}"`).join(', ');

const GTO = {
  js: {
    1: [
      () => { const a = int(2, 9), b = int(2, 9), op = pick(['+', '-', '*']); return jsq(`let a = ${a};\nlet b = ${b};\nconsole.log(a ${op} b);`, `a is ${a} and b is ${b}, so a ${op} b is worked out and printed.`); },
      () => { const n = int(2, 9), s = pick(['5', '7', '3', '10']); return jsq(`let a = "${s}";\nlet b = ${n};\nconsole.log(a + b);`, 'When one side of + is a string, JavaScript joins the values together instead of adding them.', [String(+s + n)]); },
      () => { const age = int(10, 25); return jsq(`let age = ${age};\n\nif (age >= 18) {\n  console.log("adult");\n} else {\n  console.log("minor");\n}`, `age is ${age}, so the test age >= 18 is ${age >= 18}.`, ['adult', 'minor', 'undefined', 'error']); },
      () => { const n = pick(NAMES), w = pick(WORDS); return jsq(`let name = "${n}";\nlet fruit = "${w}";\nconsole.log(name + " likes " + fruit);`, 'The + signs join the pieces of text, including the spaces inside the quotes.'); }
    ],
    2: [
      () => { const s = int(1, 3), e = int(4, 7); return jsq(`let total = 0;\nfor (let i = ${s}; i <= ${e}; i++) {\n  total += i;\n}\nconsole.log(total);`, `The loop adds every whole number from ${s} to ${e}.`); },
      () => { const f = sample(WORDS, 4), k = rnd(4); return jsq(`let fruits = [${q2(f)}];\nconsole.log(fruits[${k}]);\nconsole.log(fruits.length);`, `Arrays start counting at 0, so index ${k} is the ${ordinal(k)} item. length counts all 4 items.`, [`${f[(k + 1) % 4]}\n4`, `${f[k]}\n3`, `${f[(k + 3) % 4]}\n4`]); },
      () => { const n = int(5, 9), st = pick([2, 3]); return jsq(`let n = ${n};\nwhile (n > 0) {\n  console.log(n);\n  n -= ${st};\n}`, `n starts at ${n} and drops by ${st} each time, until it is no longer above 0.`); },
      () => { const x = int(3, 9), a = int(2, 6), m = int(2, 4); return jsq(`let x = ${x};\nx += ${a};\nx *= ${m};\nconsole.log(x);`, `${x} + ${a} = ${x + a}, then ${x + a} × ${m} = ${(x + a) * m}.`); }
    ],
    3: [
      () => { const k = int(1, 5), a = int(2, 4), b = int(2, 4); return jsq(`function calc(n) {\n  return n * n + ${k};\n}\n\nconsole.log(calc(${a}) + calc(${b}));`, `calc(${a}) = ${a * a + k} and calc(${b}) = ${b * b + k}. Their sum is printed.`); },
      () => { const nums = shuffle([...Array.from({ length: 5 }, () => int(1, 12)), 8, 10]), op = pick([['filter(n => n % 2 === 0)', 'even numbers'], ['filter(n => n > 6)', 'numbers bigger than 6']]), m = int(2, 3);
        return jsq(`let nums = [${nums.join(', ')}];\nlet result = nums\n  .${op[0]}\n  .map(n => n * ${m});\n\nconsole.log(result.join(", "));`, `filter keeps only the ${op[1]}; map then multiplies each one by ${m}.`); },
      () => { const n = int(1, 9); return jsq(`console.log(${n} == "${n}");\nconsole.log(${n} === "${n}");`, '== compares the values loosely (the text is converted to a number). === also compares the type, so number vs text is false.', ['true\ntrue', 'false\nfalse', 'false\ntrue']); },
      () => { const w = pick(['JavaScript', 'Browser', 'Keyboard', 'Variable']), n = int(2, 4); return jsq(`let s = "${w}";\nconsole.log(s.toUpperCase().slice(0, ${n}));\nconsole.log(s.length);`, `toUpperCase() makes capitals and slice(0, ${n}) keeps the first ${n} characters. length counts every character.`, [`${w.toLowerCase().slice(0, n)}\n${w.length}`, `${w.toUpperCase().slice(n)}\n${w.length}`]); }
    ]
  },
  html: {
    1: [
      () => { const t = sample(['Welcome', 'Our Menu', 'Contact Us', 'About Me', 'News', 'Gallery'], 2); return htq(`<h1>${t[0]}</h1>\n<p>${t[1]}</p>`, 'Which text is shown as the main heading?', t[0], [t[1], '<h1>', 'Both texts look the same'], '<h1> is the biggest heading. <p> is normal paragraph text.'); },
      () => { const n = int(3, 6), it = sample(WORDS, n); return htq(`<ul>\n${it.map(x => `  <li>${x}</li>`).join('\n')}\n</ul>`, 'How many bullet points does this list show?', n, [n + 1, n - 1, n + 2], 'Each <li> inside the list is one bullet point.'); },
      () => { const nm = pick(NAMES); return htq(`<p>Hello <b>${nm}</b>!</p>`, 'Which word is shown in bold?', nm, ['Hello', '!', `Hello ${nm}`], '<b> makes only the text between its tags bold.'); }
    ],
    2: [
      () => { const it = sample(WORDS, 4), k = int(2, 4); return htq(`<ol>\n${it.map(x => `  <li>${x}</li>`).join('\n')}\n</ol>`, `What text is shown next to the number ${k}?`, it[k - 1], it.filter((_, i) => i !== k - 1), '<ol> numbers its <li> items in order, starting from 1.'); },
      () => { const w = sample(WORDS, 4), hid = sample([0, 1, 2, 3], int(1, 2)), vis = 4 - hid.length;
        return htq(w.map((x, i) => hid.includes(i) ? `<!-- <p>${x}</p> -->` : `<p>${x}</p>`).join('\n'), 'How many paragraphs are visible on the page?', vis, [vis + 1, vis - 1, 4], 'Anything inside <!-- --> is a comment. The browser ignores it.'); },
      () => { const tx = pick(['Home', 'Read more', 'Contact', 'Download']), u = pick(['page', 'about', 'menu']) + '.html'; return htq(`<a href="${u}">${tx}</a>`, 'What text will the visitor see on the page?', tx, [u, `<a>${tx}</a>`, 'href'], 'The href is where the link goes. Only the text between the tags is shown.'); }
    ],
    3: [
      () => { const R = int(2, 3), C = int(2, 4), cells = Array.from({ length: C }, (_, i) => `<td>${i + 1}</td>`).join('');
        return htq(`<table>\n${Array.from({ length: R }, () => `  <tr>${cells}</tr>`).join('\n')}\n</table>`, 'How many cells (<td>) does this table have?', R * C, [R + C, R * C + 1, R * C - 1], `${R} rows × ${C} cells in each row = ${R * C}.`); },
      () => { const a = pick(['Good', 'Nice']), b = pick(['very', 'really']), c = pick(['morning', 'evening']); return htq(`<p>${a} <span hidden>${b} </span>${c}</p>`, 'What text does the visitor see?', `${a} ${c}`, [`${a} ${b} ${c}`, b, a], 'The hidden attribute stops an element from being displayed.'); },
      () => { const f = pick(['cat', 'dog', 'sun']) + '-photo.png', alt = pick(['A sleepy cat', 'A happy dog', 'The bright sun']); return htq(`<img src="${f}" alt="${alt}">`, 'The image file is missing. What shows in its place?', alt, [f, 'Nothing at all', 'A broken-image error message'], 'When an image cannot load, browsers show its alt text instead.'); }
    ]
  },
  css: {
    1: [
      () => { const c = pick(COLORS); return csq(`p {\n  color: ${c};\n}`, 'What colour is the paragraph text?', c, sample(COLORS.filter(x => x !== c), 3), 'The color property sets the colour of the text.'); },
      () => { const names = ['One', 'Two', 'Three'], h = rnd(3), vis = names.filter((_, i) => i !== h).join(' and ');
        return csq(`/* <p>One</p>\n   <p>Two</p>\n   <p>Three</p> */\n\np:nth-child(${h + 1}) {\n  display: none;\n}`, 'Which paragraphs are still visible?', vis, [names.filter((_, i) => i === h).join(''), 'All three', 'None of them'], 'display: none removes an element completely. The other paragraphs stay.'); }
    ],
    2: [
      () => { const [a, b] = sample(COLORS, 2); return csq(`/* <p class="intro">Hi</p> */\n\np {\n  color: ${a};\n}\n\n.intro {\n  color: ${b};\n}`, 'What colour is the text?', b, [a, 'black', 'Both colours mixed'], 'A class selector is more specific than an element selector, so .intro wins.'); },
      () => { const [a, b] = sample(COLORS, 2); return csq(`p {\n  color: ${a};\n}\n\np {\n  color: ${b};\n}`, 'What colour is the paragraph text?', b, [a, 'black', 'Both colours mixed'], 'Both rules are equally specific, so the one written later wins.'); },
      () => { const W = pick([100, 120, 150, 200]), P = pick([10, 15, 20]), B = pick([2, 4, 5]); return csq(`.box {\n  width: ${W}px;\n  padding: ${P}px;\n  border: ${B}px solid black;\n}`, 'How wide is the box on screen (content + padding + border)?', `${W + 2 * P + 2 * B}px`, [`${W}px`, `${W + 2 * P}px`, `${W + P + B}px`], `${W} + ${P}×2 (padding) + ${B}×2 (border) = ${W + 2 * P + 2 * B}px.`); }
    ],
    3: [
      () => { const [a, b] = sample(COLORS, 2), imp = rnd(2);
        return csq(`/* <p id="main" class="note"> */\n\n#main {\n  color: ${a};\n}\n\n.note {\n  color: ${b}${imp ? ' !important' : ''};\n}`, 'What colour is the text?', imp ? b : a, [imp ? a : b, 'black', 'Both colours mixed'], imp ? '!important beats everything else, even an id selector.' : 'An id selector (#main) is more specific than a class (.note).'); },
      () => { const dir = pick(['row', 'row-reverse', 'column', 'column-reverse']), T = { row: 'A, B, C from left to right', 'row-reverse': 'C, B, A from left to right', column: 'A, B, C from top to bottom', 'column-reverse': 'C, B, A from top to bottom' };
        return csq(`/* <div class="row">A B C (three items)</div> */\n\n.row {\n  display: flex;\n  flex-direction: ${dir};\n}`, 'How are the three items laid out?', T[dir], Object.values(T), 'row goes left to right, column goes top to bottom. The reverse values flip the order.'); },
      () => { const W = pick([200, 240, 300]), P = pick([10, 20, 30]); return csq(`.box {\n  box-sizing: border-box;\n  width: ${W}px;\n  padding: ${P}px;\n}`, 'How wide is the box on screen?', `${W}px`, [`${W + 2 * P}px`, `${W + P}px`, `${W - 2 * P}px`], 'With border-box, padding and border are counted inside the width you set.'); }
    ]
  }
};

/* ---- Bug Hunter ---- */
const E = {
  html: { mismatch: 'The closing tag does not match the opening tag', close: 'A closing tag is missing', attr: 'An attribute name is spelled wrong', quote: 'A quote is missing in an attribute', nest: 'Tags are closed in the wrong order', li: 'Only <li> items belong directly inside a list', tag: 'The tag name does not exist' },
  css: { semi: 'A semicolon is missing', spell: 'A name is spelled wrong', unit: 'A unit is missing from a number', selector: 'The wrong selector symbol is used', colon: 'A colon is missing between property and value', value: 'The value is not allowed for this property', bracket: 'The wrong kind of bracket is used' },
  js: { paren: 'A closing bracket is missing', name: 'A name is spelled wrong or has the wrong capital letters', quote: 'A quote is not closed', assign: '= is used instead of a comparison', loop: 'The loop runs one time too many', constant: 'A const variable cannot be changed', length: 'length is a property, not a function', ret: 'The function never gives back its result', type: 'The value has the wrong type' }
};
function mkBug(o) {
  const pool = Object.values(E[o.lang]).filter(e => e !== o.err);
  const eo = shuffle([o.err, ...sample(pool, 3)]), fo = shuffle([o.fixed, ...o.fixWrong.slice(0, 2)]);
  return { pub: { type: 'bug', lang: o.lang, title: o.title || 'Find and fix the bug', lines: o.lines, bad: o.bad, errOpts: eo, fixOpts: fo }, ans: { err: eo.indexOf(o.err), fix: fo.indexOf(o.fixed) }, why: o.why, hint: o.hint };
}
const BUG = {
  html: {
    1: [
      () => { const n = int(1, 3), m = n + int(1, 2), t = pick(['Welcome', 'My Page', 'Hello there', 'Our Menu']); return mkBug({ lang: 'html', title: 'Fix the broken heading', lines: ['<html>', '  <body>', `    <h${n}>${t}</h${m}>`, '  </body>', '</html>'], bad: 2, fixed: `    <h${n}>${t}</h${n}>`, fixWrong: [`    <h${m}>${t}</h${n}>`, `    <h${n}>${t}<h${n}>`], err: E.html.mismatch, why: `An element must end with the same tag it started with. <h${n}> has to be closed by </h${n}>.`, hint: 'Compare the numbers in the opening and closing heading tags.' }); },
      () => { const w = sample(WORDS, 3); return mkBug({ lang: 'html', title: 'Fix the paragraphs', lines: ['<body>', `  <p>${w[0]}</p>`, `  <p>${w[1]}`, `  <p>${w[2]}</p>`, '</body>'], bad: 2, fixed: `  <p>${w[1]}</p>`, fixWrong: [`  <p>${w[1]}<p>`, `  </p>${w[1]}</p>`], err: E.html.close, why: 'Every opening <p> needs a closing </p>, otherwise the browser has to guess where it ends.', hint: 'One of the paragraphs is never closed.' }); }
    ],
    2: [
      () => { const v = pick([['img', 'scr', 'src', 'photo.png', ' alt="A photo"'], ['a', 'hrf', 'href', 'menu.html', '']]), [tag, bad, good, val, extra] = v, text = tag === 'a' ? 'Menu</a>' : '';
        const line = a => tag === 'a' ? `  <a ${a}="${val}">Menu</a>` : `  <img ${a}="${val}"${extra}>`;
        return mkBug({ lang: 'html', title: 'Fix the attribute', lines: ['<body>', '  <h1>My Page</h1>', line(bad), '</body>'], bad: 2, fixed: line(good), fixWrong: [line(tag === 'a' ? 'link' : 'source'), tag === 'a' ? `  <link href="${val}">Menu</a>` : `  <image src="${val}"${extra}>`], err: E.html.attr, why: `The attribute is called ${good}. Browsers ignore names they do not know, so ${bad} does nothing.`, hint: 'Read the attribute name slowly, letter by letter.' }); },
      () => { const p = pick(['page', 'about', 'menu']) + '.html'; return mkBug({ lang: 'html', title: 'Fix the link', lines: ['<body>', `  <a href="${p}>Click here</a>`, '</body>'], bad: 1, fixed: `  <a href="${p}">Click here</a>`, fixWrong: [`  <a href=${p}">Click here</a>`, `  <a href="${p}"Click here</a>`], err: E.html.quote, why: 'An attribute value needs a quote at both ends. Without the closing quote the browser reads the rest of the line as part of the value.', hint: 'Count the quote marks on the link line.' }); }
    ],
    3: [
      () => { const w = pick(['HTML', 'CSS', 'tags']); return mkBug({ lang: 'html', title: 'Fix the nesting', lines: ['<body>', `  <p>Learn <b>${w}</p></b>`, '</body>'], bad: 1, fixed: `  <p>Learn <b>${w}</b></p>`, fixWrong: [`  <p>Learn <b>${w}</p>`, `  <p>Learn </b>${w}<b></p>`], err: E.html.nest, why: 'Tags must close in the opposite order they opened: the last tag opened (<b>) is closed first.', hint: 'Which tag was opened last? That one has to close first.' }); },
      () => { const w = sample(WORDS, 3); return mkBug({ lang: 'html', title: 'Fix the list', lines: ['<ul>', `  <li>${w[0]}</li>`, `  <p>${w[1]}</p>`, `  <li>${w[2]}</li>`, '</ul>'], bad: 2, fixed: `  <li>${w[1]}</li>`, fixWrong: [`  <ul>${w[1]}</ul>`, `  <li>${w[1]}`], err: E.html.li, why: 'A list should only contain <li> items. A <p> inside <ul> is not valid HTML.', hint: 'One item in the list is not a list item.' }); }
    ]
  },
  css: {
    1: [
      () => { const P = sample([['color', pick(COLORS)], ['font-size', '18px'], ['margin', '12px'], ['padding', '8px']], 3); return mkBug({ lang: 'css', title: 'Fix the style rule', lines: ['p {', `  ${P[0][0]}: ${P[0][1]};`, `  ${P[1][0]}: ${P[1][1]}`, `  ${P[2][0]}: ${P[2][1]};`, '}'], bad: 2, fixed: `  ${P[1][0]}: ${P[1][1]};`, fixWrong: [`  ${P[1][0]}: ${P[1][1]},`, `  ${P[1][0]}: ${P[1][1]}:`], err: E.css.semi, why: 'Each declaration ends with a semicolon. Without it, the browser merges two lines and ignores both.', hint: 'Look at the end of each line inside the braces.' }); },
      () => { const T = pick([['colour', 'red', 'color'], ['backround-color', '#ffe27a', 'background-color'], ['font-sise', '20px', 'font-size'], ['text-allign', 'center', 'text-align']]); return mkBug({ lang: 'css', title: 'Fix the property', lines: ['h1 {', '  font-weight: bold;', `  ${T[0]}: ${T[1]};`, '}'], bad: 2, fixed: `  ${T[2]}: ${T[1]};`, fixWrong: [`  ${T[2]} = ${T[1]};`, `  ${T[0]}: ${T[1]}`], err: E.css.spell, why: `CSS only understands exact property names. ${T[0]} is not one, the real one is ${T[2]}.`, hint: 'One property name has a spelling mistake.' }); }
    ],
    2: [
      () => { const T = pick([['font-size', 18], ['width', 240], ['margin-top', 16], ['padding', 12]]); return mkBug({ lang: 'css', title: 'Fix the number', lines: ['.card {', '  color: #16161a;', `  ${T[0]}: ${T[1]};`, '}'], bad: 2, fixed: `  ${T[0]}: ${T[1]}px;`, fixWrong: [`  ${T[0]}: ${T[1]} px;`, `  ${T[0]}: "${T[1]}";`], err: E.css.unit, why: 'Lengths need a unit such as px. A plain number (other than 0) is ignored.', hint: 'What is missing after the number?' }); },
      () => { const id = rnd(2), nm = pick(['title', 'intro', 'note']); return mkBug({ lang: 'css', title: 'Fix the selector', lines: [`/* ${id ? `<h1 id="${nm}">` : `<h1 class="${nm}">`}Hello</h1> */`, id ? `.${nm} {` : `#${nm} {`, '  color: #d6336c;', '}'], bad: 1, fixed: id ? `#${nm} {` : `.${nm} {`, fixWrong: [`${nm} {`, `*${nm} {`], err: E.css.selector, why: 'Use # to select an id and . to select a class.', hint: 'Check the comment: does the heading use an id or a class?' }); },
      () => { const p = pick([['color', 'red'], ['background', 'gold'], ['font-weight', 'bold']]); return mkBug({ lang: 'css', title: 'Fix the declaration', lines: ['.box {', '  padding: 10px;', `  ${p[0]} ${p[1]};`, '}'], bad: 2, fixed: `  ${p[0]}: ${p[1]};`, fixWrong: [`  ${p[0]}; ${p[1]};`, `  ${p[0]} = ${p[1]};`], err: E.css.colon, why: 'A declaration is written property: value; — the colon is what separates the two.', hint: 'What joins a property to its value?' }); }
    ],
    3: [
      () => { const T = pick([['text-align', 'middle', 'center'], ['justify-content', 'middle', 'center'], ['display', 'flexbox', 'flex'], ['position', 'center', 'absolute']]); return mkBug({ lang: 'css', title: 'Fix the value', lines: ['.box {', '  background: #ffe27a;', `  ${T[0]}: ${T[1]};`, '}'], bad: 2, fixed: `  ${T[0]}: ${T[2]};`, fixWrong: [`  ${T[0]}: "${T[2]}";`, `  ${T[0]}: ${T[1]}px;`], err: E.css.value, why: `${T[1]} is not a valid value for ${T[0]}. The correct keyword is ${T[2]}.`, hint: 'The property is fine, but the value is not one CSS knows.' }); },
      () => { const c = pick(['card', 'panel', 'menu']); return mkBug({ lang: 'css', title: 'Fix the rule', lines: [`.${c} (`, '  padding: 16px;', '  color: #16161a;', '}'], bad: 0, fixed: `.${c} {`, fixWrong: [`.${c} [`, `${c} {`], err: E.css.bracket, why: 'CSS rules are wrapped in curly braces { }, not round or square brackets.', hint: 'Compare the first line with the last line.' }); },
      () => lazyBugHover()
    ]
  },
  js: {
    1: [
      () => { const n = pick(NAMES); return mkBug({ lang: 'js', title: 'Fix the message', lines: [`let name = "${n}";`, 'console.log("Hello, " + name;'], bad: 1, fixed: 'console.log("Hello, " + name);', fixWrong: ['console.log("Hello, " + name));', 'console.log("Hello, " + name;)'], err: E.js.paren, why: 'Every ( needs a matching ). The closing bracket of console.log( is missing.', hint: 'Count the opening and closing brackets on the last line.' }); },
      () => { const a = int(2, 9), b = int(2, 9), w = pick(['Console.log', 'consol.log', 'console.Log']); return mkBug({ lang: 'js', title: 'Fix the print line', lines: [`let total = ${a} + ${b};`, `${w}(total);`], bad: 1, fixed: 'console.log(total);', fixWrong: ['console.print(total);', 'console.log[total];'], err: E.js.name, why: 'JavaScript is case sensitive and spelling must be exact: it is console.log, all lowercase.', hint: 'Check the spelling and capital letters of the command.' }); },
      () => { const w = pick(['Paris', 'Tokyo', 'Cairo', 'Lima']); return mkBug({ lang: 'js', title: 'Fix the text', lines: [`let city = "${w};`, 'console.log(city);'], bad: 0, fixed: `let city = "${w}";`, fixWrong: [`let city = ${w}";`, `let city = "${w}';`], err: E.js.quote, why: 'Text must start and end with the same kind of quote.', hint: 'The text on the first line never ends.' }); }
    ],
    2: [
      () => mkBug({ lang: 'js', title: 'Fix the DOM line', lines: ['let title = document.getElementbyId("title");', 'title.textContent = "Hi";'], bad: 0, fixed: 'let title = document.getElementById("title");', fixWrong: ['let title = document.getelementbyid("title");', 'let title = document.getElementByID("title");'], err: E.js.name, why: 'The method is getElementById, with capital E and capital B (Id is written with a small d).', hint: 'Look closely at the capital letters in getElementById.' }),
      () => { const n = int(5, 20); return mkBug({ lang: 'js', title: 'Fix the condition', lines: [`let score = ${n};`, `if (score = ${n}) {`, '  console.log("Perfect!");', '}'], bad: 1, fixed: `if (score === ${n}) {`, fixWrong: [`if (score == = ${n}) {`, `if (score := ${n}) {`], err: E.js.assign, why: 'A single = stores a value. To compare two values use === (or ==).', hint: 'Do we want to store a value here, or compare two values?' }); },
      () => { const it = sample(WORDS, 3); return mkBug({ lang: 'js', title: 'Fix the loop', lines: [`let items = [${q2(it)}];`, 'for (let i = 0; i <= items.length; i++) {', '  console.log(items[i]);', '}'], bad: 1, fixed: 'for (let i = 0; i < items.length; i++) {', fixWrong: ['for (let i = 1; i <= items.length; i++) {', 'for (let i = 0; i <= items.length - 2; i++) {'], err: E.js.loop, why: 'An array with 3 items has indexes 0, 1 and 2. i <= length also tries index 3, which does not exist.', hint: 'How many items are there, and what is the last index?' }); },
      () => { const n = pick(NAMES); return mkBug({ lang: 'js', title: 'Fix the function', lines: ['functoin greet(name) {', '  console.log("Hi " + name);', '}', `greet("${n}");`], bad: 0, fixed: 'function greet(name) {', fixWrong: ['fucntion greet(name) {', 'func greet(name) {'], err: E.js.name, why: 'The keyword is spelled function. JavaScript does not guess what you meant.', hint: 'The first word of the first line is a keyword. Is it spelled right?' }); }
    ],
    3: [
      () => mkBug({ lang: 'js', title: 'Fix the counter', lines: ['const count = 0;', 'count = count + 1;', 'console.log(count);'], bad: 0, fixed: 'let count = 0;', fixWrong: ['const count = 1;', 'constant count = 0;'], err: E.js.constant, why: 'const values can never be reassigned. A variable that changes must be declared with let.', hint: 'The second line changes the variable. What kind of variable can change?' }),
      () => { const w = pick(['planet', 'window', 'garden']); return mkBug({ lang: 'js', title: 'Fix the length', lines: [`let word = "${w}";`, 'console.log(word.length());'], bad: 1, fixed: 'console.log(word.length);', fixWrong: ['console.log(word.size);', 'console.log(length(word));'], err: E.js.length, why: 'length is a property, not a function. You read it without ( ).', hint: 'Does length do something, or just hold a value?' }); },
      () => { const a = int(2, 9), b = int(2, 9), op = pick(['+', '*']); return mkBug({ lang: 'js', title: 'Fix the function', lines: ['function calc(a, b) {', `  a ${op} b;`, '}', `console.log(calc(${a}, ${b}));`], bad: 1, fixed: `  return a ${op} b;`, fixWrong: [`  print a ${op} b;`, `  a ${op} b = return;`], err: E.js.ret, why: 'Without return, a function gives back undefined. The calculation is done but thrown away.', hint: 'What does the function hand back to the line that called it?' }); },
      () => { const n = int(10, 30); return mkBug({ lang: 'js', title: 'Fix the comparison', lines: [`let age = ${n};`, `if (age === "${n}") {`, '  console.log("match");', '}'], bad: 1, fixed: `if (age === ${n}) {`, fixWrong: [`if (age === '${n}') {`, `if (age !== ${n}) {`], err: E.js.type, why: `age is a number, but "${n}" in quotes is text. === never treats a number and text as equal.`, hint: 'Is age a number or a piece of text? What about the thing you compare it to?' }); }
    ]
  }
};
function lazyBugHover() {
  return mkBug({ lang: 'css', title: 'Fix the hover style', lines: ['a {', '  color: #2f6fed;', '}', 'a:hovr {', '  color: #d6336c;', '}'], bad: 3, fixed: 'a:hover {', fixWrong: ['a::hover {', 'a.hover {'], err: E.css.spell, why: 'The state selector is :hover. A misspelled one matches nothing.', hint: 'Check the spelling of the part after the colon.' });
}

/* ---- Code Arrangement ---- */
function mkArr(lang, prompt, lines, why) {
  let p = shuffle(lines), t = 0; while (p.join('\n') === lines.join('\n') && t++ < 20) p = shuffle(lines);
  return { pub: { type: 'arr', lang, prompt, pieces: p }, ans: lines, why };
}
const ARR = {
  html: {
    1: [
      () => { const t = pick(['Hello World!', 'Welcome', 'My First Page']); return mkArr('html', `Build a page with the heading "${t}".`, ['<html>', '<body>', `<h1>${t}</h1>`, '</body>', '</html>'], 'html wraps everything, body holds what people see, and the heading goes inside body.'); },
      () => { const [a, b] = sample(['Hello there', 'Welcome', 'Good day', 'Hi friends'], 2); return mkArr('html', `Inside the body, put the heading "${a}" first and then a paragraph "${b}".`, ['<body>', `<h1>${a}</h1>`, `<p>${b}</p>`, '</body>'], 'Elements appear on the page in the same order they are written.'); }
    ],
    2: [
      () => { const w = sample(WORDS, 3); return mkArr('html', `Make a bullet list with these items in order: ${w.join(', ')}.`, ['<ul>', ...w.map(x => `<li>${x}</li>`), '</ul>'], 'The <ul> wraps the whole list and every item sits in its own <li>.'); },
      () => { const t = pick(['My Links', 'Favourites', 'Useful pages']), tx = pick(['Home', 'Menu', 'About']); return mkArr('html', `In the body, add the heading "${t}" and then a paragraph that holds a link to ${tx.toLowerCase()}.html with the text "${tx}".`, ['<body>', `<h2>${t}</h2>`, '<p>', `<a href="${tx.toLowerCase()}.html">${tx}</a>`, '</p>', '</body>'], 'The link lives inside the paragraph, and the paragraph lives inside the body.'); }
    ],
    3: [
      () => { const [a, b, c, d] = sample(WORDS, 4); return mkArr('html', `Build a table with 2 rows. Row 1 has the cells ${a} and ${b}. Row 2 has ${c} and ${d}.`, ['<table>', '<tr>', `<td>${a}</td>`, `<td>${b}</td>`, '</tr>', '<tr>', `<td>${c}</td>`, `<td>${d}</td>`, '</tr>', '</table>'], 'A table holds rows (<tr>), and each row holds cells (<td>).'); },
      () => { const t = pick(['News', 'Today', 'Update']), w = sample(WORDS, 2); return mkArr('html', `Make a div containing the heading "${t}" and a list with ${w[0]} then ${w[1]}.`, ['<div>', `<h3>${t}</h3>`, '<ul>', `<li>${w[0]}</li>`, `<li>${w[1]}</li>`, '</ul>', '</div>'], 'The div is the outer box. Its children are written in order, each fully closed before the next starts.'); }
    ]
  },
  css: {
    1: [
      () => { const c = pick(COLORS), s = pick([16, 18, 20, 24]); return mkArr('css', `Style every paragraph: colour ${c} first, then a font size of ${s}px.`, ['p {', `color: ${c};`, `font-size: ${s}px;`, '}'], 'A rule starts with the selector and an opening brace, then declarations, then the closing brace.'); },
      () => { const c = pick(COLORS); return mkArr('css', `Give every h1 the colour ${c} and centred text (colour first).`, ['h1 {', `color: ${c};`, 'text-align: center;', '}'], 'Selector, { , declarations, } — always in that order.'); }
    ],
    2: [
      () => { const c = pick(['gold', 'pink', 'teal', 'orange']), p = pick([8, 12, 16]), r = pick([4, 8, 12]); return mkArr('css', `Style the class .card: background ${c}, then padding ${p}px, then border-radius ${r}px.`, ['.card {', `background: ${c};`, `padding: ${p}px;`, `border-radius: ${r}px;`, '}'], 'A class selector starts with a dot. The declarations follow in the order the task lists them.'); },
      () => { const w = pick([200, 240, 300]), m = pick([10, 20]); return mkArr('css', `Style the id #box: width ${w}px, then margin ${m}px, then a 2px solid black border.`, ['#box {', `width: ${w}px;`, `margin: ${m}px;`, 'border: 2px solid black;', '}'], 'An id selector starts with #.'); }
    ],
    3: [
      () => { const [a, b] = sample(COLORS, 2); return mkArr('css', `Write two rules. First h1 with colour ${a}. Then .btn with background ${b} and white text (background first).`, ['h1 {', `color: ${a};`, '}', '.btn {', `background: ${b};`, 'color: white;', '}'], 'Finish one rule with } before starting the next.'); },
      () => { const gap = pick([8, 12, 16]); return mkArr('css', `Make .row a flex container: display flex, then a gap of ${gap}px, then justify-content center.`, ['.row {', 'display: flex;', `gap: ${gap}px;`, 'justify-content: center;', '}'], 'display: flex turns on flexbox. gap and justify-content then control the spacing and alignment.'); }
    ]
  },
  js: {
    1: [
      () => { const a = int(2, 9), b = int(2, 9); return mkArr('js', 'Create a, then create b, then print their sum.', [`let a = ${a};`, `let b = ${b};`, 'console.log(a + b);'], 'A variable must exist before you can use it.'); },
      () => { const n = pick(NAMES); return mkArr('js', 'Store a name, then print a greeting that uses it.', [`let name = "${n}";`, 'console.log("Hello, " + name);'], 'The variable is created first, so the next line can read it.'); }
    ],
    2: [
      () => { const n = int(3, 6); return mkArr('js', `Print the numbers 1 to ${n} with a for loop.`, [`for (let i = 1; i <= ${n}; i++) {`, 'console.log(i);', '}'], 'The loop header opens the block, the body runs inside, and } closes it.'); },
      () => { const n = int(3, 6); return mkArr('js', `Add up the numbers 1 to ${n} and print the total.`, ['let total = 0;', `for (let i = 1; i <= ${n}; i++) {`, 'total += i;', '}', 'console.log(total);'], 'Create the total before the loop, add inside it, print after it has finished.'); }
    ],
    3: [
      () => { const n = int(2, 9); return mkArr('js', `Define a function double that returns n * 2, then print double(${n}).`, ['function double(n) {', 'return n * 2;', '}', `console.log(double(${n}));`], 'Define the function first, then call it.'); },
      () => { const n = int(20, 90); return mkArr('js', `Store a score of ${n}. If it is at least 50 print "Pass", otherwise print "Fail".`, [`let score = ${n};`, 'if (score >= 50) {', 'console.log("Pass");', '} else {', 'console.log("Fail");', '}'], 'if opens a block, } else { switches to the other block, and the last } closes it.'); },
      () => { const a = int(1, 9), b = int(1, 9), c = int(1, 9); return mkArr('js', 'Add every number of the array together and print the sum.', [`let nums = [${a}, ${b}, ${c}];`, 'let sum = 0;', 'for (let n of nums) {', 'sum += n;', '}', 'console.log(sum);'], 'Set up the array and the sum, loop over the array, then print once the loop is done.'); }
    ]
  }
};

/* ---- registry ---- */
function genQuestions(game, topic, level, n) {
  const tbl = ({ gto: GTO, bug: BUG, arr: ARR })[game][topic][level], out = [], seen = new Set(); let t = 0;
  while (out.length < n && t++ < 300) { const q = pick(tbl)(); const k = JSON.stringify(q.pub); if (!seen.has(k)) { seen.add(k); out.push(q); } }
  while (out.length < n) out.push(pick(tbl)());
  return out;
}
const grade = (q, a) => q.pub.type === 'gto' ? a === q.ans : q.pub.type === 'bug' ? !!a && a.err === q.ans.err && a.fix === q.ans.fix : Array.isArray(a) && a.length === q.ans.length && a.every((x, i) => x === q.ans[i]);
const answerText = q => q.pub.type === 'gto' ? q.pub.options[q.ans] : q.pub.type === 'bug' ? `${q.pub.errOpts[q.ans.err]}\n${q.pub.fixOpts[q.ans.fix].trim()}` : q.ans.join('\n');

const TOPICS = { html: 'HTML', css: 'CSS', js: 'JavaScript' };
const LEVELS = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
const GAMES = {
  lab: { key: 'lab', name: 'Live Page Lab', blurb: 'Change a tiny web page with buttons and pickers, and watch it update live.', how: ['Play freely in the sandbox, or take the quiz.', 'In the quiz you get a goal page. Change your page until it matches.', 'Turn on Show Code to see the real HTML and CSS behind each change.'], party: false },
  gto: { key: 'gto', name: 'Guess the Output', blurb: 'Read a snippet of code and work out what it prints or shows.', how: ['Read the code carefully.', 'Pick the output you think is right.', 'Get an explanation after every answer.'], party: true, count: 10, time: { 1: 30, 2: 40, 3: 50 } },
  bug: { key: 'bug', name: 'Bug Hunter', blurb: 'The code has one bug. Find what is wrong, then pick the right fix.', how: ['The buggy line is highlighted in the code.', 'Step 1: say what kind of error it is.', 'Step 2: pick the line that fixes it.'], party: true, count: 6, time: { 1: 45, 2: 60, 3: 75 } },
  arr: { key: 'arr', name: 'Code Arrangement', blurb: 'The lines of a program are shuffled. Put them back in the right order.', how: ['Read the task at the top.', 'Click (or drag) the pieces into the numbered slots.', 'Press Check to see if the order works.'], party: true, count: 6, time: { 1: 60, 2: 90, 3: 120 }, soloTime: { 1: 90, 2: 120, 3: 150 } }
};
/* =====================================================================
   LESSONS — 3 subjects × 5 topics. The code is editable and runnable.
   ===================================================================== */
const LESSONS = {
  html: {
    name: 'HTML', tagline: 'The structure of a web page', topics: [
      { t: 'What is HTML?', p: ['HTML (HyperText Markup Language) describes what is on a page: headings, text, images, links. It does not decide how things look, only what they are.', 'A page is made of elements. Every page has an <html> element wrapping everything, and a <body> element holding what visitors see.'], code: '<html>\n  <body>\n    <h1>Hello, web!</h1>\n    <p>This is my very first page.</p>\n  </body>\n</html>', tip: 'Try changing the text between the tags, then press Run.' },
      { t: 'Tags and elements', p: ['Most elements have an opening tag, some content, and a closing tag that starts with a slash: <p>content</p>.', 'Tags can carry attributes that give extra information, written inside the opening tag as name="value". For example, a link needs an href.'], code: '<p>A paragraph</p>\n<p title="Hover me!">A paragraph with an attribute</p>\n<br>\n<p>The line above is an empty element: no closing tag.</p>', tip: 'Hover over the second paragraph in the result to see its title.' },
      { t: 'Headings and text', p: ['<h1> to <h6> are headings, from most to least important. Use one <h1> per page for the main title.', 'Use <p> for paragraphs, <strong> for important text, and <em> for emphasis. Browsers show them bold and italic by default.'], code: '<h1>Main title</h1>\n<h2>Sub heading</h2>\n<p>Normal text with <strong>important</strong> and <em>emphasised</em> words.</p>', tip: 'Add an <h3> and see how its size compares.' },
      { t: 'Links and images', p: ['The <a> element makes a link. Its href attribute is where the link goes, and the text between the tags is what people click.', 'The <img> element shows a picture. src is the file, and alt is a short description used when the image cannot load.'], code: '<a href="https://example.com">Visit example.com</a>\n<br><br>\n<img src="missing.png" alt="A picture that is not here">', tip: 'The image file does not exist, so you see its alt text. That is what alt is for.' },
      { t: 'Lists', p: ['<ul> makes a bullet list and <ol> makes a numbered list. Every item inside is an <li>.', 'Lists can be nested: put a whole <ul> inside an <li> to make a sub-list.'], code: '<ul>\n  <li>HTML</li>\n  <li>CSS</li>\n  <li>JavaScript</li>\n</ul>\n\n<ol>\n  <li>Learn</li>\n  <li>Practise</li>\n  <li>Build</li>\n</ol>', tip: 'Change <ul> to <ol> in the first list.' }
    ]
  },
  css: {
    name: 'CSS', tagline: 'Colours, spacing and layout', topics: [
      { t: 'What is CSS?', p: ['CSS (Cascading Style Sheets) controls how HTML looks. A rule has a selector (what to style) and declarations (how to style it).', 'Each declaration is written property: value; and all of them sit inside curly braces.'], code: '<style>\n  h1 {\n    color: tomato;\n    text-align: center;\n  }\n</style>\n\n<h1>Styled heading</h1>', tip: 'Change tomato to teal.' },
      { t: 'Colours and text', p: ['color changes the text colour and background-color changes what is behind it. Colours can be names (teal), hex codes (#ff5b2e) or rgb() values.', 'font-size sets how big text is (use units such as px), and font-family picks the typeface.'], code: '<style>\n  p {\n    color: white;\n    background-color: #16161a;\n    font-size: 22px;\n    font-family: Georgia, serif;\n    padding: 12px;\n  }\n</style>\n\n<p>Light text on a dark background.</p>', tip: 'Try font-family: monospace;' },
      { t: 'The box model', p: ['Every element is a box. From inside out: content, padding (space inside), border, and margin (space outside).', 'The total width of a box is content + padding + border, unless you set box-sizing: border-box, which counts them inside the width.'], code: '<style>\n  .box {\n    width: 200px;\n    padding: 20px;\n    border: 4px solid #16161a;\n    margin: 20px;\n    background: #ffe27a;\n  }\n</style>\n\n<div class="box">I am a box</div>', tip: 'Increase the padding and watch the box grow.' },
      { t: 'Selectors', p: ['An element selector (p) hits every paragraph. A class selector (.note) hits elements with class="note". An id selector (#main) hits the one element with id="main".', 'When rules clash, the more specific selector wins: id beats class, and class beats element. If they are equal, the later rule wins.'], code: '<style>\n  p { color: gray; }\n  .note { color: teal; }\n  #main { color: tomato; }\n</style>\n\n<p>Plain paragraph</p>\n<p class="note">Class paragraph</p>\n<p class="note" id="main">Id wins here</p>', tip: 'Remove id="main" from the last paragraph.' },
      { t: 'Flexbox basics', p: ['Set display: flex on a parent and its children line up in a row. justify-content spreads them along the row and align-items lines them up across it.', 'flex-direction: column stacks them instead, and gap adds space between items.'], code: '<style>\n  .row {\n    display: flex;\n    justify-content: space-between;\n    gap: 12px;\n  }\n  .row div {\n    background: #ffe27a;\n    padding: 16px;\n  }\n</style>\n\n<div class="row">\n  <div>A</div><div>B</div><div>C</div>\n</div>', tip: 'Change space-between to center, then add flex-direction: column;' }
    ]
  },
  js: {
    name: 'JavaScript', tagline: 'Make pages do things', topics: [
      { t: 'Hello, console', p: ['JavaScript is a programming language that runs in the browser. console.log() prints a value, which is the easiest way to see what your code does.', 'Code runs from top to bottom, one line at a time. Lines end with a semicolon.'], code: 'console.log("Hello, JavaScript!");\nconsole.log(2 + 3);\nconsole.log("Total: " + 10 * 4);', tip: 'Add a line that prints your name.' },
      { t: 'Variables and types', p: ['A variable stores a value. Use let for a value that can change and const for one that never will.', 'Common types are numbers (5), strings of text ("hi"), and booleans (true or false). typeof tells you which one a value is.'], code: 'let score = 10;\nconst player = "Ana";\nscore = score + 5;\n\nconsole.log(player, score);\nconsole.log(typeof score, typeof player, typeof true);', tip: 'Try changing const to let and reassign player.' },
      { t: 'Conditions', p: ['if runs a block only when its condition is true, and else runs when it is not. Compare with === (equal) or > and < (bigger, smaller).', 'Combine tests with && (and) and || (or).'], code: 'let age = 16;\n\nif (age >= 18) {\n  console.log("Adult");\n} else if (age >= 13) {\n  console.log("Teenager");\n} else {\n  console.log("Child");\n}', tip: 'Change age to 8, then to 30.' },
      { t: 'Loops and arrays', p: ['An array holds a list of values: ["a", "b", "c"]. Items are numbered from 0, and length tells you how many there are.', 'A for loop repeats code. It has a start, a stopping test, and a step.'], code: 'let fruits = ["apple", "mango", "grape"];\n\nfor (let i = 0; i < fruits.length; i++) {\n  console.log(i + ": " + fruits[i]);\n}', tip: 'Add another fruit and run it again.' },
      { t: 'Functions and the page', p: ['A function is a named block of code you can run again and again. It can take inputs (parameters) and give back a result with return.', 'JavaScript can also change the page. document.getElementById finds an element, and you can then change its textContent or listen for clicks.'], code: 'function greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconsole.log(greet("Ana"));\n\nlet demo = document.getElementById("demo");\ndemo.textContent = greet("web");\n\ndocument.getElementById("btn").onclick = function () {\n  demo.textContent = "You clicked the button!";\n};', tip: 'Click the button in the result, then change the message.' }
    ]
  }
};

/* Build the little page that runs a lesson's code inside a sandboxed frame */
function lessonFrameDoc(subject, code) {
  const base = '<style>body{font:15px/1.5 system-ui,sans-serif;margin:14px;color:#16161a}</style>';
  if (subject === 'html' || subject === 'css') return base + code;
  const safe = code.replace(/<\/script/gi, '<\\/script');
  return base + '<p id="demo" style="font-weight:600"></p><button id="btn" style="padding:6px 12px;font:inherit">Click me</button>'
    + '<script>var __l=function(){parent.postMessage({lab:"log",v:[].map.call(arguments,function(a){return typeof a==="string"?a:JSON.stringify(a)}).join(" ")},"*")};'
    + 'window.console={log:__l,error:__l,warn:__l};window.onerror=function(m){__l("Error: "+m)};'
    + 'try{' + safe + '\n}catch(e){__l("Error: "+e.message)}<\/script>';
}
/* =====================================================================
   LIVE PAGE LAB — sandbox + randomised quiz
   One state object drives the preview, the code view and the checker.
   ===================================================================== */
const SW_LIGHT = ['#ffffff', '#f1ece0', '#ffe27a', '#d6ecff', '#ffd9cc', '#d5f0e0'];
const SW_DARK = ['#16161a', '#ff5b2e', '#1d7a4a', '#2f6fed', '#d6336c'];
const SWATCHES = [...SW_LIGHT, ...SW_DARK];
const FONTS = { sans: ['Sans', 'system-ui, sans-serif'], serif: ['Serif', 'Georgia, serif'], mono: ['Mono', 'ui-monospace, Menlo, monospace'], hand: ['Cursive', '"Comic Sans MS", cursive'] };
const BORDERS = { none: ['None', 'none'], thin: ['Thin', '1px solid #16161a'], thick: ['Thick', '4px solid #16161a'] };
const SHADOWS = { none: ['None', 'none'], soft: ['Soft', '0 8px 24px rgba(0,0,0,.18)'], hard: ['Hard', '6px 6px 0 #16161a'] };
const SHAPE_NAMES = { circle: 'Circle', square: 'Square', triangle: 'Triangle', star: 'Star' };
const LAB_BASE = { title: 'Hello World', para: 'This is my first web page.', btn: 'Click me', showBtn: true, bg: '#ffffff', box: '#f1ece0', titleC: '#16161a', paraC: '#16161a', btnC: '#16161a', titleSize: 28, font: 'sans', align: 'left', radius: 12, pad: 24, border: 'none', shadow: 'none', btnRadius: 8, shapes: [] };
const LAB_TXT = {
  title: ['Hello World', 'My Garden', 'Weekend Plans', 'Pixel Club', 'Cat Facts', 'Lunch Menu', 'Movie Night'],
  para: ['This is my first web page.', 'Come and see what is new today.', 'Pick a day that works for you.', 'Everything here is made with code.', 'Fresh updates arrive every week.'],
  btn: ['Click me', 'Start', 'Join now', 'Open', 'Press here', 'Go']
};
const LAB_TABS = {
  Words: [
    { k: 'title', l: 'Title', t: 'text', css: '<h1> text' }, { k: 'para', l: 'Paragraph', t: 'text', css: '<p> text' },
    { k: 'btn', l: 'Button text', t: 'text', css: '<button> text' }, { k: 'showBtn', l: 'Show the button', t: 'toggle', css: 'display' }],
  Colors: [
    { k: 'bg', l: 'Page background', t: 'color', css: 'background-color (body)' }, { k: 'box', l: 'Box', t: 'color', css: 'background-color (.box)' },
    { k: 'titleC', l: 'Title', t: 'color', css: 'color (h1)' }, { k: 'paraC', l: 'Paragraph', t: 'color', css: 'color (p)' }, { k: 'btnC', l: 'Button', t: 'color', css: 'background-color (button)' }],
  Style: [
    { k: 'titleSize', l: 'Title size', t: 'range', min: 16, max: 48, step: 4, unit: 'px', css: 'font-size' },
    { k: 'font', l: 'Font', t: 'select', opts: FONTS, css: 'font-family' },
    { k: 'align', l: 'Text alignment', t: 'seg', opts: { left: 'Left', center: 'Center', right: 'Right' }, css: 'text-align' },
    { k: 'radius', l: 'Box corners', t: 'range', min: 0, max: 32, step: 4, unit: 'px', css: 'border-radius' },
    { k: 'pad', l: 'Space inside box', t: 'range', min: 8, max: 48, step: 8, unit: 'px', css: 'padding' },
    { k: 'border', l: 'Box outline', t: 'seg', opts: { none: 'None', thin: 'Thin', thick: 'Thick' }, css: 'border' },
    { k: 'shadow', l: 'Box shadow', t: 'seg', opts: { none: 'None', soft: 'Soft', hard: 'Hard' }, css: 'box-shadow' },
    { k: 'btnRadius', l: 'Button corners', t: 'range', min: 0, max: 24, step: 4, unit: 'px', css: 'border-radius (button)' }],
  Shapes: []
};
const FIELD_TAB = {}; Object.entries(LAB_TABS).forEach(([t, fs]) => fs.forEach(f => FIELD_TAB[f.k] = t)); FIELD_TAB.shapes = 'Shapes';

/* ---------- colour helpers ---------- */
function rgb(h) { h = (h || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
const colDist = (a, b) => { const x = rgb(a), y = rgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
const isLight = h => { const [r, g, b] = rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6; };

/* ---------- preview ---------- */
function stageHTML(s) {
  return `<div class="stage" style="background:${s.bg}"><div class="pbox" style="background:${s.box};border-radius:${s.radius}px;padding:${s.pad}px;text-align:${s.align};font-family:${FONTS[s.font][1]};border:${BORDERS[s.border][1]};box-shadow:${SHADOWS[s.shadow][1]}">`
    + `<h1 style="color:${s.titleC};font-size:${s.titleSize}px">${esc(s.title) || '&nbsp;'}</h1><p style="color:${s.paraC}">${esc(s.para) || '&nbsp;'}</p>`
    + (s.showBtn ? `<button type="button" style="background:${s.btnC};color:${isLight(s.btnC) ? '#16161a' : '#fff'};border-radius:${s.btnRadius}px">${esc(s.btn) || '&nbsp;'}</button>` : '')
    + `</div>` + s.shapes.map((sh, i) => `<div class="shp" data-i="${i}" style="left:${sh.x}%;top:${sh.y}%;--c:${sh.color}"><i class="${sh.type}"></i></div>`).join('') + `</div>`;
}
function bindDrag(stage, s, done) {
  stage.onpointerdown = e => {
    const sp = e.target.closest('.shp'); if (!sp) return; e.preventDefault();
    const i = +sp.dataset.i, box = stage.querySelector('.stage') || stage; sp.classList.add('drag');
    const mv = ev => { const r = box.getBoundingClientRect(); const x = Math.round(Math.min(96, Math.max(4, (ev.clientX - r.left) / r.width * 100))), y = Math.round(Math.min(96, Math.max(4, (ev.clientY - r.top) / r.height * 100))); s.shapes[i].x = x; s.shapes[i].y = y; sp.style.left = x + '%'; sp.style.top = y + '%'; };
    const up = () => { sp.classList.remove('drag'); removeEventListener('pointermove', mv); removeEventListener('pointerup', up); done(i); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  };
}

/* ---------- generated code (every line remembers which control made it) ---------- */
function labCode(s) {
  const H = [], C = [], used = [...new Set(s.shapes.map(x => x.type))];
  H.push({ t: '<div class="box">' });
  H.push({ t: `  <h1>${s.title}</h1>`, k: ['title'] });
  H.push({ t: `  <p>${s.para}</p>`, k: ['para'] });
  if (s.showBtn) H.push({ t: `  <button>${s.btn}</button>`, k: ['btn', 'showBtn'] });
  H.push({ t: '</div>' });
  s.shapes.forEach(x => H.push({ t: `<div class="shape ${x.type}"></div>`, k: ['shapes'] }));
  C.push({ t: 'body {' }, { t: `  background: ${s.bg};`, k: ['bg'] }, { t: '}' }, { t: '' }, { t: '.box {' },
    { t: `  background: ${s.box};`, k: ['box'] }, { t: `  padding: ${s.pad}px;`, k: ['pad'] }, { t: `  border-radius: ${s.radius}px;`, k: ['radius'] },
    { t: `  text-align: ${s.align};`, k: ['align'] }, { t: `  font-family: ${FONTS[s.font][1]};`, k: ['font'] },
    { t: `  border: ${BORDERS[s.border][1]};`, k: ['border'] }, { t: `  box-shadow: ${SHADOWS[s.shadow][1]};`, k: ['shadow'] }, { t: '}' }, { t: '' },
    { t: 'h1 {' }, { t: `  color: ${s.titleC};`, k: ['titleC'] }, { t: `  font-size: ${s.titleSize}px;`, k: ['titleSize'] }, { t: '}' }, { t: '' },
    { t: 'p {' }, { t: `  color: ${s.paraC};`, k: ['paraC'] }, { t: '}' });
  if (s.showBtn) C.push({ t: '' }, { t: 'button {' }, { t: `  background: ${s.btnC};`, k: ['btnC'] }, { t: `  border-radius: ${s.btnRadius}px;`, k: ['btnRadius'] }, { t: '}' });
  if (s.shapes.length) {
    C.push({ t: '' }, { t: '.shape {', k: ['shapes'] }, { t: '  position: absolute;', k: ['shapes'] }, { t: '  width: 56px; height: 56px;', k: ['shapes'] }, { t: '}', k: ['shapes'] });
    s.shapes.forEach((x, i) => C.push({ t: `.shape:nth-of-type(${i + 2}) { left: ${x.x}%; top: ${x.y}%; background: ${x.color}; }`, k: ['shapes'] }));
  }
  return { H, C };
}
function labCodeHTML(s, last) {
  const { H, C } = labCode(s), pane = (n, arr, lang) => `<div class="codepane"><div class="code-tab">${n}</div><div class="code">${arr.map((l, i) => `<div class="ln${last && l.k && l.k.includes(last) ? ' hi' : ''}"><span class="no">${i + 1}</span><span class="tx">${hl(l.t, lang) || '&nbsp;'}</span></div>`).join('')}</div></div>`;
  return pane('HTML', H, 'html') + pane('CSS', C, 'css');
}

/* ---------- quiz: random goal + checker ---------- */
const LAB_POOLS = {
  1: ['title', 'para', 'btn', 'bg', 'box', 'titleC', 'btnC', 'align', 'titleSize'],
  2: ['title', 'para', 'btn', 'bg', 'box', 'titleC', 'btnC', 'align', 'titleSize', 'paraC', 'font', 'radius', 'pad', 'border', 'showBtn', 'shape'],
  3: ['title', 'para', 'btn', 'bg', 'box', 'titleC', 'btnC', 'align', 'titleSize', 'paraC', 'font', 'radius', 'pad', 'border', 'showBtn', 'shape', 'shape2', 'shadow', 'btnRadius']
};
function labGoal(level, idx) {
  const n = [[2, 2, 3, 3, 4], [3, 4, 4, 5, 6], [4, 5, 6, 7, 8]][level - 1][idx], g = clone(LAB_BASE), B = LAB_BASE;
  let keys = sample(LAB_POOLS[level], n); if (keys.includes('showBtn')) keys = keys.filter(k => !['btn', 'btnC', 'btnRadius'].includes(k));
  keys.sort(k => k === 'bg' ? -1 : 0);
  const dark = c => SW_DARK.filter(x => x !== c);
  keys.forEach(k => {
    if (LAB_TXT[k]) g[k] = pick(LAB_TXT[k].filter(x => x !== B[k]));
    else if (k === 'bg') g.bg = pick(SWATCHES.filter(c => c !== B.bg && c !== B.box));
    else if (k === 'box') g.box = pick(SW_LIGHT.filter(c => c !== B.box && c !== g.bg));
    else if (k === 'titleC' || k === 'paraC' || k === 'btnC') g[k] = pick(dark(B[k]));
    else if (k === 'titleSize') g.titleSize = pick([16, 20, 24, 32, 36, 40, 48]);
    else if (k === 'font') g.font = pick(['serif', 'mono', 'hand']);
    else if (k === 'align') g.align = pick(['center', 'right']);
    else if (k === 'radius') g.radius = pick([0, 4, 8, 20, 28, 32]);
    else if (k === 'pad') g.pad = pick([8, 16, 32, 40, 48]);
    else if (k === 'border') g.border = pick(['thin', 'thick']);
    else if (k === 'shadow') g.shadow = pick(['soft', 'hard']);
    else if (k === 'btnRadius') g.btnRadius = pick([0, 4, 16, 24]);
    else if (k === 'showBtn') g.showBtn = false;
    else if (k === 'shape' || k === 'shape2') g.shapes.push({ type: pick(Object.keys(SHAPE_NAMES)), color: pick(SWATCHES.filter(c => c !== g.bg)), x: int(14, 86), y: int(16, 84) });
  });
  return g;
}
const norm = t => String(t).trim().toLowerCase().replace(/\s+/g, ' ');
function labDiff(goal, cur) {
  const bad = new Set(), badShapes = new Set();
  ['title', 'para', 'btn'].forEach(k => { if (norm(goal[k]) !== norm(cur[k])) bad.add(k); });
  ['showBtn', 'titleSize', 'font', 'align', 'radius', 'pad', 'border', 'shadow', 'btnRadius'].forEach(k => { if (goal[k] !== cur[k]) bad.add(k); });
  ['bg', 'box', 'titleC', 'paraC', 'btnC'].forEach(k => { if (colDist(goal[k], cur[k]) > 25) bad.add(k); });
  if (!goal.showBtn) ['btn', 'btnC', 'btnRadius'].forEach(k => bad.delete(k));
  const used = new Set(); let missing = 0;
  goal.shapes.forEach(g => { const j = cur.shapes.findIndex((c, i) => !used.has(i) && c.type === g.type && colDist(c.color, g.color) < 25 && Math.abs(c.x - g.x) <= 14 && Math.abs(c.y - g.y) <= 14); if (j < 0) missing++; else used.add(j); });
  cur.shapes.forEach((_, i) => { if (!used.has(i)) badShapes.add(i); });
  if (missing || badShapes.size) bad.add('shapes');
  return { bad, badShapes, missing };
}

/* ---------- the app ---------- */
function renderLab(el, mode, level) {
  if (mode === 'quiz' && !level) return labQuizSetup(el);
  const L = { s: clone(LAB_BASE), tab: 'Words', code: false, last: null, bad: new Set(), hint: new Set(), badShapes: new Set(), shapeColor: '#ff5b2e', side: true, Q: null };
  if (mode === 'quiz') L.Q = { level, idx: 0, goals: Array.from({ length: 5 }, (_, i) => labGoal(level, i)), fails: 0, hint: false, stars: [], solved: false };
  el.innerHTML = `<div class="lab"><div class="lab-bar"><div class="lab-title"><h2>Live Page Lab</h2>${mode === 'quiz' ? `<span class="chip" id="qchip"></span>` : ''}</div>
    <div class="lab-tools"><button class="btn sm" id="tCode" aria-pressed="false">Show code</button><button class="btn sm" id="tReset">Reset</button>
    <div class="seg"><a class="${mode === 'play' ? 'on' : ''}" href="#/play/lab/play">Play</a><a class="${mode === 'quiz' ? 'on' : ''}" href="#/play/lab/quiz">Quiz</a></div></div></div>
    <div class="lab-grid"><aside class="lab-panel" id="panel"></aside><section class="lab-main" id="lmain"></section></div></div>`;
  const main = $('#lmain', el), panel = $('#panel', el);

  function mainShell() {
    if (!L.Q) main.innerHTML = `<div class="stagecard"><div class="stagebar">Preview</div><div id="your"></div></div><div class="codewrap" id="codeWrap" hidden></div>`;
    else if (L.Q.done) return;
    else main.innerHTML = `<div class="quiz-head"><b>Match the goal page.</b> Change your page until it looks the same.</div>
      <div class="duo ${L.side ? 'side' : ''}" id="duo"><div class="stagecard"><div class="stagebar">Goal page</div><div id="goal"></div></div><div class="stagecard"><div class="stagebar">Your page</div><div id="your"></div></div></div>
      <div class="quiz-actions"><label class="check"><input type="checkbox" id="side" ${L.side ? 'checked' : ''}> Side by side</label><span class="qmsg" id="qmsg" aria-live="polite"></span><span class="grow"></span>
      <button class="btn sm" id="bHint">Give me a hint</button><button class="btn sm" id="bSkip">Skip</button><button class="btn sm primary" id="bCheck">Check my page</button></div><div class="codewrap" id="codeWrap" hidden></div>`;
    if (L.Q) { $('#goal', el).innerHTML = stageHTML(L.Q.goals[L.Q.idx]); $('#qchip', el).textContent = `Challenge ${L.Q.idx + 1} of 5 · Level ${L.Q.level}`; }
    drawStage(); drawCode();
  }
  function drawStage() {
    const y = $('#your', el); if (!y) return; y.innerHTML = stageHTML(L.s);
    $$('.shp', y).forEach(sp => { if (L.badShapes.has(+sp.dataset.i)) sp.classList.add('bad'); });
    bindDrag(y, L.s, () => { L.last = 'shapes'; L.bad.delete('shapes'); L.hint.delete('shapes'); L.badShapes.clear(); drawStage(); drawCode(); drawPanel(); });
  }
  function drawCode() { const w = $('#codeWrap', el); if (!w) return; w.hidden = !L.code; if (L.code) w.innerHTML = labCodeHTML(L.s, L.last); }
  function fieldHTML(f) {
    const s = L.s, cls = (L.bad.has(f.k) ? ' bad' : '') + (L.hint.has(f.k) ? ' hint' : ''); let ctl = '';
    if (f.t === 'text') ctl = `<input type="text" data-k="${f.k}" value="${esc(s[f.k])}" maxlength="40" autocomplete="off">`;
    else if (f.t === 'toggle') ctl = `<button class="switch ${s[f.k] ? 'on' : ''}" data-act="toggle" data-k="${f.k}" role="switch" aria-checked="${s[f.k]}"><i></i></button>`;
    else if (f.t === 'color') ctl = swatchRow(f.k, s[f.k]);
    else if (f.t === 'range') ctl = `<div class="rng"><input type="range" data-k="${f.k}" min="${f.min}" max="${f.max}" step="${f.step}" value="${s[f.k]}"><output>${s[f.k]}${f.unit}</output></div>`;
    else if (f.t === 'select') ctl = `<select data-k="${f.k}">${Object.entries(f.opts).map(([v, o]) => `<option value="${v}" ${s[f.k] === v ? 'selected' : ''}>${o[0]}</option>`).join('')}</select>`;
    else if (f.t === 'seg') ctl = `<div class="seg">${Object.entries(f.opts).map(([v, o]) => `<button data-act="seg" data-k="${f.k}" data-v="${v}" class="${s[f.k] === v ? 'on' : ''}">${o}</button>`).join('')}</div>`;
    return `<div class="field${cls}" data-field="${f.k}" title="CSS: ${esc(f.css || '')}"><label>${f.l}</label>${ctl}</div>`;
  }
  function swatchRow(k, cur) {
    const known = SWATCHES.some(c => c.toLowerCase() === String(cur).toLowerCase());
    return `<div class="swatches">${SWATCHES.map(c => `<button class="sw${c.toLowerCase() === String(cur).toLowerCase() ? ' on' : ''}" data-act="color" data-k="${k}" data-v="${c}" style="--c:${c}" aria-label="${c}"></button>`).join('')}<label class="sw adv${known ? '' : ' on'}" title="Any colour"><input type="color" data-k="${k}" value="${cur}"></label></div>`;
  }
  function drawPanel() {
    const tabs = Object.keys(LAB_TABS), badTabs = new Set([...L.bad, ...L.hint].map(k => FIELD_TAB[k]));
    let body;
    if (L.tab === 'Shapes') {
      const full = L.s.shapes.length >= 5;
      body = `<div class="field${L.bad.has('shapes') ? ' bad' : ''}${L.hint.has('shapes') ? ' hint' : ''}" data-field="shapes"><label>Add a shape <small>${L.s.shapes.length} / 5</small></label>
        <div class="shape-add">${Object.entries(SHAPE_NAMES).map(([t, n]) => `<button class="btn sm" data-act="addshape" data-v="${t}" ${full ? 'disabled' : ''}><span class="ico"><i class="${t}" style="--c:${L.shapeColor}"></i></span>${n}</button>`).join('')}</div></div>
        <div class="field"><label>Colour for the next shape</label>${swatchRow('shapeColor', L.shapeColor)}</div>
        <div class="shape-list">${L.s.shapes.map((sh, i) => `<div class="srow"><span class="ico"><i class="${sh.type}" style="--c:${sh.color}"></i></span><span>${SHAPE_NAMES[sh.type]}</span><button class="x" data-act="rmshape" data-v="${i}" aria-label="Remove">Remove</button></div>`).join('') || '<p class="muted">No shapes yet. Add one, then drag it around the preview.</p>'}</div>`;
    } else body = LAB_TABS[L.tab].map(fieldHTML).join('');
    panel.innerHTML = `<div class="tabs" role="tablist">${tabs.map(t => `<button role="tab" class="${t === L.tab ? 'on' : ''}${badTabs.has(t) ? ' flag' : ''}" data-act="tab" data-v="${t}">${t}</button>`).join('')}</div><div class="pbody">${body}</div>`;
  }
  function changed(k) { L.last = k; L.bad.delete(k); L.hint.delete(k); if (k === 'shapes') L.badShapes.clear(); drawStage(); drawCode(); const f = $(`[data-field="${k}"]`, panel); if (f) f.classList.remove('bad', 'hint'); updateDots(); }
  function updateDots() { const badTabs = new Set([...L.bad, ...L.hint].map(k => FIELD_TAB[k])); $$('.tabs button', panel).forEach(b => b.classList.toggle('flag', badTabs.has(b.dataset.v))); }

  panel.addEventListener('input', e => {
    const k = e.target.dataset.k; if (!k) return; const t = e.target;
    if (t.type === 'range') { L.s[k] = +t.value; t.nextElementSibling.textContent = t.value + 'px'; changed(k); }
    else if (t.type === 'color') { if (k === 'shapeColor') { L.shapeColor = t.value; } else { L.s[k] = t.value; changed(k); } }
    else if (t.type === 'text') { L.s[k] = t.value; changed(k); }
  });
  panel.addEventListener('change', e => {
    const k = e.target.dataset.k; if (!k) return;
    if (e.target.tagName === 'SELECT') { L.s[k] = e.target.value; changed(k); }
    else if (e.target.type === 'color') { drawPanel(); }
  });
  panel.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, k = b.dataset.k, v = b.dataset.v;
    if (a === 'tab') { L.tab = v; drawPanel(); }
    else if (a === 'toggle') { L.s[k] = !L.s[k]; changed(k); drawPanel(); }
    else if (a === 'seg') { L.s[k] = v; changed(k); drawPanel(); }
    else if (a === 'color') { if (k === 'shapeColor') { L.shapeColor = v; } else { L.s[k] = v; changed(k); } drawPanel(); }
    else if (a === 'addshape') { if (L.s.shapes.length < 5) { L.s.shapes.push({ type: v, color: L.shapeColor, x: int(20, 80), y: int(20, 80) }); changed('shapes'); drawPanel(); } }
    else if (a === 'rmshape') { L.s.shapes.splice(+v, 1); changed('shapes'); drawPanel(); }
  });
  $('#tCode', el).onclick = e => { L.code = !L.code; e.currentTarget.classList.toggle('on', L.code); e.currentTarget.setAttribute('aria-pressed', L.code); drawCode(); };
  $('#tReset', el).onclick = () => { L.s = clone(LAB_BASE); L.last = null; L.bad.clear(); L.hint.clear(); L.badShapes.clear(); drawStage(); drawCode(); drawPanel(); msg(''); };

  /* quiz controls */
  function msg(t, cls) { const m = $('#qmsg', el); if (m) { m.textContent = t; m.className = 'qmsg ' + (cls || ''); } }
  function next() {
    const Q = L.Q; Q.idx++; Q.fails = 0; Q.hint = false; Q.solved = false; L.s = clone(LAB_BASE); L.last = null; L.bad.clear(); L.hint.clear(); L.badShapes.clear();
    if (Q.idx >= 5) return finish(); mainShell(); drawPanel();
  }
  function finish() {
    const Q = L.Q, total = Q.stars.reduce((a, b) => a + b, 0); Q.done = true; $('#qchip', el).textContent = 'Quiz finished';
    main.innerHTML = `<div class="summary"><h3>Quiz complete</h3><div class="bigscore">${total}<small> / 15 stars</small></div>
      <div class="sum-list">${Q.stars.map((s, i) => `<div class="srow"><span>Challenge ${i + 1}</span><span class="stars" aria-label="${s} stars">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</span></div>`).join('')}</div>
      <div class="row-actions"><button class="btn primary" id="again">New random quiz</button><a class="btn" href="#/play/lab/quiz">Change level</a><a class="btn" href="#/games">All games</a></div></div>`;
    $('#again', el).onclick = () => renderLab(el, 'quiz', Q.level);
  }
  if (L.Q) main.addEventListener('click', e => {
    const Q = L.Q; if (!Q || Q.done) return;
    if (e.target.id === 'side') { L.side = e.target.checked; $('#duo', el).classList.toggle('side', L.side); }
    else if (e.target.id === 'bHint') {
      const d = labDiff(Q.goals[Q.idx], L.s); Q.hint = true; L.hint = new Set(d.bad); L.bad.clear(); drawPanel(); msg(d.bad.size ? `${d.bad.size} thing${d.bad.size > 1 ? 's' : ''} to change. They are marked in yellow.` : 'Looks the same already. Press Check!', 'warn');
    } else if (e.target.id === 'bSkip') { Q.stars.push(0); next(); }
    else if (e.target.id === 'bCheck') {
      if (Q.solved) { next(); return; } const d = labDiff(Q.goals[Q.idx], L.s);
      if (!d.bad.size) {
        let st = 3; if (Q.fails >= 2) st--; if (Q.fails >= 4) st--; if (Q.hint) st--; st = Math.max(1, st); Q.stars.push(st); Q.solved = true; L.bad.clear(); L.hint.clear(); L.badShapes.clear(); drawPanel(); drawStage();
        msg(`Match! ${'★'.repeat(st)}${'☆'.repeat(3 - st)}`, 'good');
        const b = $('#bCheck', el); b.textContent = Q.idx === 4 ? 'See results' : 'Next challenge'; $('#bSkip', el).disabled = true; $('#bHint', el).disabled = true;
      } else {
        Q.fails++; L.bad = new Set(d.bad); L.hint.clear(); L.badShapes = d.badShapes; drawPanel(); drawStage();
        msg(`${d.bad.size} thing${d.bad.size > 1 ? 's are' : ' is'} still off. Look for the red marks.`, 'bad');
      }
    }
  });
  mainShell(); drawPanel();
}

function labQuizSetup(el) {
  el.innerHTML = `<div class="lab"><div class="lab-bar"><div class="lab-title"><h2>Live Page Lab</h2></div><div class="lab-tools"><div class="seg"><a href="#/play/lab/play">Play</a><a class="on" href="#/play/lab/quiz">Quiz</a></div></div></div>
    <div class="setup-card narrow"><h3>Quiz mode</h3><p>You get 5 random goal pages. Change your own page until it matches. Fewer tries and no hint means more stars.</p>
    <div class="levels">${[1, 2, 3].map(l => `<a class="levelbtn" href="#/play/lab/quiz/${l}"><b>Level ${l}</b><span>${LEVELS[l]}</span><small>${[['2 to 4 changes', 'words, colours, size'], ['3 to 6 changes', '+ fonts, shapes, outline'], ['4 to 8 changes', 'everything incl. shadows']][l - 1].join(' · ')}</small></a>`).join('')}</div></div></div>`;
}
/* =====================================================================
   QUESTION VIEWS — one component per question type.
   The same component is used in solo play, for students in party mode,
   and (read-only) on the teacher's live screen.
   ===================================================================== */
const leaveFns = [];
const onLeave = f => leaveFns.push(f);
const runLeave = () => { while (leaveFns.length) { try { leaveFns.pop()(); } catch (e) { } } };

function mountQuestion(el, pub, o = {}) {
  return pub.type === 'gto' ? mountGTO(el, pub, o) : pub.type === 'bug' ? mountBug(el, pub, o) : mountArr(el, pub, o);
}

function mountGTO(el, pub, o) {
  let sel = null, locked = !!o.readOnly;
  el.innerHTML = `<div class="q q-gto"><div class="code-panel"><div class="code-tab">${LANGNAME[pub.lang]}</div>${codeBlock(pub.code.split('\n'), pub.lang)}</div>
    <div class="ans-panel"><h3>${esc(pub.prompt)}</h3><div class="opts">${pub.options.map((t, i) => `<button class="opt" data-i="${i}"${locked ? ' disabled' : ''}><span class="key">${LETTERS[i]}</span><pre>${esc(t)}</pre></button>`).join('')}</div>
    ${o.readOnly ? '' : `<div class="q-actions"><button class="btn primary" data-act="submit" disabled>${o.submitLabel || 'Submit answer'}</button></div>`}</div></div>`;
  const sub = $('[data-act=submit]', el);
  $('.opts', el).onclick = e => { const b = e.target.closest('.opt'); if (!b || locked) return; sel = +b.dataset.i; $$('.opt', el).forEach(x => x.classList.toggle('sel', x === b)); if (sub) sub.disabled = false; };
  if (sub) sub.onclick = () => { if (sel != null && !locked) o.onSubmit(sel); };
  const lock = () => { locked = true; if (sub) sub.disabled = true; $$('.opt', el).forEach(x => x.disabled = true); };
  return {
    lock, getAnswer: () => sel,
    reveal(correct, chosen) { lock(); $$('.opt', el).forEach((x, i) => { x.classList.toggle('ok', i === correct); x.classList.toggle('no', chosen != null && i === chosen && chosen !== correct); }); },
    showCorrect(correct) { $$('.opt', el).forEach((x, i) => x.classList.toggle('ok', i === correct)); }
  };
}

function mountBug(el, pub, o) {
  let err = null, fix = null, locked = !!o.readOnly;
  const grp = (g, arr, mono) => `<div class="opts sm" data-g="${g}">${arr.map((t, i) => `<button class="opt" data-i="${i}"${locked ? ' disabled' : ''}><span class="key">${LETTERS[i]}</span>${mono ? `<pre>${esc(t.trim())}</pre>` : `<span>${esc(t)}</span>`}</button>`).join('')}</div>`;
  el.innerHTML = `<div class="q q-bug"><div class="code-panel"><div class="code-tab">${esc(pub.title)} · ${LANGNAME[pub.lang]}</div>${codeBlock(pub.lines, pub.lang, { hi: pub.bad })}<p class="code-note">The highlighted line is where the bug is.</p></div>
    <div class="ans-panel"><h4><span class="step">1</span>What is the error?</h4>${grp('err', pub.errOpts, false)}<h4><span class="step">2</span>Choose the fix</h4>${grp('fix', pub.fixOpts, true)}
    ${o.readOnly ? '' : `<div class="q-actions">${o.onHint ? '<button class="btn" data-act="hint">Hint</button>' : ''}<button class="btn" data-act="reset">Reset</button><button class="btn primary" data-act="submit" disabled>${o.submitLabel || 'Submit fix'}</button></div>`}</div></div>`;
  const sub = $('[data-act=submit]', el), upd = () => { if (sub) sub.disabled = err == null || fix == null; };
  el.onclick = e => {
    if (locked) return; const b = e.target.closest('.opt'), a = e.target.closest('[data-act]');
    if (b) { const g = b.parentElement.dataset.g; if (g === 'err') err = +b.dataset.i; else fix = +b.dataset.i; $$('.opt', b.parentElement).forEach(x => x.classList.toggle('sel', x === b)); upd(); }
    else if (a && a.dataset.act === 'submit') { if (err != null && fix != null) o.onSubmit({ err, fix }); }
    else if (a && a.dataset.act === 'hint') o.onHint();
    else if (a && a.dataset.act === 'reset') { err = fix = null; $$('.opt', el).forEach(x => x.classList.remove('sel')); upd(); }
  };
  const lock = () => { locked = true; if (sub) sub.disabled = true; $$('.opt', el).forEach(x => x.disabled = true); };
  return {
    lock, getAnswer: () => err == null || fix == null ? null : { err, fix },
    reveal(c, ch) { lock(); ['err', 'fix'].forEach(g => $$(`[data-g=${g}] .opt`, el).forEach((x, i) => { x.classList.toggle('ok', i === c[g]); x.classList.toggle('no', ch && i === ch[g] && ch[g] !== c[g]); })); },
    showCorrect(c) { ['err', 'fix'].forEach(g => $$(`[data-g=${g}] .opt`, el).forEach((x, i) => x.classList.toggle('ok', i === c[g]))); }
  };
}

function mountArr(el, pub, o) {
  const n = pub.pieces.length; let slots = Array(n).fill(null), locked = !!o.readOnly, marks = null;
  el.innerHTML = `<div class="q q-arr"><div class="arr-prompt"><span class="lang-tag">${LANGNAME[pub.lang]}</span><span>${esc(pub.prompt)}</span></div>
    <div class="arr-grid"><div><div class="lbl">Code pieces <small>click or drag</small></div><div class="pool" data-drop="pool"></div></div><div><div class="lbl">Your answer</div><div class="slots"></div></div></div>
    ${o.readOnly ? '' : `<div class="q-actions">${o.onHint ? '<button class="btn" data-act="hint">Hint</button>' : ''}<button class="btn" data-act="reset">Reset</button><button class="btn primary" data-act="submit" disabled>${o.submitLabel || 'Check'}</button></div>`}<div class="arr-key" hidden></div></div>`;
  const pool = $('.pool', el), sl = $('.slots', el), sub = $('[data-act=submit]', el);
  const piece = (p, from) => `<button type="button" class="piece${marks ? '' : ''}" draggable="${!locked}" data-p="${p}" data-from="${from}"${locked ? ' disabled' : ''}><code>${hl(pub.pieces[p], pub.lang)}</code></button>`;
  function draw() {
    pool.innerHTML = pub.pieces.map((_, i) => slots.includes(i) ? '' : piece(i, 'pool')).join('') || '<span class="muted">All pieces placed</span>';
    sl.innerHTML = slots.map((p, j) => `<div class="slot${marks ? (marks[j] ? ' ok' : ' no') : ''}" data-drop="${j}"><span class="num">${j + 1}</span>${p != null ? piece(p, j) : '<span class="empty"></span>'}</div>`).join('');
    if (sub) sub.disabled = locked || slots.includes(null);
  }
  const put = (p, s) => { const f = slots.indexOf(p); if (f >= 0) { slots[f] = slots[s]; } slots[s] = p; };
  el.addEventListener('click', e => {
    if (locked) return; const pc = e.target.closest('.piece'), a = e.target.closest('[data-act]');
    if (pc) { const p = +pc.dataset.p; if (pc.dataset.from === 'pool') { const s = slots.indexOf(null); if (s >= 0) slots[s] = p; } else slots[+pc.dataset.from] = null; draw(); }
    else if (a && a.dataset.act === 'submit') { const ans = api.getAnswer(); if (ans) o.onSubmit(ans); }
    else if (a && a.dataset.act === 'hint') o.onHint();
    else if (a && a.dataset.act === 'reset') { slots = Array(n).fill(null); marks = null; draw(); }
  });
  el.addEventListener('dragstart', e => { const pc = e.target.closest('.piece'); if (!pc || locked) return; e.dataTransfer.setData('text/plain', pc.dataset.p + ':' + pc.dataset.from); e.dataTransfer.effectAllowed = 'move'; });
  el.addEventListener('dragover', e => { if (e.target.closest('[data-drop]')) e.preventDefault(); });
  el.addEventListener('drop', e => {
    const d = e.target.closest('[data-drop]'); if (!d || locked) return; e.preventDefault();
    const [p, from] = e.dataTransfer.getData('text/plain').split(':'); const pi = +p; if (isNaN(pi)) return;
    if (d.dataset.drop === 'pool') { if (from !== 'pool') slots[+from] = null; } else { const s = +d.dataset.drop; if (from === 'pool') slots[s] = pi; else { const t = slots[s]; slots[s] = pi; slots[+from] = t; } }
    draw();
  });
  const api = {
    lock() { locked = true; draw(); },
    unlock() { locked = false; marks = null; draw(); },
    getAnswer() { return slots.includes(null) ? null : slots.map(i => pub.pieces[i]); },
    current() { return slots.map(i => i == null ? null : pub.pieces[i]); },
    countRight(ans) { return slots.filter((i, j) => i != null && pub.pieces[i] === ans[j]).length; },
    reveal(ans, ok, showKey) {
      locked = true; marks = slots.map((i, j) => i != null && pub.pieces[i] === ans[j]); draw();
      if (!ok && showKey) { const k = $('.arr-key', el); k.hidden = false; k.innerHTML = `<div class="lbl">Correct order</div>${codeBlock(ans, pub.lang)}`; }
    },
    showCorrect(ans) { const k = $('.arr-key', el); k.hidden = false; k.innerHTML = `<div class="lbl">Correct order</div>${codeBlock(ans, pub.lang)}`; }
  };
  draw(); return api;
}

/* =====================================================================
   SOLO RUNNER  (Guess the Output · Bug Hunter · Code Arrangement)
   Nothing is saved. Score only lives until you leave the page.
   ===================================================================== */
function soloRun(el, gk, topic, level) {
  const G = GAMES[gk], n = G.count, qs = genQuestions(gk, topic, level, n), maxTries = gk === 'gto' ? 1 : 2;
  let i = 0, score = 0, tries = 0, hinted = false, finished = false, res = [], ctl = null, tm = null, left = 0;
  const stop = () => { if (tm) { clearInterval(tm); tm = null; } }; onLeave(stop);
  const fmtT = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  function show() {
    tries = 0; hinted = false; finished = false; stop();
    el.innerHTML = `<div class="page"><div class="run"><div class="run-top"><div><h2>${G.name}</h2><div class="chips"><span class="chip">${TOPICS[topic]}</span><span class="chip">Level ${level} · ${LEVELS[level]}</span></div></div>
      <div class="run-meta">${G.soloTime ? '<div class="timer" id="tm" aria-label="Time left"></div>' : ''}<div><div class="meta-l">Question <b>${i + 1}</b> / ${n}</div><div class="bar"><i style="width:${i / n * 100}%"></i></div></div><div class="score"><span>Score</span><b>${score}</b></div></div></div>
      <div id="qm"></div><div id="fb" aria-live="polite"></div></div></div>`;
    ctl = mountQuestion($('#qm', el), qs[i].pub, { onSubmit: submit, onHint: gk === 'gto' ? null : hint });
    if (G.soloTime) { left = G.soloTime[level]; tick(); tm = setInterval(() => { left--; tick(); if (left <= 0 && !finished) { stop(); end(0, false, 'Time is up!'); } }, 1000); }
  }
  function tick() { const t = $('#tm', el); if (t) { t.textContent = fmtT(Math.max(0, left)); t.classList.toggle('low', left <= 10); } }
  function hint() {
    if (finished) return; hinted = true; const q = qs[i]; let t;
    if (gk === 'bug') t = q.hint;
    else { const cur = ctl.current(), j = cur.findIndex((x, k) => x !== q.ans[k]); t = j < 0 ? 'Everything you placed so far is right. Keep going!' : `Slot ${j + 1} should hold: ${q.ans[j]}`; }
    $('#fb', el).innerHTML = `<div class="fb tip"><b>Hint</b><p>${esc(t)}</p><small>Using a hint lowers the points for this question.</small></div>`;
  }
  function submit(a) {
    if (finished) return; const q = qs[i], ok = grade(q, a); tries++;
    if (ok) return end(gk === 'gto' ? 10 : (tries === 1 && !hinted ? 10 : 5), true, '', a);
    if (tries >= maxTries) return end(0, false, '', a);
    let why = 'That is not right yet. Change something and try again.';
    if (gk === 'bug') why = a.err === q.ans.err ? 'The error type is right, but the fix is not.' : a.fix === q.ans.fix ? 'The fix is right, but the error type is not.' : 'Neither answer is right yet.';
    if (gk === 'arr') why = `${ctl.countRight(q.ans)} of ${q.ans.length} pieces are in the right place.`;
    $('#fb', el).innerHTML = `<div class="fb no"><b>Not quite</b><p>${why}</p><small>One more try.</small></div>`;
  }
  function end(pts, ok, note, a) {
    finished = true; stop(); const q = qs[i]; score += pts; res.push({ ok, pts });
    if (gk === 'gto') ctl.reveal(q.ans, a); else if (gk === 'bug') { a ? ctl.reveal(q.ans, a) : (ctl.lock(), ctl.showCorrect(q.ans)); } else { a ? ctl.reveal(q.ans, ok, true) : (ctl.lock(), ctl.showCorrect(q.ans)); }
    const last = i === n - 1;
    $('#fb', el).innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}"><b>${note || (ok ? 'Correct!' : 'Not this time')}${ok ? ` +${pts} points` : ''}</b><p>${esc(q.why)}</p><div class="row-actions"><button class="btn primary" id="next">${last ? 'See results' : 'Next question'}</button></div></div>`;
    $('.run-top .score b', el).textContent = score; $('#next', el).focus(); $('#next', el).onclick = () => { i++; last ? summary() : show(); };
  }
  function summary() {
    const correct = res.filter(r => r.ok).length;
    el.innerHTML = `<div class="page"><div class="summary"><h3>Round finished</h3><div class="chips center"><span class="chip">${G.name}</span><span class="chip">${TOPICS[topic]}</span><span class="chip">Level ${level}</span></div>
      <div class="bigscore">${score}<small> / ${n * 10} points</small></div><p class="muted">${correct} of ${n} correct</p>
      <div class="dots">${res.map((r, k) => `<span class="dot ${r.ok ? 'ok' : 'no'}" title="Question ${k + 1}: ${r.pts} points">${k + 1}</span>`).join('')}</div>
      <div class="row-actions"><a class="btn primary" href="#/play/${gk}/${topic}/${level}" id="again">Play again (new questions)</a><a class="btn" href="#/games/${gk}">Change topic or level</a><a class="btn" href="#/games">All games</a></div></div></div>`;
    $('#again', el).onclick = e => { e.preventDefault(); soloRun(el, gk, topic, level); };
  }
  show();
}
/* =====================================================================
   PARTY MODE (Guess the Output · Bug Hunter · Code Arrangement)
   Teacher hosts, students join with a code + name. No accounts.

   BUILD 1 NOTE: there is no server yet, so messages travel between tabs
   of the SAME browser (BroadcastChannel + localStorage). To go multi-device
   later, replace the body of Net.send / Net.init with a WebSocket or
   Firebase channel. Nothing else in this file needs to change.
   ===================================================================== */
const Net = {
  bc: null, seen: new Set(), on: null, ready: false,
  init() {
    if (this.ready) return; this.ready = true;
    try { this.bc = new BroadcastChannel('mustacode-party'); this.bc.onmessage = e => this.recv(e.data); } catch (e) { }
    addEventListener('storage', e => { if (e.key === 'mc-msg' && e.newValue) { try { this.recv(JSON.parse(e.newValue)); } catch (x) { } } });
  },
  send(m) {
    m.mid = uid(); this.seen.add(m.mid);
    if (this.bc) this.bc.postMessage(m);
    try { localStorage.setItem('mc-msg', JSON.stringify(m)); } catch (e) { }
  },
  recv(m) { if (!m || this.seen.has(m.mid)) return; this.seen.add(m.mid); if (this.on && P && P.code && m.code === P.code) this.on(m); }
};

let P = {};                       // the one party this tab is part of
const BOT_NAMES = ['Aiman', 'Siti', 'Wei', 'Kumar', 'Nur', 'Daniel', 'Mei', 'Hadi', 'Farah', 'Zack', 'Lina', 'Raj'];
const refresh = () => { if (P && P.render) P.render(); };
const fmtClock = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function partyReset() {
  if (P.role === 'host') { clearInterval(P.timer); (P.botTimers || []).forEach(clearTimeout); Net.send({ t: 'close', code: P.code }); }
  if (P.role === 'student' && P.code) Net.send({ t: 'leave', code: P.code, id: P.id });
  P = {}; Net.on = null; setHeader('main');
}
const ranked = players => { const a = Object.values(players).sort((x, y) => y.score - x.score); let r = 0, last = null; a.forEach((p, i) => { if (p.score !== last) { r = i + 1; last = p.score; } p.rank = r; }); return a; };

/* ---------------------------- HOST LOGIC ---------------------------- */
function hostCreate(o) {
  partyReset(); Net.init();
  P = { role: 'host', code: String(int(100000, 999999)), ...o, phase: 'lobby', players: {}, qs: genQuestions(o.game, o.topic, o.level, o.count), qi: -1, remaining: 0, paused: false, answers: {}, botTimers: [], timer: null, lastSec: -1 };
  Net.on = hostRecv;
}
function hostRecv(m) {
  if (m.t === 'join') {
    if (P.phase !== 'lobby') return Net.send({ t: 'reject', code: P.code, to: m.id, why: 'This game has already started.' });
    const nm = String(m.name || '').trim().slice(0, 16);
    if (!nm) return Net.send({ t: 'reject', code: P.code, to: m.id, why: 'Please type a name.' });
    if (Object.values(P.players).some(p => p.name.toLowerCase() === nm.toLowerCase() && p.id !== m.id)) return Net.send({ t: 'reject', code: P.code, to: m.id, why: 'That name is already taken. Try another one.' });
    P.players[m.id] = { id: m.id, name: nm, score: 0 };
    Net.send({ t: 'joined', code: P.code, to: m.id, game: P.game, topic: P.topic, level: P.level, count: P.count });
    Net.send({ t: 'lobby', code: P.code, n: Object.keys(P.players).length }); refresh();
  } else if (m.t === 'leave') { if (P.phase === 'lobby') { delete P.players[m.id]; Net.send({ t: 'lobby', code: P.code, n: Object.keys(P.players).length }); refresh(); } }
  else if (m.t === 'ans') { if (P.phase === 'question' && !P.paused && P.players[m.id] && !P.answers[m.id]) record(m.id, grade(P.qs[P.qi], m.a)); }
}
function addBots() {
  const free = BOT_NAMES.filter(n => !Object.values(P.players).some(p => p.name === n));
  sample(free, Math.min(5, free.length)).forEach(n => { const id = 'bot-' + uid(); P.players[id] = { id, name: n, score: 0, bot: true }; });
  Net.send({ t: 'lobby', code: P.code, n: Object.keys(P.players).length }); refresh();
}
function hostStart() {
  if (!Object.keys(P.players).length) return false;
  Net.send({ t: 'start', code: P.code }); hostNext(); return true;
}
function hostNext() {
  P.qi++; if (P.qi >= P.qs.length) return hostFinal();
  P.phase = 'question'; P.answers = {}; P.remaining = P.time; P.paused = false; P.lastSec = -1;
  Net.send({ t: 'q', code: P.code, index: P.qi, total: P.qs.length, pub: P.qs[P.qi].pub, time: P.time });
  const pc = { 1: .8, 2: .65, 3: .5 }[P.level];
  P.botTimers = Object.values(P.players).filter(p => p.bot).map(b => {
    const go = () => { if (P.phase !== 'question' || P.answers[b.id]) return; if (P.paused) return setTimeout(go, 500); record(b.id, Math.random() < pc); };
    return setTimeout(go, (1.5 + Math.random() * Math.max(1, P.time * 0.7)) * 1000);
  });
  clearInterval(P.timer);
  P.timer = setInterval(() => {
    if (P.phase !== 'question' || P.paused) return; P.remaining = Math.max(0, P.remaining - 0.25);
    const sec = Math.ceil(P.remaining); if (sec !== P.lastSec) { P.lastSec = sec; Net.send({ t: 'tick', code: P.code, remaining: P.remaining, paused: false }); const t = $('#htm'); if (t) { t.textContent = fmtClock(P.remaining); t.classList.toggle('low', P.remaining <= 10); } }
    if (P.remaining <= 0) hostReveal();
  }, 250);
  refresh();
}
function record(id, ok) {
  P.answers[id] = { ok, pts: ok ? Math.round(1000 * (0.5 + 0.5 * P.remaining / P.time)) : 0 };
  const n = Object.keys(P.answers).length, tot = Object.keys(P.players).length, a = $('#ac'), b = $('#ab');
  if (a) a.textContent = n; if (b) b.style.width = (n / tot * 100) + '%';
  if (n >= tot) setTimeout(hostReveal, 700);
}
function hostTogglePause() {
  if (P.phase !== 'question') return; P.paused = !P.paused;
  Net.send({ t: 'tick', code: P.code, remaining: P.remaining, paused: P.paused }); refresh();
}
function hostReveal() {
  if (P.phase !== 'question') return; clearInterval(P.timer); (P.botTimers || []).forEach(clearTimeout); P.phase = 'reveal';
  const q = P.qs[P.qi], results = {}; let c = 0, w = 0;
  Object.values(P.players).forEach(p => { const a = P.answers[p.id]; if (a) { p.score += a.pts; a.ok ? c++ : w++; } });
  P.stats = { c, w, none: Object.keys(P.players).length - c - w };
  const board = ranked(P.players);
  Object.values(P.players).forEach(p => { const a = P.answers[p.id]; results[p.id] = { ok: a ? a.ok : false, answered: !!a, pts: a ? a.pts : 0, total: p.score, rank: p.rank }; });
  P.revealMsg = { t: 'reveal', code: P.code, index: P.qi, results, correctText: answerText(q), why: q.why, last: P.qi === P.qs.length - 1 };
  Net.send(P.revealMsg); refresh();
}
function hostFinal() {
  clearInterval(P.timer); (P.botTimers || []).forEach(clearTimeout); P.phase = 'final';
  const board = ranked(P.players).map(p => ({ id: p.id, name: p.name, score: p.score, rank: p.rank }));
  Net.send({ t: 'final', code: P.code, board }); refresh();
}

/* --------------------------- STUDENT LOGIC --------------------------- */
function studentJoin(code, name, fail) {
  partyReset(); Net.init(); const id = uid();
  P = { role: 'student', code: String(code).trim(), id, name: name.trim().slice(0, 16), phase: 'joining', score: 0, n: 1 };
  let ok = false;
  Net.on = m => {
    if (m.to && m.to !== P.id) return;
    if (m.t === 'joined') { ok = true; Object.assign(P, { game: m.game, topic: m.topic, level: m.level, count: m.count, phase: 'waiting' }); Net.on = studentRecv; location.hash = '#/party/play'; }
    else if (m.t === 'reject') { ok = true; fail(m.why); P = {}; Net.on = null; }
  };
  Net.send({ t: 'join', code: P.code, id, name: P.name });
  setTimeout(() => { if (!ok && P.phase === 'joining') { fail('No party found with that code. Check the code, and make sure the teacher\'s tab is still open (in this prototype both must be in the same browser).'); P = {}; Net.on = null; } }, 2500);
}
function studentRecv(m) {
  if (m.to && m.to !== P.id) return;
  if (m.t === 'lobby') { P.n = m.n; if (P.phase === 'waiting') { const e = $('#pn'); if (e) e.textContent = m.n; } }
  else if (m.t === 'q') { Object.assign(P, { phase: 'question', index: m.index, total: m.total, pub: m.pub, time: m.time, remaining: m.time, paused: false, locked: false }); refresh(); }
  else if (m.t === 'tick') { P.remaining = m.remaining; P.paused = m.paused; const t = $('#ptm'); if (t) { t.textContent = fmtClock(m.remaining); t.classList.toggle('low', m.remaining <= 10); } const pb = $('#pausebar'); if (pb) pb.hidden = !m.paused; }
  else if (m.t === 'reveal') { const r = m.results[P.id] || { ok: false, pts: 0, total: P.score, rank: '-' }; P.score = r.total; P.res = { ...r, correctText: m.correctText, why: m.why, last: m.last }; P.phase = 'result'; setHeader('min', `${P.name} · ${P.score} pts`); refresh(); }
  else if (m.t === 'final') { P.phase = 'final'; P.board = m.board; refresh(); }
  else if (m.t === 'close') { if (P.phase !== 'final') { P.phase = 'closed'; refresh(); } }
}

/* ------------------------------ VIEWS ------------------------------ */
function podiumHTML(board, meId) {
  const slot = (p, cls, rk) => p ? `<div class="pod ${cls}${p.id === meId ? ' me' : ''}"><div class="pn">${esc(p.name)}</div><div class="pp">${p.score} pts</div><div class="pb"><b>${rk}</b></div></div>` : `<div class="pod ${cls} empty"></div>`;
  const rest = board.slice(3);
  return `<div class="podium">${slot(board[1], 'p2', board[1] ? board[1].rank : 2)}${slot(board[0], 'p1', board[0] ? board[0].rank : 1)}${slot(board[2], 'p3', board[2] ? board[2].rank : 3)}</div>
    <ol class="lb rest" start="4">${rest.map(p => `<li class="${p.id === meId ? 'me' : ''}"><span class="rk">${p.rank}</span><span class="nm">${esc(p.name)}</span><span class="sc">${p.score} pts</span></li>`).join('')}</ol>`;
}
const lbRows = (players, n = 5) => { const all0 = Object.values(players).every(p => !p.score); return ranked(players).slice(0, n).map(p => `<li><span class="rk">${all0 ? '·' : p.rank}</span><span class="nm">${esc(p.name)}</span><span class="sc">${p.score} pts</span></li>`).join('') || '<li class="muted">No players yet</li>'; };

/* ---- host: setup ---- */
function renderPartySetup(host) {
  partyReset(); P = {}; host.innerHTML = ''; const el = document.createElement('div'); host.appendChild(el); const cfg = { game: 'gto', topic: 'js', level: 1, count: 10, time: 30 };
  const timeOpts = [20, 30, 45, 60, 90, 120];
  const paint = () => {
    el.innerHTML = `<div class="page narrow-page"><a class="back" href="#/party">‹ Party Mode</a><h1>Create a party</h1>
    <div class="step-block"><h4><span class="step">1</span>Choose a game</h4><div class="game-pick">${['gto', 'bug', 'arr'].map(k => `<button class="pick ${cfg.game === k ? 'on' : ''}" data-game="${k}"><b>${GAMES[k].name}</b><span>${GAMES[k].blurb}</span></button>`).join('')}</div>
    <p class="muted small">Live Page Lab is solo only, because there is no single right answer to score in a class race.</p></div>
    <div class="step-block"><h4><span class="step">2</span>Choose a topic</h4><div class="seg lg">${Object.entries(TOPICS).map(([k, v]) => `<button data-topic="${k}" class="${cfg.topic === k ? 'on' : ''}">${v}</button>`).join('')}</div></div>
    <div class="step-block"><h4><span class="step">3</span>Difficulty</h4><div class="seg lg">${[1, 2, 3].map(l => `<button data-level="${l}" class="${cfg.level === l ? 'on' : ''}">Level ${l} · ${LEVELS[l]}</button>`).join('')}</div>
    <p class="muted small">Every question is generated fresh, so no two parties are the same.</p></div>
    <div class="step-block two"><div><h4><span class="step">4</span>Questions</h4><div class="seg">${[5, 8, 10, 15].map(c => `<button data-count="${c}" class="${cfg.count === c ? 'on' : ''}">${c}</button>`).join('')}</div></div>
    <div><h4><span class="step">5</span>Time per question</h4><div class="seg">${timeOpts.map(c => `<button data-time="${c}" class="${cfg.time === c ? 'on' : ''}">${c}s</button>`).join('')}</div></div></div>
    <div class="row-actions between"><a class="btn" href="#/party">Back</a><button class="btn primary lg" id="create">Create party</button></div></div>`;
  };
  paint();
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.game) { cfg.game = d.game; cfg.time = GAMES[d.game].time[cfg.level]; }
    else if (d.topic) cfg.topic = d.topic; else if (d.level) { cfg.level = +d.level; cfg.time = GAMES[cfg.game].time[cfg.level]; }
    else if (d.count) cfg.count = +d.count; else if (d.time) cfg.time = +d.time;
    else if (b.id === 'create') { hostCreate(cfg); return renderHost(host); }
    paint();
  };
}

/* ---- host: lobby / live / final ---- */
function renderHost(el) {
  el = el || $('#app'); P.render = () => renderHost(el); setHeader('main');
  const G = GAMES[P.game], ids = Object.keys(P.players || {});
  if (P.phase === 'lobby') {
    const url = location.href.split('#')[0] + '#/party/join';
    el.innerHTML = `<div class="page"><div class="lobby"><section class="panel codecard"><div class="muted">Students go to</div><div class="joinurl">${esc(url)}</div><div class="muted">and enter the party code</div><div class="bigcode" aria-label="Party code">${P.code}</div>
      <div class="gameinfo"><b>${G.name}</b><span>${TOPICS[P.topic]} · Level ${P.level} · ${P.count} questions · ${P.time}s each</span></div>
      <p class="note">Build 1 runs without a server, so students must open the site in another <b>tab of this same browser</b>. Use the demo students to try it alone.</p></section>
      <section class="panel"><div class="panel-h"><h3>Players joined <span class="count">${ids.length}</span></h3><button class="btn sm" id="bots">+ Add 5 demo students</button></div>
      <div class="chips-grid">${ids.map(id => `<span class="pchip${P.players[id].bot ? ' bot' : ''}">${esc(P.players[id].name)}${P.players[id].bot ? '<small>demo</small>' : ''}</span>`).join('') || '<p class="muted">Waiting for students to join…</p>'}</div></section></div>
      <div class="row-actions between"><button class="btn" id="cancel">Cancel</button><button class="btn primary lg" id="start" ${ids.length ? '' : 'disabled'}>Start game</button></div></div>`;
    $('#bots').onclick = addBots; $('#cancel').onclick = () => { partyReset(); location.hash = '#/party'; };
    $('#start').onclick = () => hostStart();
  } else if (P.phase === 'final') {
    const board = ranked(P.players).map(p => ({ id: p.id, name: p.name, score: p.score, rank: p.rank }));
    el.innerHTML = `<div class="page final"><h1>Final leaderboard</h1><p class="muted center">${G.name} · ${TOPICS[P.topic]} · Level ${P.level}</p>${podiumHTML(board)}<div class="row-actions center"><a class="btn primary" href="#/party/host" id="again">Play again</a><a class="btn" href="#/">Back to home</a></div></div>`;
    $('#again').onclick = e => { e.preventDefault(); partyReset(); renderPartySetup(el); };
  } else {
    const q = P.qs[P.qi], reveal = P.phase === 'reveal', n = ids.length, got = Object.keys(P.answers).length, last = P.qi === P.qs.length - 1, S = P.stats || {};
    el.innerHTML = `<div class="page live"><div class="live-top panel"><div><b>${G.name}</b> <span class="chip">${TOPICS[P.topic]}</span> <span class="chip">Level ${P.level}</span></div><div class="live-q">Question <b>${P.qi + 1}</b> / ${P.qs.length}</div><div class="timer big ${P.remaining <= 10 ? 'low' : ''}" id="htm">${reveal ? 'Done' : fmtClock(P.remaining)}</div></div>
      <div class="live-grid"><section class="panel"><h4>What students see now</h4><div class="live-q-wrap" id="hq"></div>
      <div class="answered"><div><b id="ac">${got}</b> of ${n} answered</div><div class="bar"><i id="ab" style="width:${n ? got / n * 100 : 0}%"></i></div></div>
      ${reveal ? `<div class="reveal"><div class="rv-bars">${[['Correct', S.c, 'ok'], ['Wrong', S.w, 'no'], ['No answer', S.none, 'none']].map(([l, v, c]) => `<div class="rvb ${c}"><span>${l}</span><div class="bar"><i style="width:${n ? v / n * 100 : 0}%"></i></div><b>${v}</b></div>`).join('')}</div><div class="fb ok"><b>Correct answer</b><pre>${esc(answerText(q))}</pre><p>${esc(q.why)}</p></div></div>` : ''}</section>
      <section class="panel"><h4>Live leaderboard</h4><ol class="lb">${lbRows(P.players)}</ol></section></div>
      <div class="live-ctrl">${reveal ? '' : `<button class="btn" id="pause">${P.paused ? 'Resume' : 'Pause'}</button><button class="btn" id="skip">Skip (show answer)</button>`}<span class="grow"></span>
      <button class="btn primary" id="nextq" ${reveal ? '' : 'disabled'}>${last ? 'Final results' : 'Next question'}</button><button class="btn danger" id="end">End game</button></div></div>`;
    const ctl = mountQuestion($('#hq'), q.pub, { readOnly: true }); if (reveal) ctl.showCorrect(q.ans);
    const g = id => $('#' + id);
    if (g('pause')) g('pause').onclick = hostTogglePause; if (g('skip')) g('skip').onclick = hostReveal;
    g('nextq').onclick = hostNext; g('end').onclick = () => { if (confirm('End the game now and show the final leaderboard?')) hostFinal(); };
  }
}

/* ---- student: join form ---- */
function renderJoin(el, prefill) {
  partyReset();
  el.innerHTML = `<div class="page join"><div class="joincard"><h1>Join a party</h1><p class="muted">No account needed. Just a code and a name.</p>
    <label>Party code<input id="jcode" inputmode="numeric" maxlength="6" placeholder="6-digit code" value="${esc(prefill || '')}" autocomplete="off"></label>
    <label>Your name<input id="jname" maxlength="16" placeholder="Shown on the leaderboard" autocomplete="off"></label>
    <div class="err" id="jerr" role="alert" hidden></div><button class="btn primary lg block" id="jgo">Join</button><a class="textlink" href="#/party">Back</a></div></div>`;
  const go = () => {
    const code = $('#jcode').value.trim(), name = $('#jname').value.trim(), er = $('#jerr'); er.hidden = true;
    if (!/^\d{6}$/.test(code)) { er.textContent = 'Enter the 6-digit code from your teacher.'; er.hidden = false; return; }
    if (!name) { er.textContent = 'Please type your name.'; er.hidden = false; return; }
    const b = $('#jgo'); b.disabled = true; b.textContent = 'Joining…';
    studentJoin(code, name, why => { er.textContent = why; er.hidden = false; b.disabled = false; b.textContent = 'Join'; });
  };
  $('#jgo').onclick = go; $('#jname').onkeydown = $('#jcode').onkeydown = e => { if (e.key === 'Enter') go(); };
  (prefill ? $('#jname') : $('#jcode')).focus();
}

/* ---- student: everything after joining ---- */
function renderStudent(el) {
  el = el || $('#app'); if (P.role !== 'student') { location.hash = '#/party/join'; return; }
  P.render = () => renderStudent(el); const G = GAMES[P.game];
  setHeader('min', `${P.name} · ${P.score} pts`);
  if (P.phase === 'waiting') {
    el.innerHTML = `<div class="page center-page"><h1>You are in, ${esc(P.name)}!</h1><p class="lead">Waiting for the teacher to start…</p><div class="codepill">Party ${P.code}</div><p class="muted"><b id="pn">${P.n}</b> player${P.n === 1 ? '' : 's'} joined</p>
      <div class="chips center"><span class="chip">${G.name}</span><span class="chip">${TOPICS[P.topic]}</span><span class="chip">Level ${P.level}</span></div></div>`;
  } else if (P.phase === 'question') {
    el.innerHTML = `<div class="page"><div class="run"><div class="run-top"><div><h2>${G.name}</h2><div class="chips"><span class="chip">${TOPICS[P.topic]}</span><span class="chip">Level ${P.level}</span></div></div>
      <div class="run-meta"><div class="timer" id="ptm">${fmtClock(P.remaining)}</div><div><div class="meta-l">Question <b>${P.index + 1}</b> / ${P.total}</div><div class="bar"><i style="width:${P.index / P.total * 100}%"></i></div></div></div></div>
      <div id="pausebar" class="fb tip" ${P.paused ? '' : 'hidden'}><b>Paused by the teacher</b></div><div id="qm"></div><div id="fb"></div></div></div>`;
    const ctl = mountQuestion($('#qm'), P.pub, { submitLabel: 'Lock in answer', onSubmit: a => { if (P.paused || P.locked) return; P.locked = true; Net.send({ t: 'ans', code: P.code, id: P.id, a }); ctl.lock(); $('#fb').innerHTML = '<div class="fb tip"><b>Answer locked in</b><p>Waiting for the rest of the class…</p></div>'; } });
  } else if (P.phase === 'result') {
    const r = P.res;
    el.innerHTML = `<div class="page center-page"><div class="resultcard ${r.ok ? 'ok' : 'no'}"><div class="rtitle">${r.ok ? 'Correct!' : r.answered ? 'Incorrect' : 'Time ran out'}</div><div class="rpts">${r.ok ? '+' + r.pts + ' points' : '0 points'}</div>
      <hr><div class="rrank">Your rank <b>#${r.rank}</b></div><div class="rtot">Total score ${r.total}</div>
      ${r.ok ? '' : `<div class="rans"><small>Right answer</small><pre>${esc(r.correctText)}</pre></div>`}<p class="why">${esc(r.why)}</p></div><p class="muted">${r.last ? 'That was the last question…' : 'Waiting for the next question…'}</p></div>`;
  } else if (P.phase === 'final') {
    el.innerHTML = `<div class="page final"><h1>Final leaderboard</h1><p class="muted center">${G.name} · ${TOPICS[P.topic]} · Level ${P.level}</p>${podiumHTML(P.board, P.id)}<div class="row-actions center"><a class="btn primary" href="#/">Back to home</a></div></div>`;
  } else if (P.phase === 'closed') {
    el.innerHTML = `<div class="page center-page"><h1>The teacher ended the party</h1><div class="row-actions center"><a class="btn primary" href="#/">Back to home</a></div></div>`;
  }
}
/* small safe wrapper: storage can be blocked (private mode, file://) */
const keep = { set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { keep.m = keep.m || {}; keep.m[k] = v; } }, take(k) { let v = null; try { v = sessionStorage.getItem(k); sessionStorage.removeItem(k); } catch (e) { v = (keep.m || {})[k] || null; if (keep.m) delete keep.m[k]; } return v; } };

/* =====================================================================
   HEADER + ROUTER + PAGES
   ===================================================================== */
let NAV = 'Home';
function setHeader(variant, right) {
  const h = $('#top'); if (!h) return;
  const mark = `<span class="logo" aria-hidden="true">&lt;/&gt;</span><span class="word">MUSTA<b>CODE</b></span>`;
  if (variant === 'min') { h.innerHTML = `<div class="bar-in"><span class="brand">${mark}</span><span class="who">${esc(right || '')}</span></div>`; return; }
  h.innerHTML = `<div class="bar-in"><a class="brand" href="#/" aria-label="MUSTACODE home">${mark}</a>
    <nav aria-label="Main">${[['Home', '#/'], ['Lessons', '#/lessons'], ['Games', '#/games'], ['Party Mode', '#/party']].map(([n, u]) => `<a href="${u}" class="${n === NAV ? 'on' : ''}"${n === NAV ? ' aria-current="page"' : ''}>${n}</a>`).join('')}</nav></div>`;
}

const LVL_NOTE = { 1: 'Warm-up. One idea at a time.', 2: 'Mixing a few ideas together.', 3: 'Trickier. Read carefully.' };

function pageHome(el) {
  el.innerHTML = `<div class="page home"><section class="hero"><div class="hero-text"><p class="eyebrow">Basic web development · HTML · CSS · JavaScript</p>
    <h1>Learn the web by <mark>playing</mark> with it.</h1><p class="lead">Short lessons, four minigames, and a race mode for the classroom. No account, nothing to install, nothing saved.</p></div>
    <nav class="hero-links" aria-label="Start here">
      <a class="big-link" href="#/lessons"><span class="n">01</span><span class="t"><b>Lessons</b><small>HTML, CSS and JavaScript basics you can edit and run</small></span><span class="arr">→</span></a>
      <a class="big-link" href="#/games"><span class="n">02</span><span class="t"><b>Games</b><small>Four minigames to practise, with fresh random questions</small></span><span class="arr">→</span></a>
      <a class="big-link" href="#/party"><span class="n">03</span><span class="t"><b>Party Mode</b><small>Play together as a class and race up the leaderboard</small></span><span class="arr">→</span></a></nav></section>
    <section class="joinstrip"><div><b>Have a party code from your teacher?</b><span>Join with just your name.</span></div><form id="jf" autocomplete="off"><input id="hc" inputmode="numeric" maxlength="6" placeholder="6-digit code" aria-label="Party code"><button class="btn primary">Join</button></form></section></div>`;
  $('#jf').onsubmit = e => { e.preventDefault(); keep.set('mc-code', $('#hc').value.trim()); location.hash = '#/party/join'; };
}

function pageLessons(el) {
  el.innerHTML = `<div class="page"><h1>Lessons</h1><p class="lead">Pick a subject. Every lesson has code you can change and run right on the page.</p>
    <div class="cards3">${Object.entries(LESSONS).map(([k, L], i) => `<article class="card lesson-card"><div class="n">${String(i + 1).padStart(2, '0')}</div><h2>${L.name}</h2><p>${L.tagline}</p>
    <ol>${L.topics.map(t => `<li>${t.t}</li>`).join('')}</ol><a class="btn primary" href="#/lessons/${k}/1">Start ${L.name}</a></article>`).join('')}</div>
    <div class="callout"><span>Ready to practise what you learned?</span><a class="btn" href="#/games">Go to Games</a></div></div>`;
}

function pageLesson(el, subj, idx) {
  const L = LESSONS[subj]; if (!L) return page404(el); idx = Math.min(Math.max(1, +idx || 1), L.topics.length); const T = L.topics[idx - 1];
  el.innerHTML = `<div class="page lesson-page"><div class="subject-tabs" role="tablist">${Object.entries(LESSONS).map(([k, x]) => `<a role="tab" class="${k === subj ? 'on' : ''}" href="#/lessons/${k}/1">${x.name}</a>`).join('')}<span class="grow"></span><span class="muted">Topic ${idx} of ${L.topics.length}</span></div>
    <div class="lesson-grid"><aside class="side"><h4>${L.name} lessons</h4><ol class="topics">${L.topics.map((t, i) => `<li><a class="${i + 1 === idx ? 'on' : ''}" href="#/lessons/${subj}/${i + 1}"><span>${i + 1}</span>${t.t}</a></li>`).join('')}</ol><a class="textlink" href="#/lessons">‹ All lessons</a></aside>
    <article class="lesson"><h1>${idx}. ${T.t}</h1>${T.p.map(p => `<p>${esc(p).replace(/&lt;(\/?[a-z0-9]+)&gt;/gi, '<code>&lt;$1&gt;</code>')}</p>`).join('')}
      <div class="try"><div class="try-h"><b>Try it</b><span class="tip">${esc(T.tip)}</span><span class="grow"></span><button class="btn sm" id="rst">Reset code</button><button class="btn sm primary" id="run">Run ▶</button></div>
      <div class="try-grid"><textarea id="code" spellcheck="false" aria-label="Editable code">${esc(T.code)}</textarea><div class="result"><div class="rtab">Result</div><iframe id="frame" sandbox="allow-scripts" title="Result"></iframe>${subj === 'js' ? '<div class="rtab">Console</div><pre id="con" class="con"></pre>' : ''}</div></div></div>
      <div class="lesson-nav">${idx > 1 ? `<a class="btn" href="#/lessons/${subj}/${idx - 1}">‹ Previous</a>` : '<span></span>'}<a class="btn" href="#/games">Practise in Games</a>${idx < L.topics.length ? `<a class="btn primary" href="#/lessons/${subj}/${idx + 1}">Next ›</a>` : `<a class="btn primary" href="#/lessons/${subj === 'html' ? 'css' : subj === 'css' ? 'js' : 'html'}/1">Next subject ›</a>`}</div></article></div></div>`;
  const ta = $('#code'), fr = $('#frame'), con = $('#con');
  const run = () => { if (con) con.textContent = ''; fr.srcdoc = lessonFrameDoc(subj, ta.value); };
  const onMsg = e => { if (e.source === fr.contentWindow && e.data && e.data.lab === 'log' && con) con.textContent += (con.textContent ? '\n' : '') + e.data.v; };
  addEventListener('message', onMsg); onLeave(() => removeEventListener('message', onMsg));
  $('#run').onclick = run; $('#rst').onclick = () => { ta.value = T.code; run(); };
  ta.onkeydown = e => { if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run(); };
  run();
}

function pageGames(el) {
  el.innerHTML = `<div class="page"><h1>Games</h1><p class="lead">Four ways to practise. Questions are generated fresh every time, so you will never get the same round twice.</p>
    <div class="cards2">${Object.values(GAMES).map((g, i) => `<article class="card game-card"><div class="gnum">${String(i + 1).padStart(2, '0')}</div><div class="gbody"><h2>${g.name}</h2><p>${g.blurb}</p>
    <div class="chips"><span class="chip">Solo</span>${g.party ? '<span class="chip accent">Party mode</span>' : ''}</div></div><a class="btn primary" href="#/games/${g.key}">Play</a></article>`).join('')}</div></div>`;
}

function pageIntro(el, key) {
  const g = GAMES[key]; if (!g) return page404(el); const cfg = { topic: 'html', level: 1 };
  const right = key === 'lab'
    ? `<div class="setup-card"><h3>Choose a mode</h3><a class="modebtn" href="#/play/lab/play"><b>Sandbox</b><span>Free play. Change anything and watch the page react.</span></a><a class="modebtn" href="#/play/lab/quiz"><b>Quiz</b><span>5 random goal pages. Match each one for stars.</span></a>
       <p class="muted small">Live Page Lab is solo only. There is nothing to score in a class race.</p></div>`
    : `<div class="setup-card"><h3>Set up your round</h3><div class="lbl">Topic</div><div class="seg lg" id="sTopic">${Object.entries(TOPICS).map(([k, v]) => `<button data-v="${k}" class="${k === cfg.topic ? 'on' : ''}">${v}</button>`).join('')}</div>
       <div class="lbl">Difficulty</div><div class="seg lg" id="sLevel">${[1, 2, 3].map(l => `<button data-v="${l}" class="${l === cfg.level ? 'on' : ''}">Level ${l}</button>`).join('')}</div><p class="muted small" id="lvn">${LEVELS[1]}: ${LVL_NOTE[1]} ${g.count} questions, all random.</p>
       <a class="btn primary lg block" id="go" href="#/play/${key}/html/1">Play solo</a>${g.party ? '<p class="muted small">Playing with your class? Use <a href="#/party">Party Mode</a>.</p>' : ''}</div>`;
  el.innerHTML = `<div class="page"><a class="back" href="#/games">‹ All games</a><div class="intro-grid"><div><h1>${g.name}</h1><p class="lead">${g.blurb}</p><h4>How to play</h4><ol class="how">${g.how.map(x => `<li>${x}</li>`).join('')}</ol></div>${right}</div></div>`;
  if (key !== 'lab') {
    const upd = () => { $('#go').href = `#/play/${key}/${cfg.topic}/${cfg.level}`; $('#lvn').textContent = `${LEVELS[cfg.level]}: ${LVL_NOTE[cfg.level]} ${g.count} questions, all random.`; };
    $('#sTopic').onclick = e => { const b = e.target.closest('button'); if (!b) return; cfg.topic = b.dataset.v; $$('#sTopic button').forEach(x => x.classList.toggle('on', x === b)); upd(); };
    $('#sLevel').onclick = e => { const b = e.target.closest('button'); if (!b) return; cfg.level = +b.dataset.v; $$('#sLevel button').forEach(x => x.classList.toggle('on', x === b)); upd(); };
  }
}

function pageParty(el) {
  el.innerHTML = `<div class="page"><h1>Party Mode</h1><p class="lead">Play one game together as a class. Everyone answers on their own device, and points go to a live leaderboard.</p>
    <div class="cards2"><article class="card role-card"><h2>I am a teacher</h2><p>Create a party, choose a game and topic, and run it from the front.</p><a class="btn primary lg" href="#/party/host">Create party</a></article>
    <article class="card role-card"><h2>I am a student</h2><p>Join with the 6-digit code on the teacher's screen and type your name.</p><a class="btn lg" href="#/party/join">Join party</a></article></div>
    <p class="muted center">No login needed. Party mode works with Guess the Output, Bug Hunter and Code Arrangement.</p></div>`;
}
const page404 = el => { el.innerHTML = `<div class="page center-page"><h1>Page not found</h1><a class="btn primary" href="#/">Back to home</a></div>`; };

function route() {
  runLeave();
  const parts = location.hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean), [a, b, c, d] = parts, app = $('#app');
  if (P.role === 'host' && !(a === 'party' && b === 'host')) partyReset();
  if (P.role === 'student' && !(a === 'party' && b === 'play')) partyReset();
  scrollTo(0, 0);
  NAV = a === 'lessons' ? 'Lessons' : (a === 'games' || a === 'play') ? 'Games' : a === 'party' ? 'Party Mode' : 'Home';
  setHeader('main'); app.className = ''; document.title = 'MUSTACODE';
  if (!a) return pageHome(app);
  if (a === 'lessons') return b ? pageLesson(app, b, c) : pageLessons(app);
  if (a === 'games') return b ? pageIntro(app, b) : pageGames(app);
  if (a === 'play') {
    if (b === 'lab') { app.className = 'wide'; return renderLab(app, c === 'quiz' ? 'quiz' : 'play', +d || 0); }
    if (GAMES[b] && TOPICS[c] && [1, 2, 3].includes(+d)) return soloRun(app, b, c, +d);
    return page404(app);
  }
  if (a === 'party') {
    if (!b) return pageParty(app);
    if (b === 'host') { app.className = 'wide'; return P.role === 'host' ? renderHost(app) : renderPartySetup(app); }
    if (b === 'join') { return renderJoin(app, keep.take('mc-code')); }
    if (b === 'play') return renderStudent(app);
  }
  page404(app);
}
addEventListener('hashchange', route);
addEventListener('DOMContentLoaded', route);
