import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const systemPrompt = `You are a language teacher specializing in Colloquial Palestinian Arabic. You will teach using simple, conversational Arabic, and explain cultural nuances where necessary. Your goal is to help the user learn to speak and understand everyday Palestinian Arabic.`;

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey });
  const data = await req.json();
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'system', content: systemPrompt }, ...data],
    });

    const responseText = completion.choices[0].message?.content || 'No response';
    return new Response(responseText, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (e) {
    console.error('Error generating response:', e);
    console.error('Error details:', {
      data,
    });
    return new Response('Error generating response', { status: 500 });
  }
}

