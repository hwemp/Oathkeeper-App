# Oathkeeper — gameplay and calculation audit
Review date: November 10, 2026 (local); reference baseline: D&D 2024 fifth-edition SRD 5.2.1.

## Rules sources
- Official SRD, reuse policy and CC BY 4.0 attribution: https://www.dndbeyond.com/srd
- Official free character advancement: https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character
- Official free Paladin progression, healing pool and spell slots: https://www.dndbeyond.com/sources/dnd/br-2024/character-classes
- Official rules glossary (carrying capacity, attunement, exhaustion): https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary
- Official magic item rules and examples: https://www.dndbeyond.com/sources/dnd/br-2024/magic-items-a-z

This is an SRD-compatible rules helper, not an official rules authority, an endorsement, or a guarantee of compliance with every edition/supplement. The DM remains responsible for adjudicating optional, custom and situation-specific rules. Community forum interpretations can be useful for questions, but do not override the published rules agreed upon at the table. Do not reproduce proprietary sourcebooks verbatim or rely on unauthorized scans.

## Implemented in this review
1. Dice animation appearance uses the **active, verified** cosmetic selection, via its color accent and background. Purple is the default when no owned alternative is active; selected green, red, pale, gold etc. are drawn in the animated 3D dice. No unverified purchase flag enables a skin. The actual random face results remain independent of art.
2. A canonical derived-stat engine refreshes every rendered dependent value after modifying base ability scores, item quantity/weight, equipped items, active magic item effect, class level, creature size, HP base, concentration/resource counters, or spell use.
3. Standard ability modifiers, level-based proficiency, effective abilities, carrying capacity (15 × effective STR for Small/Medium, scaled by size), equipped-armor/shield AC, speed, HP maximum and relevant action modifiers are derived rather than duplicated as editable totals.
4. Single-class Paladin level changes automatically add/remove the *average* 6 base HP per level while Constitution modifiers apply per level. Official Paladin Extra Attack becomes available at level 5. Ability scores do **not** increase automatically with level: Ability Score Improvement/feat selection remains a player/DM choice.
5. Inventory weight includes counted physical items, oil, ritual supplies and coins (50 coins/lb). Items can be marked "inside bag"; content weight is excluded only while an actual Bag of Holding entry exists, and the bag still weighs 5 lb. A 500-lb contents warning is displayed. This is a convenience for the common bag; exceptional extradimensional storage must be handled by the DM.
6. Magic effects are tied to a named present item (quantity greater than zero), require explicit active/equipped status, and attunement when relevant. Types: additive, multiplier or minimum value, with targets covering ability scores, carry/weight, AC, HP, attack, damage/healing, speed, saves, spell DC and dice totals. Duplicate/special stacking remains subject to DM adjudication. No default name-to-magic guess is made. Only three distinct attuned items contribute at once; over-limit selections raise a warning.
7. The Dice page supports normal rolls, Strength check, Wisdom save, attack roll, Strength-based damage, Charisma-based healing, and custom homebrew powers. D20 tests enforce a D20. Multipliers apply to the **chosen relevant total**, never the natural faces or the fairness of the roller. Roll history saves actual adjusted totals separately from face counts.
8. The three custom roll-based power ranks can be increased manually. Each chosen rank adds an extra d8 within this explicit homebrew scaling scheme. Original Holy Points and costs are untouched. Official Paladin Lay on Hands is a **separate** tracked pool (5 × level).
9. 2024 Paladin spell slot usage can be tracked by level; long rest resets spell slot usage and official healing pool. 2024 exhaustion applies −2 to D20 Tests and −5 ft Speed per level, and one level is removed on a long rest.
10. Existing data is retained locally and continued in the backup/import workflow. Changes do not automatically upload character data to community services.

## Remaining gaps / do not auto-assume
- **Ruleset scope:** 2014/legacy fifth-edition and the 2024 SRD are not universally interchangeable. This pass uses 2024 mechanics for new derived rules. An explicit, fully tested edition switch still needs implementation before claiming complete legacy support.
- **Character progression:** Feat selection, subclasses, multiclass progression, class-specific starting proficiencies, all Paladin class choices, special HP-roll choices, non-Paladin hit-die progression and multiclass spellcasting are not fully automated.
- **Combat and conditions:** Advantage/disadvantage, critical-hit dice interactions, concentration checks, resistance/vulnerability, cover, immunities, target-specific modifiers, weapon properties, area effects, and special situational stacking still require DM/manual decisions.
- **Resources:** Spell preparation, component costs, full spell rules, channel divinity per subclass, and special recharge schedules are not fully implemented. The Holy Points powers are explicitly homebrew; their old descriptions may conflict with a strict 2024 rules-as-written character. No false official equivalence is claimed.
- **Equipment:** Armor category/proficiency, individual magical-item exceptions, nested storage, portable hole interactions, price/currency valuation exceptions, and fully fledged container volume are not tracked with complete rules.
- **Magic:** Configuration deliberately requires the user/DM to supply applicable effects instead of inventing items' mechanics. The app warns at three attuned items but permits the owner to adjust the roster. Different names for the same item require manual matching to inventory.
- **Live app validation:** Unit, shell, build and package checks are not a substitute for an Android/iOS physical-device audit, including 3D performance, large-roll quantities, backups, old saves, reduced-motion preferences and touch interactions.
- **Commerce and community:** Checkout remains unconfigured and cannot be treated as published; real-time community functionality still requires its own deployed backend, moderation and verification. These are independent of D&D calculation rules.

## Pre-publish QA checklist
- Export a character backup. Reopen it and confirm original level, items, stats, notes and history.
- Vary Strength, Constitution and level. Check carrying capacity, HP and action bonuses; confirm no automatic feat or ability increase.
- Remove armor, shield and magic items, change quantities, and restore them. Confirm modifiers reverse cleanly.
- Try 1–4 items requiring attunement and confirm the fourth gives no active benefit.
- Try a bag with and without an actual Bag of Holding present; check weight and warning.
- Roll every supported die with animation off/on and with default/selected owned skins. Check face totals, adjusted totals, normal rolls, statistics and reduced-motion.
- Spend/recover Paladin resources and verify long-rest behavior.
- Test legacy saves and imported JSON for malformed/bad multiplier values before production.
- Test release signing and install upgrade without erasing character data.

License note already exists in Oathkeeper/THIRD_PARTY_NOTICES.txt, including the SRD 5.2.1 CC BY 4.0 attribution and independence disclaimer.
