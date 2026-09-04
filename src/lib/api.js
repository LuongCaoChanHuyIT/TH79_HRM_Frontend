const rawBase = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

// VITE_API_URL chỉ chứa origin backend, ví dụ https://api.hrm.daututh79.com
// Local dev để trống => Vite proxy /api -> http://localhost:5000.
export const API_ORIGIN = rawBase;

export function apiUrl(path = '') {
  const cleanPath = String(path || '');
  const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${API_ORIGIN}/api${normalized}`;
}

export async function api(path, options = {}) {
  const cleanPath = String(path || '');
  if (!cleanPath.startsWith('/')) throw new Error('Đường dẫn API không hợp lệ.');
  if (/\/(?:undefined|null)(?:\/|$|\?)/i.test(cleanPath)) {
    throw new Error('Thiếu mã định danh dữ liệu. Vui lòng tải lại danh sách trước khi mở chi tiết.');
  }

  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('th79_token') : null;
  const isForm = options.body instanceof FormData;
  const res = await fetch(apiUrl(cleanPath), {
    credentials: 'include',
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
      ...(options.headers || {})
    }
  });

  if (res.status === 204) return null;
  const type = res.headers.get('content-type') || '';
  if (!res.ok) {
    let payload = {};
    try {
      payload = type.includes('json') ? await res.json() : { message: await res.text() };
    } catch {}
    const err = new Error(payload.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return type.includes('json') ? res.json() : res.blob();
}

export const qs = params => {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) p.set(k, v);
  });
  return p.toString() ? `?${p}` : '';
};
