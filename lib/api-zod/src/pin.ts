import { z } from "zod";

const pin = z
  .string({ required_error: "PIN is required." })
  .regex(/^\d{4,6}$/, "PIN must be 4–6 digits.");

/** POST /api/users/me/pin — set PIN for the first time */
export const SetPinBody = z.object({
  pin,
});

/** PUT /api/users/me/pin — change an existing PIN */
export const ChangePinBody = z.object({
  currentPin: z
    .string({ required_error: "currentPin is required." })
    .regex(/^\d{4,6}$/, "currentPin must be 4–6 digits."),
  newPin: pin,
});

/** DELETE /api/users/me/pin — remove PIN (requires confirmation) */
export const DeletePinBody = z.object({
  pin,
});

/** POST /api/auth/pin-login — PIN-based login (unauthenticated) */
export const PinLoginBody = z.object({
  email: z
    .string({ required_error: "email is required." })
    .email("Must be a valid email address."),
  pin,
});

export type SetPinBody = z.infer<typeof SetPinBody>;
export type ChangePinBody = z.infer<typeof ChangePinBody>;
export type DeletePinBody = z.infer<typeof DeletePinBody>;
export type PinLoginBody = z.infer<typeof PinLoginBody>;
