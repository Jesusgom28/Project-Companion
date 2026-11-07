import test from 'node:test';import assert from 'node:assert/strict';
import {initialState,completeTask,uncompleteTask,levelFromXp,tierFromLevel,normalizeState,pickDialogue} from '../src/logic.js';
test('task completion awards XP only once per date',()=>{let s=initialState();s=completeTask(s,'starter-0','2026-11-06');assert.equal(s.relationships.bruno.xp,5);assert.equal(completeTask(s,'starter-0','2026-11-06'),s);assert.equal(s.history.length,1)});
test('undo removes XP and completion; completing again does not duplicate XP',()=>{let s=completeTask(initialState(),'starter-1','2026-11-06');s=uncompleteTask(s,'starter-1','2026-11-06');assert.equal(s.relationships.bruno.xp,0);assert.equal(s.history.length,0);s=completeTask(s,'starter-1','2026-11-06');assert.equal(s.relationships.bruno.xp,5)});
test('levels and milestones follow XP',()=>{assert.equal(levelFromXp(0),1);assert.equal(levelFromXp(99),1);assert.equal(levelFromXp(100),2);assert.equal(tierFromLevel(10),'Friend')});
test('normalization handles empty saved state',()=>{assert.equal(normalizeState(null).tasks.length,5)});
test('dialogue returns eligible lines',()=>{assert.ok(pickDialogue('complete',1).length>0)});
