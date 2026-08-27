# Open Quiz Arena visual system

## Direction: kinetic arena scoreboard

This product is an instrument used across a noisy classroom, not a SaaS dashboard. Its visual language borrows from venue scoreboards, lane markers, and broadcast control desks: large tabular room codes, terse uppercase status strips, high-contrast answer lanes, signal bars, and ranks that can be read from the back of a room. It deliberately avoids the soft cards, rainbow geometry, playful music, and terminology associated with incumbent quiz games.

The host view optimizes distance reading and shared attention. The player view sheds nearly all chrome and turns the screen into four large answer lanes. Decorative geometry is limited to signal strength/rhythm motifs that explain live state. There is no generic gradient hero.

## Color tokens

The thesis is explicitly single-mode because a dark venue board preserves contrast in both dim projectors and bright student phones.

| Token | Value | Use |
| --- | --- | --- |
| Midnight / `--ink` | `#07152B` | Explicit page background; focus surface |
| Deep board / `--ink-2` | `#0D2140` | Raised controls and arena panel |
| Electric lime / `--lime` | `#B7F43A` | Primary actions, live scores, first place |
| Coral / `--coral` | `#FF596D` | Interruption, one answer lane, error edge |
| Warm white / `--paper` | `#F7F2E8` | Primary text and neutral answer lane |
| Cyan / `--cyan` | `#35C2D6` | Connection cues, supporting action, answer lane |
| Muted blue-white | `#B9C4D2` | Secondary text at accessible contrast |

Dark text is used on lime/cyan/coral fills. Warm white and muted blue-white are used on midnight surfaces. State never relies on color alone: letters, words, check marks, ranks, and connection labels always accompany color.

## Typography and spacing

No font files or third-party requests are used. A self-contained system sans stack (`Inter` when locally installed, then platform UI sans) prioritizes classroom legibility and fast loading. Display text uses heavy weights, tight tracking, and a fluid scale; room codes and scores use tabular numerals. Body text is never below 16px, with 1.5–1.7 line height for policy copy.

Spacing follows a 4/8px rhythm, with primary steps at 8, 12, 16, 20, 24, 32, 40, 64, and 80px. Answer targets exceed 44px and reach 120px+ on phones. Desktop boards use broad negative space; at 360px, secondary explanatory chrome drops, controls stack, and answer lanes retain a 2×2 game-pad layout.

## Interaction grammar

- Lime filled controls advance the main flow; outlined midnight controls are secondary.
- A lane stripe and a persistent A–D letter distinguish answers without shape mimicry.
- Immediate pressed movement confirms input, then the player receives a full “Answer locked” state.
- Connection state is always visible and textual. Reconnect uses bounded exponential backoff and exposes its attempt count.
- CSV errors accumulate into a focusable, live error summary instead of failing row by row.
- Host results shift from question scale to ranked rows; the final three scores rise into a literal stepped podium.

## Motion policy

Motion is sparse and physical: buttons lift 2px on hover, the waiting signal gently scales, score/leader states update in place, and the podium height itself supplies the final flourish. UI transitions are 160ms. Nothing flashes and there is no audio. Under `prefers-reduced-motion`, animation and transitions become effectively instant and the waiting signal is static.

## Original assets and provenance

All marks, signal bars, lane layouts, podium geometry, and interface icons are hand-authored in HTML/CSS for Open Quiz Arena during this work order. No generated images, stock assets, copied trade dress, external icon sets, music, or third-party fonts are used. The three-bar logo is an original abstract live-signal mark and is not derived from an incumbent product.
