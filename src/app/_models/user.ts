export interface User {
    _id: number;
    account: string;
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    environments: [[string]];
}