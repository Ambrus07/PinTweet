const API_BASE = 'http://127.0.0.1:8000/api';

function getTokens() {
  return {
    access: localStorage.getItem('access'),
    refresh: localStorage.getItem('refresh'),
  };
}

function setTokens({ access, refresh }) {
  if (access) localStorage.setItem('access', access);
  if (refresh) localStorage.setItem('refresh', refresh);
}

function clearTokens() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
}

async function refreshAccessToken() {
  const { refresh } = getTokens();
  if (!refresh) return null;
  const res = await fetch(`${API_BASE}/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) { clearTokens(); return null; }
  const data = await res.json();
  setTokens({ access: data.access });
  return data.access;
}

export async function apiFetch(path, options = {}) {
  const { access } = getTokens();
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (access) headers['Authorization'] = `Bearer ${access}`;

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${newAccess}` },
      });
    }
  }
  return res;
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Hibás e-mail vagy jelszó.');
  const data = await res.json();
  setTokens(data);
  const profileRes = await apiFetch('/auth/profile/');
  if (!profileRes.ok) throw new Error('Nem sikerült betölteni a profilt.');
  return profileRes.json();
}

export async function register(username, email, password) {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(Object.values(err).flat().join(' ') || 'Hiba a regisztráció során.');
  }
  const data = await res.json();
  setTokens(data);
  return data.user;
}

export function logout() {
  clearTokens();
}

export async function fetchPosts() {
  const res = await apiFetch('/posts/');
  if (!res.ok) throw new Error('Nem sikerült betölteni a feedet.');
  return res.json();
}

export async function createPost({ title = "", description = "", image = null }) {
  const formData = new FormData();

  formData.append("title", title);
  formData.append("description", description);

  if (image) {
    formData.append("image", image);
  }

  const res = await apiFetch("/posts/", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      Object.values(err).flat().join(" ") || "Hiba a posztolás során."
    );
  }

  return res.json();
}

export async function fetchBoards() {
  const res = await apiFetch('/boards/');
  if (!res.ok) throw new Error('Nem sikerült betölteni a táblákat.');
  return res.json();
}

export async function createBoard(name) {
  const res = await apiFetch('/boards/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(Object.values(err).flat().join(' ') || 'Hiba a tábla létrehozása során.');
  }
  return res.json();
}


export async function deletePost(id) {
  const res = await apiFetch(`/posts/${id}/`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Nem sikerült törölni a posztot.");
  }

  return true;
}