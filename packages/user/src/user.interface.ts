export interface IUser {
  id: number | null;
  name: string | null;
  email: string | null;
  role: string | null;
  location: string | null;
  skills: string[] | null;
  previousCompanies: string[] | null;
  interests: string[] | null;
  experience: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserService {
  extractUserFromText(text: string): Promise<IUser>;
  saveUser(user: IUser): Promise<IUser>;
  getUserById(id: number): Promise<IUser | null>;
  getAllUsers(): Promise<IUser[]>;
}
