import { Component, OnInit, NgZone } from '@angular/core';
import { User } from '../../_models'

import { EnvironmentService,
         AlertService, 
         BannerMessageService } from '../../_services';

@Component({
  selector: 'banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css']
})

export class BannerComponent implements OnInit {
  user: User[]
  user_first_name: String;
  environment: String;
  active_environment: Boolean = false;
  logged_in: Boolean = false;
  greeting: Boolean = true;
  inner_width: Number;

  constructor(
    private alert_service: AlertService,
    private banner_message_service: BannerMessageService) {
    //private ng_zone_updates: NgZone) {
      //this.ng_zone_updates.run(() => {
        this.banner_message_service.getMessage().subscribe(message => {
          if (message.subject === "loggedin") {
            this.logged_in = true;
            this.user_first_name = message.body.firstName;
          }
          if (message.subject === "loggedout") {
            this.environment = "EPIC IoT";
            this.logged_in = false;
          }
          if (message.subject === "updated") {
            this.user_first_name = message.body.firstName;
          }
          if (message.subject === "activeenvironment") {
            if (message.body.environment != "EPIC IoT") {
              this.environment = message.body.environment;
              this.active_environment = true;
            } else {
              this.environment = message.body.environment;
              this.active_environment = false;
            }
          }
        });
        this.environment = localStorage.getItem('active_env') ?
          JSON.parse(localStorage.getItem('active_env'))['envName'] : "EPIC IoT";
        if (this.environment != "EPIC IoT") {
          this.active_environment = true;
        } else {
          this.active_environment = false;
        }
      //});
  }

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('currentUser'));
    this.inner_width = window.innerWidth;

  	if (this.user) {
      this.logged_in = true;
      this.user_first_name = this.user['firstName']
    } else {
      this.logged_in = false;
    }

    // no hi firstName if screen aint wide enough
    if (this.inner_width < 680) {
      this.greeting = false;
    }
  }

  sendEnvErrorAlert() {
    this.alert_service.error("Be sure you have an activated environment first...");
  }
}
