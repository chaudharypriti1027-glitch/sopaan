import type { LucideIcon } from 'lucide-react-native';
import {
  BookOpen,
  Brain,
  Flame,
  GraduationCap,
  Rocket,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react-native';
import type { PersonAvatarSpec } from './PersonAvatarArt';

export type AvatarPresetKind = 'person' | 'badge';

export type AvatarPresetId =
  | 'personArjun'
  | 'personPriya'
  | 'personDev'
  | 'personAnanya'
  | 'personRohan'
  | 'personMeera'
  | 'personKabir'
  | 'personSiya'
  | 'personVikram'
  | 'personNaina'
  | 'personAryan'
  | 'personZara'
  | 'scholar'
  | 'reader'
  | 'strategist'
  | 'champion'
  | 'achiever'
  | 'focused'
  | 'premium'
  | 'streak';

export type AvatarPreset = {
  id: AvatarPresetId;
  kind: AvatarPresetKind;
  labelKey: string;
  /** Badge tile gradient — top → bottom */
  gradient: readonly [string, string, string];
  glyph: string;
  ring: string;
  Icon?: LucideIcon;
  person?: PersonAvatarSpec;
};

const PERSON: Record<string, PersonAvatarSpec> = {
  arjun: {
    skin: ['#FDDFC8', '#EDBF98', '#D4A078'],
    hair: ['#4A3E50', '#2C2438', '#1A1520'],
    shirt: ['#525A80', '#3E4568', '#2C3358'],
    hairStyle: 'crop',
    cheek: '#E8A090',
    iris: '#3D4A6E',
  },
  priya: {
    skin: ['#FFE8D8', '#F0C8A8', '#D8A888'],
    hair: ['#6A4830', '#4A3020', '#2E1E12'],
    shirt: ['#6A9A88', '#568274', '#426A5C'],
    hairStyle: 'wave',
    cheek: '#F0A8A0',
    iris: '#5C4030',
  },
  dev: {
    skin: ['#F8D8B8', '#E8C098', '#D0A878'],
    hair: ['#2E3650', '#1E2438', '#12182A'],
    shirt: ['#D4B066', '#C29A4E', '#8F7028'],
    hairStyle: 'cap',
    cheek: '#D89888',
    iris: '#2A3550',
  },
  ananya: {
    skin: ['#FFF0E0', '#F4D0B0', '#E0B090'],
    hair: ['#7A5040', '#5C3828', '#3E2418'],
    shirt: ['#C07866', '#A86452', '#8C5040'],
    hairStyle: 'bun',
    cheek: '#F0A8A0',
    iris: '#6A4838',
  },
  rohan: {
    skin: ['#F8E0C0', '#E8C8A0', '#D0A880'],
    hair: ['#404850', '#283038', '#181E24'],
    shirt: ['#7AAA98', '#6A9A88', '#4C7264'],
    hairStyle: 'spiky',
    cheek: '#E0A090',
    iris: '#3A5048',
  },
  meera: {
    skin: ['#FFF0E4', '#F4D0B0', '#E0B090'],
    hair: ['#8A5840', '#6A4030', '#4A2818'],
    shirt: ['#787B9C', '#64678C', '#4E5174'],
    hairStyle: 'braid',
    cheek: '#F0A8B0',
    iris: '#5A3848',
  },
  kabir: {
    skin: ['#E8D0A8', '#D4B896', '#C0A078'],
    hair: ['#3A3A3A', '#1A1A1A', '#0E0E0E'],
    shirt: ['#D08878', '#C07866', '#A8503E'],
    hairStyle: 'crop',
    cheek: '#C88878',
    iris: '#3A3020',
  },
  siya: {
    skin: ['#FFF0E0', '#F4D8C0', '#E0C0A0'],
    hair: ['#5A6878', '#3A4858', '#283440'],
    shirt: ['#6888B0', '#5676A0', '#3E5E88'],
    hairStyle: 'wave',
    cheek: '#E8B0A8',
    iris: '#4A5870',
  },
  vikram: {
    skin: ['#F8E0C0', '#E8C8A8', '#D8B088'],
    hair: ['#4A3828', '#2A2018', '#1A1008'],
    shirt: ['#D4B066', '#B89442', '#8F7028'],
    hairStyle: 'crop',
    cheek: '#D89080',
    iris: '#4A3820',
  },
  naina: {
    skin: ['#FFF0E0', '#F5D8C0', '#E8C0A0'],
    hair: ['#6A4868', '#4A3048', '#322030'],
    shirt: ['#646A90', '#525A80', '#3E4568'],
    hairStyle: 'bun',
    cheek: '#E8A0A8',
    iris: '#5A4060',
  },
  aryan: {
    skin: ['#ECD8B8', '#DCC0A0', '#C8A880'],
    hair: ['#505850', '#303830', '#202820'],
    shirt: ['#8098C0', '#6E88B0', '#4C6084'],
    hairStyle: 'spiky',
    cheek: '#C89080',
    iris: '#3A4858',
  },
  zara: {
    skin: ['#FCE8C8', '#F0D0B0', '#E0B890'],
    hair: ['#7A5840', '#5A4030', '#3E2818'],
    shirt: ['#E8C880', '#D4B066', '#A67C33'],
    hairStyle: 'wave',
    cheek: '#E8A898',
    iris: '#6A5038',
  },
};

export const AVATAR_PERSON_PRESETS: AvatarPreset[] = [
  {
    id: 'personArjun',
    kind: 'person',
    labelKey: 'avatarPersonArjun',
    gradient: ['#525A80', '#3E4568', '#2C3358'],
    glyph: '#FFFFFF',
    ring: '#DBDEEA',
    person: PERSON.arjun,
  },
  {
    id: 'personPriya',
    kind: 'person',
    labelKey: 'avatarPersonPriya',
    gradient: ['#6A9A88', '#568274', '#426A5C'],
    glyph: '#FFFFFF',
    ring: '#CFE0D9',
    person: PERSON.priya,
  },
  {
    id: 'personDev',
    kind: 'person',
    labelKey: 'avatarPersonDev',
    gradient: ['#D4B066', '#B89442', '#8F7028'],
    glyph: '#FFFFFF',
    ring: '#EADFC4',
    person: PERSON.dev,
  },
  {
    id: 'personAnanya',
    kind: 'person',
    labelKey: 'avatarPersonAnanya',
    gradient: ['#C07866', '#A86452', '#8C5040'],
    glyph: '#FFFFFF',
    ring: '#EACBC0',
    person: PERSON.ananya,
  },
  {
    id: 'personRohan',
    kind: 'person',
    labelKey: 'avatarPersonRohan',
    gradient: ['#6A9A88', '#568274', '#426A5C'],
    glyph: '#FFFFFF',
    ring: '#CFE0D9',
    person: PERSON.rohan,
  },
  {
    id: 'personMeera',
    kind: 'person',
    labelKey: 'avatarPersonMeera',
    gradient: ['#64678C', '#4E5174', '#3A3D58'],
    glyph: '#FFFFFF',
    ring: '#CDD2E0',
    person: PERSON.meera,
  },
  {
    id: 'personKabir',
    kind: 'person',
    labelKey: 'avatarPersonKabir',
    gradient: ['#C07866', '#A86452', '#8C5040'],
    glyph: '#FFFFFF',
    ring: '#EACBC0',
    person: PERSON.kabir,
  },
  {
    id: 'personSiya',
    kind: 'person',
    labelKey: 'avatarPersonSiya',
    gradient: ['#6E88B0', '#5676A0', '#3E5E88'],
    glyph: '#FFFFFF',
    ring: '#D3DEEA',
    person: PERSON.siya,
  },
  {
    id: 'personVikram',
    kind: 'person',
    labelKey: 'avatarPersonVikram',
    gradient: ['#D4B066', '#B89442', '#8F7028'],
    glyph: '#FFFFFF',
    ring: '#EADFC4',
    person: PERSON.vikram,
  },
  {
    id: 'personNaina',
    kind: 'person',
    labelKey: 'avatarPersonNaina',
    gradient: ['#525A80', '#3E4568', '#2C3358'],
    glyph: '#FFFFFF',
    ring: '#DBDEEA',
    person: PERSON.naina,
  },
  {
    id: 'personAryan',
    kind: 'person',
    labelKey: 'avatarPersonAryan',
    gradient: ['#6E88B0', '#5676A0', '#3E5E88'],
    glyph: '#FFFFFF',
    ring: '#D3DEEA',
    person: PERSON.aryan,
  },
  {
    id: 'personZara',
    kind: 'person',
    labelKey: 'avatarPersonZara',
    gradient: ['#F0D48A', '#C29A4E', '#A67C33'],
    glyph: '#2A2110',
    ring: '#EADFC4',
    person: PERSON.zara,
  },
];

export const AVATAR_BADGE_PRESETS: AvatarPreset[] = [
  {
    id: 'scholar',
    kind: 'badge',
    labelKey: 'avatarPresetScholar',
    Icon: GraduationCap,
    gradient: ['#525A80', '#3E4568', '#2C3358'],
    glyph: '#FFFFFF',
    ring: '#DBDEEA',
  },
  {
    id: 'reader',
    kind: 'badge',
    labelKey: 'avatarPresetReader',
    Icon: BookOpen,
    gradient: ['#6A9A88', '#568274', '#426A5C'],
    glyph: '#FFFFFF',
    ring: '#CFE0D9',
  },
  {
    id: 'strategist',
    kind: 'badge',
    labelKey: 'avatarPresetStrategist',
    Icon: Brain,
    gradient: ['#64678C', '#4E5174', '#3A3D58'],
    glyph: '#FFFFFF',
    ring: '#CDD2E0',
  },
  {
    id: 'champion',
    kind: 'badge',
    labelKey: 'avatarPresetChampion',
    Icon: Trophy,
    gradient: ['#D4B066', '#B89442', '#8F7028'],
    glyph: '#FFFFFF',
    ring: '#EADFC4',
  },
  {
    id: 'achiever',
    kind: 'badge',
    labelKey: 'avatarPresetAchiever',
    Icon: Rocket,
    gradient: ['#6E88B0', '#5676A0', '#3E5E88'],
    glyph: '#FFFFFF',
    ring: '#D3DEEA',
  },
  {
    id: 'focused',
    kind: 'badge',
    labelKey: 'avatarPresetFocused',
    Icon: Target,
    gradient: ['#C07866', '#A86452', '#8C5040'],
    glyph: '#FFFFFF',
    ring: '#EACBC0',
  },
  {
    id: 'premium',
    kind: 'badge',
    labelKey: 'avatarPresetPremium',
    Icon: Sparkles,
    gradient: ['#F0D48A', '#C29A4E', '#A67C33'],
    glyph: '#2A2110',
    ring: '#EADFC4',
  },
  {
    id: 'streak',
    kind: 'badge',
    labelKey: 'avatarPresetStreak',
    Icon: Flame,
    gradient: ['#E8A050', '#D08030', '#A86020'],
    glyph: '#FFFFFF',
    ring: '#F4D8A8',
  },
];

/** All presets — person portraits first, then achievement badges. */
export const AVATAR_PRESETS: AvatarPreset[] = [...AVATAR_PERSON_PRESETS, ...AVATAR_BADGE_PRESETS];

const PRESET_MAP = Object.fromEntries(AVATAR_PRESETS.map((preset) => [preset.id, preset])) as Record<
  AvatarPresetId,
  AvatarPreset
>;

export function getAvatarPreset(id?: string | null): AvatarPreset | undefined {
  if (!id) return undefined;
  return PRESET_MAP[id as AvatarPresetId];
}

export function defaultAvatarPresetForName(name?: string): AvatarPreset {
  if (!name?.trim()) {
    return AVATAR_PERSON_PRESETS[0];
  }
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PERSON_PRESETS[hash % AVATAR_PERSON_PRESETS.length];
}
