# Oathkeeper DM desk: research and implementation

Reviewed November 10, 2026. This is an original organizing guide and product requirements map based on official Wizards of the Coast / D&D Beyond sources. It covers the recurring work of running a campaign. Adventure-specific, setting-specific and character-specific exceptions still require the relevant source. It does not claim to reproduce every published book.

## Rules baseline

The calculator uses the 2024 encounter budgets. The app labels that baseline rather than combining it with 2014 encounter multipliers. Keep the edition and house rules visible to the table. D&D Beyond now distinguishes 2014/5e and updated/5.5e material; the publication dates remain useful identifiers. Source: [official Free Rules introduction](https://www.dndbeyond.com/posts/1804-start-playing-today-with-the-2024-d-d-free-rules).

## Preparation, play and follow-through

The DM prepares situations and presents the world, portrays its inhabitants, adjudicates uncertain outcomes and tracks consequences while players decide their characters’ actions. The DMG organizes that work into game-running advice, toolbox rules, adventures, campaigns, cosmology, treasure and Bastions. The app turns those responsibilities into a session checklist and persistent notebooks. [DMG contents](https://www.dndbeyond.com/sources/dnd/dmg-2024).

Session zero should establish expectations and a way to revisit them: tone, schedule, allowed options, advancement, house rules, content boundaries, PvP and a pause/check-in process. Use notes for agreements, not sensitive personal details. [Official session-zero guidance](https://www.dndbeyond.com/posts/929-how-to-run-a-session-0-for-your-d-d-game).

The following matrix is an Oathkeeper design synthesis. It explains what information to keep, where the current app stores it and which work remains manual.

| Work area | Information to keep close | Current implementation |
|---|---|---|
| Table organization | Attendance, scheduling, edition, allowed books, expectations | Session checklist; expectations and house-rule notebooks |
| Preparation | Recap, likely scenes, goals, clues, maps, NPC motives | Checklist; recap, quest and location notebooks |
| Player spotlight | Character hooks, goals, preferred play, unresolved threads | Session checklist and campaign notes |
| Scene framing | Location, sensory cues, immediate choices, stakes | Environment fields and notebook |
| Adjudication | Intent, approach, check/save, DC, circumstances, consequence | Searchable prompts and house-rule notes; DM makes rulings |
| Social encounters | NPC knowledge, motives, attitude, influence, promises | NPC/faction notebook |
| Exploration | Routes, marching order, visibility, terrain, supplies, watches | Environment fields, travel and calendar notes |
| Hazards/traps | Detection, trigger, DC, save, damage, bypass and reset | Hazards textarea; reference links |
| Environment | Light, weather, terrain, difficult routes, cover and elevation | Structured scene fields; location/map notes |
| Time | Scene minutes, days, travel progress, rest windows | Manual minute/hour clock and calendar notebook |
| Maps | Scale, location links, secret versus player-facing versions | Map-link notebook; no grid/VTT engine |
| Encounter design | Party levels, objectives, monster XP, resources and terrain | Mixed-level 2024 XP budget calculator; notes |
| Initiative | Combatant, initiative, tie decision, active turn and round | Sorted roster; explicit tie order; turn advance |
| Defenses | AC, current/max HP, temporary HP and exceptional defenses | Structured health/AC fields; resource notes |
| Damage/healing | Final damage, temporary absorption, healing cap | Apply controls; defenses and special cases adjudicated first |
| Death and recovery | Death-save counts, stabilization, recovery, massive damage | Manual success/failure fields and status display; reference link |
| Conditions | Condition, source, duration and end trigger | Condition notes and index; no automatic condition engine |
| Concentration | Current effect, damage save, loss triggers | Concentration text; damage-save reminder; clears at zero HP |
| Turn economy | Action, Bonus Action, Reaction, movement and features | Used-resource checkboxes; movement/features in notes |
| Spell resources | Slots, prepared options, range, concentration and duration | Per-combatant resource notes and spell-source links |
| Monster resources | Recharge, limited uses, legendary/lair options and behavior | Resource notes; exact published stat block remains authoritative |
| NPCs and factions | Motives, secrets, relationships, agreements and reactions | Dedicated notebook |
| Quests and clues | Leads, discovered clues, unresolved problems and consequences | Dedicated notebook |
| Rewards | Coins, items, allocation, XP or milestones and promises | Treasure/advancement notebook |
| Downtime | Projects, crafting, research, orders and campaign changes | Downtime/Bastions notebook |
| World continuity | Calendar, locations, factions, villains, rumors and fallout | Calendar and campaign notebooks |
| House rules | Decision, source edition, exception, date and table agreement | House-rule/allowed-books notebook |
| Session close | Recap, rewards, feedback, next hook and schedule | After-play checklist and recap notebook |
| Data management | Private DM notes, recovery, backups, device changes | Included in the existing full JSON backup and validated import |

## Core rules reference

The quick-reference library links the official play chapter for exploration, movement, combat and health. Current/max HP and temporary HP are tracked separately. Death-save counters are manual: the DM applies natural-roll exceptions, massive damage, attacks at zero HP and special creature features from the source. The app does not silently invent those outcomes. [Playing the Game](https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game).

Actions and conditions are indexed against the Rules Glossary. The tracker’s concentration reminder uses the 2024 damage DC: the greater of 10 or half damage rounded down, capped at 30. Condition durations, immunity, other concentration-loss triggers and feature exceptions remain manual. [Rules Glossary](https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary/).

The encounter calculator sums each party member’s low/moderate/high budget for their own level. Compare those totals with the XP sum of the chosen monsters. It does not use the 2014 monster-count multiplier and does not guarantee that an encounter is survivable. Creature abilities, numbers, terrain, resource depletion and group experience remain relevant. [DM’s Toolbox](https://www.dndbeyond.com/sources/dnd/br-2024/dms-toolbox); [2014 encounter method for comparison](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/building-combat-encounters).

Equipment, coins, armor, weapons, adventuring supplies and tools have their own reference. The current DM desk records rewards and supplies in notes rather than creating an independent economy simulator. [Equipment](https://www.dndbeyond.com/sources/dnd/br-2024/equipment).

## Books and source library

| Resource | Why a DM uses it | Access in Oathkeeper |
|---|---|---|
| Player’s Handbook (2024) | Player rules, character options and spells | Official source link; book access may be required |
| Dungeon Master’s Guide (2024) | Running games, adventures, campaigns and DM tools | Official source link; book access may be required |
| Monster Manual (2025) | Creature choices and exact stat blocks | Official source link; book access may be required |
| Free Rules / Basic Rules | Accessible rules lookup while learning or running play | Official web links |
| SRD 5.2.1 | Downloadable open rules for creators and reference | Official download/licensing page |
| Official tracking sheets | Campaign, NPC, travel and other record templates | Official download links |
| Chosen adventure or setting | Locations, encounters, lore and adventure-specific rules | Add owned/open reference links to campaign notes |
| Optional supplements | Table-selected character options and additional systems | Record allowed books and exceptions in House rules |
| Errata and Sage Advice | Corrections and published clarifications | Official index link; check the relevant book edition |

The core-rulebook publication sequence and SRD update were described by Wizards in [the core-rulebook announcement](https://www.dndbeyond.com/posts/1717-2024-core-rulebooks-to-expand-the-srd). Official supplemental record forms are available from [Tracking Sheets](https://www.dndbeyond.com/sources/dnd/br-2024/tracking-sheets). Corrections are covered by [Sage Advice and errata](https://www.dndbeyond.com/posts/1950-sage-advice-and-errata-for-the-new-core-rules-is). The [SRD page](https://www.dndbeyond.com/srd) identifies the open rules and their Creative Commons license. Paid book contents, artwork and complete compendia are not bundled.

## Placement and visual design

Recommendation: keep DM in the dropdown for character-focused play; choose a main tab after Dice when primarily running sessions. The choice is available under DM → Session → DM location. The four inner sections are Session, Encounter, Campaign and Rules & Books. All inherit the existing Chronicle font, metallic gold, amethyst controls, rounded dark cards and Moonlit Citadel background. Existing character tabs are retained.

## Boundaries and next decisions

This release is a local DM desk, not shared live campaign synchronization. Notes are freeform in several areas; spell/monster automation, interactive maps, encounter imports, player-facing sharing, automated condition timers and a licensed full-text book library would each need separate implementation. A full backup contains DM secrets as well as character data. Review what you share. These boundaries are visible in the app and prevent confusing a note field or source link with a rules engine.

## Attribution

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode. The app condenses rules into prompts and tracker functions rather than reproducing the full document.
