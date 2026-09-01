declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string | { toString(): string };
        role: 'guest' | 'host' | 'admin';
        isActive?: boolean;
      };
      resource?: any;
    }
  }
}

export {};
