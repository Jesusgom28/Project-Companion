
/*
 * Companion Quest — Wardrobe
 *
 * Defines available outfits for each companion.
 *
 * Outfits can be unlocked through relationship
 * levels once their artwork is ready.
 *
 * This file does not modify saved XP or tasks.
 */

export const WARDROBE_KEY = 'companion-quest-wardrobe-v1';

export const outfits = [
  {
    id: 'classic',
    characterId: 'bruno',
    name: 'Classic Bruno',
    description: 'The iconic white suit.',
    image: 'characters/bruno-classic-full.png',
    unlockLevel: 1,
    available: true
  },
  {
    id: 'formal',
    characterId: 'bruno',
    name: 'Formal Bruno',
    description: 'An elegant black tailored suit.',
    image: 'characters/bruno-formal-full.png',
    unlockLevel: 30,
    available: false
  },
  {
    id: 'casual',
    characterId: 'bruno',
    name: 'Casual Bruno',
    description: 'A comfortable everyday outfit.',
    image: 'characters/bruno-casual-full.png',
    unlockLevel: 10,
    available: false
  },
  {
    id: 'midnight',
    characterId: 'bruno',
    name: 'Midnight Blue',
    description: 'A sophisticated blue suit.',
    image: 'characters/bruno-midnight-full.png',
    unlockLevel: 20,
    available: false
  }
];

/*
 * Find an outfit by ID.
 */
export function getOutfit(id) {
  return outfits.find(outfit => outfit.id === id) || outfits[0];
}

/*
 * An outfit must meet both conditions:
 * 1. Its artwork/content is available.
 * 2. The relationship level is high enough.
 */
export function isOutfitUnlocked(outfit, level) {
  return Boolean(
    outfit &&
    outfit.available &&
    level >= outfit.unlockLevel
  );
}

/*
 * Legacy wardrobe helpers.
 *
 * Keep these for compatibility with existing
 * code while the wardrobe system is updated.
 */
export function loadSelectedOutfit() {
  try {
    const saved = localStorage.getItem(WARDROBE_KEY);
    return getOutfit(saved).id;
  } catch {
    return 'classic';
  }
}

export function saveSelectedOutfit(id) {
  const outfit = getOutfit(id);
  localStorage.setItem(WARDROBE_KEY, outfit.id);
}
