# Curriculum alignment assumptions

## Scope

The request names Zhejiang province, People's Music Publishing House (人音版), primary grades 1–6, and a “复合教材” experience. The repository currently has a broad theory catalog organized by five stages (`primary-lower`, `primary-middle`, `primary-upper`, `junior-basic`, `junior-advanced`) but no edition, semester, unit, or province metadata.

## Decision

Add a data-driven “浙江人音版小学音乐（综合实践）” alignment layer rather than hard-code textbook page content. The layer uses grade/semester/unit themes and capability focus; exact unit names remain editable because printings and school-provided companion volumes may differ.

Primary topics map to grades 1–6. Existing junior topics stay available as optional `extension` topics so the current breadth is not lost. Zhejiang-local material is represented by short contextual prompts (越剧、江南丝竹、采茶/水乡节奏、地方民歌等) and existing interactive tools, not copied textbook recordings or full scores.

## Product implications

- The student experience should remain one exploration card and one next action.
- Grade/semester metadata belongs on the student profile and topic card, not in a new navigation tree.
- A one-sentence discovery record is more useful than adding another points or badge system.

## Calibration point

Before a future content pass, a teacher can provide the exact table of contents for the school’s printing. Only `src/music/zhejiangCurriculum.ts` needs adjustment; recommendation and UI contracts remain unchanged.
