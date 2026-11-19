/* =========================================================
   spark // interactive hero terminal
   =========================================================
   Reads email/profiles/skills/projects live from the DOM
   so the terminal stays in sync with the page. All output
   uses textContent — no innerHTML with user input anywhere.
   ========================================================= */
(function () {
  'use strict';

  const root   = document.getElementById('heroTerminal');
  const screen = document.getElementById('termScreen');
  const input  = document.getElementById('termInput');
  const echoEl = document.getElementById('termEcho');
  const chips  = document.querySelectorAll('.term-chip');

  if (!root || !screen || !input || !echoEl) return;

  /* email read from the existing mailto: link — single source of truth */
  const mailLink = document.querySelector('.contact__mail');
  const EMAIL = (mailLink?.getAttribute('href') || '').replace('mailto:', '') || 'sokathakshay@gmail.com';

  const history = [];
  let historyIdx = -1;
  let intervals = [];

  /* ---------- rendering ---------- */

  function line(cls = 'term-out') {
    const el = document.createElement('div');
    el.className = 'term-line ' + cls;
    screen.appendChild(el);
    return el;
  }

  function plain(text, cls = 'term-out') {
    const el = line(cls);
    el.textContent = text;
    scroll();
    return el;
  }

  function styled(parts, cls = 'term-out') {
    const el = line(cls);
    parts.forEach(p => {
      const s = document.createElement('span');
      if (p.cls) s.className = p.cls;
      s.textContent = p.text;
      el.appendChild(s);
    });
    scroll();
    return el;
  }

  function echo(cmd) {
    styled([
      { text: 'Akshay',  cls: 'term-user'   },
      { text: '@',      cls: 'term-user'   },
      { text: 'sec',    cls: 'term-user'   },
      { text: ':',      cls: 'term-sep'    },
      { text: '~',      cls: 'term-path'   },
      { text: '$ ',     cls: 'term-dollar' },
      { text: cmd,      cls: 'term-cmd-text' }
    ], 'term-cmdline');
  }

  function scroll() { screen.scrollTop = screen.scrollHeight; }

  function clearScreen() {
    intervals.forEach(clearInterval);
    intervals = [];
    screen.textContent = '';
  }

  /* ---------- initial scrollback ---------- */

  function renderInitial() {
    echo('cat profile.json');
    plain('{', 'term-json');
    styled([{text:'  "alias"', cls:'term-key'}, {text:':   ', cls:'term-out'}, {text:'"spark"', cls:'term-str'}, {text:',', cls:'term-out'}], 'term-json');
    styled([{text:'  "role"',  cls:'term-key'}, {text:':    ', cls:'term-out'}, {text:'"cybersecurity student"', cls:'term-str'}, {text:',', cls:'term-out'}], 'term-json');
    styled([
      {text:'  "focus"', cls:'term-key'}, {text:':   ', cls:'term-out'}, {text:'[', cls:'term-out'},
      {text:'"blue team"', cls:'term-str'}, {text:', ', cls:'term-out'},
      {text:'"threat detection"', cls:'term-str'}, {text:', ', cls:'term-out'},
      {text:'"pentesting"', cls:'term-str'}, {text:'],', cls:'term-out'}
    ], 'term-json');
    styled([
      {text:'  "certs"', cls:'term-key'}, {text:':   ', cls:'term-out'}, {text:'[', cls:'term-out'},
      {text:'"CEH (in progress)"', cls:'term-str'}, {text:', ', cls:'term-out'},
      {text:'"Cisco Intro to Cybersecurity"', cls:'term-str'}, {text:'],', cls:'term-out'}
    ], 'term-json');
    styled([{text:'  "status"', cls:'term-key'}, {text:':  ', cls:'term-out'}, {text:'"learning daily"', cls:'term-str'}], 'term-json');
    plain('}', 'term-json');
    plain("# type 'help' to begin", 'term-comment');
  }

  /* ---------- commands ---------- */

  const COMMANDS = {
    help() {
      plain('available commands:', 'term-out');
      const rows = [
        ['help',     'list available commands'],
        ['whoami',   'one-line bio'],
        ['alias',    'handle'],
        ['role',     'current role'],
        ['focus',    'areas of focus'],
        ['skills',   'skill categories'],
        ['certs',    'certifications & courses'],
        ['status',   'current status'],
        ['projects', 'projects (also see ## projects)'],
        ['profiles', 'TryHackMe / HTB / GitHub / LinkedIn'],
        ['contact',  'email address'],
        ['ls',       'site sections'],
        ['history',  'command history'],
        ['date',     'current date & time'],
        ['echo',     'echo <text> — print text'],
        ['clear',    'clear the screen (or Ctrl+L)']
      ];
      rows.forEach(([c, d]) => styled([
        { text: '  ' + c.padEnd(10), cls: 'term-cmd-name' },
        { text: d,                   cls: 'term-cmd-desc' }
      ]));
      plain('', 'term-out');
      plain("hint: some commands aren't listed. keep poking around.", 'term-comment');
    },

    whoami() { plain('Akshay — cybersecurity student, blue-team mindset, red-team curiosity.', 'term-out'); },
    alias()  { plain('spark', 'term-out'); },
    role()   { plain('cybersecurity student', 'term-out'); },
    focus()  { plain('blue team · threat detection · pentesting', 'term-out'); },
    status() { plain('learning daily', 'term-out'); },

    skills() {
      const cards = document.querySelectorAll('.skill');
      if (!cards.length) return plain('no skill cards found on the page.', 'term-comment');
      cards.forEach(card => {
        const head = (card.querySelector('.skill__head')?.textContent || '')
                       .replace(/[\[\]]/g, '').trim();
        const tags = [...card.querySelectorAll('.tags li')]
                       .map(li => li.textContent).join(', ');
        styled([
          { text: '  ' + head.padEnd(15), cls: 'term-key' },
          { text: tags, cls: 'term-out' }
        ]);
      });
    },

    /* certs is the one command that stays hardcoded — update it when you
       finish CEH or add a certification. */
    certs() {
      plain('certifications:', 'term-out');
      styled([{text:'  [~] ', cls:'term-warn'}, {text:'CEH', cls:'term-out'}, {text:' — in progress (EC-Council)', cls:'term-dim'}]);
      styled([{text:'  [✓] ', cls:'term-ok'},   {text:'Cisco Introduction to Cybersecurity', cls:'term-out'}, {text:' — completed', cls:'term-dim'}]);
      styled([{text:'  [~] ', cls:'term-warn'}, {text:'further certifications', cls:'term-out'}, {text:' — in progress', cls:'term-dim'}]);
    },

    projects() {
      const cards = document.querySelectorAll('.project');
      if (!cards.length) return plain('no projects listed.', 'term-comment');
      plain('projects:', 'term-out');
      cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent || '';
        plain('  - ' + title, 'term-out');
      });
      plain("scroll to '## projects' for the full cards.", 'term-comment');
    },

    profiles() {
      const cards = document.querySelectorAll('.profile-card');
      if (!cards.length) return plain('no profile cards found on the page.', 'term-comment');
      plain('profiles:', 'term-out');
      cards.forEach(card => {
        const name = card.querySelector('.profile-card__name')?.textContent || '';
        const href = card.getAttribute('href') || '';
        styled([
          { text: '  ' + name.padEnd(12), cls: 'term-key' },
          { text: href, cls: 'term-out' }
        ]);
      });
    },

    contact() {
      plain('email: ' + EMAIL, 'term-out');
      plain("(or scroll to '## contact' — there's a copy button)", 'term-comment');
    },

    ls(args) {
      ['about/', 'skills/', 'projects/', 'certs/', 'profiles/', 'contact/']
        .forEach(d => styled([{ text: d, cls: 'term-path' }]));
      if (args.join(' ').includes('a')) {
        plain('.ssh/   .gnupg/   .vimrc   .bashrc', 'term-dim');
      }
    },

    history() {
      if (!history.length) return plain('no commands yet.', 'term-comment');
      history.forEach((cmd, i) => styled([
        { text: String(i + 1).padStart(3) + '  ', cls: 'term-dim' },
        { text: cmd, cls: 'term-out' }
      ]));
    },

    date() { plain(new Date().toString(), 'term-out'); },
    echo(args) { plain(args.join(' '), 'term-out'); },
    clear() { clearScreen(); },

    /* ---------- easter eggs ---------- */

    sudo(args) {
      const rest = args.join(' ');
      if (rest === 'rm -rf /' || rest === 'rm -rf /*') {
        plain('permission denied — and honestly, rude.', 'term-err');
      } else if (!rest) {
        plain("usage: sudo <command>\nwe both know you don't have root here.", 'term-err');
      } else {
        plain('nice try.', 'term-err');
      }
    },

    rm(args) {
      if (args.join(' ').includes('-rf')) {
        plain('permission denied — and honestly, rude.', 'term-err');
      } else {
        plain('rm: missing operand', 'term-err');
      }
    },

    exit() { plain("there's no escape.", 'term-comment'); },

    cat(args) {
      const target = args.join(' ');
      if (target === 'flag.txt') {
        plain('flag{th4nks_f0r_p0k1ng_4r0und}', 'term-flag');
      } else if (target === '/etc/shadow') {
        plain('cat: /etc/shadow: Permission denied', 'term-err');
      } else if (target === 'profile.json') {
        renderInitial();
      } else {
        plain('cat: ' + (target || '') + ': No such file or directory', 'term-err');
      }
    },

    hack() {
      plain('initializing exploit framework...', 'term-warn');
      const steps = [
        ['> fingerprinting target...',           'term-out'],
        ['> bypassing firewall...',              'term-out'],
        ['> injecting payload...',               'term-out'],
        ['> establishing reverse shell...',      'term-out'],
        ['> escalating privileges...',           'term-out'],
        ['> ...just kidding. 🤡',                'term-ok'],
        ['',                                     'term-out'],
        ["if you're curious about the real thing, check the projects section.", 'term-comment']
      ];
      let i = 0;
      const iv = setInterval(() => {
        if (i >= steps.length) return clearInterval(iv);
        const [text, cls] = steps[i++];
        plain(text, cls);
      }, 220);
      intervals.push(iv);
    },

    matrix() {
      const on = root.classList.toggle('is-matrix');
      if (on) {
        plain('> follow the white rabbit...', 'term-ok');
        plain("(type 'matrix' again to disconnect)", 'term-comment');
      } else {
        plain('> disconnected from the matrix.', 'term-comment');
      }
    },

    ping(args) {
      const host = args[0] || 'localhost';
      plain('PING ' + host + ' (' + host + '): 56 data bytes', 'term-out');
      plain('ping: sendto: Network is unreachable — this is a portfolio, not a router.', 'term-err');
    },

    neofetch() {
      plain('       Akshay@sec', 'term-accent');
      plain('       ----------', 'term-accent');
      styled([{text:'  OS      ', cls:'term-key'}, {text:'sparkOS 1.0 (portfolio edition)', cls:'term-out'}]);
      styled([{text:'  Host    ', cls:'term-key'}, {text:'github pages', cls:'term-out'}]);
      styled([{text:'  Kernel  ', cls:'term-key'}, {text:'vanilla-js', cls:'term-out'}]);
      styled([{text:'  Shell   ', cls:'term-key'}, {text:'portfolio-sh 0.1', cls:'term-out'}]);
      styled([{text:'  Uptime  ', cls:'term-key'}, {text:'learning daily', cls:'term-out'}]);
      styled([{text:'  Theme   ', cls:'term-key'}, {text:'phosphor green', cls:'term-out'}]);
    },

    uname(args) {
      plain(args.includes('-a') ? 'sparkOS 1.0 portfolio-sh x86_64 (vanilla JS)' : 'sparkOS', 'term-out');
    },

    pwd() { plain('/home/spark', 'term-out'); },
    id()  { plain('uid=1000(spark) gid=1000(spark) groups=1000(spark),27(sudo)', 'term-out'); },

    nmap(args) {
      if (!args.length) {
        plain('usage: nmap <target>', 'term-out');
        return plain("hint: try 'nmap localhost'", 'term-comment');
      }
      if (['localhost', '127.0.0.1'].includes(args[0])) {
        plain('Starting Nmap 7.94 ( https://nmap.org )', 'term-out');
        plain('Nmap scan report for localhost (127.0.0.1)', 'term-out');
        plain('PORT     STATE  SERVICE', 'term-out');
        plain('22/tcp   open   ssh',    'term-ok');
        plain('80/tcp   open   http',   'term-ok');
        plain('443/tcp  open   https',  'term-ok');
        plain('1337/tcp closed leet',  'term-dim');
      } else {
        plain('nmap: not authorized to scan external hosts from this page.', 'term-err');
      }
    },

    curl(args) {
      plain('curl: (6) Could not resolve host: ' + (args[0] || '') + ' — try the links in ## profiles instead.', 'term-err');
    }
  };

  /* ---------- dispatcher ---------- */

  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) { echo(''); return; }

    history.push(cmd);
    historyIdx = history.length;
    echo(cmd);

    const [name, ...args] = cmd.split(/\s+/);
    const fn = COMMANDS[name];

    if (typeof fn === 'function') {
      try { fn(args); }
      catch (e) { plain('internal error: ' + e.message, 'term-err'); }
    } else {
      plain('bash: ' + name + ': command not found', 'term-err');
      plain("type 'help' to see available commands", 'term-comment');
    }
    scroll();
  }

  /* ---------- input wiring ---------- */

  function updateEcho() {
    if (!input.value && document.activeElement !== input) {
      echoEl.textContent = "type 'help'";
      echoEl.classList.add('is-placeholder');
    } else {
      echoEl.textContent = input.value;
      echoEl.classList.remove('is-placeholder');
    }
  }

  input.addEventListener('input', updateEcho);
  input.addEventListener('focus', () => { root.classList.add('is-focused'); updateEcho(); });
  input.addEventListener('blur',  () => { root.classList.remove('is-focused'); updateEcho(); });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = input.value;
      input.value = '';
      updateEcho();
      run(value);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      historyIdx = Math.max(0, historyIdx - 1);
      input.value = history[historyIdx] || '';
      updateEcho();
      setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!history.length) return;
      historyIdx = Math.min(history.length, historyIdx + 1);
      input.value = history[historyIdx] || '';
      updateEcho();
      return;
    }
    if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); clearScreen(); return; }
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      echo(input.value + '^C');
      input.value = '';
      updateEcho();
    }
  });

  /* clicking the card focuses the input — unless you're selecting text */
  root.addEventListener('click', (e) => {
    if (e.target === input) return;
    if (window.getSelection().toString().length) return;
    input.focus();
  });

  /* chips */
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cmd = chip.dataset.cmd;
      if (!cmd) return;
      run(cmd);
      input.focus();
    });
  });

  /* go */
  renderInitial();
  updateEcho();
})();