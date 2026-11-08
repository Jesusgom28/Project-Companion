
import React, { useState } from 'react';
import {
  outfits,
  getOutfit,
  isOutfitUnlocked
} from './wardrobe';

const WARDROBE_STORAGE_KEY = 'companion-quest-wardrobe-v1';

const characterDialogue = {
  bruno: [
    "Buongiorno! Ready to make today count? Andiamo!",
    "Forza! Every small step brings us closer to our goal.",
    "Tranquillo. You don't need to do everything at once.",
    "Perfetto! You're making progress. Keep moving forward.",
    "Remember to take care of yourself, too.",
    "We make a good team. Andiamo!"
  ]
};

function loadWardrobe() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(WARDROBE_STORAGE_KEY) || '{}'
    );

    if (typeof saved === 'string') {
      return { bruno: saved };
    }

    return saved && typeof saved === 'object' && !Array.isArray(saved)
      ? saved
      : {};
  } catch {
    return {};
  }
}

export default function Lobby({ character, level = 1 }) {
  const [wardrobe, setWardrobe] = useState(loadWardrobe);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [reacting, setReacting] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const characterId = character.id;

  const availableOutfits = outfits.filter(
    item => !item.characterId || item.characterId === characterId
  );

  const defaultOutfit = availableOutfits[0];

  const savedOutfit = availableOutfits.find(
    item => item.id === wardrobe[characterId]
  );

  const outfit =
    savedOutfit && isOutfitUnlocked(savedOutfit, level)
      ? savedOutfit
      : defaultOutfit;

  const lines = characterDialogue[characterId] || [
    "It's good to see you.",
    "One step at a time. We can do this.",
    "Keep moving forward. I'm here to help."
  ];

  const imagePath = outfit
    ? `${import.meta.env.BASE_URL}${outfit.image}`
    : character.image;

  function talk() {
    setDialogueIndex(previous => (previous + 1) % lines.length);
    setReacting(true);
    window.setTimeout(() => setReacting(false), 450);
  }

  function equipOutfit(nextOutfit) {
    if (!isOutfitUnlocked(nextOutfit, level)) return;

    const updated = {
      ...wardrobe,
      [characterId]: nextOutfit.id
    };

    setWardrobe(updated);
    localStorage.setItem(
      WARDROBE_STORAGE_KEY,
      JSON.stringify(updated)
    );

    setImageFailed(false);
    setWardrobeOpen(false);
  }

  return (
    <section className="companion-lobby">
      <div className="lobby-stage">
        <div className="lobby-heading">
          <span>ACTIVE COMPANION</span>
          <strong>{character.name}</strong>
          <small>{outfit?.name || 'Default outfit'}</small>
        </div>

        <button
          type="button"
          className={`lobby-character ${
            reacting ? 'lobby-reacting' : ''
          }`}
          onClick={talk}
          aria-label={`Talk to ${character.name}`}
        >
          <img
            key={`${characterId}-${outfit?.id}-${imageFailed}`}
            src={imageFailed ? character.image : imagePath}
            alt={`${character.name} — ${outfit?.name || 'Default'}`}
            onError={() => setImageFailed(true)}
          />
        </button>

        <div className="lobby-dialogue" aria-live="polite">
          <strong>{character.name}</strong>
          <p>{lines[dialogueIndex % lines.length]}</p>
        </div>
      </div>

      <div className="lobby-controls">
        <button type="button" onClick={talk}>
          Talk
        </button>

        <button
          type="button"
          onClick={() => setWardrobeOpen(previous => !previous)}
        >
          Wardrobe
        </button>
      </div>

      {wardrobeOpen && (
        <div className="lobby-wardrobe">
          <h3>{character.name}'s Wardrobe</h3>

          <div className="lobby-outfit-list">
            {availableOutfits.map(item => {
              const unlocked = isOutfitUnlocked(item, level);
              const equipped = outfit?.id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!unlocked}
                  className={equipped ? 'equipped' : ''}
                  onClick={() => equipOutfit(item)}
                >
                  <strong>{item.name}</strong>
                  <small>
                    {equipped
                      ? 'Equipped'
                      : unlocked
                        ? 'Tap to equip'
                        : `Unlocks at level ${item.unlockLevel}`}
                  </small>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
