// types/user.ts
export interface User {
  _id: string;
  email: string;
  firstName?: string;  // The ? means "optional"
  lastName?: string;
  role: 'admin' | 'user';
  domain: 'RH' | 'Finance' | 'IT' | 'Vente' | 'Direction';
}