import type { JourneyStepId, ReferenceActivity } from '../referenceCourseware'

const COMMON_STEPS: JourneyStepId[] = ['hook', 'listen', 'feel', 'notice', 'try', 'explain', 'create', 'reflect']

function activity(
  id: string,
  kind: ReferenceActivity['kind'],
  knowledgePointId: string,
  title: string,
  prompt: string,
  summary: string,
  assetId: string,
  audioId: string
): ReferenceActivity {
  return {
    id,
    kind,
    knowledgePointId,
    title,
    prompt,
    steps: [...COMMON_STEPS],
    audioIds: [audioId],
    assetIds: [assetId],
    feedback: {
      correct: '你的感受和听觉依据已经连接起来了。',
      retry: '再听一次，注意情绪、力度、声部或演唱方式的变化。',
      complete: '这次探索完成了，你已经用自己的话听懂了一点音乐。',
    },
    summary,
  }
}

export const GRADE_THREE_ACTIVITIES: ReferenceActivity[] = [
  activity(
    'g3-solfege-note-names-activity',
    'note-ladder',
    'g3-solfege-note-names',
    '唱名和音名的声音地图',
    '先听声音，再把唱名和音名放回音乐地图。',
    '唱名帮助演唱，音名帮助我们辨认和记录固定的音高。',
    'g3/solfege/name-map',
    'g3/solfege/names'
  ),
  activity(
    'g3-dynamics-marks-activity',
    'listen-and-choose',
    'g3-dynamics-marks',
    '力度记号听觉线索',
    '听音乐怎样变强、变弱，再找对应的力度线索。',
    '力度记号把听到的强弱变化记录下来。',
    'g3/dynamics/marks',
    'g3/dynamics/marks'
  ),
  activity(
    'g3-music-emotion-activity',
    'listen-and-choose',
    'g3-music-emotion',
    '音乐情绪侦探',
    '音乐让你想到什么情绪、动作或故事？找一个声音依据。',
    '情绪可以是主观感受，也可以用速度、力度、音色和旋律线索说清楚。',
    'g3/emotion/story-cards',
    'g3/emotion/contrast'
  ),
  activity(
    'g3-low-567-high-1-activity',
    'note-ladder',
    'g3-low-567-high-1',
    '低音和高音的远近',
    '在低音 567 和高音 1 之间听见音区变化。',
    '音区让同一个音乐世界拥有不同的高度和空间。',
    'g3/pitch/register-map',
    'g3/pitch/low-high'
  ),
  activity(
    'g3-labor-chant-activity',
    'voice-form-guess',
    'g3-labor-chant',
    '劳动号子的呼应',
    '听领唱和回应怎样把大家的动作连接起来。',
    '劳动号子常用领唱、呼应和稳定节奏推动集体行动。',
    'g3/voice/labor-scene',
    'g3/voice/labor-chant'
  ),
  activity(
    'g3-sound-dictation-activity',
    'sound-dictation',
    'g3-sound-dictation',
    '听音记谱小桌',
    '听完一小段旋律，把声音排列成简单谱面。',
    '记谱是把听到的高低和节奏变成可以回看的符号。',
    'g3/notation/dictation',
    'g3/notation/short-melody'
  ),
  activity(
    'g3-ostinato-activity',
    'rhythm-builder',
    'g3-ostinato',
    '固定节奏伴奏',
    '给旋律铺一条稳定的节奏地毯。',
    '固定节奏型反复出现，可以成为音乐持续前进的脚步。',
    'g3/rhythm/ostinato',
    'g3/rhythm/ostinato'
  ),
  activity(
    'g3-voice-ranges-activity',
    'voice-form-guess',
    'g3-voice-ranges',
    '人声角色听辨',
    '比较不同音区和音色，找到声音角色。',
    '男高、男低、女高、女中和童声可以通过音区与音色线索比较。',
    'g3/voice/ranges',
    'g3/voice/ranges'
  ),
  activity(
    'g3-two-part-activity',
    'layered-listening',
    'g3-two-part',
    '二声部先分开再合起来',
    '先听每一条线，再打开另一条线，观察它们怎样配合。',
    '二声部需要同时听见自己的线和伙伴的线。',
    'g3/polyphony/two-part',
    'g3/polyphony/two-part'
  ),
  activity(
    'g3-unison-chorus-round-activity',
    'voice-form-guess',
    'g3-unison-chorus-round',
    '齐唱、合唱、轮唱',
    '听示例，判断大家是一起唱还是错开进入。',
    '演唱形式会改变音乐中的人物关系、空间和层次。',
    'g3/voice/forms',
    'g3/voice/unison-chorus-round'
  ),
  activity(
    'g3-polyphony-activity',
    'layered-listening',
    'g3-polyphony',
    '多声部音乐建筑',
    '打开不同声部，听听音乐建筑怎样一层层长出来。',
    '多声部让旋律、节奏和音色在同一时间形成丰富层次。',
    'g3/polyphony/building',
    'g3/polyphony/layers'
  ),
  activity(
    'g3-crescendo-diminuendo-activity',
    'meter-movement',
    'g3-crescendo-diminuendo',
    '渐强和渐弱的轨迹',
    '用动作和音量轨迹表现声音逐渐变强或逐渐变弱。',
    '渐强、渐弱不是突然变化，而是力度在一段时间里的移动。',
    'g3/dynamics/trajectory',
    'g3/dynamics/crescendo'
  ),
  activity(
    'g3-review-activity',
    'review-quest',
    'g3-review',
    '三年级音乐鉴赏复习',
    '带着情绪、动作、故事和文化线索再听一遍。',
    '好的复习会让音乐经验、主观感受和乐理名字彼此连接。',
    'g3/review/music-theater',
    'g3/review/works'
  ),
]

export const GRADE_THREE_ACTIVITY_IDS: Record<string, string[]> = Object.fromEntries(
  GRADE_THREE_ACTIVITIES.map((item) => [item.knowledgePointId, [item.id]])
)
