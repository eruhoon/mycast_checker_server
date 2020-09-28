import { User } from "../model/User";

export interface IUserAsyncLoader {
    getUsers(): Promise<User[]>;
    getUserByPrivKey(privKey: string): Promise<User | null>;
}
