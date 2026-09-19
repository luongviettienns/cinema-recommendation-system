import React, { useState } from 'react';
import { toast } from 'sonner';
import { QrCode, Copy, Check, ShieldAlert, Sparkles, CreditCard } from 'lucide-react';
import { generateVietQRUrl } from '../../utils/qrHelper';
import { formatCurrency } from '../../utils/formatCurrency';
import { Button } from '../../components/ui/Button';

interface VietQRPaymentProps {
  amount: number;
  bookingCode: string;
  onConfirmPaid: () => void;
  isSubmitting?: boolean;
}

export const VietQRPayment: React.FC<VietQRPaymentProps> = ({
  amount,
  bookingCode,
  onConfirmPaid,
  isSubmitting = false,
}) => {
  const [activeTab, setActiveTab] = useState<'vietqr' | 'momo' | 'card'>('vietqr');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const bankAccount = '109876543210';
  const bankName = 'VietinBank (ICB)';
  const accountHolder = 'CINELIGHT CINEMA VIETNAM';
  const transferMemo = `DATVE ${bookingCode}`;

  const qrImageUrl = generateVietQRUrl({
    bankId: 'ICB',
    accountNo: bankAccount,
    accountName: accountHolder,
    amount,
    memo: transferMemo,
    template: 'compact2',
  });

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success('Đã sao chép vào bộ nhớ tạm!', {
      description: text,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
      {/* Payment Method Selector Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('vietqr')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'vietqr'
              ? 'bg-white text-rose-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>VietQR Tự Động</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('momo')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'momo'
              ? 'bg-white text-pink-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Ví MoMo</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('card')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'card'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Thẻ ATM / Visa</span>
        </button>
      </div>

      {activeTab === 'vietqr' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Quét Mã VietQR Để Thanh Toán
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Mở ứng dụng ngân hàng bất kỳ để quét mã và chuyển tiền tự động đúng số tiền & nội dung
            </p>
          </div>

          {/* QR Code Card */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200/80 max-w-sm mx-auto shadow-inner">
            <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-100">
              <img
                src={qrImageUrl}
                alt="Mã VietQR"
                className="w-56 h-auto object-contain rounded-lg"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-3 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
              Mã QR mã hóa tự động số tiền {formatCurrency(amount)}
            </p>
          </div>

          {/* Transfer Details Form */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ngân hàng:</span>
              <span className="font-bold text-slate-800">{bankName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Số tài khoản:</span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm tracking-wider">
                  {bankAccount}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bankAccount, 'account')}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                  title="Sao chép"
                >
                  {copiedField === 'account' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Người thụ hưởng:</span>
              <span className="font-bold text-slate-800">{accountHolder}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Số tiền:</span>
              <span className="font-extrabold text-rose-600 text-sm">
                {formatCurrency(amount)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Nội dung chuyển khoản:</span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-xs">
                  {transferMemo}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(transferMemo, 'memo')}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                  title="Sao chép"
                >
                  {copiedField === 'memo' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Confirmation Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center text-sm font-bold shadow-md shadow-rose-200"
              isLoading={isSubmitting}
              onClick={onConfirmPaid}
            >
              Tôi Đã Hoàn Tất Chuyển Khoản
            </Button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Hệ thống sẽ tự động xác thực và xuất vé điện tử ngay khi bạn bấm xác nhận
            </p>
          </div>
        </div>
      )}

      {activeTab === 'momo' && (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto text-pink-600 border border-pink-200">
            <Sparkles className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900">Thanh toán qua Ví điện tử MoMo</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Quét mã QR MoMo hoặc liên kết tài khoản để thanh toán tức thì với vô vàn ưu đãi hoàn tiền.
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="bg-pink-600 hover:bg-pink-700 text-white shadow-pink-200 w-full sm:w-auto"
            onClick={onConfirmPaid}
            isLoading={isSubmitting}
          >
            Mở Ví MoMo Thanh Toán {formatCurrency(amount)}
          </Button>
        </div>
      )}

      {activeTab === 'card' && (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 border border-indigo-200">
            <CreditCard className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900">Cổng Thẻ Quốc Tế / Nội Địa</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hỗ trợ Visa, MasterCard, JCB và thẻ ATM 40+ ngân hàng Việt Nam qua cổng bảo mật 3D Secure.
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
            onClick={onConfirmPaid}
            isLoading={isSubmitting}
          >
            Xác Nhận Thanh Toán Thẻ {formatCurrency(amount)}
          </Button>
        </div>
      )}
    </div>
  );
};
