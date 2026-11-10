
/*
 * Companion Quest — Relationship Rewards
 *
 * Tracks rewards earned through relationship levels.
 *
 * available: true  = Content is implemented.
 * available: false = Content is planned.
 *
 * This file does not modify saved XP or tasks.
 */

export const relationshipRewards = {
  bruno: [
    {
      level: 5,
      type: 'story',
      id: 'trust',
      name: 'A Growing Trust',
      available: true
    },
    {
      level: 10,
      type: 'outfit',
      id: 'casual',
      name: 'Casual Bruno',
      available: false
    },
    {
      level: 15,
      type: 'dialogue',
      id: 'trusted-dialogue',
      name: 'Special Conversations',
      available: true
    },
    {
      level: 20,
      type: 'story',
      id: 'steadfast',
      name: 'An Unbreakable Bond',
      available: true
    },
    {
      level: 20,
      type: 'outfit',
      id: 'midnight',
      name: 'Midnight Blue',
      available: false
    },
    {
      level: 30,
      type: 'outfit',
      id: 'formal',
      name: 'Formal Bruno',
      available: false
    },
    {
      level: 40,
      type: 'story',
      id: 'romance',
      name: 'A Special Connection',
      available: false
    },
    {
      level: 50,
      type: 'outfit',
      id: 'exclusive',
      name: 'Exclusive Bruno Outfit',
      available: false
    }
  ]
};

/*
 * Return rewards that are implemented
 * and unlocked by the player's level.
 */
export function getUnlockedRewards(characterId, level) {
  const rewards = relationshipRewards[characterId] || [];

  return rewards.filter(
    reward => reward.available && level >= reward.level
  );
}

/*
 * Find the next implemented reward.
 * Unreleased content is skipped.
 */
export function getNextReward(characterId, level) {
  const rewards = relationshipRewards[characterId] || [];

  return rewards.find(
    reward => reward.available && level < reward.level
  ) || null;
}

/*
 * Return upcoming rewards, including unreleased ones.
 * Useful for a future milestone roadmap screen.
 */
export function getUpcomingRewards(characterId, level) {
  const rewards = relationshipRewards[characterId] || [];

  return rewards.filter(reward => level < reward.level);
}
