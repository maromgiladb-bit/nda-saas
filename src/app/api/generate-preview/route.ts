import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partyName, effectiveDate, governingLaw, disclosingParty, receivingParty, purpose, duration } = body;

    const prompt = `Generate a professional Non-Disclosure Agreement with the following details:
    
Party Name: ${partyName}
Effective Date: ${effectiveDate}
Governing Law: ${governingLaw}
Disclosing Party: ${disclosingParty}
Receiving Party: ${receivingParty}
Purpose: ${purpose}
Duration: ${duration}

Create a complete, legally-sound NDA document with all standard clauses including definitions, obligations, exclusions, term, and signatures section.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a legal document expert. Generate professional, legally-sound NDA documents in a clear, structured format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content;

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error generating NDA:', error);
    return NextResponse.json(
      { error: 'Failed to generate NDA preview' },
      { status: 500 }
    );
  }
}