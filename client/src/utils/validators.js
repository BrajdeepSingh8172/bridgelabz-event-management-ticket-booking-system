import { z } from 'zod';

// ── Auth ─────────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Event ────────────────────────────────────────────────────────────────────
export const eventSchema = z.object({
  title:       z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category:    z.string().min(1, 'Category is required'),
  venue:       z.string().min(3, 'Venue is required'),
  city:        z.string().min(2, 'City is required'),
  startDate:   z.string().min(1, 'Start date is required'),
  endDate:     z.string().optional(),
  isFeatured:  z.boolean().optional(),
  totalCapacity: z.coerce.number().min(1, 'Capacity must be at least 1').optional(),
}).passthrough();   // ← keep extra fields like _bannerFile so the submit handler can read them

// ── Checkout / Attendee ───────────────────────────────────────────────────────
export const checkoutSchema = z.object({
  attendeeName:  z.string().min(2, 'Name must be at least 2 characters'),
  attendeeEmail: z.string().email('Enter a valid email address'),
  // Phone is optional — if provided, accept common formats (digits, spaces, +, dashes)
  attendeePhone: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.trim() === '' || /^[+\d][\d\s-]{7,14}$/.test(v.trim()),
      { message: 'Enter a valid phone number' }
    ),
});

// ── Profile ──────────────────────────────────────────────────────────────────
export const profileSchema = z.object({
  name:  z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number').optional().or(z.literal('')),
  bio:   z.string().max(300, 'Bio too long').optional(),
});
