import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
//import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { first } from 'rxjs/operators';
import { AlertService, 
         AuthenticationService, 
         BannerMessageService } from '../_services';

@Component({templateUrl: 'login.component.html',
            styleUrls: ['login.component.css']})

export class LoginComponent implements OnInit {

    loginForm: FormGroup;
    loading: Boolean = false;
    submitted: Boolean = false;

    constructor(
        private form_builder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authentication_service: AuthenticationService,
        private banner_message_service: BannerMessageService,
        private alert_service: AlertService) {}

    ngOnInit() {
        this.loginForm = this.form_builder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });       
        // reset login status...allows for logout routing functionality
        // dont know why I made this or if it even does anything...but just in case? lol
        //this.authentication_service.logout();
    }

    // convenience getter for easy access to form fields
    get form() { return this.loginForm.controls; }

    onSubmit() {
        this.submitted = true;
        // stops here if form is invalid (doesn't match mongo model requirements)
        if (this.loginForm.invalid) {
            return;
        }
        this.loading = true;
        this.authentication_service.login(this.form.username.value, this.form.password.value)
            .pipe(first())
            .subscribe(
                data => {
                    let message = JSON.parse(JSON.stringify(
                                {"firstName": data.firstName}));
                    this.banner_message_service.sendMessage("loggedin", message);
                    this.router.navigate(['/home']);
                },
                error => {
                    this.alert_service.error(error);
                    this.loading = false;
                });
    }
}
