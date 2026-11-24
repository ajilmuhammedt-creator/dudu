import { z } from 'zod';

/**
 * 36-character hex-and-dash GUID regex.
 * Accepts standard RFC-4122 UUIDs as well as synthetic seed GUIDs
 * (e.g., 11111111-1111-1111-1111-111111111111, 22222222-2222-2222-2222-222222222222, etc.)
 */
export const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const guidSchema = z.string().regex(guidRegex, 'Invalid ID format');
