import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
//import { map } from 'rxjs/operators';
//import { first } from 'rxjs/operators';

import { AlertService, 
        AuthenticationService, 
        UserService, 
        EnvironmentService, 
        BannerMessageService } from '../../_services';

@Component({
  selector: 'profile_settings',
  templateUrl: './profile_settings.component.html',
  styleUrls: ['./profile_settings.component.css']
})

export class ProfileSettingsComponent implements OnInit {
  
  register_user_form: FormGroup;
  user: Object;
  loading: Boolean = false;
  submitted: Boolean = false;
  submittedUser: Boolean = false;

  constructor(
    private form_builder: FormBuilder,
    private user_service: UserService,
    private alert_service: AlertService,
    private auth_service: AuthenticationService,
    private banner_message_service: BannerMessageService,
    private router: Router
  ) { }

  ngOnInit() {
	  this.register_user_form = this.form_builder.group({
        firstName: [''],
        lastName: [''],
        username: [''],
        email: [''],
        password: ['', [Validators.minLength(6)]],
        passwordConf: ['', [Validators.minLength(6)]]
    });
    this.user = JSON.parse(localStorage.getItem('currentUser'));
  }

  // convenience getter for easy access to User form fields
  get fUser() { return this.register_user_form.controls; }

  verifyPassMatch(registerForm) {
    let password = registerForm.get('password').value;
    let pass_confirm = registerForm.get('passwordConf').value;
    return password === pass_confirm ? true : false;
  }

  onUpdateUser(register_user_form) {
    this.submitted = true;
    if (this.register_user_form.invalid) {
        return;
    }
    let pass_verification = this.verifyPassMatch(this.register_user_form);
    if (!pass_verification) {
        this.alert_service.error('Passwords did not match.');
        return;
    }
    if (pass_verification) {
        this.alert_service.success('Processing your new user profile...');
        this.loading = true;
        this.user_service.update(this.user['_id'], this.register_user_form.value)
            .pipe()
            .subscribe(
                user_update => {
                      this.alert_service.success('User profile update successful', false)
                      this.submittedUser = true;
                      this.submitted = this.loading = false;
                      //Sends updated username to the banner
                      let firstName = this.register_user_form.value.firstName ? 
                        this.register_user_form.value.firstName : this.user['firstName']
                      let message = JSON.parse(JSON.stringify(
                            {"firstName": firstName}))  
                      this.banner_message_service.sendMessage("updated", message);
                      this.router.navigate(['/home']);
                },
                error => {
                    this.alert_service.error(error);
                    this.loading = false;
                }
          );
    }
  }
}
