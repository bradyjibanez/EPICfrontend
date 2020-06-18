import { Component,
         OnInit, 
         OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';

import { AlertService } from '../_services';

@Component({
    selector: 'alert',
    templateUrl: 'alert.component.html',
    styleUrls: ['./alert.component.css']
})

export class AlertComponent implements OnInit, OnDestroy {
    private subscription: Subscription;
    timer: any = 0;
    message: any;

    constructor(private alert_service: AlertService) { }

    ngOnInit() {
        this.subscription = this.alert_service.getMessage().subscribe(message => {
            this.message = null;
            this.message = message;
            setTimeout(() => {
                this.message = null;
            }, 7000);
        });
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}