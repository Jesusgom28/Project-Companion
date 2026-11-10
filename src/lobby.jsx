
import React, { useState } from 'react';
import {
  outfits,
  isOutfitUnlocked
} from './wardrobe';

import {
  getNextReward,
  getUnlockedRewards,
  getUpcomingRewards
} from './relationshipRewards';

const WARDROBE_STORAGE_KEY = 'companion-quest-wardrobe-v1';

/*
 * Dialogue for each companion.
 * Future characters can have their own entries here.
 */
const characterDialogue = {
  bruno: {
    general: [
      "Forza! Every small step brings us closer to our goal.",
      "Tranquillo. You don't need to do everything at once.",
      "Perfetto! You're making progress. Keep moving forward.",
      "Remember to take care of yourself, too.",
      "We make a good team. Andiamo!"
    ],

    morning: [
      "Buongiorno! Ready to make today count?",
      "A new morning means another opportunity. Andiamo!"
    ],

    afternoon: [
      "Buon pomeriggio! How has your day been?",
      "Remember to take a break if you need one."
    ],

    evening: [
      "Buonasera! You made it through another day.",
      "Whatever you accomplished today, I'm proud of your effort."
    ],

    // Relationship dialogue unlocks at specific levels.
    relationship: [
      {
        minLevel: 5,
        lines: [
          "I'm beginning to understand you better. I'm glad we're working together.",
          "You can count on me. That's what teammates are for."
        ]
      },
      {
        minLevel: 10,
        lines: [
          "We've come a long way together, haven't we?",
          "Your determination is something I genuinely admire."
        ]
      },
      {
        minLevel: 20,
        lines: [
          "Our bond has grown stronger. I trust you.",
          "No matter what challenges come next, we'll face them together."
        ]
      }
    ],

    // Each outfit can have its own special dialogue.
    outfits: {
      classic: [
        "This suit has accompanied me through quite a few adventures."
      ],
      formal: [
        "A formal occasion? Then we should look our best."
      ],
      casual: [
        "Even I appreciate a more relaxed day now and then."
      ],
      midnight: [
        "Midnight blue. A fitting choice for a quiet evening."
      ]
    }
  }
};

const fallbackDialogue = {
  general: [
    "It's good to see you.",
    "One step at a time. We can do this.",
    "Keep moving forward. I'm here to help."
  ],
  morning: ["Good morning! Ready for today?"],
  afternoon: ["Good afternoon! How is your day going?"],
  evening: ["Good evening! Remember to rest."],
  relationship: [],
  outfits: {}
};

/*
 * Load the existing wardrobe without deleting progress.
 * Supports the older single-outfit storage format.
 */
function loadWardrobe() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(WARDROBE_STORAGE_KEY) || '{}'
    );

    if (typeof saved === 'string') {
      return { bruno: saved };
    }

    return saved &&
      typeof saved === 'object' &&
      !Array.isArray(saved)
      ? saved
      : {};
  } catch {
    return {};
  }
}

/*
 * Determine the current time period.
 * Uses the player's device clock.
 */
function getTimePeriod() {
  const hour = new Date().getHours();

  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';

  return 'evening';
}

/*
 * Build a list of dialogue options.
 * Relationship lines are only added when unlocked.
 */
function getDialogue(characterId, level, outfitId) {
  const dialogue =
    characterDialogue[characterId] || fallbackDialogue;

  const lines = [
    ...dialogue[getTimePeriod()],
    ...dialogue.general
  ];

  for (const milestone of dialogue.relationship) {
    if (level >= milestone.minLevel) {
      lines.push(...milestone.lines);
    }
  }

  if (outfitId && dialogue.outfits[outfitId]) {
    lines.push(...dialogue.outfits[outfitId]);
  }

  return lines;
}


export default function Lobby({
  character,
  level = 1,
  xp = 0,
  onOpenCharacters
}) {
  const [wardrobe, setWardrobe] = useState(loadWardrobe);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);

  // Controls whether the relationship milestones are visible.
  const [milestonesOpen, setMilestonesOpen] = useState(false);

  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [reacting, setReacting] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);


  const characterId = character.id;

  // Find the next relationship reward based on the companion's level.
  const nextReward = getNextReward(characterId, level);

    // Get rewards Bruno has already earned.
  const unlockedRewards = getUnlockedRewards(characterId, level);

  // Get future relationship rewards.
  const upcomingRewards = getUpcomingRewards(characterId, level);

  // Calculate progress toward the next relationship reward.
// Level 1 starts at 0 XP; each additional level requires 100 XP.
const rewardTargetXp = nextReward
  ? (nextReward.level - 1) * 100
  : 0;

const previousRewardLevel = nextReward
  ? Math.max(
      1,
      ...[1, 5, 10, 15, 20, 30, 40, 50].filter(
        milestone => milestone < nextReward.level
      )
    )
  : level;

const rewardStartXp = (previousRewardLevel - 1) * 100;

const rewardProgress = nextReward
  ? Math.min(
      100,
      Math.max(
        0,
        ((xp - rewardStartXp) /
          (rewardTargetXp - rewardStartXp)) * 100
      )
    )
  : 100;

  // Only show outfits belonging to the active companion.
  const availableOutfits = outfits.filter(
    item =>
      !item.characterId ||
      item.characterId === characterId
  );

  const defaultOutfit = availableOutfits[0];

  const savedOutfit = availableOutfits.find(
    item => item.id === wardrobe[characterId]
  );

  const outfit =
    savedOutfit && isOutfitUnlocked(savedOutfit, level)
      ? savedOutfit
      : defaultOutfit;

  // Dialogue updates when level or outfit changes.
  const lines = getDialogue(
    characterId,
    level,
    outfit?.id
  );

  const imagePath = outfit
    ? `${import.meta.env.BASE_URL}${outfit.image}`
    : character.image;

  /*
   * Cycle through dialogue and trigger the existing
   * character tap animation.
   */
  function talk() {
    setDialogueIndex(previous => (previous + 1) % lines.length);
    setReacting(true);

    window.setTimeout(() => setReacting(false), 450);
  }

  /*
   * Equip an unlocked outfit and save the selection.
   */
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
    setDialogueIndex(0);
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
            alt={`${character.name} — ${
              outfit?.name || 'Default'
            }`}
            onError={() => setImageFailed(true)}
          />
        </button>

        <div className="lobby-dialogue" aria-live="polite">
          <strong>{character.name}</strong>
          <p>{lines[dialogueIndex % lines.length]}</p>
        </div>
      </div>

      {/* Show the next relationship reward. */}
      
{/* ==========================================
    RELATIONSHIP REWARD PROGRESS + BUTTONS
    ========================================== */}
<div className="lobby-next-reward">
  <div className="lobby-reward-top">

    {/* Left side: next relationship reward */}
    <div className="lobby-reward-info">
      {nextReward ? (
        <>
          <div className="lobby-reward-heading">
            <span>🎁 NEXT RELATIONSHIP REWARD</span>
            <strong>{nextReward.name}</strong>
          </div>

          <p>
            Unlocks at Relationship Level {nextReward.level}
          </p>
        </>
      ) : (
        <p>All current relationship milestones reached!</p>
      )}
    </div>

    {/* Right side: Milestones and Wardrobe buttons */}
    <div className="lobby-reward-actions">
      <button
        type="button"
        className="lobby-reward-button"
        onClick={() => {
          setMilestonesOpen(previous => !previous);
          setWardrobeOpen(false);
        }}
      >
        <span aria-hidden="true">🎁</span>
        <span>Milestones</span>
      </button>

      <button
        type="button"
        className="lobby-reward-button"
        onClick={() => {
          setWardrobeOpen(previous => !previous);
          setMilestonesOpen(false);
        }}
      >
        <span aria-hidden="true">👔</span>
        <span>Wardrobe</span>
      </button>
    </div>
  </div>

  {/* XP progress stays underneath */}
  {nextReward && (
    <>
      <div
        className="lobby-reward-progress"
        role="progressbar"
        aria-label="Progress toward next relationship reward"
        aria-valuenow={Math.round(rewardProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div style={{ width: `${rewardProgress}%` }} />
      </div>

      <small>
        {xp} / {rewardTargetXp} total XP
      </small>
    </>
  )}
</div>



{/* ==========================================
    RELATIONSHIP MILESTONES
    Only appears when Milestones is clicked
    ========================================== */}
{milestonesOpen && (
  <div className="lobby-milestones">
    <h3>Relationship Milestones</h3>

    <p>
      Build your bond with {character.name} to unlock
      new stories, conversations, and outfits.
    </p>

    <div className="lobby-milestone-list">
      {unlockedRewards.map(reward => (
        <div
          key={`${reward.type}-${reward.id}`}
          className="lobby-milestone"
        >
          <span>✓ Level {reward.level}</span>
          <strong>{reward.name}</strong>
          <small>Unlocked</small>
        </div>
      ))}

      {upcomingRewards.map(reward => (
        <div
          key={`${reward.type}-${reward.id}`}
          className="lobby-milestone"
        >
          <span>Level {reward.level}</span>
          <strong>{reward.name}</strong>
          <small>
            {reward.available
              ? 'Locked'
              : 'Coming Soon'}
          </small>
        </div>
      ))}
    </div>
  </div>
)}


{/* ==========================================
    COMPANION LOBBY — MAIN ACTION BUTTONS
    ========================================== */}
<div className="lobby-controls">
  {/* Opens Bruno's dialogue */}
  <button
    type="button"
    onClick={talk}
  >
    💬 Talk
  </button>

  {/* Opens the character collection */}
  <button
    type="button"
    onClick={onOpenCharacters}
  >
    👥 Characters
  </button>
</div>


{/* ==========================================
    WARDROBE PANEL
    Only appears when Wardrobe is clicked
    ========================================== */}
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
                : !item.available
                  ? `Coming Soon · Level ${item.unlockLevel}`
                  : unlocked
                    ? 'Tap to equip'
                    : `Unlocks at Level ${item.unlockLevel}`}
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
