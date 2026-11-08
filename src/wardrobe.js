
export const WARDROBE_KEY = 'companion-quest-wardrobe-v1';

export const outfits = [
  {
    id: 'classic',
    name: 'Classic Bruno',
    description: 'The iconic white suit.',
    image: 'characters/bruno-classic-full.png',
    unlockLevel: 1
  },
  {
    id: 'formal',
    name: 'Formal Bruno',
    description: 'An elegant black tailored suit.',
    image: 'characters/bruno-formal-full.png',
    unlockLevel: 5
  },
  {
    id: 'casual',
    name: 'Casual Bruno',
    description: 'A comfortable everyday outfit.',
    image: 'characters/bruno-casual-full.png',
    unlockLevel: 10
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    description: 'A sophisticated blue suit.',
    image: 'characters/bruno-midnight-full.png',
    unlockLevel: 20
  }
];

export function getOutfit(id) {
  return outfits.find(outfit => outfit.id === id) || outfits[0];
}

export function isOutfitUnlocked(outfit, level) {
  return level >= outfit.unlockLevel;
}

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
