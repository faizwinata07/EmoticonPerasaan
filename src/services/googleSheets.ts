import { VoteRecord, EmotionCategory } from '../types/emotion';

export interface ConnectedSheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
  sheetTitle: string;
  lastSyncedAt?: string;
}

const STORAGE_KEY_SHEET_INFO = 'radar_emosi_google_sheet_info_v1';

export function getSavedSheetInfo(): ConnectedSheetInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHEET_INFO);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSheetInfo(info: ConnectedSheetInfo | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (info) {
      localStorage.setItem(STORAGE_KEY_SHEET_INFO, JSON.stringify(info));
    } else {
      localStorage.removeItem(STORAGE_KEY_SHEET_INFO);
    }
  } catch (e) {
    console.error('Failed to save sheet info', e);
  }
}

/**
 * Creates a brand new Google Spreadsheet configured as the class mood database
 */
export async function createMoodDatabaseSpreadsheet(
  accessToken: string,
  title: string = 'Radar Emosi Kelas 11 SMA - Database'
): Promise<ConnectedSheetInfo> {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
      },
      sheets: [
        {
          properties: {
            title: 'Data_Respon_Murid',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json();
    throw new Error(errorData.error?.message || 'Gagal membuat Google Spreadsheet baru');
  }

  const data = await createRes.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  const sheetTitle = data.sheets?.[0]?.properties?.title || 'Data_Respon_Murid';

  // Add stylish headers and column labels
  const headers = [
    'No',
    'ID Siswa Anonim',
    'Waktu (WIB)',
    'Emotikon',
    'Perasaan Siswa',
    'Kategori',
    'Sesi Kelas',
    'Timestamp (ms)',
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:H1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${sheetTitle}!A1:H1`,
        majorDimension: 'ROWS',
        values: [headers],
      }),
    }
  );

  // Format header row (dark header with bold white text)
  try {
    const firstSheetId = data.sheets?.[0]?.properties?.sheetId || 0;
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: firstSheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 8,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.08, green: 0.12, blue: 0.2 }, // Slate dark
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                    fontSize: 11,
                  },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.warn('Could not apply header styling, but spreadsheet was created', err);
  }

  const sheetInfo: ConnectedSheetInfo = {
    spreadsheetId,
    spreadsheetUrl,
    spreadsheetTitle: title,
    sheetTitle,
    lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
  };

  saveSheetInfo(sheetInfo);
  return sheetInfo;
}

/**
 * Append a single vote record to the connected Google Spreadsheet
 */
export async function appendVoteToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  vote: VoteRecord
): Promise<void> {
  const rowValues = [
    vote.index,
    vote.anonymousStudentId,
    vote.timestamp,
    vote.emotionEmoji,
    vote.emotionLabel,
    vote.categoryLabel,
    vote.sessionName,
    vote.rawTime,
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A:H:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${sheetTitle}!A:H`,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Gagal menyimpan suara ke Google Sheets');
  }
}

/**
 * Batch append multiple votes to Google Sheets (e.g. syncing local history)
 */
export async function batchAppendVotesToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  votes: VoteRecord[]
): Promise<void> {
  if (votes.length === 0) return;

  const rows = votes.map((v) => [
    v.index,
    v.anonymousStudentId,
    v.timestamp,
    v.emotionEmoji,
    v.emotionLabel,
    v.categoryLabel,
    v.sessionName,
    v.rawTime,
  ]);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A:H:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${sheetTitle}!A:H`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Gagal sinkronisasi data ke Google Sheets');
  }
}

/**
 * Read all recorded votes from Google Sheets database
 */
export async function readVotesFromSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string
): Promise<VoteRecord[]> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A2:H`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Gagal membaca data dari Google Sheets');
  }

  const data = await res.json();
  const rows = data.values || [];

  return rows.map((row: any[], i: number): VoteRecord => {
    const index = parseInt(row[0], 10) || i + 1;
    const anonymousStudentId = row[1] || `SISWA-XI-${1000 + i}`;
    const timestamp = row[2] || '';
    const emotionEmoji = row[3] || '✨';
    const emotionLabel = row[4] || 'Perasaan';
    const categoryLabel = row[5] || 'Umum';
    const sessionName = row[6] || 'Kelas XI';
    const rawTime = parseInt(row[7], 10) || Date.now() - (rows.length - i) * 60000;

    let category: EmotionCategory = 'positif';
    if (categoryLabel.toLowerCase().includes('lelah') || categoryLabel.toLowerCase().includes('rehat')) {
      category = 'kelelahan';
    } else if (categoryLabel.toLowerCase().includes('stres') || categoryLabel.toLowerCase().includes('support')) {
      category = 'stres';
    } else if (categoryLabel.toLowerCase().includes('fokus') || categoryLabel.toLowerCase().includes('motivasi')) {
      category = 'fokus';
    } else if (categoryLabel.toLowerCase().includes('tenang') || categoryLabel.toLowerCase().includes('netral')) {
      category = 'tenang';
    }

    return {
      id: `sheet-vote-${index}-${rawTime}`,
      index,
      emotionId: emotionLabel.toLowerCase().replace(/\s+/g, '_'),
      emotionEmoji,
      emotionLabel,
      category,
      categoryLabel,
      timestamp,
      rawTime,
      anonymousStudentId,
      sessionName,
    };
  });
}

/**
 * Clear data rows in Google Sheets database (preserving header row)
 */
export async function clearSheetDataRows(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string
): Promise<void> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A2:H:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || 'Gagal mengosongkan data Google Sheets');
  }
}
