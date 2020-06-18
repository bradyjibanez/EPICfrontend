import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { User } from '../_models';

@Injectable()
export class UserService {
    constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<User[]>(environment.EPICFEServerURI+'users/');
    }

    getById(user_id: String) {
        return this.http.get<User[]>(environment.EPICFEServerURI+'users/'+user_id);
    }

    register(user: User) {
        return this.http.post<User[]>(environment.EPICFEServerURI+'users/'+'register', user);
    }

    update(user_id: String, user_form: User) {
        return this.http.put<any>(environment.EPICFEServerURI+'users/'+user_id, user_form)
            .pipe(map(user => {
                    if (user && user.token) {
                        localStorage.setItem('currentUser', JSON.stringify(user));
                    };
                }
            ));
    }

    delete(user_id: number) {
        return this.http.delete(environment.EPICFEServerURI+'users/'+user_id);
    }
}