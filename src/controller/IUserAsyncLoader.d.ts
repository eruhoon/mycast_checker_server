import { User } from "../model/User";

export interface IUserAsyncLoader {
    getUsers(): Promise<User[]>;
}