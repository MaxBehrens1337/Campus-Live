import { z } from "zod";

export const loginSchema = z.object({
  companyName: z.string().min(2, "Firmenname muss mindestens 2 Zeichen haben"),
  customerNumber: z
    .string()
    .min(3, "Kundennummer ungültig")
    .regex(/^[A-Z]{2}-\d+$/, "Format: TH-12345"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const feedbackSchema = z.object({
  overallRating: z.number().min(1).max(5),
  contentRating: z.number().min(1).max(5),
  organizationRating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;

export const quizAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedIndex: z.number().min(0),
});

export const quizSubmitSchema = z.object({
  registrationId: z.string().uuid(),
  eventId: z.string().uuid(),
  answers: z.array(quizAnswerSchema),
});

export type QuizSubmitData = z.infer<typeof quizSubmitSchema>;

export const stampUpdateSchema = z.object({
  registrationId: z.string().uuid(),
  stationId: z.string().uuid(),
  score: z.number().min(0).max(100).optional(),
});

export type StampUpdateData = z.infer<typeof stampUpdateSchema>;

export const configuratorSchema = z.object({
  selectedProducts: z.array(z.string()).min(1, "Mindestens ein Produkt wählen"),
  scenario: z.string().optional(),
});

export type ConfiguratorData = z.infer<typeof configuratorSchema>;
