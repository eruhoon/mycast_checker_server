import { IUserAsyncLoader } from "./IUserAsyncLoader";
import { User } from "../model/User";

export class DummyUserAsyncLoader implements IUserAsyncLoader {

    public getUsers(): Promise<User[]> {

        const dummyUsers: User[] = [];
        const dummyUser1 = new User({
            idx: 1,
            id: 'eruhoon',
            nickname: 'shiguruna'
        });
        dummyUsers.push(dummyUser1);

        return new Promise<User[]>(resolve => {
            resolve(dummyUsers);
        });
    }
}