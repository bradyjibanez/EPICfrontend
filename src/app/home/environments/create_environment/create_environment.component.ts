import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';

import { AlertService, 
        AuthenticationService, 
        UserService, 
        EnvironmentService,
        GeneralMessageService } from '../../../_services';

import { User } from '../../../_models';

@Component({
  selector: 'create_environment',
  templateUrl: './create_environment.component.html',
  styleUrls: ['./create_environment.component.css']
})
export class CreateEnvironmentComponent implements OnInit {

  user: User[];
  environments: String[] = [];
  register_environment_form: FormGroup;
  loading: Boolean = false;
  submitted: Boolean = false;
  first_visit: Boolean = false;
  formatted_address = '';
  options = {
    componentRestrictions: {
        country: []
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alert_service: AlertService,
    private form_builder: FormBuilder,
    private env_service: EnvironmentService,
    private general_message_service: GeneralMessageService) {}

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('currentUser'));
  	this.register_environment_form = this.form_builder.group({
        envName: ['', [Validators.required, Validators.maxLength(12)]],
        envLoc: ['', Validators.required],
        envType: ['', Validators.required],
        envDesc: [''],
        admin: ['']
    });
  }

  get fEnv() { return this.register_environment_form.controls; }

  handleAddressChange(address: any) {
    this.formatted_address = address.formatted_address;
  }

  onSaveEnvironment(register_environment_form) {
    let user = JSON.parse(localStorage.getItem('currentUser'));
    this.register_environment_form.value.admin = user._id;        
    if (this.register_environment_form.invalid || !user) {
        return;
    } else {
        this.loading = true;
        this.registerEnvironment(register_environment_form);
    }
  }

  registerEnvironment(register_environment_form) {
      if (this.formatted_address != '') {
        register_environment_form.value['envLoc'] = this.formatted_address;
      }
      this.env_service.create(register_environment_form.value)
          .pipe(first())
          .subscribe(
              data => {
                  let user = JSON.parse(localStorage.getItem('currentUser'));
                  user['environments'].push(register_environment_form.value['envName']);
                  localStorage.setItem('currentUser', JSON.stringify(user));
                  this.alert_service.success('Environment creation successful', true);
                  this.env_service.getUserEnvs(this.user['_id'])
                    .pipe(first())
                    .subscribe(
                      (env_res: any[]) => {
                        for (let i = 0; i < env_res.length; i++) {
                          this.environments.push(env_res[i]);
                        }
                        this.configEnvironmentSettings(
                          register_environment_form.value['envName']);
                      },
                      error => {
                        this.alert_service.error("User environments not available at this time due to <"
                                                 +error+">...try again in a bit.");
                      });
              },
              error => {
                  this.alert_service.error("We could not create this environment due to <"
                                            +error+">...try again in a bit");
                  this.loading = false;
              });
  }

  configEnvironmentSettings(environment_name) {
    let selected_environment = 
      JSON.parse(JSON.stringify(this.matchEnvironment(environment_name)));
    this.general_message_service.sendMessage("selected_environment", selected_environment)
    if (this.route.snapshot.paramMap.get('first-visit') === "true") {
      this.router.navigate(['/home/environments/environment-settings/'
                            +environment_name, {'first-visit': true}])
    } else {
      this.router.navigate(['/home/environments']);
    }  
  }

  matchEnvironment(env_name) {
  for (var i=0; i < this.environments.length; i++)
    if (this.environments[i]['envName'] == env_name)
      return this.environments[i];
  }

}
