'use server';

/**
 * @fileOverview An AI agent that summarizes fleet tracking alerts.
 *
 * - summarizeAlerts - A function that handles the alert summarization process.
 * - SummarizeAlertsInput - The input type for the summarizeAlerts function.
 * - SummarizeAlertsOutput - The return type for the summarizeAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAlertsInputSchema = z.object({
  events: z.string().describe('A JSON string containing an array of fleet tracking event objects.'),
});
export type SummarizeAlertsInput = z.infer<typeof SummarizeAlertsInputSchema>;

const SummarizeAlertsOutputSchema = z.object({
  summary: z.string().describe('A summary of the alerts, aggregated by severity and frequency, providing actionable insights.'),
});
export type SummarizeAlertsOutput = z.infer<typeof SummarizeAlertsOutputSchema>;

export async function summarizeAlerts(input: SummarizeAlertsInput): Promise<SummarizeAlertsOutput> {
  return summarizeAlertsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAlertsPrompt',
  input: {schema: SummarizeAlertsInputSchema},
  output: {schema: SummarizeAlertsOutputSchema},
  prompt: `You are a fleet management assistant. You will receive fleet tracking events as input. Analyze these events, aggregate and summarize alerts based on severity and frequency, and provide actionable insights for a fleet manager.\n\nEvents: {{{events}}}\n\nSummary: `,
});

const summarizeAlertsFlow = ai.defineFlow(
  {
    name: 'summarizeAlertsFlow',
    inputSchema: SummarizeAlertsInputSchema,
    outputSchema: SummarizeAlertsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
