const STORAGE_BASE = 'https://dev.melhem.app';

const resolveImageUrl = (imageKey: string) => {
  if (!imageKey) {
    return '';
  }

  if (/^https?:\/\//i.test(imageKey)) {
    return imageKey;
  }

  const base = STORAGE_BASE.replace(/\/+$/, '');
  const key = imageKey.replace(/^\/+/, '');

  return `${base}/${key}`;
};

const getImageUrl = (
  _bucketName: string,
  imageKey: string,
  _size: 256 | 512 | 1024 = 512,
) => resolveImageUrl(imageKey);

export default getImageUrl;
export { resolveImageUrl };
