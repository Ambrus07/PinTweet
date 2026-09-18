import { useState, useEffect } from 'react';
import './App.css';
import {
  login,
  register,
  logout,
  fetchPosts,
  createPost,
  fetchBoards,
  createBoard,
  deletePost,
  updatePost,
  updateProfile,
  toggleLike,
  fetchComments,
  addComment,
  searchUsers,
  fetchConversations,
  startConversation,
  fetchConversationMessages,
  sendConversationMessage
} from './api';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: 'ti-home', label: 'Főoldal', page: 'home' },
  { icon: 'ti-search', label: 'Felfedezés', page: 'explore' },
  { icon: 'ti-bell', label: 'Értesítések', page: 'notifs' },
  { icon: 'ti-bookmark', label: 'Mentések', page: 'saved' },
  { icon: 'ti-layout-masonry', label: 'Táblák', page: 'boards' },
  { icon: 'ti-message', label: 'Üzenetek', page: 'messages' },
  { icon: 'ti-user', label: 'Profil', page: 'profile' },
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
  const [image, setImage] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handlePost = async () => {
    if (!text.trim() && !image) return;

    setPosting(true);
    setError('');

    try {
      const newPost = await createPost({
        description: text,
        image: image
      });

      console.log(newPost);

      setPosts([newPost, ...posts]);
      setText('');
      setImage(null);

    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };


  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deletePost(id);

      setPosts(posts.filter(post => post.id !== id));

    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditStart = (post) => {
    setEditingId(post.id);
    setEditText(post.description || '');
    setError('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleEditSave = async (id) => {
    setSavingEdit(true);
    setError('');
    try {
      const updated = await updatePost(id, { description: editText });
      setPosts(posts.map(post => post.id === id ? { ...post, ...updated } : post));
      setEditingId(null);
      setEditText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleLike = async (id) => {
    // optimistic update
    setPosts(posts.map(post => post.id === id
      ? {
          ...post,
          is_liked: !post.is_liked,
          likes_count: post.is_liked ? Math.max(0, post.likes_count - 1) : post.likes_count + 1,
        }
      : post
    ));
    try {
      const result = await toggleLike(id);
      setPosts(prev => prev.map(post => post.id === id
        ? { ...post, is_liked: result.liked, likes_count: result.likes_count }
        : post
      ));
    } catch (err) {
      // revert on failure
      setPosts(prev => prev.map(post => post.id === id
        ? {
            ...post,
            is_liked: !post.is_liked,
            likes_count: post.is_liked ? Math.max(0, post.likes_count - 1) : post.likes_count + 1,
          }
        : post
      ));
      setError(err.message);
    }
  };

  const handleToggleComments = async (id) => {
    setPosts(posts.map(post => post.id === id
      ? { ...post, commentsOpen: !post.commentsOpen }
      : post
    ));

    const post = posts.find(p => p.id === id);
    if (post && !post.commentsOpen && !post.commentsLoaded) {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, commentsLoading: true } : p));
      try {
        const comments = await fetchComments(id);
        setPosts(prev => prev.map(p => p.id === id
          ? { ...p, comments, commentsLoaded: true, commentsLoading: false }
          : p
        ));
      } catch (err) {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, commentsLoading: false } : p));
        setError(err.message);
      }
    }
  };

  const handleCommentTextChange = (id, value) => {
    setPosts(posts.map(post => post.id === id ? { ...post, commentDraft: value } : post));
  };

  const handleAddComment = async (id) => {
    const post = posts.find(p => p.id === id);
    const content = (post?.commentDraft || '').trim();
    if (!content) return;

    setPosts(prev => prev.map(p => p.id === id ? { ...p, commentPosting: true } : p));
    try {
      const newComment = await addComment(id, content);
      setPosts(prev => prev.map(p => p.id === id
        ? {
            ...p,
            comments: [newComment, ...(p.comments || [])],
            comments_count: p.comments_count + 1,
            commentDraft: '',
            commentPosting: false,
          }
        : p
      ));
    } catch (err) {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, commentPosting: false } : p));
      setError(err.message);
    }
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

      <div className="compose-box">
        <div className="avatar-sm">{user.initials}</div>
        <div className="compose-input">
          <textarea
            rows="2"
            placeholder="Mi jár a fejedben?"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          {image && (
            <div style={{ marginTop: 10 }}>
              <img
                src={URL.createObjectURL(image)}
                alt="preview"
                style={{
                  width: "200px",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "12px"
                }}
              />
            </div>
          )}
          <div className="compose-actions">
            <div className="compose-tools">
              <label className="photo-btn">
                <i className="ti ti-photo"></i>

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </label>
              <i className="ti ti-layout-masonry" title="Pin hozzáadása"></i>
              <i className="ti ti-map-pin" title="Helyszín"></i>
              <i className="ti ti-mood-smile" title="Emoji"></i>
            </div>
            <button className="compose-post" onClick={handlePost} disabled={posting}>
              {posting ? 'Közzététel...' : 'Közzétesz'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="auth-error"><i className="ti ti-alert-circle"></i> {error}</div>}

      {loading ? (
        <EmptyState icon="ti-news" title="Betöltés..." sub="A feed betöltése folyamatban" />
      ) : posts.length === 0 ? (
        <EmptyState icon="ti-news" title="A feed üres" sub="Legyél te az első, aki posztol!" />
      ) : (
        posts.map(p => (
          <div
            key={p.id}
            className="compose-box"
            style={{ flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <div style={{ fontWeight: 600 }}>
              @{p.author_username}
            </div>

            {p.title && (
              <div style={{ fontWeight: 600, marginTop: 4 }}>
                {p.title}
              </div>
            )}

            {p.image && (
              <img
                src={p.image}
                alt=""
                className="post-image"
              />
            )}

            {editingId === p.id ? (
              <div className="post-edit-box">
                <textarea
                  className="post-edit-textarea"
                  rows="3"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  autoFocus
                />
                <div className="post-edit-actions">
                  <button
                    className="post-action-btn cancel"
                    onClick={handleEditCancel}
                    disabled={savingEdit}
                  >
                    <i className="ti ti-x"></i> Mégse
                  </button>
                  <button
                    className="post-action-btn save"
                    onClick={() => handleEditSave(p.id)}
                    disabled={savingEdit || !editText.trim()}
                  >
                    <i className="ti ti-check"></i> {savingEdit ? 'Mentés...' : 'Mentés'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 10 }}>
                {p.description}
              </div>
            )}

            {Number(p.author) === Number(user.id) && editingId !== p.id && (
              <div className="post-card-actions">
                <button
                  className="post-action-btn edit"
                  onClick={() => handleEditStart(p)}
                >
                  <i className="ti ti-pencil"></i> Szerkesztés
                </button>

                <button
                  className="post-action-btn delete"
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                >
                  <i className="ti ti-trash"></i> {deletingId === p.id ? 'Törlés...' : 'Törlés'}
                </button>
              </div>
            )}

            <div className="post-engagement">
              <button
                className={`engagement-btn like${p.is_liked ? ' active' : ''}`}
                onClick={() => handleToggleLike(p.id)}
              >
                <i className={`ti ${p.is_liked ? 'ti-heart-filled' : 'ti-heart'}`}></i>
                {p.likes_count > 0 ? p.likes_count : ''} Kedvelés
              </button>

              <button
                className={`engagement-btn comment${p.commentsOpen ? ' active' : ''}`}
                onClick={() => handleToggleComments(p.id)}
              >
                <i className="ti ti-message-circle"></i>
                {p.comments_count > 0 ? p.comments_count : ''} Hozzászólás
              </button>
            </div>

            {p.commentsOpen && (
              <div className="comment-section">
                <div className="comment-input-row">
                  <div className="avatar-sm">{user.initials}</div>
                  <input
                    type="text"
                    placeholder="Írj hozzászólást..."
                    value={p.commentDraft || ''}
                    onChange={e => handleCommentTextChange(p.id, e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddComment(p.id)}
                  />
                  <button
                    className="comment-send-btn"
                    onClick={() => handleAddComment(p.id)}
                    disabled={p.commentPosting || !(p.commentDraft || '').trim()}
                  >
                    <i className="ti ti-send"></i>
                  </button>
                </div>

                {p.commentsLoading ? (
                  <div className="comment-loading">Betöltés...</div>
                ) : (
                  (p.comments || []).map(c => (
                    <div key={c.id} className="comment-item">
                      <div className="avatar-sm small">{(c.username || '?').slice(0, 2).toUpperCase()}</div>
                      <div className="comment-body">
                        <span className="comment-author">@{c.username}</span>
                        <span className="comment-text">{c.content}</span>
                      </div>
                    </div>
                  ))
                )}

                {p.commentsLoaded && (p.comments || []).length === 0 && !p.commentsLoading && (
                  <div className="comment-empty">Még nincs hozzászólás. Legyél te az első!</div>
                )}
              </div>
            )}

          </div>
        ))
      )}
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
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBoards()
      .then(setBoards)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateBoard = async () => {
    if (!boardName.trim()) return;
    try {
      const newBoard = await createBoard(boardName);
      setBoards([newBoard, ...boards]);
      setBoardName('');
      setShowNew(false);
    } catch (err) {
      setError(err.message);
    }
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
            onKeyDown={e => e.key === 'Enter' && handleCreateBoard()}
            autoFocus
          />
          <button className="compose-post" onClick={handleCreateBoard}>Létrehozás</button>
          <button className="btn-cancel" onClick={() => setShowNew(false)}>Mégsem</button>
        </div>
      )}

      {error && <div className="auth-error"><i className="ti ti-alert-circle"></i> {error}</div>}

      {loading ? (
        <EmptyState icon="ti-layout-masonry" title="Betöltés..." sub="A táblák betöltése folyamatban" />
      ) : boards.length === 0 ? (
        <EmptyState icon="ti-layout-masonry" title="Nincsenek táblák" sub="Hozd létre az elsőt a + Új tábla gombbal!" />
      ) : (
        boards.map(b => (
          <div key={b.id} className="compose-box">
            <div style={{ fontWeight: 600 }}>{b.name}</div>
          </div>
        ))
      )}
    </>
  );
}

function MessagesPage({ user }) {
  const [conversations, setConversations] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [active, setActive] = useState(null); // { id, other }
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadConversations = async () => {
    setLoadingConvos(true);
    try {
      const data = await fetchConversations();
      setConversations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingConvos(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const otherOf = (conv) =>
    (conv.participants || []).find(p => Number(p.user) !== Number(user.id)) || {};

  const openConversation = async (conv) => {
    const other = otherOf(conv);
    setActive({ id: conv.id, other });
    setMsgs([]);
    setLoadingMsgs(true);
    try {
      const data = await fetchConversationMessages(conv.id);
      setMsgs(data);
      loadConversations(); // frissítjük az olvasatlan számot a listában
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const send = async () => {
    if (!input.trim() || !active) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    try {
      const newMsg = await sendConversationMessage(active.id, content);
      setMsgs(prev => [...prev, newMsg]);
      loadConversations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const runSearch = async (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await searchUsers(q.trim());
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const startChat = async (targetUser) => {
    try {
      const conv = await startConversation(targetUser.id);
      setSearchOpen(false);
      setQuery('');
      setResults([]);
      await loadConversations();
      openConversation(conv);
    } catch (err) {
      setError(err.message);
    }
  };

  if (active) {
    return (
      <div className="chat-view">
        <div className="chat-header">
          <button className="back-btn" onClick={() => { setActive(null); setMsgs([]); }}>
            <i className="ti ti-arrow-left"></i>
          </button>
          <div className="tweet-avatar" style={{ background: '#3D6B9F', width: 38, height: 38, fontSize: 13 }}>
            {(active.other.username || '?').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="tweet-name" style={{ fontSize: 14 }}>{active.other.username}</div>
            <div className="profile-handle" style={{ color: 'var(--muted)' }}>@{active.other.username}</div>
          </div>
        </div>
        <div className="chat-messages">
          {loadingMsgs ? (
            <EmptyState icon="ti-message" title="Betöltés..." sub="Az üzenetek betöltése folyamatban" />
          ) : msgs.length === 0 ? (
            <EmptyState icon="ti-message" title="Még nincs üzenet" sub="Küldj az első üzenetet!" />
          ) : (
            msgs.map((m) => (
              <div
                key={m.id}
                className={`chat-bubble ${Number(m.sender) === Number(user.id) ? 'me' : 'them'}`}
              >
                {m.content}
              </div>
            ))
          )}
        </div>
        <div className="chat-input-row">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Írj üzenetet..."
            disabled={sending}
          />
          <button onClick={send} className="compose-post" style={{ padding: '10px 16px' }} disabled={sending || !input.trim()}>
            <i className="ti ti-send"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="feed-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>Üzenetek</h2>
        <button className="compose-post" style={{ padding: '8px 16px' }} onClick={() => setSearchOpen(o => !o)}>
          <i className="ti ti-plus"></i> Új üzenet
        </button>
      </div>

      {error && <div className="auth-error" style={{ margin: '0 20px' }}><i className="ti ti-alert-circle"></i> {error}</div>}

      {searchOpen && (
        <div className="message-search-box">
          <input
            autoFocus
            type="text"
            placeholder="Felhasználónév keresése..."
            value={query}
            onChange={e => runSearch(e.target.value)}
          />
          {searching && <div className="comment-loading">Keresés...</div>}
          {!searching && query && results.length === 0 && (
            <div className="comment-empty">Nincs ilyen felhasználó.</div>
          )}
          {results.map(u => (
            <div key={u.id} className="message-search-result" onClick={() => startChat(u)}>
              <div className="avatar-sm small">{u.username.slice(0, 2).toUpperCase()}</div>
              <span>@{u.username}</span>
            </div>
          ))}
        </div>
      )}

      {loadingConvos ? (
        <EmptyState icon="ti-message-2" title="Betöltés..." sub="A beszélgetések betöltése folyamatban" />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon="ti-message-2"
          title="Nincsenek üzenetek"
          sub="Kattints az 'Új üzenet' gombra egy beszélgetés indításához"
        />
      ) : (
        <div className="conversation-list">
          {conversations.map(conv => {
            const other = otherOf(conv);
            return (
              <div key={conv.id} className="conversation-item" onClick={() => openConversation(conv)}>
                <div className="avatar-sm">{(other.username || '?').slice(0, 2).toUpperCase()}</div>
                <div className="conversation-info">
                  <div className="conversation-name">
                    @{other.username}
                    {conv.unread_count > 0 && <span className="unread-badge">{conv.unread_count}</span>}
                  </div>
                  <div className="conversation-preview">
                    {conv.last_message ? conv.last_message.content : 'Nincs még üzenet'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function ProfilePage({ user, onLogout, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const avatarPreview = avatarFile ? URL.createObjectURL(avatarFile) : user.avatar;
  const coverPreview = coverFile ? URL.createObjectURL(coverFile) : user.cover_image;

  const startEdit = () => {
    setBio(user.bio || '');
    setAvatarFile(null);
    setCoverFile(null);
    setError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError('');
  };

  const saveEdit = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateProfile({ bio, avatar: avatarFile, cover_image: coverFile });
      onUpdateUser({
        bio: updated.bio,
        avatar: updated.avatar || user.avatar,
        cover_image: updated.cover_image || user.cover_image,
      });
      setEditing(false);
      setAvatarFile(null);
      setCoverFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="profile-cover"
        style={coverPreview ? {
          backgroundImage: `url(${coverPreview})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {editing && (
          <label className="profile-cover-upload">
            <i className="ti ti-camera"></i> Borítókép módosítása
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={e => setCoverFile(e.target.files[0])}
            />
          </label>
        )}
      </div>
      <div className="profile-section" style={{ position: 'relative' }}>
        <div className="profile-avatar-wrap">
          {avatarPreview ? (
            <img className="profile-avatar-lg" src={avatarPreview} alt="" />
          ) : (
            <div className="profile-avatar-lg">{user.initials}</div>
          )}
          {editing && (
            <label className="profile-avatar-upload-btn" title="Profilkép módosítása">
              <i className="ti ti-camera"></i>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={e => setAvatarFile(e.target.files[0])}
              />
            </label>
          )}
        </div>

        {!editing && (
          <button className="profile-edit-btn" onClick={startEdit}>
            <i className="ti ti-pencil"></i> Profil szerkesztése
          </button>
        )}

        <div className="profile-name-lg">{user.name}</div>
        <div className="profile-handle-lg">{user.handle}</div>

        {editing ? (
          <div className="profile-edit-form">
            <label className="profile-edit-label">Bio</label>
            <textarea
              className="post-edit-textarea"
              rows="3"
              maxLength={500}
              placeholder="Mesélj magadról..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              autoFocus
            />
            <div className="profile-edit-charcount">{bio.length}/500</div>

            {error && <div className="auth-error"><i className="ti ti-alert-circle"></i> {error}</div>}

            <div className="post-edit-actions">
              <button className="post-action-btn cancel" onClick={cancelEdit} disabled={saving}>
                <i className="ti ti-x"></i> Mégse
              </button>
              <button className="post-action-btn save" onClick={saveEdit} disabled={saving}>
                <i className="ti ti-check"></i> {saving ? 'Mentés...' : 'Mentés'}
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-bio">
            {user.bio || 'Még nincs bio megadva.'}
          </div>
        )}

        <div className="profile-stats">
          <div className="stat"><span className="stat-num">—</span><span className="stat-label">bejegyzés</span></div>
          <div className="stat"><span className="stat-num">{user.followers_count ?? '—'}</span><span className="stat-label">követő</span></div>
          <div className="stat"><span className="stat-num">{user.following_count ?? '—'}</span><span className="stat-label">követett</span></div>
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
        {['#6B9FCC', '#3D6B9F', '#C4B8A8', '#A8998A', '#D6E8F7', '#2C4A6E'].map((c, i) => (
          <div key={i} className="auth-pin-chip" style={{ background: c }}></div>
        ))}
      </div>
    </div>
  );
}

function LoginPage({ onLogin, onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) { setError('Töltsd ki az összes mezőt!'); return; }
    setError(''); setLoading(true);
    try {
      const profileData = await login(email, password);
      const initials = (profileData.username || email).slice(0, 2).toUpperCase();

      onLogin({
        id: profileData.id,
        name: profileData.username,
        handle: `@${profileData.username}`,
        initials,
        bio: profileData.bio || '',
        avatar: profileData.avatar || null,
        cover_image: profileData.cover_image || null,
        followers_count: profileData.followers_count || 0,
        following_count: profileData.following_count || 0,
      });
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
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  const submit = async () => {
    if (!name || !email || !password) { setError('Töltsd ki az összes kötelező mezőt!'); return; }
    if (!agreed) { setError('El kell fogadnod a feltételeket!'); return; }
    setError(''); setLoading(true);
    try {
      const username = handle || name.toLowerCase().replace(/\s+/g, '_');
      const userData = await register(username, email, password);

      onLogin({
        id: userData.id,
        name: userData.username,
        handle: `@${userData.username}`,
        initials,
        bio: userData.bio || '',
        avatar: userData.avatar || null,
        cover_image: userData.cover_image || null,
        followers_count: userData.followers_count || 0,
        following_count: userData.following_count || 0,
      });
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
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');

  const handleLogin = (userData /*, token */) => {
    setUser(userData);
  };

  const handleUserUpdate = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setPage('home');
  };

  if (!user) {
    return authMode === 'login'
      ? <LoginPage onLogin={handleLogin} onSwitch={() => setAuthMode('register')} />
      : <RegisterPage onLogin={handleLogin} onSwitch={() => setAuthMode('login')} />;
  }

  const pages = {
    home: <HomePage user={user} />,
    explore: <ExplorePage />,
    notifs: <NotificationsPage />,
    saved: <SavedPage />,
    boards: <BoardsPage />,
    messages: <MessagesPage user={user} />,
    profile: <ProfilePage user={user} onLogout={handleLogout} onUpdateUser={handleUserUpdate} />,
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
