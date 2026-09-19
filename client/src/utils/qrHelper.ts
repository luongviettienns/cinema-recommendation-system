export interface VietQRParams {
  bankId?: string; // e.g. 'ICB' (Vietinbank), 'VCB' (Vietcombank), 'MB' (MBBank)
  accountNo?: string;
  accountName?: string;
  amount: number;
  memo: string;
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}

export function generateVietQRUrl({
  bankId = 'ICB',
  accountNo = '109876543210',
  accountName = 'CINELIGHT CINEMA VIETNAM',
  amount,
  memo,
  template = 'compact2',
}: VietQRParams): string {
  const encodedAccountName = encodeURIComponent(accountName);
  const encodedMemo = encodeURIComponent(memo);
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodedMemo}&accountName=${encodedAccountName}`;
}
