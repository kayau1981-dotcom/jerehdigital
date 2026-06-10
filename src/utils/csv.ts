import { Member, ColumnMapping } from '../types';

/**
 * Custom robust CSV parser to parse published-to-web Google Sheet CSV files
 * without requiring high-maintenance third-party dependencies of React 19.
 */
export function parseCSV(text: string): Record<string, string>[] {
  // Strip UTF-8 BOM if present
  text = text.replace(/^\uFEFF/, '');

  let lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  // Split lines accounting for multiline quoted text (very robust!)
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if (char === '\n' || char === '\r') {
      if (inQuotes) {
        currentLine += ' '; // Convert hard newline inside quote to a space
      } else {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip next \n
        }
        lines.push(currentLine);
        currentLine = '';
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Fallback: If inQuotes got stuck to true or we ended up with only 0 or 1 line,
  // but there are actual newlines in the raw text, let's fall back to a simple split on line breaks
  // to prevent a mismatched quote from failing to extract any rows.
  if (lines.length <= 1 && (text.includes('\n') || text.includes('\r'))) {
    const rawLines = text.split(/\r?\n/);
    if (rawLines.length > 1) {
      lines = rawLines;
    }
  }

  if (lines.length === 0) return [];

  // Parse headers & detect delimiter dynamically (comma vs semicolon vs tab)
  const firstLine = lines[0] || '';
  let delimiter = ',';
  let commaCount = 0;
  let semicolonCount = 0;
  let tabCount = 0;
  let inQuotesHeader = false;

  for (let i = 0; i < firstLine.length; i++) {
    const char = firstLine[i];
    if (char === '"') {
      inQuotesHeader = !inQuotesHeader;
    } else if (!inQuotesHeader) {
      if (char === ',') commaCount++;
      if (char === ';') semicolonCount++;
      if (char === '\t') tabCount++;
    }
  }

  if (semicolonCount > commaCount && semicolonCount > tabCount) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = '\t';
  }

  const headers = parseCSVLine(lines[0], delimiter);
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line, delimiter);
    const obj: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      const cleanHeader = header.trim();
      obj[cleanHeader] = values[index]?.trim() || '';
    });
    
    results.push(obj);
  }

  return results;
}

function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes) {
        if (line[i + 1] === '"') {
          // Escaped quote "" inside a quoted field
          current += '"';
          i++; // skip next quote
        } else {
          // Closing quote of a quoted field
          inQuotes = false;
        }
      } else {
        // Entering quotes is only allowed at the beginning of a field cell (or after trimming spaces)
        if (current.trim() === '') {
          inQuotes = true;
        } else {
          // Just a normal quote character inside a non-quoted field
          current += '"';
        }
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  // Clean up any remaining outer quotes and resolve double quotes safely
  return result.map(val => {
    let s = val.trim();
    if (s.startsWith('"') && s.endsWith('"')) {
      s = s.slice(1, -1).replace(/""/g, '"');
    }
    return s;
  });
}

/**
 * Formats parsed rows from Google Sheet into Member interfaces based on mapping configurations
 */
export function mapRowsToMembers(rows: Record<string, string>[], mapping: ColumnMapping): Member[] {
  return rows.map((row) => {
    // Determine gender: standard L/P
    let rawGender = (row[mapping.gender] || '').toUpperCase().trim();
    let gender: 'L' | 'P' = 'L';
    if (rawGender.startsWith('P') || rawGender.includes('FEMALE') || rawGender.includes('WANITA') || rawGender.includes('PEREMPUAN')) {
      gender = 'P';
    }

    // Determine status hidup: standard Hidup/Wafat
    let rawStatus = (row[mapping.statusHidup] || '').toUpperCase().trim();
    let statusHidup: 'Hidup' | 'Wafat' = 'Hidup';
    if (rawStatus.startsWith('W') || rawStatus === 'DEAD' || rawStatus.includes('WAFAT') || rawStatus.includes('MENINGGAL')) {
      statusHidup = 'Wafat';
    }

    const member: Member = {
      id: row[mapping.id] || `M_${Math.random().toString(36).substr(2, 9)}`,
      nama: row[mapping.nama] || 'Tanpa Nama',
      gender,
      statusHidup,
      ayahId: row[mapping.ayahId] || undefined,
      ibuId: row[mapping.ibuId] || undefined,
      pasanganId: row[mapping.pasanganId] || undefined,
      tanggalLahir: row[mapping.tanggalLahir] || undefined,
      tempatLahir: row[mapping.tempatLahir] || undefined,
      tanggalWafat: row[mapping.tanggalWafat] || undefined,
      pekerjaan: row[mapping.pekerjaan] || undefined,
      telepon: row[mapping.telepon] || undefined,
      domisili: row[mapping.domisili] || undefined,
      foto: row[mapping.foto] || undefined,
      catatan: row[mapping.catatan] || undefined,
    };

    return member;
  });
}

/**
 * Generates structured CSV content matching standard template
 */
export function generateTemplateCSV(mapping: ColumnMapping): string {
  const headers = [
    mapping.id,
    mapping.nama,
    mapping.gender,
    mapping.ayahId,
    mapping.ibuId,
    mapping.pasanganId,
    mapping.tanggalLahir,
    mapping.tempatLahir,
    mapping.statusHidup,
    mapping.tanggalWafat,
    mapping.pekerjaan,
    mapping.telepon,
    mapping.domisili,
    mapping.foto,
    mapping.catatan
  ].join(',');

  const rows = [
    ['M01', 'Mbah Joyo', 'L', '', '', 'M02', '1945-08-17', 'Solo', 'Wafat', '2020-01-01', 'Tani', '', 'Solo', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df', 'Sesepuh keluarga'].join(','),
    ['M02', 'Nenek Marsilah', 'P', '', '', 'M01', '1948-11-12', 'Yogyakarta', 'Hidup', '', 'IRT', '08123', 'Solo', 'https://images.unsplash.com/photo-1581579438747-1dc8d1e0ca96', 'Ibu Mertua'].join(','),
    ['M03', 'Bambang Joyo', 'L', 'M01', 'M02', '', '1970-05-24', 'Solo', 'Hidup', '', 'Guru', '08124', 'Semarang', '', 'Anak Pertama'].join(','),
  ];

  return [headers, ...rows].join('\n');
}

/**
 * Downloads a text string as a local file (for CSV templates)
 */
export function downloadFile(content: string, fileName: string, contentType: string) {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}
