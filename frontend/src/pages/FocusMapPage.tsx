import React, { useState } from 'react';
import { Compass, Plus } from 'lucide-react';
import { LocationCard } from '../components/map/LocationCard';
import { CreateLocationModal } from '../components/map/CreateLocationModal';
import { EditLocationModal } from '../components/map/EditLocationModal';
import { Button } from '../components/ui/Button';
import type { LocationMapMetrics } from '../types';

interface FocusMapPageProps {
  locations: LocationMapMetrics[];
  onCreateLocation: (name: string) => Promise<void>;
  onUpdateLocation: (id: string, name: string) => Promise<void>;
  onDeleteLocation: (id: string) => Promise<void>;
  onSelectForSession: (id: string) => void;
}

export const FocusMapPage: React.FC<FocusMapPageProps> = ({
  locations,
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation,
  onSelectForSession,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationMapMetrics | null>(null);

  const handleDelete = async (loc: LocationMapMetrics) => {
    if (window.confirm(`Are you sure you want to remove "${loc.name}"? Past noise samples will be unassigned from this workspace.`)) {
      await onDeleteLocation(loc.id);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-forest-600 uppercase tracking-widest block">
            Places You Return To
          </span>
          <h1 className="text-3xl font-extrabold text-forest-950 tracking-tight mt-1">
            Focus Map
          </h1>
          <p className="text-sm text-sage-500 mt-0.5">
            A local picture of how each workspace tends to sound and feel over time.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateOpen(true)}
          icon={<Plus size={16} />}
        >
          Add Workspace
        </Button>
      </header>

      {/* Grid or Empty state */}
      {locations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              onEdit={(l) => setEditingLocation(l)}
              onDelete={handleDelete}
              onSelectForSession={onSelectForSession}
            />
          ))}
        </div>
      ) : (
        <div className="h-80 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-sage-300 p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mb-4">
            <Compass size={28} />
          </div>
          <h2 className="text-xl font-bold text-forest-950">Where do you focus?</h2>
          <p className="text-sm text-sage-500 max-w-sm mt-1.5 mb-6">
            Register workspaces like &quot;Desk&quot; or &quot;Library&quot; to correlate ambient calm with your focus blocks.
          </p>
          <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)} icon={<Plus size={16} />}>
            Add Your First Workspace
          </Button>
        </div>
      )}

      {/* Modals */}
      <CreateLocationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={onCreateLocation}
      />

      <EditLocationModal
        location={editingLocation}
        isOpen={editingLocation !== null}
        onClose={() => setEditingLocation(null)}
        onSubmit={onUpdateLocation}
      />
    </div>
  );
};
