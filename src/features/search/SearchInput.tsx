interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: Props) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape' && value !== '') {
      e.preventDefault();
      onChange('');
      e.currentTarget.blur();
    }
  }

  return (
    <div className="search-input-wrapper">
      <input
        className="search-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search tracks, artists, albums…"
        autoFocus
      />
    </div>
  );
}
