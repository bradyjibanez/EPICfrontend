import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { BannerMessageService } from './banner_message.service';


@Injectable()
export class AuthenticationService {

    time: any;

    constructor(private http: HttpClient,
                private router: Router) { 
    }

    login(username: string, password: string) {
        return this.http.post<any>(environment.EPICFEServerURI+"users/authenticate", { username: username, password: password })
            .pipe(map(user => {
                // login successful if there's a jwt token in the response
                if (user && user.token) {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    localStorage.setItem('currentUser', JSON.stringify(user));
                }
                return user;
            }));
    }

    isLoggedIn() {
        //Needs to be something referencable...currentUser needs to be changed to just
        //the token and the token reference from html5 internal storage...cookie?
        if (localStorage.getItem('currentUser')) {
            // logged in so return true
            return true;
        } else {
            return false;
        }
    }

    logout() {
        // remove user from local storage to log user out
        localStorage.clear();
        this.router.navigate(['./login']);
    }

}
