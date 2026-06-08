import { useState } from 'react';
import './App.css';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon:'ti-home',           label:'Főoldal',     page:'home'     },
  { icon:'ti-search',         label:'Felfedezés',  page:'explore'  },
  { icon:'ti-bell',           label:'Értesítések', page:'notifs'   },
  { icon:'ti-bookmark',       label:'Mentések',    page:'saved'    },
  { icon:'ti-layout-masonry', label:'Táblák',      page:'boards'   },
  { icon:'ti-message',        label:'Üzenetek',    page:'messages' },
  { icon:'ti-user',           label:'Profil',      page:'profile'  },
];

// ─── EMPTY STATE COMPONENT ───────────────────────────────────────────────────

function EmptyState({ icon, title, sub }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><i className={`ti ${icon}`}></i></div>
      <div className="empty-title">{title}</div>
      <div className="empty-sub">{sub}</div>
    </div>
  );
}

// ─── PAGES ───────────────────────────────────────────────────────────────────

function HomePage({ user }) {
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const handlePost = () => {
    if (!text.trim()) return;
    setText('');
    alert('Backend szükséges a közzétételhez!');
  };

  return (
    <>
      <div className="feed-header">
        <h2>Hírfolyam</h2>
        <div className="feed-tabs">
          {['Neked', 'Követett', 'Trend'].map((t, i) => (
            <button key={t} className={`feed-tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>{t}</button>
          ))}
        </div>
      </div>

      {/* Compose */}
      <div className="compose-box">
        <div className="avatar-sm">{user.initials}</div>
        <div className="compose-input">
          <textarea
            rows="2"
            placeholder="Mi jár a fejedben?"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div className="compose-actions">
            <div className="compose-tools">
              <i className="ti ti-photo" title="Kép feltöltése"></i>
              <i className="ti ti-layout-masonry" title="Pin hozzáadása"></i>
              <i className="ti ti-map-pin" title="Helyszín"></i>
              <i className="ti ti-mood-smile" title="Emoji"></i>
            </div>
            <button className="compose-post" onClick={handlePost}>Közzétesz</button>
          </div>
        </div>
      </div>

      {/* Feed — backend tölti majd */}
      <EmptyState
        icon="ti-news"
        title="A feed üres"
        sub="Csatlakoztasd a backendet a GET /api/feed végponton keresztül"
      />
    </>
  );
}

function ExplorePage() {
  const [search, setSearch] = useState('');

  return (
    <>
      <div className="feed-header">
        <h2>Felfedezés</h2>
        <div className="explore-search">
          <i className="ti ti-search"></i>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Keresés témák, emberek után..."
          />
        </div>
      </div>
      {/* TODO: GET /api/explore?q={search} */}
      <EmptyState
        icon="ti-search"
        title="Keresés"
        sub="Csatlakoztasd a backendet a GET /api/explore végponton keresztül"
      />
    </>
  );
}

function NotificationsPage() {
  const [activeChip, setActiveChip] = useState(0);
  return (
    <>
      <div className="feed-header"><h2>Értesítések</h2></div>
      <div className="notif-filter">
        {['Mind', 'Kedvelések', 'Követők', 'Hozzászólások'].map((c, i) => (
          <span key={c} className={`notif-chip${activeChip === i ? ' active' : ''}`} onClick={() => setActiveChip(i)}>{c}</span>
        ))}
      </div>
      {/* TODO: GET /api/notifications */}
      <EmptyState
        icon="ti-bell"
        title="Nincsenek értesítések"
        sub="Csatlakoztasd a backendet a GET /api/notifications végponton keresztül"
      />
    </>
  );
}

function SavedPage() {
  return (
    <>
      <div className="feed-header"><h2>Mentések</h2></div>
      {/* TODO: GET /api/saved */}
      <EmptyState
        icon="ti-bookmark"
        title="Nincsenek mentések"
        sub="Csatlakoztasd a backendet a GET /api/saved végponton keresztül"
      />
    </>
  );
}

function BoardsPage() {
  const [showNew, setShowNew] = useState(false);
  const [boardName, setBoardName] = useState('');

  const createBoard = () => {
    if (!boardName.trim()) return;
    setBoardName('');
    setShowNew(false);
    alert('Backend szükséges a tábla létrehozásához!');
  };

  return (
    <>
      <div className="feed-header">
        <h2>Táblák</h2>
        <button className="compose-post" style={{ marginTop: 12 }} onClick={() => setShowNew(!showNew)}>
          + Új tábla
        </button>
      </div>

      {showNew && (
        <div className="new-board-form">
          <input
            placeholder="Tábla neve..."
            value={boardName}
            onChange={e => setBoardName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createBoard()}
            autoFocus
          />
          <button className="compose-post" onClick={createBoard}>Létrehozás</button>
          <button className="btn-cancel" onClick={() => setShowNew(false)}>Mégsem</button>
        </div>
      )}

      {/* TODO: GET /api/boards */}
      <EmptyState
        icon="ti-layout-masonry"
        title="Nincsenek táblák"
        sub="Csatlakoztasd a backendet a GET /api/boards végponton keresztül"
      />
    </>
  );
}

function MessagesPage() {
  const [active, setActive] = useState(null);
  const [input, setInput]   = useState('');
  const [msgs, setMsgs]     = useState([]);

  const send = () => {
    if (!input.trim()) return;
    setMsgs([...msgs, { text: input, me: true }]);
    setInput('');
  };

  if (active) {
    return (
      <div className="chat-view">
        <div className="chat-header">
          <button className="back-btn" onClick={() => { setActive(null); setMsgs([]); }}>
            <i className="ti ti-arrow-left"></i>
          </button>
          <div className="tweet-avatar" style={{ background: '#3D6B9F', width: 38, height: 38, fontSize: 13 }}>
            {active.initials}
          </div>
          <div>
            <div className="tweet-name" style={{ fontSize: 14 }}>{active.name}</div>
            <div className="profile-handle" style={{ color: 'var(--muted)' }}>{active.handle}</div>
          </div>
        </div>
        <div className="chat-messages">
          {msgs.length === 0 && (
            <EmptyState icon="ti-message" title="Még nincs üzenet" sub="Küldj az első üzenetet!" />
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.me ? 'me' : 'them'}`}>{m.text}</div>
          ))}
        </div>
        <div className="chat-input-row">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Írj üzenetet..."
          />
          <button onClick={send} className="compose-post" style={{ padding: '10px 16px' }}>
            <i className="ti ti-send"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="feed-header"><h2>Üzenetek</h2></div>
      {/* TODO: GET /api/conversations */}
      <EmptyState
        icon="ti-message-2"
        title="Nincsenek üzenetek"
        sub="Csatlakoztasd a backendet a GET /api/conversations végponton keresztül"
      />
    </>
  );
}

function ProfilePage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <>
      <div className="profile-cover"></div>
      <div className="profile-section" style={{ position: 'relative' }}>
        <div className="profile-avatar-lg">{user.initials}</div>
        <button className="profile-edit-btn">Profil szerkesztése</button>
        <div className="profile-name-lg">{user.name}</div>
        <div className="profile-handle-lg">{user.handle}</div>
        <div className="profile-bio">— bio a backendből jön —</div>
        <div className="profile-stats">
          <div className="stat"><span className="stat-num">—</span><span className="stat-label">bejegyzés</span></div>
          <div className="stat"><span className="stat-num">—</span><span className="stat-label">követő</span></div>
          <div className="stat"><span className="stat-num">—</span><span className="stat-label">követett</span></div>
        </div>
      </div>
      <div className="feed-tabs" style={{ padding: '0 24px', borderBottom: '1px solid var(--border)' }}>
        {['Bejegyzések', 'Táblák', 'Kedvelések'].map((t, i) => (
          <button key={t} className={`feed-tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>{t}</button>
        ))}
      </div>
      <EmptyState
        icon="ti-user"
        title="Profil adatok"
        sub="Csatlakoztasd a backendet a GET /api/profile végponton keresztül"
      />
    </>
  );
}

// ─── AUTH PAGES ──────────────────────────────────────────────────────────────

function AuthLeft({ title, sub }) {
  return (
    <div className="auth-left">
      <div className="auth-brand">
        <div className="auth-logo-icon">🌊</div>
        <span className="auth-logo-text">Pin<em>Tweet</em></span>
      </div>
      <h1 className="auth-tagline">{title}</h1>
      <p className="auth-sub">{sub}</p>
      <div className="auth-preview-pins">
        {['#6B9FCC','#3D6B9F','#C4B8A8','#A8998A','#D6E8F7','#2C4A6E'].map((c, i) => (
          <div key={i} className="auth-pin-chip" style={{ background: c }}></div>
        ))}
      </div>
    </div>
  );
}

function LoginPage({ onLogin, onSwitch }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const submit = async () => {
    if (!email || !password) { setError('Töltsd ki az összes mezőt!'); return; }
    setError(''); setLoading(true);
    try {

      await new Promise(r => setTimeout(r, 800));
      const name = email.split('@')[0];
      const initials = name.slice(0, 2).toUpperCase();
      onLogin({ name, handle: `@${name}`, initials });
    } catch (err) {
      setError(err.message || 'Hiba történt a bejelentkezés során.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <AuthLeft
        title={"Fedezd fel.\nOszd meg.\nKapcsolódj."}
        sub="A közösségi platform, ahol a kreatív világ él."
      />
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-card-title">Bejelentkezés</h2>
          <p className="auth-card-sub">Üdvözlünk vissza! 👋</p>

          <div className="auth-social-row">
            <button className="auth-social-btn"><i className="ti ti-brand-google"></i> Google</button>
            <button className="auth-social-btn"><i className="ti ti-brand-apple"></i> Apple</button>
          </div>
          <div className="auth-divider"><span>vagy</span></div>

          <div className="auth-field">
            <label>E-mail cím</label>
            <div className="auth-input-wrap">
              <i className="ti ti-mail"></i>
              <input type="email" placeholder="nev@example.com" value={email}
                onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
          </div>

          <div className="auth-field">
            <label>Jelszó</label>
            <div className="auth-input-wrap">
              <i className="ti ti-lock"></i>
              <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
              <button className="auth-eye" onClick={() => setShowPw(!showPw)}>
                <i className={`ti ${showPw ? 'ti-eye-off' : 'ti-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="auth-row-between">
            <label className="auth-check"><input type="checkbox" /> Emlékezz rám</label>
            <span className="auth-link">Elfelejtett jelszó?</span>
          </div>

          {error && <div className="auth-error"><i className="ti ti-alert-circle"></i> {error}</div>}

          <button className={`auth-submit${loading ? ' loading' : ''}`} onClick={submit} disabled={loading}>
            {loading ? <><i className="ti ti-loader-2 spin"></i> Bejelentkezés...</> : 'Bejelentkezés'}
          </button>

          <p className="auth-switch">
            Még nincs fiókod? <span className="auth-link" onClick={onSwitch}>Regisztrálj!</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterPage({ onLogin, onSwitch }) {
  const [name, setName]         = useState('');
  const [handle, setHandle]     = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [agreed, setAgreed]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  const submit = async () => {
    if (!name || !email || !password) { setError('Töltsd ki az összes kötelező mezőt!'); return; }
    if (!agreed) { setError('El kell fogadnod a feltételeket!'); return; }
    setError(''); setLoading(true);
    try {

      await new Promise(r => setTimeout(r, 800));
      onLogin({ name, handle: handle ? `@${handle}` : `@${name.toLowerCase().replace(' ', '_')}`, initials });
    } catch (err) {
      setError(err.message || 'Hiba történt a regisztráció során.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <AuthLeft
        title={"Csatlakozz a\nkreatív közösséghez."}
        sub="Több ezer alkotó, fotós és designrajongó vár rád."
      />
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-card-title">Regisztráció</h2>
          <p className="auth-card-sub">Hozd létre a fiókodat!</p>

          <div className="auth-social-row">
            <button className="auth-social-btn"><i className="ti ti-brand-google"></i> Google</button>
            <button className="auth-social-btn"><i className="ti ti-brand-apple"></i> Apple</button>
          </div>
          <div className="auth-divider"><span>vagy</span></div>

          <div className="auth-two-col">
            <div className="auth-field">
              <label>Teljes név <span className="req">*</span></label>
              <div className="auth-input-wrap">
                <i className="ti ti-user"></i>
                <input type="text" placeholder="Kovács Vera" value={name} onChange={e => setName(e.target.value)} />
              </div>
            </div>
            <div className="auth-field">
              <label>Felhasználónév</label>
              <div className="auth-input-wrap">
                <span className="auth-at">@</span>
                <input type="text" placeholder="kovacs_vera" value={handle}
                  onChange={e => setHandle(e.target.value.replace('@', ''))} style={{ paddingLeft: 28 }} />
              </div>
            </div>
          </div>

          <div className="auth-field">
            <label>E-mail cím <span className="req">*</span></label>
            <div className="auth-input-wrap">
              <i className="ti ti-mail"></i>
              <input type="email" placeholder="nev@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="auth-field">
            <label>Jelszó <span className="req">*</span></label>
            <div className="auth-input-wrap">
              <i className="ti ti-lock"></i>
              <input type={showPw ? 'text' : 'password'} placeholder="Min. 8 karakter"
                value={password} onChange={e => setPassword(e.target.value)} />
              <button className="auth-eye" onClick={() => setShowPw(!showPw)}>
                <i className={`ti ${showPw ? 'ti-eye-off' : 'ti-eye'}`}></i>
              </button>
            </div>
            {password && (
              <div className="pw-strength">
                <div className="pw-bar" style={{
                  width: password.length < 6 ? '33%' : password.length < 10 ? '66%' : '100%',
                  background: password.length < 6 ? '#C0392B' : password.length < 10 ? '#E67E22' : '#27AE60'
                }}></div>
                <span>{password.length < 6 ? 'Gyenge' : password.length < 10 ? 'Közepes' : 'Erős'}</span>
              </div>
            )}
          </div>

          <label className="auth-check" style={{ marginBottom: 16 }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            Elfogadom a <span className="auth-link">Felhasználási feltételeket</span> és az <span className="auth-link">Adatvédelmi szabályzatot</span>
          </label>

          {error && <div className="auth-error"><i className="ti ti-alert-circle"></i> {error}</div>}

          <button className={`auth-submit${loading ? ' loading' : ''}`} onClick={submit} disabled={loading}>
            {loading ? <><i className="ti ti-loader-2 spin"></i> Regisztráció...</> : 'Regisztráció'}
          </button>

          <p className="auth-switch">
            Már van fiókod? <span className="auth-link" onClick={onSwitch}>Jelentkezz be!</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────

export default function App() {
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser]         = useState(null);
  const [page, setPage]         = useState('home');

  const handleLogin = (userData /*, token */) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setPage('home');
  };

  if (!user) {
    return authMode === 'login'
      ? <LoginPage    onLogin={handleLogin} onSwitch={() => setAuthMode('register')} />
      : <RegisterPage onLogin={handleLogin} onSwitch={() => setAuthMode('login')} />;
  }

  const pages = {
    home:     <HomePage     user={user} />,
    explore:  <ExplorePage  />,
    notifs:   <NotificationsPage />,
    saved:    <SavedPage    />,
    boards:   <BoardsPage   />,
    messages: <MessagesPage />,
    profile:  <ProfilePage  user={user} onLogout={handleLogout} />,
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="logo">
          <div className="logo-icon">🌊</div>
          Pin<span>Tweet</span>
        </div>
        <div className="nav-section">
          {NAV_ITEMS.map(item => (
            <div
              key={item.page}
              className={`nav-item${page === item.page ? ' active' : ''}`}
              onClick={() => setPage(item.page)}
            >
              <i className={`ti ${item.icon}`}></i>
              {item.label}
            </div>
          ))}
        </div>
        <button className="post-btn">+ Közzétesz</button>
        <div className="sidebar-footer" onClick={handleLogout} title="Kijelentkezés">
          <div className="avatar-sm">{user.initials}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className="profile-name">{user.name}</div>
            <div className="profile-handle">{user.handle}</div>
          </div>
          <i className="ti ti-logout" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}></i>
        </div>
      </div>

      <div className="main-feed">
        {pages[page]}
      </div>

      <div className="pinterest-panel">
        <div className="panel-header"><h3>Felfedezés</h3></div>
        {/* TODO: GET /api/explore/pins */}
        <div style={{ padding: 24 }}>
          <EmptyState icon="ti-layout-masonry" title="Pinek" sub="Backend szükséges" />
        </div>
      </div>
    </div>
  );
}
