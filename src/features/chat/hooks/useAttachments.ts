import { useEffect, useRef, useState } from 'react';

import type { Attachment } from '../types/chat';

export const MAX_FILE_SIZE = 2 * 1024 * 1024;

export interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Local-file previews via object URLs (revoked on remove/unmount); data URLs on send so they persist. */
export function useAttachments() {
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.previewUrl)), []);

  const add = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    const tooBig = picked.filter((file) => file.size > MAX_FILE_SIZE);
    setError(tooBig.length ? `${tooBig.map((f) => f.name).join(', ')} exceeds 2 MB` : null);

    const accepted = picked
      .filter((file) => file.size <= MAX_FILE_SIZE)
      .map((file) => ({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) }));
    setFiles((current) => [...current, ...accepted]);
  };

  const remove = (id: string) =>
    setFiles((current) => {
      const target = current.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((f) => f.id !== id);
    });

  const clear = () => {
    files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setError(null);
  };

  const toAttachments = (): Promise<Attachment[]> =>
    Promise.all(
      files.map(async ({ id, file }) => ({
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: await readAsDataUrl(file),
      }))
    );

  return { files, error, add, remove, clear, toAttachments };
}
