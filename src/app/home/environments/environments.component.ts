import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';

import { EnvironmentService, 
         AlertService,
         GeneralMessageService } from '../../_services';

import { User } from '../../_models';

@Component({
  selector: 'app-environments',
  templateUrl: './environments.component.html',
  styleUrls: ['./environments.component.css']
})

export class EnvironmentsComponent implements OnInit {

  user: User[] = [];
  environments: String[];
  first_visit: Boolean = false;
  no_click: Boolean = true;
  create_environment_route: any = ['./create-environment'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  	private env_service: EnvironmentService,
    private alert_service: AlertService,
    private general_message_service: GeneralMessageService) { 
      this.environments = []
    }

  ngOnInit() {
    if (this.route.snapshot.paramMap.get('first-visit') === "true") {
      this.first_visit = true;
      this.create_environment_route = ['./create-environment', {'first-visit': true}];
    }
    this.user = JSON.parse(localStorage.getItem('currentUser'));
  	if (this.user) {
      this.env_service.getUserEnvs(this.user['_id'])
        .pipe(first())
        .subscribe(
          (env_res: any[]) => {
            for (let i = 0; i < env_res.length; i++) {
              this.environments.push(env_res[i])
            }
          },
          error => {
            this.alert_service.error("User environments not available at this time due to <"
                                     +error+">...try again in a bit.");
          });
    }
  }

  configEnvironmentSettings(environment_name) {
    let selected_environment = 
      JSON.parse(JSON.stringify(this.matchEnvironment(environment_name)));
    this.general_message_service.sendMessage("selected_environment", selected_environment)
    if (this.first_visit) {
      this.router.navigate(['/home/environments/environment-settings/'
                            +environment_name, {'first-visit': 'true'}]);
    } else {
      this.router.navigate(['/home/environments/environment-settings/'+environment_name]);
    }
  }

  matchEnvironment(env_name) {
    for (var i=0; i < this.environments.length; i++) {
      if (this.environments[i]['envName'] == env_name)
        return this.environments[i];
    }
  }

  skipIntro() {
    this.first_visit = false;
    this.router.navigate(['/home/environments']);
  }

  get animateInstruction(): any {
    if (this.first_visit) {
      return {
        type: 'slide',
        direction: 'up',
        duration: 500,
      };
    }
    return false;
  }

  get animateInstructionCreated(): any {
    if (this.first_visit) {
      return {
        type: 'slide',
        direction: 'right',
        duration: 500,
      };
    }
    return false;
  }

}
