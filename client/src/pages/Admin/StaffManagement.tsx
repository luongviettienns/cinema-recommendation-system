import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import {
  createStaff,
  getCinemaOptions,
  listStaff,
  updateStaff,
  type CinemaOption,
  type CreateStaffInput,
  type StaffFilters,
  type StaffPagination,
  type StaffSummary,
  type UpdateStaffInput,
} from '../../services/adminStaffService';

const schema = z.object({
  name: z.string().trim().min(2, 'Nhập họ tên ít nhất 2 ký tự.'),
  email: z.string().trim().email('Nhập email hợp lệ.'),
  password: z.string(),
  phone: z.string(),
  assignedCinemaId: z.string().min(1, 'Chọn một cụm rạp phụ trách.'),
});

type StaffFormValues = z.infer<typeof schema>;
type FormMode = 'create' | 'edit';

interface StatusCandidate {
  member: StaffSummary;
  nextActive: boolean;
}

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

      if (event.shiftKey && (document.activeElement === first || focusIsOutsideDialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || focusIsOutsideDialog)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dialogRef, isOpen, onClose]);
};

export const StaffManagement = () => {
  const [staff, setStaff] = useState<StaffSummary[]>([]);
  const [pagination, setPagination] = useState<StaffPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [cinemas, setCinemas] = useState<CinemaOption[]>([]);
  const [filters, setFilters] = useState<StaffFilters>({ status: 'ALL', page: 1, limit: 20 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<FormMode>('create');
  const [editingStaff, setEditingStaff] = useState<StaffSummary | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusCandidate, setStatusCandidate] = useState<StatusCandidate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const formDialogRef = useRef<HTMLDivElement>(null);
  const statusDialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', phone: '', assignedCinemaId: '' },
  });

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [staffResult, cinemaResult] = await Promise.all([
        listStaff(filters),
        getCinemaOptions(),
      ]);
      setStaff(staffResult.items);
      setPagination(staffResult.pagination);
      setCinemas(cinemaResult);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Không thể tải danh sách nhân viên.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const rememberTrigger = () => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
  };
  const restoreFocus = () => {
    const trigger = returnFocusRef.current;
    returnFocusRef.current = null;
    trigger?.focus();
  };
  const closeForm = useCallback(() => {
    setEditingStaff(null);
    setIsCreateOpen(false);
    form.reset();
    restoreFocus();
  }, [form]);

  const closeStatusDialog = useCallback(() => {
    setStatusCandidate(null);
    restoreFocus();
  }, []);

  const openCreate = () => {
    rememberTrigger();
    setMode('create');
    setEditingStaff(null);
    setIsCreateOpen(true);
    form.reset({
      name: '',
      email: '',
      password: '',
      phone: '',
      assignedCinemaId: cinemas[0]?.id || '',
    });
  };
  const openEdit = (member: StaffSummary) => {
    rememberTrigger();
    setMode('edit');
    setIsCreateOpen(false);
    setEditingStaff(member);
    form.reset({
      name: member.name,
      email: member.email,
      password: '',
      phone: member.phone || '',
      assignedCinemaId: member.assignedCinema?.id || cinemas[0]?.id || '',
    });
  };
  const openStatusDialog = (member: StaffSummary, nextActive: boolean) => {
    rememberTrigger();
    setStatusCandidate({ member, nextActive });
  };

  const saveStaff = async (values: StaffFormValues) => {
    if (mode === 'create' && values.password.trim().length < 8) {
      form.setError('password', { message: 'Mật khẩu tạm thời cần ít nhất 8 ký tự.' });
      return;
    }
    setIsSaving(true);
    try {
      if (mode === 'create') {
        const input: CreateStaffInput = {
          name: values.name,
          email: values.email,
          password: values.password,
          phone: values.phone.trim() || undefined,
          assignedCinemaId: values.assignedCinemaId,
        };
        await createStaff(input);
        toast.success('Đã tạo tài khoản nhân viên.');
      } else if (editingStaff) {
        const input: UpdateStaffInput = {
          name: values.name,
          phone: values.phone.trim() || undefined,
          assignedCinemaId: values.assignedCinemaId,
        };
        await updateStaff(editingStaff.id, input);
        toast.success('Đã cập nhật phân công nhân viên.');
      }
      closeForm();
      await loadStaff();
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : 'Không thể lưu thông tin nhân viên.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmStatusToggle = async () => {
    if (!statusCandidate) return;
    setIsSaving(true);
    try {
      await updateStaff(statusCandidate.member.id, {
        isActive: statusCandidate.nextActive,
      });
      toast.success(
        statusCandidate.nextActive
          ? `Đã mở khóa tài khoản ${statusCandidate.member.name}.`
          : `Đã khóa tài khoản ${statusCandidate.member.name}.`,
      );
      closeStatusDialog();
      await loadStaff();
    } catch (updateError) {
      toast.error(
        updateError instanceof Error
          ? updateError.message
          : statusCandidate.nextActive
            ? 'Không thể mở khóa tài khoản.'
            : 'Không thể khóa tài khoản.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formOpen = isCreateOpen || Boolean(editingStaff);
  useAccessibleDialog(formOpen, formDialogRef, closeForm);
  useAccessibleDialog(Boolean(statusCandidate), statusDialogRef, closeStatusDialog);

  return (
    <section className="space-y-5" aria-labelledby="staff-management-title">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex h-9 items-center gap-2 bg-slate-900 px-5 text-[11px] font-semibold tracking-wide text-slate-100">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" aria-hidden="true" />
          CA TRỰC ·{' '}
          {filters.cinemaId
            ? cinemas.find((cinema) => cinema.id === filters.cinemaId)?.name
            : 'Tất cả cụm rạp'}{' '}
          ·{' '}
          {filters.status === 'ALL'
            ? 'toàn bộ trạng thái'
            : filters.status === 'ACTIVE'
              ? 'đang hoạt động'
              : 'đã khóa'}
        </div>
        <div className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">
                Quản trị vận hành
              </span>
            </div>
            <h2 id="staff-management-title" className="mt-2 text-xl font-black text-slate-950">
              Nhân sự tại rạp
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Phân công tài khoản quầy vé, soát vé và điều phối theo từng cụm rạp.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreate}
            leftIcon={<Plus className="h-4 w-4" />}
            className="whitespace-nowrap font-bold"
          >
            Thêm nhân viên
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="relative block md:col-span-2">
          <span className="sr-only">Tìm nhân viên</span>
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            value={filters.search || ''}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))
            }
            placeholder="Tìm tên, email hoặc cụm rạp"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          />
        </label>
        <select
          aria-label="Lọc theo cụm rạp"
          value={filters.cinemaId || ''}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              cinemaId: event.target.value || undefined,
              page: 1,
            }))
          }
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
        >
          <option value="">Tất cả cụm rạp</option>
          {cinemas.map((cinema) => (
            <option key={cinema.id} value={cinema.id}>
              {cinema.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc theo trạng thái"
          value={filters.status || 'ALL'}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              status: event.target.value as StaffFilters['status'],
              page: 1,
            }))
          }
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Đã khóa</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-sm font-medium text-slate-500">
            Đang tải danh sách nhân viên…
          </div>
        ) : error ? (
          <div className="py-14 text-center">
            <p className="text-sm font-semibold text-slate-700">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => void loadStaff()}
            >
              Thử lại
            </Button>
          </div>
        ) : staff.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <UserRound className="mx-auto mb-3 h-7 w-7 text-slate-300" />
            <p className="text-sm font-semibold">
              Chưa có nhân viên phù hợp với bộ lọc này.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Nhân viên</th>
                    <th className="px-5 py-3">Liên hệ</th>
                    <th className="px-5 py-3">Rạp phụ trách</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{member.name}</div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          Tạo{' '}
                          {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(
                            new Date(member.createdAt),
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <div>{member.email}</div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {member.phone || 'Chưa cập nhật số điện thoại'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                          <Building2 className="h-3.5 w-3.5 text-rose-500" />
                          {member.assignedCinema
                            ? member.assignedCinema.name
                            : 'Chưa phân công rạp'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            member.isActive
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                              : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                          }`}
                        >
                          {member.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(member)}
                            className="rounded-lg p-2 text-slate-500 outline-none hover:bg-slate-100 hover:text-slate-900 focus:ring-2 focus:ring-rose-200"
                            aria-label={`Chỉnh sửa ${member.name}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          {member.isActive ? (
                            <button
                              type="button"
                              onClick={() => openStatusDialog(member, false)}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-700 outline-none hover:bg-rose-50 focus:ring-2 focus:ring-rose-200"
                              aria-label={`Khóa tài khoản ${member.name}`}
                            >
                              Khóa tài khoản
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openStatusDialog(member, true)}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-700 outline-none hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-200"
                              aria-label={`Mở khóa tài khoản ${member.name}`}
                            >
                              Mở khóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3 text-xs text-slate-600">
                <div>
                  Trang{' '}
                  <span className="font-bold text-slate-900">{pagination.page}</span> /{' '}
                  <span className="font-bold text-slate-900">{pagination.totalPages}</span>{' '}
                  (Tổng{' '}
                  <span className="font-bold text-slate-900">{pagination.total}</span>{' '}
                  nhân sự)
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        page: Math.max(1, (prev.page || 1) - 1),
                      }))
                    }
                    leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
                  >
                    Trước
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        page: (prev.page || 1) + 1,
                      }))
                    }
                    rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-form-title"
        >
          <div
            ref={formDialogRef}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 id="staff-form-title" className="text-lg font-black text-slate-950">
                  {mode === 'create' ? 'Thêm nhân viên' : 'Chỉnh sửa phân công'}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {mode === 'create'
                    ? 'Mật khẩu tạm thời chỉ dùng khi khởi tạo.'
                    : 'Cập nhật thông tin và cụm rạp phụ trách.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Đóng biểu mẫu"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={form.handleSubmit(saveStaff)} className="space-y-4 p-6">
              <Field label="Họ và tên" error={form.formState.errors.name?.message}>
                <input
                  {...form.register('name')}
                  className="field"
                  data-dialog-initial-focus
                />
              </Field>
              <Field label="Email" error={form.formState.errors.email?.message}>
                <input
                  {...form.register('email')}
                  type="email"
                  disabled={mode === 'edit'}
                  className="field disabled:bg-slate-100"
                />
              </Field>
              {mode === 'create' && (
                <Field
                  label="Mật khẩu tạm thời"
                  error={form.formState.errors.password?.message}
                >
                  <input {...form.register('password')} type="password" className="field" />
                </Field>
              )}
              <Field label="Số điện thoại" error={form.formState.errors.phone?.message}>
                <input {...form.register('phone')} type="tel" className="field" />
              </Field>
              <Field
                label="Rạp phụ trách"
                error={form.formState.errors.assignedCinemaId?.message}
              >
                <select {...form.register('assignedCinemaId')} className="field">
                  <option value="">Chọn cụm rạp</option>
                  {cinemas.map((cinema) => (
                    <option key={cinema.id} value={cinema.id}>
                      {cinema.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <Button type="button" variant="outline" size="sm" onClick={closeForm}>
                  Hủy
                </Button>
                <Button type="submit" size="sm" isLoading={isSaving}>
                  {mode === 'create' ? 'Tạo nhân viên' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusCandidate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/35 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-dialog-title"
        >
          <div
            ref={statusDialogRef}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                statusCandidate.nextActive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {statusCandidate.nextActive ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <h3 id="status-dialog-title" className="mt-4 text-lg font-black text-slate-950">
              {statusCandidate.nextActive
                ? 'Xác nhận mở khóa tài khoản'
                : 'Xác nhận khóa tài khoản'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {statusCandidate.nextActive
                ? `Tài khoản của ${statusCandidate.member.name} sẽ được kích hoạt lại và có thể đăng nhập, sử dụng các công cụ nhân viên.`
                : `${statusCandidate.member.name} sẽ không thể đăng nhập hay dùng các công cụ nhân viên cho đến khi được mở lại.`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeStatusDialog}
              >
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                className={
                  statusCandidate.nextActive
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }
                isLoading={isSaving}
                data-dialog-initial-focus
                onClick={() => void confirmStatusToggle()}
              >
                {statusCandidate.nextActive ? 'Xác nhận mở khóa' : 'Xác nhận khóa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) => (
  <label className="block text-sm font-bold text-slate-700">
    <span>{label}</span>
    <div className="mt-1.5 [&_.field]:w-full [&_.field]:rounded-xl [&_.field]:border [&_.field]:border-slate-200 [&_.field]:px-3 [&_.field]:py-2.5 [&_.field]:text-sm [&_.field]:font-medium [&_.field]:text-slate-800 [&_.field]:outline-none [&_.field]:focus:border-rose-500 [&_.field]:focus:ring-2 [&_.field]:focus:ring-rose-100">
      {children}
    </div>
    {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
  </label>
);
