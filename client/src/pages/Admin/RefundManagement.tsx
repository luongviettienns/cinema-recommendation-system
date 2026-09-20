import React, { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { toast } from 'sonner';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  AlertTriangle,
  Film,
  Calendar,
  X,
  User,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatFullDate } from '../../utils/formatDate';
import {
  refundService,
  type RefundItem,
  type AdminRefundListResult,
} from '../../services/refundService';

const focusableSelector =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const useAccessibleDialog = (
  isOpen: boolean,
  dialogRef: RefObject<HTMLDivElement | null>,
  onClose: () => void,
) => {
  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    const focusableControls = () =>
      Array.from(dialog?.querySelectorAll<HTMLElement>(focusableSelector) || []);
    const focusInitialControl = () =>
      (
        dialog?.querySelector<HTMLElement>('[data-dialog-initial-focus]') ||
        focusableControls()[0]
      )?.focus();
    const timer = window.setTimeout(focusInitialControl, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const controls = focusableControls();
      if (!controls.length) {
        event.preventDefault();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      const focusIsOutsideDialog = !dialog?.contains(document.activeElement);

      if (event.shiftKey) {
        if (document.activeElement === first || focusIsOutsideDialog) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last || focusIsOutsideDialog) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, dialogRef, onClose]);
};

export const RefundManagement: React.FC = () => {
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Review Modal State
  const [selectedRefund, setSelectedRefund] = useState<RefundItem | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const reviewDialogRef = useRef<HTMLDivElement>(null);
  const reviewTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Emergency Cancel Modal State
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyBookingCode, setEmergencyBookingCode] = useState('');
  const [emergencyReason, setEmergencyReason] = useState('');
  const [isSubmittingEmergency, setIsSubmittingEmergency] = useState(false);
  const emergencyDialogRef = useRef<HTMLDivElement>(null);

  // Counts for pending badge
  const [pendingCount, setPendingCount] = useState(0);

  const loadRefunds = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await refundService.listAdminRefunds({
        status: statusFilter,
        search: searchTerm,
        page,
        limit: 10,
      });
      setRefunds(result.items);
      setTotalPages(result.pagination.totalPages);
      setTotalCount(result.pagination.total);

      // Load pending count if viewing ALL
      const pendingResult = await refundService.listAdminRefunds({ status: 'PENDING', limit: 1 });
      setPendingCount(pendingResult.pagination.total);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải danh sách hoàn tiền.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm, page]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  const handleCloseReviewModal = useCallback(() => {
    if (isProcessing) return;
    setSelectedRefund(null);
    setAdminNote('');
    reviewTriggerRef.current?.focus();
  }, [isProcessing]);

  useAccessibleDialog(Boolean(selectedRefund), reviewDialogRef, handleCloseReviewModal);

  const handleCloseEmergencyModal = useCallback(() => {
    if (isSubmittingEmergency) return;
    setIsEmergencyModalOpen(false);
    setEmergencyBookingCode('');
    setEmergencyReason('');
  }, [isSubmittingEmergency]);

  useAccessibleDialog(isEmergencyModalOpen, emergencyDialogRef, handleCloseEmergencyModal);

  const handleProcess = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedRefund) return;

    if (action === 'REJECT') {
      const note = adminNote.trim();
      if (!note || note.length < 5) {
        toast.error('Vui lòng nhập lý do từ chối tối thiểu 5 ký tự trước khi từ chối.');
        return;
      }
    }

    try {
      setIsProcessing(true);
      await refundService.processRefund(selectedRefund.id, {
        action,
        adminNote: adminNote.trim() || undefined,
      });

      toast.success(
        action === 'APPROVE'
          ? 'Đã duyệt hoàn tiền thành công và giải phóng ghế!'
          : 'Đã từ chối yêu cầu và khôi phục hiệu lực vé cho khách.',
      );
      handleCloseReviewModal();
      await loadRefunds();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xử lý yêu cầu hoàn tiền.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmergencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = emergencyBookingCode.trim();
    if (!code) {
      toast.error('Vui lòng nhập mã vé hoặc mã giao dịch cần hủy.');
      return;
    }

    try {
      setIsSubmittingEmergency(true);
      await refundService.directCancel(code, emergencyReason.trim() || 'Admin hủy khẩn cấp do sự cố kỹ thuật');
      toast.success('Đã hủy vé và hoàn tiền khẩn cấp thành công!');
      handleCloseEmergencyModal();
      await loadRefunds();
    } catch (err: any) {
      toast.error(err.message || 'Không thể hủy vé khẩn cấp.');
    } finally {
      setIsSubmittingEmergency(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Duyệt Yêu Cầu Hoàn Tiền & Hủy Vé
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Xử lý hoàn tiền giao dịch theo quy định 60 phút và hỗ trợ hủy vé khẩn cấp
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<ShieldAlert className="w-4 h-4 text-rose-600" />}
            onClick={() => setIsEmergencyModalOpen(true)}
            className="border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl"
          >
            Hủy Vé Khẩn Cấp
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 w-full md:w-auto overflow-x-auto">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'PENDING', label: 'Chờ xử lý', count: pendingCount },
            { key: 'APPROVED', label: 'Đã hoàn tiền' },
            { key: 'REJECTED', label: 'Đã từ chối' },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key as any);
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã vé, tên khách, email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Đang tải danh sách yêu cầu hoàn tiền...</p>
          </div>
        ) : refunds.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Không có yêu cầu hoàn tiền nào</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Hiện tại không có yêu cầu nào phù hợp với bộ lọc tìm kiếm đã chọn.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Khách Hàng</th>
                  <th className="py-3.5 px-5">Mã Vé & Phim</th>
                  <th className="py-3.5 px-5">Suất Chiếu & Ghế</th>
                  <th className="py-3.5 px-5">Số Tiền</th>
                  <th className="py-3.5 px-5">Lý Do Khách Hàng</th>
                  <th className="py-3.5 px-5">Trạng Thái</th>
                  <th className="py-3.5 px-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {refunds.map((item) => {
                  const isPending = item.status === 'PENDING';
                  const isApproved = item.status === 'APPROVED';
                  const isRejected = item.status === 'REJECTED';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Customer */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 font-black text-xs flex items-center justify-center shrink-0 border border-rose-100">
                            {item.customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block">{item.customer.name}</span>
                            <span className="text-[11px] text-slate-400">{item.customer.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Code & Movie */}
                      <td className="py-4 px-5">
                        <span className="font-mono font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 block w-fit mb-1">
                          {item.bookingCode}
                        </span>
                        <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                          {item.movieTitle}
                        </span>
                      </td>

                      {/* Showtime & Seats */}
                      <td className="py-4 px-5">
                        <span className="text-slate-800 font-semibold block">
                          {item.cinemaName} • {item.roomName}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Ghế: <strong className="text-slate-900">{item.seats.join(', ')}</strong>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-5">
                        <span className="font-black text-sm text-slate-900">
                          {formatCurrency(item.refundAmount)}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="py-4 px-5 max-w-xs">
                        <p className="text-slate-700 line-clamp-2 leading-relaxed italic">
                          "{item.reason}"
                        </p>
                        {item.adminNote && (
                          <p className="text-[11px] text-slate-400 mt-1 truncate">
                            <strong>Phản hồi:</strong> {item.adminNote}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-xl font-bold text-[11px]">
                            <Clock3 className="w-3 h-3 text-amber-600" />
                            Chờ duyệt
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl font-bold text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Đã hoàn tiền
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-xl font-bold text-[11px]">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            Đã từ chối
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        {isPending ? (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              reviewTriggerRef.current = e.currentTarget;
                              setSelectedRefund(item);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                          >
                            Xử Lý Yêu Cầu
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {refunds.length > 0 && (
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Hiển thị <strong>{refunds.length}</strong> trên tổng số <strong>{totalCount}</strong> yêu cầu
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
                className="rounded-xl"
              >
                Trước
              </Button>
              <span className="font-bold text-slate-800">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="rounded-xl"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRefund && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in"
        >
          <div
            ref={reviewDialogRef}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 relative animate-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={handleCloseReviewModal}
              disabled={isProcessing}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 id="review-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
                  Xét Duyệt Yêu Cầu Hoàn Tiền
                </h3>
                <p className="text-xs text-slate-500 font-medium">Mã vé: {selectedRefund.bookingCode}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Ticket Details Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Khách hàng:</span>
                  <span className="font-bold text-slate-900">
                    {selectedRefund.customer.name} ({selectedRefund.customer.email})
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Phim & Suất:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[240px]">
                    {selectedRefund.movieTitle} • {selectedRefund.roomName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Ghế ngồi:</span>
                  <span className="font-bold text-rose-600">{selectedRefund.seats.join(', ')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Số tiền hoàn:</span>
                  <span className="font-black text-sm text-emerald-600">
                    {formatCurrency(selectedRefund.refundAmount)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 text-slate-700">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Lý do khách hủy:</span>
                  <p className="italic bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                    "{selectedRefund.reason}"
                  </p>
                </div>
              </div>

              {/* Note input */}
              <div>
                <label htmlFor="admin-note" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ghi chú của Admin (Bắt buộc tối thiểu 5 ký tự nếu Từ chối)
                </label>
                <textarea
                  id="admin-note"
                  rows={2}
                  data-dialog-initial-focus
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Nhập ghi chú phản hồi cho khách hàng..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                />
              </div>

              {/* Notice Warning */}
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Khi bấm <strong>Duyệt Hoàn Tiền</strong>, hệ thống sẽ tự động giải phóng ghế trong phòng chiếu để khách khác có thể đặt lại ngay lập tức.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseReviewModal}
                  disabled={isProcessing}
                  className="rounded-xl"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleProcess('REJECT')}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl"
                >
                  Từ Chối
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isProcessing}
                  onClick={() => handleProcess('APPROVE')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-200"
                >
                  Duyệt & Hoàn Tiền
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Cancellation Modal */}
      {isEmergencyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in"
        >
          <div
            ref={emergencyDialogRef}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={handleCloseEmergencyModal}
              disabled={isSubmittingEmergency}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 id="emergency-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
                  Hủy Vé & Hoàn Tiền Khẩn Cấp
                </h3>
                <p className="text-xs text-slate-500 font-medium">Dành cho tình huống rạp gặp sự cố kỹ thuật</p>
              </div>
            </div>

            <form onSubmit={handleEmergencySubmit} className="space-y-4">
              <div className="bg-rose-50/80 border border-rose-200/90 rounded-2xl p-3 text-xs text-rose-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Thao tác này sẽ hủy vé, đánh dấu hoàn tiền và giải phóng toàn bộ ghế ngay lập tức mà không cần khách gửi yêu cầu trước.
                </p>
              </div>

              <div>
                <label htmlFor="emergency-booking-code" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mã vé hoặc Mã giao dịch (Booking Code / ID) <span className="text-rose-600">*</span>
                </label>
                <input
                  id="emergency-booking-code"
                  type="text"
                  required
                  data-dialog-initial-focus
                  placeholder="VD: CL-819203"
                  value={emergencyBookingCode}
                  onChange={(e) => setEmergencyBookingCode(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono font-bold"
                />
              </div>

              <div>
                <label htmlFor="emergency-reason" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lý do hủy khẩn cấp
                </label>
                <textarea
                  id="emergency-reason"
                  rows={2}
                  placeholder="VD: Phòng chiếu hỏng điều hòa, sự cố máy chiếu..."
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseEmergencyModal}
                  disabled={isSubmittingEmergency}
                  className="rounded-xl"
                >
                  Đóng
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingEmergency}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-200"
                >
                  Xác Nhận Hủy Ngay
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
