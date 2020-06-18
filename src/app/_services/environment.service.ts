import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Environment } from '../_models';



@Injectable()
export class EnvironmentService {
    constructor(
        private http: HttpClient) { 
    }

////        REMOTE SERVICE CALLS        ////

    getUserEnvs(id: string) {
        return this.http.get(environment.EPICFEServerURI+'environments/get_user_envs/'+id)
            .pipe(map(
                envs => {
                    return envs
                },
                error => {
                    return error
                }));
    }

    create(env: Environment) {
        return this.http.post(environment.EPICFEServerURI+'environments/create', env)
            .pipe(map(
                claim_token => {
                    return claim_token
                },
                error => {
                    return error
                }));
    }

    update(env: Environment) {
        return this.http.put(environment.EPICFEServerURI+'environments/'+env._id, env);
    }

    deleteEnvironment(id: string) {
        return this.http.delete(environment.EPICFEServerURI+'environments/'+id)
            .pipe(map(response => response),
                catchError(err => err)
            );
    }


////        LOCAL HUB SERVICE CALLS        ////


    listenForHub(socket, socketIOEventName: string) {
        return new Observable((subscriber) => {
            socket.on(socketIOEventName, (hub_specs) => {
                subscriber.next(hub_specs);
            })
        });
    }

    async talkToHub(socket, socketIOEventName: string, message_body: any) {
        let sent_data: boolean = false;
        if (!sent_data) {
            if (message_body) {
                await socket.emit(socketIOEventName, message_body);
                sent_data = true;
            } else {
                await socket.emit(socketIOEventName);
                sent_data = true;
            }
        }
    }
}