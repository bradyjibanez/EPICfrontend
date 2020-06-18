import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class BannerMessageService {
    private subject = new Subject<any>();

    sendMessage(subject: string, body: JSON) {
        this.subject.next({ subject: subject, body: body });
    }

    //I think think only applies to wiping saved message queues in components maintaining lists
    /*clearMessages() {
        this.subject.next();
    }*/

    getMessage(): Observable<any> {
        return this.subject.asObservable();
    }
}