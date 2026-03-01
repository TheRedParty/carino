/* ============================================================
   CARIÑO — script.js
   carino.red · Mutual Aid Tool by The Red Party
   ============================================================ */

/* ── CHAIN BUTTON ── */
function buildChains() {
  const left  = document.getElementById('chain-left');
  const right = document.getElementById('chain-right');
  if (!left || !right) return;

  // 5 links per side, alternating h/v
  [left, right].forEach(side => {
    side.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const link = document.createElement('span');
      link.className = i % 2 === 0 ? 'chain-link-h' : 'chain-link-v';
      side.appendChild(link);
    }
  });
}

function discardChains() {
  const wrap = document.getElementById('chain-btn-wrap');
  const btn  = document.getElementById('chain-btn');
  const frags = document.getElementById('chain-fragments');
  if (!wrap || !btn) return;

  // Gather all visible link positions relative to wrap
  const wrapRect = wrap.getBoundingClientRect();
  const links = btn.querySelectorAll('.chain-link-h, .chain-link-v');

  links.forEach((link, i) => {
    const r = link.getBoundingClientRect();
    const cx = r.left - wrapRect.left + r.width  / 2;
    const cy = r.top  - wrapRect.top  + r.height / 2;
    const isH = link.classList.contains('chain-link-h');

    const frag = document.createElement('span');
    frag.className = 'chain-fragment';
    frag.style.cssText = `
      width:  ${isH ? 22 : 13}px;
      height: ${isH ? 13 : 22}px;
      left:   ${cx - (isH ? 11 : 6.5)}px;
      top:    ${cy - (isH ? 6.5 : 11)}px;
      --tx:   ${(Math.random() - 0.5) * 280}px;
      --ty:   ${(Math.random() * -200) - 60}px;
      --rot:  ${(Math.random() - 0.5) * 720}deg;
      --dur:  ${0.55 + Math.random() * 0.35}s;
      --delay:${i * 0.025}s;
    `;
    frags.appendChild(frag);

    // Tiny delay so element is in DOM before class triggers animation
    requestAnimationFrame(() => frag.classList.add('breaking'));
  });

  // Hide original links immediately
  btn.querySelectorAll('.chain-side').forEach(s => { s.style.opacity = '0'; });
  wrap.classList.add('shattering');

  // Dissolve hero after fragments land
  setTimeout(() => {
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.classList.add('dissolving');
      hero.addEventListener('transitionend', () => hero.classList.add('gone'), { once: true });
    }
  }, 480);
}

/* ── PAGE ROUTING ── */
let currentPage = 'board';

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === id)
  );
  const page = document.getElementById('page-' + id);
  if (page) {
    page.classList.add('active');
    window.scrollTo(0, 0);
    currentPage = id;
    document.getElementById('nav-links').classList.remove('open');
  }
  // Hide hero whenever we navigate away; show it only on fresh board load
  const hero = document.querySelector('.hero');
  if (hero && id !== 'board') {
    hero.classList.add('gone');
  }
  if (id === 'board') initBoard();
  if (id === 'orgs')  initOrgs();
}

function toggleMenu() {
  document.getElementById('nav-links').classList.toggle('open');
}


/* ── TOAST ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}


/* ── AUTH STATE ── */
let loggedIn = false;
let currentUser = null;
let pendingAction = null;

function requireAuth(action) {
  if (loggedIn) { action(); return; }
  pendingAction = action;
  openModal('signin');
}

function updateNavAuth() {
  const wrap = document.getElementById('nav-profile-wrap');
  if (!wrap) return;
  if (loggedIn && currentUser) {
    const initial = currentUser.name.charAt(0).toUpperCase();
    wrap.innerHTML = `
      <button class="nav-profile-btn" id="nav-profile-btn" onclick="toggleProfileMenu(event)">
        <span class="nav-profile-avatar">${initial}</span>
        <span class="nav-profile-name">${currentUser.name}</span>
      </button>
      <div class="profile-dropdown" id="profile-dropdown">
        <div class="profile-dropdown-user">
          <div class="profile-dropdown-avatar">${initial}</div>
          <div>
            <div class="profile-dropdown-uname">${currentUser.name}</div>
            <div class="profile-dropdown-loc">${currentUser.location || 'No location set'}</div>
          </div>
        </div>
        <div class="profile-dropdown-divider"></div>
        <button class="profile-dropdown-item" onclick="showPage('profile'); closeProfileMenu()">My Profile</button>
        <button class="profile-dropdown-item" onclick="showPage('inbox'); closeProfileMenu()">
          Inbox <span class="inbox-badge" id="inbox-badge">2</span>
        </button>
        <div class="profile-dropdown-divider"></div>
        <button class="profile-dropdown-item profile-dropdown-signout" onclick="signOut()">Sign Out</button>
      </div>
    `;
  } else {
    wrap.innerHTML = `<button class="nav-signin-btn" onclick="openModal('signin')">Sign In</button>`;
  }
}

function signOut() {
  loggedIn = false;
  currentUser = null;
  closeProfileMenu();
  updateNavAuth();
  showPage('board');
  showToast('Signed out.');
}

function buildSignInModal() {
  const hint = pendingAction ? '<p class="auth-gate-hint">Sign in to continue.</p>' : '';
  return `
    <div class="modal-title">Sign In</div>
    <p class="modal-sub">Welcome back. The community needs you.</p>${hint}
    <div class="form-field">
      <label class="form-label">Email</label>
      <input type="email" class="form-input" id="signin-email" placeholder="your@email.com">
    </div>
    <div class="form-field">
      <label class="form-label">Password</label>
      <input type="password" class="form-input" id="signin-password" placeholder="••••••••">
    </div>
    <button class="form-submit" onclick="submitSignIn()">Sign In →</button>
    <p class="auth-switch">Don't have an account? <span class="auth-link" onclick="openModal('signup')">Create one →</span></p>
  `;
}

function submitSignIn() {
  const email = document.getElementById('signin-email')?.value.trim();
  const pass  = document.getElementById('signin-password')?.value.trim();
  if (!email || !pass) { showToast('Please fill in both fields.'); return; }
  loggedIn = true;
  currentUser = { name: 'Alex M.', location: 'Northside, DC', bio: 'Retired electrician. Tools, time, and a truck.' };
  closeModal();
  updateNavAuth();
  showToast('Welcome back, ' + currentUser.name.split(' ')[0] + '.');
  if (pendingAction) { const fn = pendingAction; pendingAction = null; setTimeout(fn, 250); }
}

let signupData = {};

function buildSignUpModal(step) {
  step = step || 1;
  signupData._step = step;
  if (step === 1) return `
    <div class="modal-step-indicator">Step 1 of 4</div>
    <div class="modal-title">Create an Account</div>
    <p class="modal-sub">Free, always. No catch.</p>
    <div class="form-field">
      <label class="form-label">Username</label>
      <input type="text" class="form-input" id="su-username" placeholder="how others will find you">
    </div>
    <div class="form-field">
      <label class="form-label">Email</label>
      <input type="email" class="form-input" id="su-email" placeholder="your@email.com">
    </div>
    <div class="form-field">
      <label class="form-label">Password</label>
      <input type="password" class="form-input" id="su-password" placeholder="••••••••">
    </div>
    <button class="form-submit" onclick="signupNext(1)">Continue →</button>
    <p class="auth-switch">Already have an account? <span class="auth-link" onclick="openModal('signin')">Sign in →</span></p>
  `;
  if (step === 2) return `
    <div class="modal-step-indicator">Step 2 of 4</div>
    <div class="modal-title">Tell us about yourself</div>
    <p class="modal-sub">This is what others see on your profile.</p>
    <div class="form-field">
      <label class="form-label">Display Name</label>
      <input type="text" class="form-input" id="su-displayname" placeholder="Can match your username" value="${signupData.username || ''}">
    </div>
    <div class="form-field">
      <label class="form-label">General Location <span style="opacity:0.5;font-weight:400;text-transform:none;letter-spacing:0">(neighborhood or city — never exact address)</span></label>
      <input type="text" class="form-input" id="su-location" placeholder="e.g. Northside, DC">
    </div>
    <div class="form-field">
      <label class="form-label">Short Bio <span style="opacity:0.5;font-weight:400;text-transform:none;letter-spacing:0">(optional but encouraged)</span></label>
      <textarea class="form-textarea" id="su-bio" placeholder="What do you bring to the community? What do you care about?" rows="3"></textarea>
    </div>
    <button class="form-submit" onclick="signupNext(2)">Continue →</button>
  `;
  if (step === 3) return `
    <div class="modal-step-indicator">Step 3 of 4</div>
    <div class="modal-title">What brings you here?</div>
    <p class="modal-sub">This helps us show you the right things first.</p>
    <div class="signup-options">
      <label class="signup-option">
        <input type="radio" name="su-intent" value="offer">
        <span class="signup-option-label">I have abilities to offer</span>
      </label>
      <label class="signup-option">
        <input type="radio" name="su-intent" value="need">
        <span class="signup-option-label">I have needs I'm looking for help with</span>
      </label>
      <label class="signup-option">
        <input type="radio" name="su-intent" value="both">
        <span class="signup-option-label">Both</span>
      </label>
      <label class="signup-option">
        <input type="radio" name="su-intent" value="orgs">
        <span class="signup-option-label">I'm looking for local groups and orgs</span>
      </label>
    </div>
    <button class="form-submit" onclick="signupNext(3)">Continue →</button>
  `;
  if (step === 4) return `
    <div class="signup-welcome">
      <div class="signup-welcome-star">★</div>
      <div class="modal-title" style="margin-bottom:0.5rem">Welcome to Cariño</div>
      <p class="modal-sub" style="margin-bottom:1.5rem">You're in. The community is better for it.</p>
      <div class="signup-welcome-name">${signupData.displayname || signupData.username}</div>
      <p class="signup-welcome-loc">📍 ${signupData.location || 'Location not set'}</p>
      ${signupData.bio ? `<p class="signup-welcome-bio">${signupData.bio}</p>` : ''}
    </div>
    <button class="form-submit" onclick="signupFinish()">Go to the Board →</button>
  `;
}

function signupNext(step) {
  if (step === 1) {
    const username = document.getElementById('su-username')?.value.trim();
    const email    = document.getElementById('su-email')?.value.trim();
    const password = document.getElementById('su-password')?.value.trim();
    if (!username || !email || !password) { showToast('Please fill in all fields.'); return; }
    signupData.username = username;
    signupData.email    = email;
  }
  if (step === 2) {
    signupData.displayname = document.getElementById('su-displayname')?.value.trim() || signupData.username;
    signupData.location    = document.getElementById('su-location')?.value.trim();
    signupData.bio         = document.getElementById('su-bio')?.value.trim();
  }
  if (step === 3) {
    const intent = document.querySelector('input[name="su-intent"]:checked');
    if (!intent) { showToast('Choose what brings you here.'); return; }
    signupData.intent = intent.value;
  }
  document.getElementById('modal-body').innerHTML = buildSignUpModal(step + 1);
}

function signupFinish() {
  loggedIn = true;
  currentUser = {
    name:     signupData.displayname || signupData.username,
    location: signupData.location,
    bio:      signupData.bio
  };
  closeModal();
  updateNavAuth();
  showToast('Welcome, ' + currentUser.name.split(' ')[0] + '. You\'re in.');
}

/* ── MODAL ── */
function openModal(type) {
  if ((type === 'post-need' || type === 'post-offer') && !loggedIn) {
    requireAuth(() => openModal(type));
    return;
  }
  document.getElementById('modal-body').innerHTML = buildModal(type);
  document.getElementById('overlay').classList.add('open');
}
function closeModal() {
  document.getElementById('overlay').classList.remove('open');
}
function handleOverlay(e) {
  if (e.target === document.getElementById('overlay')) closeModal();
}

function buildModal(type) {
  if (type === 'signin') return buildSignInModal();
  if (type === 'signup') return buildSignUpModal(1);
  if (type === 'post-need') {
    return `
      <div class="modal-title">Post a Need</div>
      <p class="modal-sub">Tell the community what you need. No judgment. No means test. You need it — that's enough.</p>
      <div class="form-field">
        <label class="form-label">What do you need?</label>
        <input type="text" class="form-input" placeholder="e.g. Grocery run, Legal advice, Someone to talk to">
      </div>
      <div class="form-field">
        <label class="form-label">Tell us more</label>
        <textarea class="form-textarea" placeholder="Describe what you need and when. As much or as little as you want."></textarea>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Category</label>
          <select class="form-select">${catOptionsHTML(currentTab)}</select>
        </div>
        <div class="form-field">
          <label class="form-label">Your neighborhood or city</label>
          <input type="text" class="form-input" placeholder="${currentTab === 'local' ? 'e.g. Northside, DC' : 'Remote'}">
        </div>
      </div>
      <button class="form-submit" onclick="submitPost('need')">Post this Need →</button>
    `;
  }
  if (type === 'post-offer') {
    return `
      <div class="modal-title">Post an Ability</div>
      <p class="modal-sub">What can you give? Your time, your skill, your care — offered directly to someone who needs it.</p>
      <div class="form-field">
        <label class="form-label">What can you offer?</label>
        <input type="text" class="form-input" placeholder="e.g. Rides, Cooking, Web design, Tutoring, A listening ear">
      </div>
      <div class="form-field">
        <label class="form-label">Tell us more</label>
        <textarea class="form-textarea" placeholder="Describe what you can do and how you can help. Be specific — it helps people know if you're the right fit."></textarea>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Category</label>
          <select class="form-select">${catOptionsHTML(currentTab)}</select>
        </div>
        <div class="form-field">
          <label class="form-label">Your neighborhood or city</label>
          <input type="text" class="form-input" placeholder="${currentTab === 'local' ? 'e.g. East End, Richmond' : 'Remote'}">
        </div>
      </div>
      <button class="form-submit" onclick="submitPost('offer')">Post this Ability →</button>
    `;
  }
  if (type === 'add-org') {
    return `
      <div class="modal-title">Add an Organization</div>
      <p class="modal-sub">Add your mutual aid group, union, community org, or collective to the directory. Free, always.</p>
      <div class="form-field">
        <label class="form-label">Organization name</label>
        <input type="text" class="form-input" placeholder="Name of your group">
      </div>
      <div class="form-field">
        <label class="form-label">What do you do?</label>
        <textarea class="form-textarea" placeholder="Describe your organization and who you serve."></textarea>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label class="form-label">Type</label>
          <select class="form-select">
            <option>Local (in-person)</option>
            <option>Global (online)</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">Location</label>
          <input type="text" class="form-input" placeholder="City or 'Remote'">
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Contact email</label>
        <input type="email" class="form-input" placeholder="contact@yourorg.org">
      </div>
      <button class="form-submit" onclick="submitOrg()">Submit Organization →</button>
    `;
  }
  return '';
}

function catOptionsHTML(tab) {
  const cats = tab === 'global'
    ? ['All','Tech / Code','Legal','Art / Design','Writing','Education','Advice','Other']
    : ['All','Food','Cleaning','Transport','Housing','Healthcare','Infrastructure','Other'];
  return cats.map(c => `<option>${c}</option>`).join('');
}

function submitPost(kind) {
  if (!loggedIn) { closeModal(); setTimeout(() => requireAuth(() => openModal(kind === 'need' ? 'post-need' : 'post-offer')), 100); return; }
  closeModal();
  showToast(kind === 'need'
    ? '★ Your need has been posted.'
    : '★ Your ability has been posted.'
  );
}
function submitOrg() {
  closeModal();
  showToast('★ Organization submitted — we\'ll review it shortly.');
}


/* ══════════════════════════════════════
   DATA
══════════════════════════════════════ */
const localOrgs = [
  {
    id: 'community-garden', emoji: '🌱',
    name: 'Community Garden Collective',
    desc: 'Growing food and sharing the harvest freely',
    members: 34, location: 'Northside Community Center',
    contact: 'garden@carino.red',
    about: 'We maintain three shared garden plots across the neighborhood. All produce is distributed freely to members and neighbors in need. No experience required — just show up and we\'ll teach you everything.',
    announcements: [],
    events: [
      { id:'ev-1', title: 'Spring Planting Day', date: 'Saturday, March 8', time: '9 AM – 1 PM', type: 'volunteer', capacity: 20, rsvpCount: 14, desc: 'Help us get the spring beds ready. Seeds, tools, and food provided. All welcome.' },
      { id:'ev-2', title: 'Weekly Harvest Share', date: 'Every Sunday', time: '11 AM – 1 PM', type: 'recurring', capacity: null, rsvpCount: 0, desc: 'Come pick up fresh produce or help sort and distribute. Free for everyone.' },
      { id:'ev-3', title: 'Composting Workshop', date: 'Saturday, March 22', time: '2 PM – 4 PM', type: 'workshop', capacity: 12, rsvpCount: 11, desc: 'Learn to compost at home. You\'ll leave with a starter kit.' }
    ]
  },
  {
    id: 'tool-library', emoji: '🔧',
    name: 'Tool Lending Library',
    desc: 'Borrow tools instead of buying them',
    members: 67, location: 'East End Workshop, 114 Meridian St',
    contact: 'tools@carino.red',
    about: 'Why should every household own a drill they use twice a year? Our library has over 200 items — power tools, hand tools, garden equipment. Borrow for free, return when done.',
    announcements: [
      { title: 'New power tools added', body: 'We just added a Milwaukee cordless drill set, an oscillating multi-tool, and a random orbital sander. All available to borrow starting this Tuesday.', date: '2 days ago' },
      { title: 'Spring cleaning of the workshop', body: 'We\'re doing a full inventory and deep clean on Saturday March 15 starting at 10am. Members who help out get priority borrowing for the following month.', date: '1 week ago' }
    ],
    events: [
      { id:'ev-4', title: 'Open Hours', date: 'Every Tuesday & Thursday', time: '5 PM – 8 PM', type: 'recurring', capacity: null, rsvpCount: 0, desc: 'Drop in to borrow or return tools. No appointment needed.' },
      { id:'ev-5', title: 'Basic Home Repair Workshop', date: 'Sunday, March 16', time: '1 PM – 4 PM', type: 'workshop', capacity: 15, rsvpCount: 8, desc: 'Patching drywall, fixing leaky faucets, replacing outlets. Free, hands-on.' },
      { id:'ev-6', title: 'Bike Repair Clinic', date: 'Saturday, March 29', time: '10 AM – 2 PM', type: 'workshop', capacity: 18, rsvpCount: 6, desc: 'Bring your bike. Tubes, brakes, chains — all covered.' }
    ]
  },
  {
    id: 'mutual-aid-network', emoji: '🤝',
    name: 'Mutual Aid Network',
    desc: 'Coordinating local needs and getting them met',
    members: 118, location: 'Multiple locations',
    contact: 'network@carino.red',
    about: 'We are the coordination hub for local mutual aid — connecting people who need help with people who can provide it, organizing emergency response, making sure nothing falls through the cracks.',
    announcements: [],
    events: [
      { title: 'Monthly Coordination Meeting', date: 'First Monday of each month', time: '7 PM – 9 PM', type: 'meeting', desc: 'Open to all. We review needs, assign volunteers, plan for the month ahead.' },
      { title: 'Emergency Grocery Run', date: 'Every Saturday', time: '10 AM', type: 'recurring', desc: 'Drivers needed to deliver groceries to people who can\'t get out.' },
      { title: 'New Volunteer Orientation', date: 'Sunday, March 9', time: '3 PM – 5 PM', type: 'workshop', desc: 'First time volunteering? Come meet the network and find where you fit.' }
    ]
  },
  {
    id: 'youth-tutoring', emoji: '📚',
    name: 'Youth Tutoring Circle',
    desc: 'Free tutoring for K–12 students, no exceptions',
    members: 29, location: 'Southside Library, Room 4',
    contact: 'tutoring@carino.red',
    about: 'Every child deserves support with their education regardless of what their family can afford. We match volunteer tutors with students who need help.',
    announcements: [],
    events: [
      { title: 'Tutoring Sessions', date: 'Tuesdays & Thursdays', time: '4 PM – 7 PM', type: 'recurring', desc: 'Drop-in tutoring for any K–12 subject.' },
      { title: 'Tutor Volunteer Sign-Up', date: 'Ongoing', time: 'Flexible', type: 'volunteer', desc: 'Can you help a kid with math or reading? We need you.' },
      { title: 'SAT Prep', date: 'Saturdays in April', time: '10 AM – 12 PM', type: 'workshop', desc: 'Free SAT prep for high school juniors and seniors. Four sessions starting April 5.' }
    ]
  },
  {
    id: 'disability-access', emoji: '♿',
    name: 'Disability Access Group',
    desc: 'Improving access and supporting each other',
    members: 41, location: 'Online and rotating accessible venues',
    contact: 'access@carino.red',
    about: 'We advocate for accessible spaces, support disabled community members with practical needs, and build peer relationships among people navigating disability together.',
    announcements: [],
    events: [
      { title: 'Peer Support Circle', date: 'Every other Wednesday', time: '6 PM – 8 PM', type: 'recurring', desc: 'A space to talk, vent, share resources, and support each other.' },
      { title: 'Accessibility Audit Walk', date: 'Saturday, March 15', time: '11 AM – 2 PM', type: 'volunteer', desc: 'We walk local spaces and document accessibility barriers.' },
      { title: 'Benefits Navigation Help', date: 'By appointment', time: 'Flexible', type: 'volunteer', desc: 'Navigating disability benefits is a nightmare. We have people who have been through it.' }
    ]
  }
];

const globalOrgs = [
  {
    id: 'open-source-good', emoji: '💻',
    name: 'Open Source for Good',
    desc: 'Code for mutual aid orgs and the public good',
    members: 203, location: 'Remote — Discord and GitHub',
    contact: 'code@carino.red',
    about: 'Developers, designers, and technical people who want their skills to serve something real. We build and maintain free software for mutual aid orgs, nonprofits, and community groups.',
    announcements: [
      { title: 'Cariño backend development starting', body: 'We\'re beginning work on the backend for Cariño — the mutual aid platform built by The Red Party. Node/Express/PostgreSQL stack. If you want to contribute reach out through the platform.', date: '3 days ago' },
      { title: 'Looking for a security-focused contributor', body: 'We need someone with cybersecurity experience to review our auth implementation and database security before we go live. If that\'s you, get in touch.', date: '5 days ago' }
    ],
    events: [
      { title: 'Weekly Standup', date: 'Every Monday', time: '7 PM ET', type: 'recurring', desc: 'Quick check-in on active projects. Join Discord to participate.' },
      { title: 'Project Intake — Spring 2026', date: 'Applications open now', time: 'Ongoing', type: 'volunteer', desc: 'Community orgs can submit projects for our spring cohort.' },
      { title: 'Intro to Contributing', date: 'Sunday, March 23', time: '2 PM ET', type: 'workshop', desc: 'Never contributed to open source? We\'ll walk you through it.' }
    ]
  },
  {
    id: 'legal-aid-network', emoji: '⚖️',
    name: 'Legal Aid Network',
    desc: 'Connecting people with pro bono lawyers',
    members: 87, location: 'Remote — video and phone',
    contact: 'legal@carino.red',
    about: 'Legal help should not be something only rich people can access. We connect people facing eviction, labor disputes, immigration issues, and debt with attorneys and paralegals who volunteer their time.',
    announcements: [],
    events: [
      { title: 'Tenant Rights Q&A', date: 'Every other Tuesday', time: '6:30 PM ET', type: 'recurring', desc: 'Live Q&A with a tenant rights attorney.' },
      { title: 'Know Your Labor Rights', date: 'Wednesday, March 12', time: '7 PM ET', type: 'workshop', desc: 'Wage theft, wrongful termination, workplace safety — what you\'re entitled to.' },
      { title: 'Intake Open Hours', date: 'Fridays', time: '12 PM – 3 PM ET', type: 'recurring', desc: 'Book a free 30-minute consultation with a volunteer attorney.' }
    ]
  },
  {
    id: 'peer-support', emoji: '💙',
    name: 'Mental Health Peer Support',
    desc: 'Lived experience, no judgment, just people',
    members: 156, location: 'Remote — video and chat',
    contact: 'support@carino.red',
    about: 'We are not therapists. We are people who have been through depression, anxiety, crisis, grief, burnout — and we know how to sit with someone who is struggling without trying to fix them.',
    announcements: [],
    events: [
      { title: 'Open Support Circle', date: 'Every Thursday', time: '8 PM ET', type: 'recurring', desc: 'Drop in, say as much or as little as you want. A space to not be alone.' },
      { title: 'Peer Support Training', date: 'Starts April 1', time: '6 weeks, Tuesdays 7 PM ET', type: 'workshop', desc: 'Free six-week training: active listening, crisis response, self-care.' },
      { title: '1-on-1 Peer Matching', date: 'Ongoing', time: 'Your schedule', type: 'volunteer', desc: 'Request a peer match — someone who has been through something similar.' }
    ]
  },
  {
    id: 'worker-coop-network', emoji: '🏭',
    name: 'Worker Co-op Network',
    desc: 'Supporting worker-owned businesses and conversions',
    members: 74, location: 'Remote — monthly calls and events',
    contact: 'coops@carino.red',
    about: 'We support workers who want to convert their workplace to a cooperative, start new worker-owned businesses, and connect existing co-ops with the resources and people they need.',
    announcements: [],
    events: [
      { title: 'Co-op Conversion Q&A', date: 'First Thursday of each month', time: '6 PM ET', type: 'recurring', desc: 'Open Q&A for workers exploring conversion to a cooperative.' },
      { title: 'New Co-op Mentorship', date: 'Ongoing', time: 'Flexible', type: 'volunteer', desc: 'Experienced co-op members available to mentor new worker-owners.' },
      { title: 'Co-op Finance Workshop', date: 'Saturday, April 5', time: '1 PM ET', type: 'workshop', desc: 'How to fund a worker cooperative without giving up control.' }
    ]
  }
];

const boardData = {
  local: [
    { id: 1,  type: 'offer', cat: 'food',           title: 'Grocery runs for seniors',              body: 'I have a car and free time on weekends. Happy to do grocery runs for seniors or anyone with mobility issues in the Northside area. No charge, no catch.',                            name: 'Marcus T.',    loc: 'Northside',      time: '2h ago' },
    { id: 2,  type: 'need',  cat: 'food',           title: 'Baby formula — urgent',                 body: 'My sister just had her baby and we ran out of formula. Any brand works. Will pick up immediately.',                                                                                 name: 'Keisha M.',    loc: 'East End',       time: '3h ago' },
    { id: 3,  type: 'offer', cat: 'infrastructure', title: 'Home repairs — free for people who need it', body: 'Can help with leaky faucets, drywall, painting, basic electrical. I\'m a retired contractor and I have the time. Free for people who can\'t afford a contractor.',           name: 'James R.',     loc: 'Westside',       time: '5h ago' },
    { id: 4,  type: 'need',  cat: 'transport',      title: 'Ride to medical appointment',           body: 'Need a ride to a specialist downtown next Tuesday morning around 9am. Can offer gas money. Won\'t take long.',                                                                      name: 'Rosa L.',      loc: 'Southside',      time: '6h ago' },
    { id: 5,  type: 'offer', cat: 'food',           title: 'Free after-school snacks',              body: 'I bake extra every week and drop off snacks at the community center on Tuesdays. Grab what you need — no questions asked.',                                                        name: 'Margaret O.',  loc: 'Central',        time: '1d ago' },
    { id: 6,  type: 'need',  cat: 'healthcare',     title: 'Just need someone to talk to',          body: 'Going through a really hard time and feeling isolated. Not looking for professional advice, just a human conversation.',                                                            name: 'Jordan T.',    loc: 'Any',            time: '1d ago' },
    { id: 7,  type: 'offer', cat: 'food',           title: 'Extra produce every week',              body: 'My garden grows more than I can eat. I leave bags on my porch every Sunday morning — take what you need. Tomatoes, greens, herbs, squash depending on the season.',               name: 'Priya S.',     loc: 'Oak Park',       time: '2d ago' },
    { id: 8,  type: 'need',  cat: 'food',           title: 'Help with meal prep while I recover',   body: 'Recovering from surgery and can\'t stand long enough to cook. Have groceries, just need help preparing food for the week. Even a few hours would mean everything.',               name: 'Tanya B.',     loc: 'East End',       time: '2d ago' },
    { id: 9,  type: 'offer', cat: 'infrastructure', title: 'Community WiFi help',                   body: 'Can help households get connected to low-income internet programs — Comcast Essentials, ACP, whatever is available in your area. Free, no catch.',                                  name: 'Deb L.',       loc: 'Northside',      time: '3d ago' },
    { id: 10, type: 'need',  cat: 'housing',        title: 'Temporary housing needed urgently',     body: 'Leaving a bad situation with my daughter. We need somewhere safe to stay for a week or two while I sort things out. I\'m working, I can contribute.',                              name: 'Diane F.',    loc: 'Any',            time: '3d ago' },
  ],
  global: [
    { id: 11, type: 'offer', cat: 'tech',       title: 'Free web development for mutual aid orgs',  body: 'Full-stack developer, 10 years experience. Will build or fix websites for mutual aid organizations, community groups, and cooperatives. No charge.',                               name: 'Lena V.',      loc: 'Remote',         time: '1h ago' },
    { id: 12, type: 'need',  cat: 'tech',       title: 'Help automating volunteer tracking',        body: 'Need someone to help set up a Google Sheet to track volunteers and shifts automatically. I\'m not a developer. Even a few hours of guidance would help.',                          name: 'Priya N.',     loc: 'Remote',         time: '4h ago' },
    { id: 13, type: 'offer', cat: 'legal',      title: 'Tenant rights consultations',               body: 'Paralegal, 8 years of tenant rights experience. Happy to answer questions about eviction defense, lease review, and housing rights. Free.',                                       name: 'Amir H.',      loc: 'Remote',         time: '5h ago' },
    { id: 14, type: 'need',  cat: 'advice',     title: 'Navigating disability benefits',            body: 'Just applied for SSDI and the process is overwhelming. Looking for someone who has been through it who can help me understand what to expect.',                                    name: 'Carla W.',    loc: 'Remote',         time: '8h ago' },
    { id: 15, type: 'offer', cat: 'art',        title: 'Graphic design for community orgs',        body: 'Graphic designer. Free flyers, social media graphics, and logos for mutual aid groups, unions, and community organizations. I do this because I believe in it.',                  name: 'Sam K.',       loc: 'Remote',         time: '1d ago' },
    { id: 16, type: 'need',  cat: 'writing',    title: 'Help writing a housing complaint letter',   body: 'My landlord violated our lease and I need help writing a formal complaint to the housing authority. I know what happened, I just need help with the language.',                   name: 'Chen W.',      loc: 'Remote',         time: '1d ago' },
    { id: 17, type: 'offer', cat: 'education',  title: 'ESL tutoring — all levels',                body: 'Native English speaker, taught ESL for 5 years. One-on-one or small group over video call. Free. Happy to work around your schedule.',                                              name: 'Brianna T.',   loc: 'Remote',         time: '2d ago' },
    { id: 18, type: 'need',  cat: 'tech',       title: 'Need someone to review my resume',         body: 'Been out of work for 8 months. Would really appreciate an honest review of my resume from someone in tech or healthcare. I just need to know what to fix.',                       name: 'Marcus D.',    loc: 'Remote',         time: '2d ago' },
    { id: 19, type: 'offer', cat: 'advice',     title: 'Workplace organizing support',             body: 'Experienced union organizer. Can help workers who want to organize their workplace — strategy, legal basics, what to expect, how to protect yourselves.',                          name: 'Rafael M.',    loc: 'Remote',         time: '3d ago' },
    { id: 20, type: 'need',  cat: 'legal',      title: 'Wage theft — where do I start?',          body: 'My employer owes me three weeks of pay and stopped responding. I don\'t know how to pursue this or whether I can afford to. Looking for someone who knows this area.',             name: 'Tony R.',    loc: 'Remote',         time: '3d ago' },
  ]
};

const filterSets = {
  local:  ['all','food','cleaning','transport','housing','healthcare','infrastructure','other'],
  global: ['all','tech','legal','art','writing','advice','education','comrade-support','other']
};
const filterLabels = {
  all:'All', food:'Food', cleaning:'Cleaning', transport:'Transport', housing:'Housing',
  healthcare:'Healthcare', infrastructure:'Infrastructure',
  tech:'Tech/Code', legal:'Legal', art:'Art/Design',
  writing:'Writing', advice:'Advice', education:'Education', 'comrade-support':'Comrade Support', other:'Other'
};


/* ══════════════════════════════════════
   BOARD
══════════════════════════════════════ */
let currentTab    = 'local';
let currentFilter = 'all';
let boardReady    = false;


/* ── RSVP STATE ── */
const rsvpSet = new Set(); // event ids the current user has RSVP'd to

/* ── REPORT SYSTEM ── */
function openReport(contentType, contentLabel) {
  requireAuth(() => {
    const body = `
      <div class="modal-title">Report</div>
      <p class="modal-sub">You're reporting: <strong>${contentLabel}</strong></p>
      <p class="report-policy">Reports are reviewed by Cariño moderators. At 5 reports, content is automatically taken down and pushed to the review queue. You will not be identified to the person being reported.</p>
      <div class="form-field">
        <label class="form-label">Reason</label>
        <div class="report-reasons">
          <label class="report-reason"><input type="radio" name="report-reason" value="spam"> <span>Spam or misleading</span></label>
          <label class="report-reason"><input type="radio" name="report-reason" value="harassment"> <span>Harassment or abuse</span></label>
          <label class="report-reason"><input type="radio" name="report-reason" value="hate"> <span>Hate speech or discrimination</span></label>
          <label class="report-reason"><input type="radio" name="report-reason" value="predatory"> <span>Predatory or dangerous behavior</span></label>
          <label class="report-reason"><input type="radio" name="report-reason" value="other"> <span>Other</span></label>
        </div>
      </div>
      <div class="form-field" id="report-other-wrap" style="display:none">
        <label class="form-label">Tell us more</label>
        <textarea class="form-textarea" id="report-other-text" placeholder="Describe what's wrong." rows="3"></textarea>
      </div>
      <button class="form-submit" onclick="submitReport()">Submit Report →</button>
    `;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('overlay').classList.add('open');
    document.querySelectorAll('input[name="report-reason"]').forEach(r => {
      r.addEventListener('change', () => {
        document.getElementById('report-other-wrap').style.display =
          r.value === 'other' && r.checked ? 'block' : 'none';
      });
    });
  });
}

function submitReport() {
  const reason = document.querySelector('input[name="report-reason"]:checked');
  if (!reason) { showToast('Please select a reason.'); return; }
  closeModal();
  showToast('Report submitted. Moderators will review it.');
}



function toggleRsvp(evId, orgId, btn) {
  requireAuth(() => {
    // Check membership — for demo, allow if joined or if in joinedOrgs
    // In production this would check the backend
    const isMember = joinedOrgs.has(orgId);
    if (!isMember) {
      showToast('You need to be a member to RSVP. Request to join first.');
      return;
    }

    // Find the event across all orgs
    const allOrgs = [...localOrgs, ...globalOrgs];
    let ev = null;
    for (const org of allOrgs) {
      ev = org.events?.find(e => e.id === evId);
      if (ev) break;
    }
    if (!ev) return;

    if (rsvpSet.has(evId)) {
      // Cancel RSVP
      rsvpSet.delete(evId);
      ev.rsvpCount = Math.max(0, ev.rsvpCount - 1);
      btn.textContent = 'RSVP';
      btn.classList.remove('rsvp-btn-going');
      showToast('RSVP cancelled.');
    } else {
      // Check capacity
      if (ev.capacity !== null && ev.rsvpCount >= ev.capacity) {
        showToast('This event is full.');
        return;
      }
      rsvpSet.add(evId);
      ev.rsvpCount++;
      btn.textContent = '✓ Going';
      btn.classList.add('rsvp-btn-going');
      showToast('You\'re going! We\'ll remind you closer to the date.');
    }

    // Update the spots display
    const spotsEl = btn.closest('.od-event')?.querySelector('.ev-spots');
    if (spotsEl && ev.capacity !== null) {
      const spots = ev.capacity - ev.rsvpCount;
      spotsEl.textContent = spots === 0 ? 'Full' : `${spots} spot${spots === 1 ? '' : 's'} left`;
      spotsEl.classList.toggle('ev-spots-full', spots === 0);
    }
  });
}
function initBoard() {
  if (boardReady) return;
  boardReady = true;
  renderSidebar();
  renderFilters();
  renderCards();
}

function switchTab(tab) {
  currentTab    = tab;
  currentFilter = 'all';

  document.querySelectorAll('.board-tab[data-tab]').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );

  document.getElementById('panel-title').innerHTML = tab === 'local'
    ? 'Local <em>Abilities &amp; Needs</em>'
    : 'Global <em>Abilities &amp; Needs</em>';
  document.getElementById('panel-sub').textContent = tab === 'local'
    ? 'In-person help in your community.'
    : 'Remote help — skills, code, advice, writing, anything you can give from anywhere.';
  document.getElementById('sidebar-label').textContent = tab === 'local'
    ? 'Local Groups' : 'Global Groups';

  renderSidebar();
  renderFilters();
  renderCards();
}

function renderSidebar() {
  const orgs = currentTab === 'local' ? localOrgs : globalOrgs;
  document.getElementById('sidebar-orgs').innerHTML = orgs.map(o => `
    <div class="sidebar-org" onclick="openOrgDetail('${o.id}', 'board')">
      <div class="so-name">${o.emoji} ${o.name}</div>
      <div class="so-desc">${o.desc}</div>
      <div class="so-meta">${o.members} members · ${o.location}</div>
    </div>
  `).join('');
}

function renderFilters() {
  const chips = filterSets[currentTab].map(f => `
    <button class="filter-chip${f === currentFilter ? ' active' : ''}"
            onclick="setFilter('${f}')">${filterLabels[f]}</button>
  `).join('');
  document.getElementById('board-filters').innerHTML = chips;
}

function setFilter(f) {
  currentFilter = f;
  renderFilters();
  renderCards();
}

function renderCards() {
  const search = (document.getElementById('board-search')?.value || '').toLowerCase().trim();
  const sort   = document.getElementById('board-sort')?.value || 'all';
  let posts    = [...boardData[currentTab]];

  if (currentFilter !== 'all') posts = posts.filter(p => p.cat === currentFilter);
  if (sort === 'offers') posts = posts.filter(p => p.type === 'offer');
  if (sort === 'needs')  posts = posts.filter(p => p.type === 'need');
  if (search) posts = posts.filter(p =>
    p.title.toLowerCase().includes(search) ||
    p.body.toLowerCase().includes(search) ||
    p.name.toLowerCase().includes(search)
  );

  if (!posts.length) {
    document.getElementById('cards-grid').innerHTML =
      '<div class="no-results">Nothing here yet. Be the first to post.</div>';
    return;
  }

  document.getElementById('cards-grid').innerHTML = posts.map(p => `
    <div class="card">
      <div class="card-top">
        <span class="badge badge-${p.type}">${p.type === 'offer' ? 'Offering' : 'Needs Help'}</span>
        <span class="card-time">${p.time}</span>
      </div>
      <div class="card-title">${p.title}</div>
      <div class="card-body">${p.body}</div>
      <div class="card-footer">
        <div class="card-meta"><span class="card-name" onclick="openProfileModal('${p.name}', '${p.loc}', 'Member of the Cariño community.', ${Math.floor(Math.random()*10)+1}, ${Math.floor(Math.random()*8)})">${p.name}</span> · ${p.loc}</div>
        <div class="card-actions">
          <button class="card-report-btn" onclick="openReport('post','${p.title}')" title="Report this post">⚑</button>
          <button class="card-cta" onclick="respondToPost('${p.name}', '${p.title}')">Respond</button>
        </div>
      </div>
    </div>
  `).join('');
}


/* ══════════════════════════════════════
   ORGANIZATIONS
══════════════════════════════════════ */
let orgsTab   = 'local';
let orgsReady = false;

function initOrgs() {
  if (orgsReady) return;
  orgsReady = true;
  renderOrgs();
}

function switchOrgsTab(tab) {
  orgsTab = tab;
  document.querySelectorAll('.board-tab[data-orgtab]').forEach(b =>
    b.classList.toggle('active', b.dataset.orgtab === tab)
  );
  renderOrgs();
}

function renderOrgs() {
  const search = (document.getElementById('orgs-search')?.value || '').toLowerCase().trim();
  const orgs = (orgsTab === 'local' ? localOrgs : globalOrgs)
    .filter(o => !search ||
      o.name.toLowerCase().includes(search) ||
      o.desc.toLowerCase().includes(search)
    );

  if (!orgs.length) {
    document.getElementById('orgs-grid').innerHTML =
      '<div class="no-results" style="grid-column:1/-1">No organizations found.</div>';
    return;
  }

  document.getElementById('orgs-grid').innerHTML = orgs.map(o => `
    <div class="org-card" onclick="openOrgDetail('${o.id}', 'orgs')">
      <div class="org-emoji">${o.emoji}</div>
      <div class="org-name">${o.name}</div>
      <div class="org-desc">${o.desc}</div>
      <div class="org-footer">
        <div class="org-meta">${o.members} members · ${o.location}</div>
        <span class="org-tag">${orgsTab === 'local' ? '📍 Local' : '🌐 Global'}</span>
      </div>
    </div>
  `).join('');
}


/* ══════════════════════════════════════
   ORG DETAIL
══════════════════════════════════════ */
function switchOdTab(name, btn) {
  document.querySelectorAll('.od-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.od-tab-panel').forEach(p => p.classList.add('od-tab-panel-hidden'));
  btn.classList.add('active');
  document.getElementById('od-panel-' + name)?.classList.remove('od-tab-panel-hidden');
}

function openOrgDetail(id, fromPage) {
  const org = [...localOrgs, ...globalOrgs].find(o => o.id === id);
  if (!org) return;

  const isLocal = localOrgs.some(o => o.id === id);
  const evClass = { volunteer:'ev-volunteer', recurring:'ev-recurring', workshop:'ev-workshop', meeting:'ev-meeting' };
  const evLabel = { volunteer:'Volunteer', recurring:'Recurring', workshop:'Workshop', meeting:'Meeting' };

  const annHTML = org.announcements && org.announcements.length
    ? `<h2 class="od-section-title">Announcements &amp; Updates</h2>
       <div class="od-announcements">${org.announcements.map(a => `
         <div class="od-announcement">
           <div class="od-ann-header">
             <div class="od-ann-title">${a.title}</div>
             <div class="od-ann-date">${a.date}</div>
           </div>
           <p class="od-ann-body">${a.body}</p>
         </div>`).join('')}
       </div>`
    : '';

  const evHTML = org.events.map(e => {
    const hasCapacity = e.capacity !== null;
    const spots = hasCapacity ? e.capacity - e.rsvpCount : null;
    const isFull = hasCapacity && spots <= 0;
    const userGoing = rsvpSet.has(e.id);
    const isMember = joinedOrgs.has(org.id);
    return `
    <div class="od-event">
      <div class="od-event-top">
        <span class="od-event-badge ${evClass[e.type]}">${evLabel[e.type]}</span>
        <span class="od-event-time">${e.time}</span>
      </div>
      <div class="od-event-title">${e.title}</div>
      <div class="od-event-date">${e.date}</div>
      <div class="od-event-desc">${e.desc}</div>
      <div class="od-event-footer">
        ${hasCapacity ? `<span class="ev-spots${isFull ? ' ev-spots-full' : ''}">${isFull ? 'Full' : spots + ' spot' + (spots === 1 ? '' : 's') + ' left'}</span>` : '<span class="ev-spots-open">Open</span>'}
        <button class="rsvp-btn${userGoing ? ' rsvp-btn-going' : ''}${isFull && !userGoing ? ' rsvp-btn-full' : ''}"
          onclick="toggleRsvp('${e.id}', '${org.id}', this)">
          ${userGoing ? '✓ Going' : isFull ? 'Full' : 'RSVP'}
        </button>
      </div>
    </div>
  `}).join('');

  const annCount = org.announcements ? org.announcements.length : 0;
  const evCount  = org.events ? org.events.length : 0;

  document.getElementById('page-org-detail').innerHTML = `
    <div class="page-hero-sm">
      <div class="page-hero-inner">
        <button class="org-detail-back" onclick="showPage('${fromPage}')">← Back</button>
        <h1 class="page-hero-title" style="margin-top:0.7rem">${org.emoji} <em>${org.name}</em></h1>
        <p class="page-hero-sub">${org.members} members · ${org.location}</p>
      </div>
    </div>
    <div class="org-detail-body">
      <div>
        <div class="od-tabs">
          <button class="od-tab active" onclick="switchOdTab('about', this)">About</button>
          <button class="od-tab" onclick="switchOdTab('announcements', this)">
            Announcements${annCount > 0 ? ` <span class="od-tab-badge">${annCount}</span>` : ''}
          </button>
          <button class="od-tab" onclick="switchOdTab('events', this)">
            Events &amp; Opportunities${evCount > 0 ? ` <span class="od-tab-badge">${evCount}</span>` : ''}
          </button>
        </div>

        <div class="od-tab-panel" id="od-panel-about">
          <p class="od-about">${org.about}</p>
        </div>

        <div class="od-tab-panel od-tab-panel-hidden" id="od-panel-announcements">
          ${annCount > 0 ? `<div class="od-announcements">${org.announcements.map(a => `
            <div class="od-announcement">
              <div class="od-ann-header">
                <div class="od-ann-title">${a.title}</div>
                <div class="od-ann-date">${a.date}</div>
              </div>
              <p class="od-ann-body">${a.body}</p>
            </div>`).join('')}</div>`
          : '<p class="od-empty">No announcements yet.</p>'}
        </div>

        <div class="od-tab-panel od-tab-panel-hidden" id="od-panel-events">
          <div class="od-events">${evHTML}</div>
        </div>

      </div>
      <aside class="org-detail-aside">
        <div class="od-aside-box">
          <div class="od-aside-emoji">${org.emoji}</div>
          <div class="od-aside-name">${org.name}</div>
          <div class="od-aside-count">${org.members} members</div>
          <button class="od-aside-join${joinedOrgs.has(org.id) ? ' od-aside-join-joined' : ''}" id="od-join-btn" onclick="toggleJoinOrg('${org.name}', this)">${joinedOrgs.has(org.id) ? '✓ Member' : 'Request to Join'}</button>
          <button class="od-aside-msg"  onclick="respondToPost('${org.name}', 'Message from ${org.name} page')">Send a Message</button>
          <button class="od-aside-report" onclick="openReport('org','${org.name}')">⚑ Report this Organization</button>
          <div class="od-aside-lbl">Location</div>
          <div class="od-aside-val">${org.location}</div>
          <div class="od-aside-lbl">Contact</div>
          <div class="od-aside-val">${org.contact}</div>
          <div class="od-aside-lbl">Type</div>
          <div class="od-aside-val">${isLocal ? '📍 Local' : '🌐 Global'}</div>
        </div>
      </aside>
    </div>
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-logo">Cariño</div>
        <div class="footer-mid"><span>Tenderness in action.</span></div>
        <div class="footer-party">Brought to you by <a href="https://theparty.red" target="_blank">The Red Party</a></div>
      </div>
    </footer>
  `;

  showPage('org-detail');
}


/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  buildChains();
  showPage('board');
  setTimeout(() => openThread(0), 100);
});


/* ══════════════════════════════════════
   PROFILE DROPDOWN
══════════════════════════════════════ */
function toggleProfileMenu(e) {
  e.stopPropagation();
  document.getElementById('profile-dropdown').classList.toggle('open');
}
function closeProfileMenu() {
  document.getElementById('profile-dropdown').classList.remove('open');
}
document.addEventListener('click', () => closeProfileMenu());


/* ══════════════════════════════════════
   PROFILE MODAL (quick card)
══════════════════════════════════════ */
function openProfileModal(name, loc, bio, helps, vouches) {
  const initial = name.charAt(0).toUpperCase();
  const body = `
    <div class="profile-modal-wrap">
      <div class="profile-modal-avatar">${initial}</div>
      <div>
        <div class="profile-modal-name">${name}</div>
        <div class="profile-modal-loc">📍 ${loc}</div>
        <div class="profile-modal-bio">${bio}</div>
      </div>
    </div>
    <div class="profile-modal-stats">
      <div class="profile-modal-stat">
        <span class="profile-modal-stat-num">${helps}</span>
        <span class="profile-modal-stat-label">Helps given</span>
      </div>
      <div class="profile-modal-stat">
        <span class="profile-modal-stat-num">${vouches}</span>
        <span class="profile-modal-stat-label">Vouches</span>
      </div>
    </div>
    <div class="profile-modal-actions">
      <button class="profile-modal-btn-primary" onclick="closeModal(); showPage('inbox')">Send Message</button>
      <button class="profile-modal-btn-secondary" onclick="closeModal(); showPage('profile')">View Full Profile →</button>
    </div>
  `;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('overlay').classList.add('open');
}


/* ══════════════════════════════════════
   INBOX
══════════════════════════════════════ */
const inboxThreads = [
  {
    name: 'Marcus T.', initial: 'M', re: 'Re: Grocery runs for seniors', status: 'active',
    messages: [
      { mine: false, text: 'Hey, I saw your post about grocery runs. My neighbor is 84 and really struggling to get out. Would you be able to help her?', time: '2 days ago' },
      { mine: true,  text: 'Of course — that\'s exactly what I\'m here for. What area is she in and what days work best?', time: '2 days ago' },
      { mine: false, text: 'She\'s in Northside, near the community center. Weekends are best for her.', time: '1 day ago' },
      { mine: true,  text: 'Perfect, I\'m in Northside too. I\'ll reach out Saturday morning. What\'s the best way to coordinate with her?', time: '1 day ago' },
      { mine: false, text: 'Thanks for the help today — you really came through. She was so grateful.', time: '2 hours ago' },
    ]
  },
  {
    name: 'Rosa L.', initial: 'R', re: 'Re: Ride to medical appointment', status: 'active',
    messages: [
      { mine: false, text: 'Hi — I need a ride to a specialist downtown next Tuesday morning, around 9am. I saw your post about rides. Are you available?', time: '2 days ago' },
      { mine: true,  text: 'Yes I can do that. Where are you coming from?', time: '2 days ago' },
      { mine: false, text: 'Southside, near the park. It shouldn\'t take long, the appointment is about an hour.', time: '2 days ago' },
      { mine: false, text: 'Are you still available Tuesday morning?', time: '1 day ago' },
    ]
  },
  {
    name: 'Priya S.', initial: 'P', re: 'Re: Community garden shed', status: 'pending-completion',
    messages: [
      { mine: false, text: 'Hello! Our community garden shed roof is leaking badly. I saw your post about home repairs. Would you be able to take a look?', time: '1 week ago' },
      { mine: true,  text: 'Absolutely. I can come by this weekend. What time works?', time: '1 week ago' },
      { mine: false, text: 'Saturday afternoon? Around 2pm?', time: '6 days ago' },
      { mine: true,  text: 'Saturday at 2 works. I\'ll bring what I need.', time: '6 days ago' },
      { mine: false, text: 'The shed looks amazing, thank you so much', time: '3 days ago' },
    ]
  },
  {
    name: 'Keisha M.', initial: 'K', re: 'Re: Home repairs', status: 'active',
    messages: [
      { mine: false, text: 'Hi, I saw your post about home repairs — I have a leaky faucet that\'s been dripping for months. I can\'t afford a plumber right now. Would you be able to help?', time: '5 days ago' },
    ]
  },
];

let activeThread = 0;
const joinedOrgs = new Set(['tool-library', 'tech-collective']); // Alex M.'s memberships

function toggleJoinOrg(orgName, btn) {
  if (joinedOrgs.has(orgName)) return; // already a member
  if (btn.classList.contains('od-aside-join-pending')) return; // already pending

  // Open request modal
  const body = `
    <div class="modal-title">Request to Join</div>
    <p class="modal-sub">You're requesting to join <strong>${orgName}</strong>. Tell them why you belong here.</p>
    <div class="form-field">
      <label class="form-label">Why do you fit in here?</label>
      <textarea class="form-textarea" id="join-request-msg" placeholder="Tell ${orgName} how your values and skills align with what they're doing. Be specific — this is your introduction." rows="5"></textarea>
    </div>
    <p class="form-hint">This message goes directly to the group's admins. They'll review your request and get back to you.</p>
    <button class="form-submit" onclick="submitJoinRequest('${orgName}')">Send Request →</button>
  `;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('overlay').classList.add('open');
  setTimeout(() => document.getElementById('join-request-msg')?.focus(), 100);
}

function submitJoinRequest(orgName) {
  const msg = document.getElementById('join-request-msg')?.value.trim();
  if (!msg) {
    showToast('Tell them why you fit in here first.');
    return;
  }
  closeModal();
  // Find the join button and set it to pending
  const btn = document.getElementById('od-join-btn');
  if (btn) {
    btn.textContent = '⧖ Request Pending';
    btn.classList.add('od-aside-join-pending');
  }
  showToast(`Request sent to ${orgName}`);
}

function respondToPost(posterName, postTitle) {
  if (!loggedIn) { requireAuth(() => respondToPost(posterName, postTitle)); return; }
  const initial = posterName.charAt(0).toUpperCase();

  // Check if a thread with this person already exists
  const existing = inboxThreads.findIndex(t => t.name === posterName);
  if (existing !== -1) {
    showPage('inbox');
    openThread(existing);
    const input = document.getElementById('inbox-compose-input');
    input.focus();
    input.placeholder = `Re: ${postTitle}`;
    return;
  }

  // Create a new thread at the top
  const newThread = {
    name: posterName,
    initial,
    re: `Re: ${postTitle}`,
    messages: []
  };
  inboxThreads.unshift(newThread);

  // Add thread to the sidebar list
  const threadList = document.getElementById('inbox-thread-list');
  const el = document.createElement('div');
  el.className = 'inbox-thread active';
  el.onclick = () => openThread(0);
  el.innerHTML = `
    <div class="inbox-thread-avatar">${initial}</div>
    <div class="inbox-thread-info">
      <div class="inbox-thread-name">${posterName}</div>
      <div class="inbox-thread-preview">Re: ${postTitle}</div>
    </div>
    <div class="inbox-thread-meta">
      <div class="inbox-thread-time">Now</div>
    </div>
  `;
  // Deactivate all others and insert at top
  threadList.querySelectorAll('.inbox-thread').forEach(t => t.classList.remove('active'));
  threadList.insertBefore(el, threadList.firstChild);

  // Shift existing thread indices
  threadList.querySelectorAll('.inbox-thread:not(:first-child)').forEach((t, i) => {
    t.onclick = () => openThread(i + 1);
  });

  showPage('inbox');
  activeThread = 0;

  // Update header
  document.querySelector('.inbox-thread-hd-avatar').textContent = initial;
  document.querySelector('.inbox-thread-hd-name').textContent = posterName;
  document.querySelector('.inbox-thread-hd-re').textContent = `Re: ${postTitle}`;
  document.getElementById('inbox-messages').innerHTML = '';

  // Focus and hint compose box
  const input = document.getElementById('inbox-compose-input');
  input.placeholder = `Message ${posterName} about "${postTitle}"…`;
  setTimeout(() => input.focus(), 100);
}



function confirmMarkDone(idx) {
  const thread = inboxThreads[idx];
  const body = `
    <div class="modal-title">Mark as Done?</div>
    <p class="modal-sub">You're marking your interaction with <strong>${thread.name}</strong> as complete.</p>
    <p class="form-hint">Both of you will be asked to confirm. Once confirmed, thank you notes and vouching unlock.</p>
    <button class="form-submit" onclick="markDone(${idx})">Yes, we're done →</button>
  `;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('overlay').classList.add('open');
}

function markDone(idx) {
  closeModal();
  const thread = inboxThreads[idx];
  thread.status = 'complete';
  thread.messages.push({ system: true, complete: true, text: 'This interaction is complete. You can leave a thank you note or vouch for each other below.' });
  openThread(idx);
  showToast('★ Marked as done. Thank you notes and vouching are now unlocked.');
}

function openThankYouModal(idx) {
  const thread = inboxThreads[idx];
  const body = `
    <div class="modal-title">Leave a Thank You Note</div>
    <p class="modal-sub">For <strong>${thread.name}</strong>. Short, human, honest.</p>
    <div class="form-field">
      <textarea class="form-textarea" id="thankyou-text" placeholder="What did they do? What did it mean to you?" rows="4"></textarea>
    </div>
    <div class="form-field">
      <label class="form-label">Post as</label>
      <div class="signup-options" style="gap:0.35rem">
        <label class="signup-option" style="padding:0.5rem 0.75rem">
          <input type="radio" name="ty-anon" value="named" checked>
          <span style="font-size:0.72rem">My name (${currentUser ? currentUser.name : 'You'})</span>
        </label>
        <label class="signup-option" style="padding:0.5rem 0.75rem">
          <input type="radio" name="ty-anon" value="anon">
          <span style="font-size:0.72rem">Community member (anonymous)</span>
        </label>
      </div>
    </div>
    <p class="form-hint">The recipient chooses whether to display it on their profile. Once posted you can't edit it.</p>
    <button class="form-submit" onclick="submitThankYou(${idx})">Send Note →</button>
  `;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('overlay').classList.add('open');
}

function submitThankYou(idx) {
  const text = document.getElementById('thankyou-text')?.value.trim();
  if (!text) { showToast('Write something first.'); return; }
  const thread = inboxThreads[idx];
  closeModal();
  showToast('Thank you note sent to ' + thread.name + '.');
}

function openVouchModal(idx) {
  const thread = inboxThreads[idx];
  const body = `
    <div class="modal-title">Vouch for ${thread.name}</div>
    <p class="modal-sub">A vouch says: I have worked with this person and I stand behind them.</p>
    <div class="form-field">
      <label class="form-label">Add a note <span style="opacity:0.5;font-weight:400;text-transform:none;letter-spacing:0">(optional but meaningful)</span></label>
      <textarea class="form-textarea" id="vouch-note" placeholder="What was it like working with them? What would you want others to know?" rows="3"></textarea>
    </div>
    <p class="form-hint">Vouches are visible on their public profile. You can only vouch once per completed interaction.</p>
    <button class="form-submit" onclick="submitVouch(${idx})">Vouch for ${thread.name} →</button>
  `;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('overlay').classList.add('open');
}

function submitVouch(idx) {
  const thread = inboxThreads[idx];
  closeModal();
  showToast('★ You vouched for ' + thread.name + '. It will appear on their profile.');
}

function openThread(idx) {
  activeThread = idx;
  document.querySelectorAll('.inbox-thread').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  const dot = document.querySelectorAll('.inbox-unread-dot')[idx];
  if (dot) dot.remove();

  const thread = inboxThreads[idx];
  document.querySelector('.inbox-thread-hd-avatar').textContent = thread.initial;
  document.querySelector('.inbox-thread-hd-name').textContent = thread.name;
  document.querySelector('.inbox-thread-hd-re').textContent = thread.re;

  // Render header action button based on status
  const hdInfo = document.querySelector('.inbox-thread-hd-info');
  let hdAction = '';
  if (thread.status === 'active' || thread.status === 'pending-completion') {
    hdAction = `<button class="inbox-mark-done-btn" onclick="confirmMarkDone(${idx})">Mark as Done</button>`;
  } else if (thread.status === 'complete') {
    hdAction = `<span class="inbox-complete-badge">✓ Complete</span>`;
  }
  document.querySelector('.inbox-thread-hd').innerHTML = `
    <div class="inbox-thread-hd-avatar">${thread.initial}</div>
    <div class="inbox-thread-hd-info">
      <div class="inbox-thread-hd-name">${thread.name}</div>
      <div class="inbox-thread-hd-re">${thread.re}</div>
    </div>
    ${hdAction}
  `;

  // Add system message for pending-completion
  const msgs = [...thread.messages];
  if (thread.status === 'pending-completion' && !msgs.find(m => m.system)) {
    msgs.push({ system: true, text: `${thread.name} said the help is done. Mark as complete to unlock thank you notes and vouching.` });
  }
  if (thread.status === 'complete' && !msgs.find(m => m.system && m.complete)) {
    msgs.push({ system: true, complete: true, text: 'This interaction is complete. You can leave a thank you note or vouch for each other below.' });
  }

  const container = document.getElementById('inbox-messages');
  container.innerHTML = msgs.map(m => m.system ? `
    <div class="inbox-msg-system">${m.text}</div>
  ` : `
    <div class="inbox-msg ${m.mine ? 'mine' : 'theirs'}">
      <div class="inbox-msg-bubble">${m.text}</div>
      <div class="inbox-msg-time">${m.time}</div>
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;

  // Render compose or post-completion actions
  const compose = document.getElementById('inbox-compose');
  if (thread.status === 'complete') {
    compose.innerHTML = `
      <div class="inbox-post-completion">
        <p class="inbox-completion-label">Interaction complete —</p>
        <button class="inbox-completion-btn" onclick="openThankYouModal(${idx})">Leave a Thank You Note</button>
        <button class="inbox-completion-btn inbox-vouch-btn" onclick="openVouchModal(${idx})">Vouch for ${thread.name}</button>
      </div>
    `;
  } else {
    compose.innerHTML = `
      <textarea class="inbox-compose-input" id="inbox-compose-input" placeholder="Write a message…" rows="2"></textarea>
      <button class="inbox-compose-send" onclick="sendMessage()">Send →</button>
    `;
  }
}

function sendMessage() {
  const input = document.getElementById('inbox-compose-input');
  const text = input.value.trim();
  if (!text) return;
  const thread = inboxThreads[activeThread];
  thread.messages.push({ mine: true, text, time: 'Just now' });
  input.value = '';
  openThread(activeThread);
}



/* Make usernames on board cards clickable */
function attachCardProfileClicks() {
  document.querySelectorAll('.card-name').forEach(el => {
    el.style.cursor = 'pointer';
    el.style.textDecoration = 'underline dotted';
    el.onclick = (e) => {
      e.stopPropagation();
      const name = el.textContent;
      openProfileModal(name, 'Local area', 'Member of the Cariño community.', Math.floor(Math.random()*10)+1, Math.floor(Math.random()*8));
    };
  });
}
