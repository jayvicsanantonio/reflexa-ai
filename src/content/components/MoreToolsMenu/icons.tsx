/**
 * More Tools Menu Icons
 * Shared SVG icons used in the More Tools Menu component
 */

import {
  Volume2,
  VolumeX,
  Move,
  List,
  AlignLeft,
  Heading,
  Smile,
  ArrowRight,
  Heart,
  GraduationCap,
  Sparkles,
  Edit,
  Loader2,
} from 'lucide-react';

export const VolumeIcon = () => <Volume2 size={16} strokeWidth={2} />;

export const VolumeMuteIcon = () => <VolumeX size={16} strokeWidth={2} />;

export const ReduceMotionIcon = () => <Move size={16} strokeWidth={2} />;

export const BulletIcon = () => <List size={16} strokeWidth={2} />;

export const ParagraphIcon = () => <AlignLeft size={16} strokeWidth={2} />;

export const HeadlineIcon = () => <Heading size={16} strokeWidth={2} />;

export const CalmIcon = () => <Smile size={16} strokeWidth={2} />;

export const ConciseIcon = () => <ArrowRight size={16} strokeWidth={2} />;

export const EmpatheticIcon = () => <Heart size={16} strokeWidth={2} />;

export const AcademicIcon = () => <GraduationCap size={16} strokeWidth={2} />;

export const SparklesIcon = () => <Sparkles size={16} strokeWidth={2} />;

export const EditIcon = () => <Edit size={16} strokeWidth={2} />;

export const LoadingIcon = () => (
  <Loader2 size={16} strokeWidth={2} className="reflexa-more-tools__spinner" />
);
