export interface IUser {
  id?: string;
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
  getUserById(id: string): Promise<IUser | null>;
  getAllUsers(): Promise<IUser[]>;
}
