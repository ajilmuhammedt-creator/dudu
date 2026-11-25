// src/lib/cbse-subjects.ts

/**
 * Returns the standard CBSE subjects list for a given class (1–12).
 */
export function getSubjectsForClass(cbseClass: number): string[] {
  if (cbseClass <= 2) {
    return ['Mathematics', 'English', 'Hindi', 'EVS'];
  }
  if (cbseClass <= 5) {
    return ['Mathematics', 'EVS', 'English', 'Hindi', 'Computer'];
  }
  if (cbseClass <= 8) {
    return ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Computer'];
  }
  if (cbseClass <= 10) {
    return ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Computer'];
  }
  // Class 11–12
  return ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer'];
}

export const ALL_CBSE_SUBJECTS = [
  'Mathematics',
  'EVS',
  'Science',
  'Social Science',
  'English',
  'Hindi',
  'Malayalam',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer'
];

export const AVATAR_EMOJIS = ['👦', '👧', '🧒', '🦊', '🐼', '🦁', '🚀', '🌟'];
