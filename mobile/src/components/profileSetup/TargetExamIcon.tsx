import type { ReactNode } from 'react';
import {
  Briefcase,
  Building2,
  ClipboardList,
  GraduationCap,
  Landmark,
  MapPin,
  Shield,
  Sparkles,
  Train,
} from 'lucide-react-native';

export type TargetExamValue =
  | 'SSC CGL'
  | 'IBPS PO'
  | 'RRB NTPC'
  | 'CDS'
  | 'CTET'
  | 'State PSC'
  | 'UPSC CSE'
  | 'Police Constable'
  | 'Other';

type TargetExamIconProps = {
  examValue: string;
  color: string;
  size?: number;
};

export function TargetExamIcon({ examValue, color, size = 20 }: TargetExamIconProps) {
  const icons: Record<string, ReactNode> = {
    'SSC CGL': <ClipboardList size={size} color={color} />,
    'IBPS PO': <Building2 size={size} color={color} />,
    'RRB NTPC': <Train size={size} color={color} />,
    CDS: <Shield size={size} color={color} />,
    CTET: <GraduationCap size={size} color={color} />,
    'State PSC': <MapPin size={size} color={color} />,
    'UPSC CSE': <Landmark size={size} color={color} />,
    'Police Constable': <Briefcase size={size} color={color} />,
    Other: <Sparkles size={size} color={color} />,
  };

  return icons[examValue] ?? <Sparkles size={size} color={color} />;
}
