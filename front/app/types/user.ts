// types/user.ts
export interface User {
  _id: string;
  email: string;
  firstName?: string;  // Le ? veut dire "optionnel"
  lastName?: string;
  role: 'admin' | 'user';
  domain: 'RH' | 'Finance' | 'IT' | 'Vente' | 'Direction';
}