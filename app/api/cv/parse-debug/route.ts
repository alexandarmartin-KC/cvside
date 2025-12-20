import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse/lib/pdf-parse';

/**
 * DEBUG ENDPOINT - View raw extracted text from PDF
 * Use this to see exactly what text OpenAI receives
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    const text = data.text;

    return NextResponse.json({
      success: true,
      rawText: text,
      textLength: text.length,
      preview: text.substring(0, 3000),
      lines: text.split('\n').slice(0, 100)
    });
  } catch (error: any) {
    console.error('❌ Debug parse error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
