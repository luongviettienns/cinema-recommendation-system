import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const authGuard = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    // 1. Check Bearer token from header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // 2. Or check HttpOnly Cookie
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Vui lòng đăng nhập để thực hiện thao tác này',
        },
      });
      return;
    }

    const secret = process.env.JWT_ACCESS_SECRET || 'cinelight-access-super-secret-key-2026-xyz';
    const decoded = jwt.verify(token, secret) as AuthUserPayload;

    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      },
    });
  }
};

export const roleGuard = (...roles: (Role | Role[])[]) => {
  const allowedRoles = roles.flat();
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Vui lòng đăng nhập để tiếp tục',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Bạn không có quyền thực hiện thao tác này',
        },
      });
      return;
    }

    next();
  };
};
