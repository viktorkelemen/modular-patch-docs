import { useState, useEffect, useRef } from 'react';

interface Props {
  defaultName: string;
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function SavePatchDialog({ defaultName, open, onClose, onSave }: Props) {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [open, defaultName]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.3)' }}
         onClick={onClose}>
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-xl p-5 w-80 flex flex-col gap-3"
      >
        <div className="text-sm font-semibold text-neutral-700">Save Patch</div>
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Patch name"
          className="border rounded px-2 py-1.5 text-sm outline-none focus:border-blue-400"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
                  className="px-3 py-1 text-xs text-neutral-500 hover:text-neutral-700">
            Cancel
          </button>
          <button type="submit"
                  disabled={!name.trim()}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-40">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
