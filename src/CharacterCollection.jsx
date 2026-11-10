
import React from 'react';

/*
 * Companion Quest — Character Collection
 *
 * Displays available companions.
 * Selecting one opens their character profile.
 *
 * This component only displays information.
 * It does not change saved XP or tasks.
 */

export default function CharacterCollection({
  characters = [],
  selectedId,
  relationships = {},
  onSelectCharacter,
  onBack
}) {
  return (
    <section className="character-collection">
      <div className="character-collection-header">
        <button
          type="button"
          onClick={onBack}
          className="secondaryButton"
        >
          ← Back to Lobby
        </button>

        <h2>Character Collection</h2>
        <p>Choose a companion to view their profile.</p>
      </div>

      <div className="character-collection-grid">
        {characters.map(character => {
          const xp = relationships[character.id]?.xp || 0;
          const level = Math.floor(Math.max(0, xp) / 100) + 1;

          return (
            <button
              key={character.id}
              type="button"
              className="character-collection-card"
              onClick={() => onSelectCharacter(character.id)}
            >
              <img
                src={character.alt || character.image}
                alt={character.name}
              />

              <strong>{character.name}</strong>

              <small>Relationship Level {level}</small>

              {character.id === selectedId && (
                <span className="character-active-label">
                  Active Companion
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
