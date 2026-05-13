import { baseURL } from '../api/client';

export function imageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${baseURL}${path}`;
}
