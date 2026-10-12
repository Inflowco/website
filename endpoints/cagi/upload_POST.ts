import superjson from 'superjson';
import pdfParse from 'pdf-parse';
import { db, saveDb } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader, userHasFacilityAccess } from '../../helpers/auth';

interface ParsedCAGIData {
  manufacturer?: string;
  model?: string;
  compressorType?: string;
  capacityCfm?: number;
  fullLoadPowerKw?: number;
  ratedPressurePsi?: number;
  partLoad25?: number;
  partLoad50?: number;
  partLoad75?: number;
  partLoad100?: number;
  testDate?: string;
}

// Parse CAGI data sheet PDF text
function parseCAGIText(text: string): ParsedCAGIData {
  const data: ParsedCAGIData = {};
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Common patterns in CAGI data sheets
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const nextLine = lines[i + 1] || '';

    // Manufacturer
    if (line.includes('manufacturer') || line.includes('company')) {
      const match = nextLine.match(/^([A-Za-z\s&]+)/);
      if (match) data.manufacturer = match[1].trim();
    }

    // Model
    if (line.includes('model') && !line.includes('model year')) {
      const modelMatch = nextLine.match(/^([A-Za-z0-9\-\+\s]+)/);
      if (modelMatch) data.model = modelMatch[1].trim();
    }

    // Compressor type
    if (line.includes('compressor type') || line.includes('type of compressor')) {
      if (nextLine.toLowerCase().includes('screw')) {
        data.compressorType = 'Rotary Screw';
      } else if (nextLine.toLowerCase().includes('reciprocating')) {
        data.compressorType = 'Reciprocating';
      } else if (nextLine.toLowerCase().includes('centrifugal')) {
        data.compressorType = 'Centrifugal';
      } else if (nextLine.toLowerCase().includes('scroll')) {
        data.compressorType = 'Scroll';
      }
    }

    // Capacity (CFM or ACFM)
    if (line.includes('capacity') || line.includes('acfm') || line.includes('actual cfm')) {
      const cfmMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:acfm|cfm)/i);
      if (cfmMatch) data.capacityCfm = parseFloat(cfmMatch[1]);
    }

    // Full load power
    if (line.includes('full load') && (line.includes('power') || line.includes('kw'))) {
      const kwMatch = nextLine.match(/(\d+(?:\.\d+)?)\s*(?:kw|kilowatt)/i) ||
                      line.match(/(\d+(?:\.\d+)?)\s*(?:kw|kilowatt)/i);
      if (kwMatch) data.fullLoadPowerKw = parseFloat(kwMatch[1]);
    }

    // Rated pressure
    if (line.includes('rated pressure') || line.includes('discharge pressure')) {
      const psiMatch = nextLine.match(/(\d+(?:\.\d+)?)\s*(?:psi|psig)/i) ||
                       line.match(/(\d+(?:\.\d+)?)\s*(?:psi|psig)/i);
      if (psiMatch) data.ratedPressurePsi = parseFloat(psiMatch[1]);
    }

    // Part load data
    if (line.includes('25%') || line.includes('25 %')) {
      const match = line.match(/(\d+(?:\.\d+)?)\s*kw/i);
      if (match) data.partLoad25 = parseFloat(match[1]);
    }
    if (line.includes('50%') || line.includes('50 %')) {
      const match = line.match(/(\d+(?:\.\d+)?)\s*kw/i);
      if (match) data.partLoad50 = parseFloat(match[1]);
    }
    if (line.includes('75%') || line.includes('75 %')) {
      const match = line.match(/(\d+(?:\.\d+)?)\s*kw/i);
      if (match) data.partLoad75 = parseFloat(match[1]);
    }
    if (line.includes('100%') || line.includes('100 %')) {
      const match = line.match(/(\d+(?:\.\d+)?)\s*kw/i);
      if (match) data.partLoad100 = parseFloat(match[1]);
    }

    // Test date
    if (line.includes('test date') || line.includes('date of test')) {
      const dateMatch = nextLine.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/);
      if (dateMatch) data.testDate = dateMatch[1];
    }
  }

  // Try to extract numbers more aggressively if we didn't find them
  if (!data.capacityCfm) {
    const cfmMatches = text.match(/(\d{2,4}(?:\.\d+)?)\s*(?:acfm|cfm)/gi);
    if (cfmMatches && cfmMatches.length > 0) {
      const match = cfmMatches[0].match(/(\d+(?:\.\d+)?)/);
      if (match) data.capacityCfm = parseFloat(match[1]);
    }
  }

  if (!data.fullLoadPowerKw) {
    // Look for power values near "full load" or just kW values
    const powerMatch = text.match(/full\s*load[^0-9]*(\d+(?:\.\d+)?)\s*kw/i);
    if (powerMatch) data.fullLoadPowerKw = parseFloat(powerMatch[1]);
  }

  if (!data.ratedPressurePsi) {
    const psiMatches = text.match(/(\d{2,3}(?:\.\d+)?)\s*(?:psi|psig)/gi);
    if (psiMatches && psiMatches.length > 0) {
      const match = psiMatches[0].match(/(\d+(?:\.\d+)?)/);
      if (match) data.ratedPressurePsi = parseFloat(match[1]);
    }
  }

  return data;
}

export async function handle(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader || undefined);

    if (!token) {
      return new Response(superjson.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return new Response(superjson.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const facilityId = parseInt(formData.get('facilityId') as string || '0');

    if (!file) {
      return new Response(superjson.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!facilityId) {
      return new Response(superjson.stringify({ error: 'facilityId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hasAccess = await userHasFacilityAccess(payload.userId, facilityId);
    if (!hasAccess) {
      return new Response(superjson.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfData;
    try {
      pdfData = await pdfParse(buffer);
    } catch (err) {
      return new Response(superjson.stringify({
        error: 'Failed to parse PDF. Please ensure the file is a valid PDF.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const extractedText = pdfData.text;
    const parsedData = parseCAGIText(extractedText);

    // Calculate specific power if we have capacity and power
    let specificPower: number | null = null;
    if (parsedData.capacityCfm && parsedData.fullLoadPowerKw) {
      specificPower = parseFloat((parsedData.capacityCfm / parsedData.fullLoadPowerKw).toFixed(2));
    }

    // Return parsed data for user review (not saved yet)
    return new Response(superjson.stringify({
      parsed: {
        manufacturer: parsedData.manufacturer || '',
        model: parsedData.model || '',
        compressorType: parsedData.compressorType || '',
        capacityCfm: parsedData.capacityCfm || null,
        fullLoadPowerKw: parsedData.fullLoadPowerKw || null,
        ratedPressurePsi: parsedData.ratedPressurePsi || null,
        specificPower,
        partLoad25: parsedData.partLoad25 || null,
        partLoad50: parsedData.partLoad50 || null,
        partLoad75: parsedData.partLoad75 || null,
        partLoad100: parsedData.partLoad100 || null,
        testDate: parsedData.testDate || null,
      },
      rawText: extractedText.substring(0, 2000), // First 2000 chars for debugging
      fileName: file.name,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process upload';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
