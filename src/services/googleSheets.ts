import { ReceiptRecord } from '../types';
import { getAccessToken, googleSignIn } from './auth';

export interface ExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  rowsAdded: number;
}

export const createAndExportToSheets = async (
  title: string,
  receipts: ReceiptRecord[]
): Promise<ExportResult> => {
  let token = await getAccessToken();
  if (!token) {
    const signInResult = await googleSignIn();
    if (!signInResult) {
      throw new Error('Google authentication is required to export to Google Sheets.');
    }
    token = signInResult.accessToken;
  }

  // 1. Create a new Spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || `PayCheck.lk - Receipts ${new Date().toISOString().slice(0, 10)}`,
      },
      sheets: [
        {
          properties: {
            title: 'Verified Receipts',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createResponse.ok) {
    const errText = await createResponse.text();
    throw new Error(`Failed to create Google Spreadsheet: ${errText}`);
  }

  const createData = await createResponse.json();
  const spreadsheetId = createData.spreadsheetId;
  const spreadsheetUrl = createData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare headers and rows
  const headers = [
    'Ref / Txn No',
    'Bank Name',
    'Amount (LKR)',
    'Date',
    'Time',
    'Sender Account / Name',
    'Beneficiary Account / Name',
    'Verification Status',
    'Notes / Remarks',
    'OCR Confidence (%)',
    'File Name',
    'Record ID',
    'Processed At',
  ];

  const rows = receipts.map((r) => [
    r.refNumber,
    r.bankName,
    r.amount,
    r.date,
    r.time || '',
    [r.senderName, r.senderAccount].filter(Boolean).join(' - '),
    [r.beneficiaryName, r.beneficiaryAccount].filter(Boolean).join(' - '),
    r.status.toUpperCase(),
    r.notes || '',
    `${r.confidence}%`,
    r.fileName,
    r.id,
    new Date(r.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Colombo' }),
  ]);

  const values = [headers, ...rows];

  // 3. Append data to the created sheet
  const appendResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Verified Receipts'!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: "'Verified Receipts'!A1",
        majorDimension: 'ROWS',
        values: values,
      }),
    }
  );

  if (!appendResponse.ok) {
    const errText = await appendResponse.text();
    throw new Error(`Failed to populate spreadsheet rows: ${errText}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    rowsAdded: rows.length,
  };
};
