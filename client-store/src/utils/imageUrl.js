import { baseURL } from '../api/axios';

export function imageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${baseURL}${path}`;
}
