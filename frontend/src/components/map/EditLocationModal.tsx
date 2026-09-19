import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { LocationMapMetrics } from '../../types';

interface EditLocationModalProps {
  location: LocationMapMetrics | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, newName: string) => Promise<void>;
}

export const EditLocationModal: React.FC<EditLocationModalProps> = ({
  location,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location) {
      setName(location.name);
      setError(null);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !name.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await onSubmit(location.id, name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Workspace Name">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="edit-location-name" className="text-xs font-semibold text-forest-900 block mb-1">
            Workspace Name
          </label>
          <input
            id="edit-location-name"
            type="text"
            required
            maxLength={64}
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
