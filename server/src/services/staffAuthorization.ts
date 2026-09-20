import { Role } from '@prisma/client';

export interface StaffActorContext {
  id: string;
  role: Role;
  assignedCinemaId: string | null;
}

const authorizationError = (message: string, code: string) => {
  const error = new Error(message) as Error & { statusCode: number; code: string };
  error.statusCode = 403;
  error.code = code;
  return error;
};

const assignedCinemaFor = (actor: StaffActorContext): string => {
  if (!actor.assignedCinemaId) {
    throw authorizationError(
      'Tài khoản nhân viên chưa được phân công rạp',
      'STAFF_CINEMA_REQUIRED',
    );
  }
  return actor.assignedCinemaId;
};

export const resolveStaffCinemaScope = (
  actor: StaffActorContext,
  requestedCinemaId?: string,
): string | undefined => {
  if (actor.role === Role.ADMIN) return requestedCinemaId?.trim() || undefined;
  if (actor.role === Role.STAFF) return assignedCinemaFor(actor);
  throw authorizationError('Bạn không có quyền sử dụng Staff Console', 'FORBIDDEN');
};

export const assertStaffCinemaAccess = (
  actor: StaffActorContext,
  resourceCinemaId: string,
): void => {
  if (actor.role === Role.ADMIN) return;
  if (actor.role !== Role.STAFF) {
    throw authorizationError('Bạn không có quyền sử dụng Staff Console', 'FORBIDDEN');
  }
  assertCinemaScope(assignedCinemaFor(actor), resourceCinemaId);
};

export const assertCinemaScope = (
  allowedCinemaId: string | undefined,
  resourceCinemaId: string,
): void => {
  if (allowedCinemaId && allowedCinemaId !== resourceCinemaId) {
    throw authorizationError('Bạn không có quyền thao tác tại rạp này', 'FORBIDDEN');
  }
};
