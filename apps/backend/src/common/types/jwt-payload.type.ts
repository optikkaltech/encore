export interface JwtPayload {
  sub: string;
  merchantId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
