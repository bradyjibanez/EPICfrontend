import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class GeneralMessageService {
    private subject = new BehaviorSubject<any>(null);

    sendMessage(subject: string, body: JSON) {
        this.subject.next({ subject: subject, body: body });
    }

    getMessage(): Observable<any> {
        return this.subject.asObservable();
    }
}