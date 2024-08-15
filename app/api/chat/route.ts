import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const systemPrompt = `
You are a Shami Arabic language partner/teacher for English-speaking students. Please provide brief and concise responses when teaching. Focus on key phrases, simple explanations, and avoid unnecessary details. When using Arabic words, write them in Arabic along with transliteration. Keep your responses to a few sentences.
`;
const rateLimit = {
  limit: 1, 
  timeWindow: 3 * 60 * 60 * 1000,
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const currentTime = Date.now();

  const cookies = req.cookies.get('rateLimit')?.value;
  let requestData = cookies ? JSON.parse(cookies) : { count: 0, lastRequestTime: 0 };

  const timeSinceLastRequest = currentTime - requestData.lastRequestTime;

  if (timeSinceLastRequest > rateLimit.timeWindow) {
    requestData = { count: 1, lastRequestTime: currentTime };
  } else {
    requestData.count += 1;
  }

  if (requestData.count > rateLimit.limit) {
    const timeUntilReset = rateLimit.timeWindow - timeSinceLastRequest;
    const timeUntilResetMinutes = Math.ceil(timeUntilReset / 1000 / 60);

    return new NextResponse(
      JSON.stringify({
        error: true,
        message: 'Too many requests, please try again later.',
        timeUntilReset: timeUntilResetMinutes,
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  requestData.lastRequestTime = currentTime;

  const remainingRequests = rateLimit.limit - requestData.count;

  const response = new NextResponse(
    JSON.stringify({
      error: false,
      message: '',
      remainingRequests,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  response.cookies.set('rateLimit', JSON.stringify(requestData), {
    httpOnly: true, 
    maxAge: rateLimit.timeWindow / 1000,
    path: '/',
  });

  const apiKey = process.env.OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey });
  const data = await req.json();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'system', content: systemPrompt }, ...data],
    });

    const responseText = completion.choices[0].message?.content || 'No response';

    return new NextResponse(
      JSON.stringify({
        error: false,
        message: responseText,
        remainingRequests,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (e) {
    console.error('Error generating response:', e);
    return new NextResponse(
      JSON.stringify({ error: true, message: 'Error generating response' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}




