import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AlertService, 
         AuthenticationService, 
         UserService, 
         EnvironmentService,
         BannerMessageService } from '../_services';

@Component({templateUrl: 'register.component.html',
            styleUrls: ['register.component.css']})

export class RegisterComponent implements OnInit {
    register_environment_form: FormGroup;
    register_user_form: FormGroup;
    loading: Boolean = false;
    submitted: Boolean = false;
    submitted_user: Boolean = false;
    formatted_address = '';
    options = {
        componentRestrictions: {
            country: []
        }
    }

    constructor(
        private form_builder: FormBuilder,
        private router: Router,
        private user_service: UserService,
        private alert_service: AlertService,
        private env_service: EnvironmentService,
        private auth_service: AuthenticationService,
        private banner_message_service: BannerMessageService
    ) { }

    ngOnInit() {
        this.register_user_form = this.form_builder.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            username: ['', Validators.required],
            email: ['', Validators.required],
            password: ['', [Validators.required, Validators.minLength(6)]],
            passwordConf: ['', [Validators.required, Validators.minLength(6)]]
        });
        this.register_environment_form = this.form_builder.group({
            envName: ['', [Validators.required, Validators.maxLength(12)]],
            envLoc: ['', Validators.required],
            envType: ['', Validators.required],
            envDesc: [''],
            admin: ['']
        });
        if (JSON.parse(localStorage.getItem('currentUser'))) {
            this.submitted_user = true;
        }
    }

    get fUser() { return this.register_user_form.controls; }

    get fEnv() { return this.register_environment_form.controls; }

    handleAddressChange(address: any) {
        this.formatted_address = address.formatted_address;
    }

    verifyPassMatch(registerForm) {
        let password = registerForm.get('password').value;
        let pass_confirm = registerForm.get('passwordConf').value;
        return password === pass_confirm ? true : false;
    }

    messageBanner() {
        let user = JSON.parse(localStorage.getItem('currentUser'));
        let message = JSON.parse(JSON.stringify(
            {"firstName": user['firstName']}));
        this.banner_message_service.sendMessage("loggedin", message);
    }

    onSaveUser(register_user_form) {
        this.submitted = true;
        if (register_user_form.invalid) {
            return;
        }
        let pass_verification = this.verifyPassMatch(register_user_form);
        if (!pass_verification) {
            this.alert_service.error('Passwords did not match.');
            return;
        }
        if (pass_verification) {
            this.alert_service.success('Processing your new user profile...');
            this.loading = true;
            this.registerUserProfile(register_user_form);
        }
    }

    onSaveEnvironment(register_environment_form) {
        let user = JSON.parse(localStorage.getItem('currentUser'));
        this.register_environment_form.value.admin = user._id;        
        this.submitted = true;
        if (this.register_environment_form.invalid || !user) {
            return;
        } else {
            this.loading = true;
            this.registerEnvironment(register_environment_form);
        }
    }

    registerUserProfile(register_user_form) {
        this.user_service.register(JSON.parse(JSON.stringify(register_user_form.value)))
            .pipe(first())
            .subscribe(
                data => {
                    this.alert_service.success('User profile registration successful', false)
                    window.scrollTo(0, 0);
                    this.submitted = this.loading = false;
                    this.submitted_user = true;
                    this.auth_service.login(register_user_form.value.username,
                        register_user_form.value.password)
                        .pipe(first())
                        .subscribe(
                            error => {
                                this.alert_service.error(error);
                                this.loading = false;
                            }
                        );
                },
                error => {
                    this.alert_service.error(error);
                    this.loading = false;
                }
            );
    }

    registerEnvironment(register_environment_form) {
        if (this.formatted_address != '') {
          register_environment_form.value['envLoc'] = this.formatted_address;
        }
        this.env_service.create(register_environment_form.value)
            .pipe(first())
            .subscribe(
                token => {
                    let user = JSON.parse(localStorage.getItem('currentUser'));
                    user['environments'] = [register_environment_form.value['envName']];
                    user['claimToken'] = token;
                    this.messageBanner();
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    this.alert_service.success('Environment creation successful', true);
                    this.router.navigate(['/home', {'first-visit': true}]);
                },
                error => {
                    this.alert_service.error(error);
                    this.loading = false;
                });
    }
    
}
