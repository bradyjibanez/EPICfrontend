import { Component, OnInit } from '@angular/core';
import { Title }     from '@angular/platform-browser';
import { Router } from '@angular/router';

import { AuthenticationService,
         BannerMessageService } from './_services';


@Component({
    selector: 'app',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.css'],
})

export class AppComponent implements OnInit { 

  private is_logged_in: boolean;
  private environment: any;
  private time: any;

  constructor(
    private auth_service: AuthenticationService,
    private title_service: Title,
    private banner_message_service: BannerMessageService,
    private router: Router,
    ) {
      if (!this.auth_service.isLoggedIn()) {
        this.router.navigate(['./login']);
      }
    }

  ngOnInit() {
    if (JSON.parse(localStorage.getItem('active_env'))) {
      this.environment = JSON.parse(localStorage.getItem('active_env'))['envName'] 
    }
    this.environment ? this.title_service.setTitle(this.environment+" IoT") 
      : this.title_service.setTitle("EPIC IoT");
  }

  onUserInteraction(e) {
    clearTimeout(this.time)
    this.time = setTimeout(() => 
      {
        this.auth_service.logout();
        let message = JSON.parse(JSON.stringify({"nada": "null"}));
        this.banner_message_service.sendMessage("loggedout", message);        
      }, 900000);
  }
}

