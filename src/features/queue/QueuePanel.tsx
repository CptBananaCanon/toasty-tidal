import { memo } from 'react';
import { X } from 'lucide-react';
import { Track, QueueEntry, ContextSnapshot } from '../../types';

// ── Single queue row ─────────────────────────────────────────────────────────

interface RowProps {
  track: Track;
  onRemove?(): void;
}

function QueueRow({ track, onRemove }: RowProps) {
  return (
    <div className="queue-entry">
      <div className="queue-entry__art">
        {track.coverUrl
          ? <img className="queue-entry__art-img" src={track.coverUrl} alt="" />
          : <div className="queue-entry__art-placeholder" />}
      </div>
      <div className="queue-entry__meta">
        <span className="queue-entry__title">{track.title}</span>
        <span className="queue-entry__artist">{track.artist.name}</span>
      </div>
      {onRemove && (
        <button className="queue-entry__action" onClick={onRemove} title="Remove">
          <X size={13} />
        </button>
      )}
    </div>
  );
}

// ── Panel ────────────────────────────────────────────────────────────────────

interface Props {
  currentTrack: Track | null;
  manualHead: QueueEntry[];
  contextSnapshot: ContextSnapshot | null;
  onClose(): void;
  onRemoveFromContext(entryId: string): void;
  onClearContext(): void;
}

export const QueuePanel = memo(function QueuePanel({
  currentTrack,
  manualHead,
  contextSnapshot,
  onClose,
  onRemoveFromContext,
  onClearContext,
}: Props) {
  const isEmpty = !currentTrack && manualHead.length === 0 && !contextSnapshot;

  return (
    <div className="queue-panel">
      <div className="queue-panel__header">
        <span className="queue-panel__title">Play queue</span>
        <button className="queue-panel__close" onClick={onClose} title="Close">
          <X size={16} />
        </button>
      </div>

      <div className="queue-panel__body">
        {isEmpty && (
          <p className="queue-panel__empty">Your queue is empty</p>
        )}

        {currentTrack && (
          <section className="queue-panel__section">
            <h3 className="queue-panel__section-label">Now playing</h3>
            <QueueRow track={currentTrack} />
          </section>
        )}

        {manualHead.length > 0 && (
          <section className="queue-panel__section">
            <h3 className="queue-panel__section-label">Next in queue</h3>
            {manualHead.map(entry => (
              <QueueRow key={entry.id} track={entry.track} />
            ))}
          </section>
        )}

        {contextSnapshot && contextSnapshot.entries.length > 0 && (
          <section className="queue-panel__section">
            <div className="queue-panel__section-row">
              <h3 className="queue-panel__section-label">
                Next from: {contextSnapshot.label}
              </h3>
              <button className="queue-panel__clear" onClick={onClearContext}>
                Clear
              </button>
            </div>
            {contextSnapshot.entries.map(entry => (
              <QueueRow
                key={entry.id}
                track={entry.track}
                onRemove={() => onRemoveFromContext(entry.id)}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
});
