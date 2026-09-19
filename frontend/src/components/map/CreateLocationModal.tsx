import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface CreateLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export const CreateLocationModal: React.FC<CreateLocationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await onSubmit(name.trim());
      setName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Focus Workspace">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs text-sage-500 leading-relaxed">
          Name a physical space where you focus (e.g., &quot;Home Desk&quot;, &quot;Library 3rd Floor&quot;, &quot;Coffee Shop&quot;). No GPS is ever requested.
        </p>

        <div>
          <label htmlFor="location-name" className="text-xs font-semibold text-forest-900 block mb-1">
            Workspace Name
          </label>
          <input
            id="location-name"
            type="text"
            required
            maxLength={64}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quiet Study Nook"
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-sage-300 focus:outline-none focus:ring-2 focus:ring-forest-500"
            autoFocus
          />
        </div>

        {error && <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</div>}

        <div className="flex justify-end gap-2.5 mt-2">
          <Button type="button" variant="light" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={!name.trim() || loading}>
            {loading ? 'Adding...' : 'Add Workspace'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
