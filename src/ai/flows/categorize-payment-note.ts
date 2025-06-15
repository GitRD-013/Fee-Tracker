
// This file is no longer used as AI categorization has been removed.
// You can safely delete this file.
// 'use server';
// /**
//  * @fileOverview This file defines a Genkit flow to categorize payment notes using AI.
//  *
//  * - categorizePaymentNote - A function that categorizes payment notes.
//  * - CategorizePaymentNoteInput - The input type for the categorizePaymentNote function.
//  * - CategorizePaymentNoteOutput - The output type for the categorizePaymentNote function.
//  */

// import {ai} from '@/ai/genkit';
// import {z} from 'genkit';

// const CategorizePaymentNoteInputSchema = z.object({
//   note: z.string().describe('The payment note to categorize.'),
// });
// export type CategorizePaymentNoteInput = z.infer<typeof CategorizePaymentNoteInputSchema>;

// const CategorizePaymentNoteOutputSchema = z.object({
//   categories: z
//     .array(z.string())
//     .describe(
//       'An array of categories that apply to the payment note.  Possible values include: late payment, partial payment, full payment, early payment, overpayment, other.'
//     ),
// });
// export type CategorizePaymentNoteOutput = z.infer<typeof CategorizePaymentNoteOutputSchema>;

// export async function categorizePaymentNote(input: CategorizePaymentNoteInput): Promise<CategorizePaymentNoteOutput> {
//   return categorizePaymentNoteFlow(input);
// }

// const prompt = ai.definePrompt({
//   name: 'categorizePaymentNotePrompt',
//   input: {schema: CategorizePaymentNoteInputSchema},
//   output: {schema: CategorizePaymentNoteOutputSchema},
//   prompt: `You are a financial assistant who categorizes payment notes. Based on the note, determine which categories apply to the note. Possible values include: late payment, partial payment, full payment, early payment, overpayment, other.

// Note: {{{note}}}

// Categories:`,
//   config: {
//     safetySettings: [
//       {
//         category: 'HARM_CATEGORY_HATE_SPEECH',
//         threshold: 'BLOCK_NONE',
//       },
//       {
//         category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
//         threshold: 'BLOCK_NONE',
//       },
//       {
//         category: 'HARM_CATEGORY_HARASSMENT',
//         threshold: 'BLOCK_NONE',
//       },
//       {
//         category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
//         threshold: 'BLOCK_NONE',
//       },
//     ],
//   },
// });

// const categorizePaymentNoteFlow = ai.defineFlow(
//   {
//     name: 'categorizePaymentNoteFlow',
//     inputSchema: CategorizePaymentNoteInputSchema,
//     outputSchema: CategorizePaymentNoteOutputSchema,
//   },
//   async input => {
//     const {output} = await prompt(input);
//     return output!;
//   }
// );

