'use client';

import { useTheme } from './useTheme';

const OPTIONS = ['system', 'light', 'dark'] as const;

export default function AppearanceControl() {
  const { pref, setPref } = useTheme();

  return (
    <div className="account-card">
      <h2>Appearance</h2>
      <p>Choose your preferred color scheme.</p>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={`btn btn--sm ${pref === option ? 'btn--primary' : 'btn--outline'}`}
            onClick={() => setPref(option)}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
