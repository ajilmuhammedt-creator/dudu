// src/lib/cbse-subjects.ts

/**
 * Returns the default CBSE subjects list for a given class (1–12).
 */
export function getSubjectsForClass(cbseClass: number): string[] {
  if (cbseClass <= 2) {
    return ['Mathematics', 'English', 'Hindi', 'EVS'];
  }
  if (cbseClass <= 5) {
    return ['Mathematics', 'EVS', 'English', 'Hindi', 'Computer'];
  }
  if (cbseClass <= 10) {
    return ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Computer'];
  }
  // Class 11–12
  return ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer'];
}

/**
 * Returns all subjects that are valid for a given CBSE class (1–12).
 * Used when changing class so parent-chosen subjects (like Social Science or Malayalam)
 * are preserved if they are valid for the new class.
 */
export function getValidSubjectsForClass(cbseClass: number): string[] {
  if (cbseClass <= 10) {
    return [
      'Mathematics',
      'EVS',
      'Science',
      'Social Science',
      'English',
      'Hindi',
      'Malayalam',
      'Computer'
    ];
  }
  return ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Malayalam', 'Computer'];
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
