import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterEvent, Router, Event } from '@angular/router';
import { filter, first } from 'rxjs/operators';


import { User, Environment } from '../_models';
import { EnvironmentService,
         AlertService,
         AuthenticationService,
         UserService} from '../_services';


@Component({templateUrl: 'home.component.html', 
            styleUrls: ['home.component.css']})

export class HomeComponent implements OnInit {
    user: User[];
    active_environment: Environment[];
    is_home: Boolean;
    first_visit: Boolean = false;

    constructor(
      private alert_service: AlertService,
      private route: ActivatedRoute,
      private router: Router,
      private user_service: UserService,
      private env_service: EnvironmentService) 
    { 
      router.events.pipe(
         filter((event: Event) => event instanceof RouterEvent)
        ).subscribe((event: any) => {
          event.url === '/home' ? this.is_home = true : this.is_home = false;
        });
    }

    ngOnInit() {
      this.user = JSON.parse(localStorage.getItem('currentUser'));
      if (this.user) {
        this.router.navigate(['/home']);
      } else {
        this.router.navigate(['/login']);
      }
      if (this.route.snapshot.paramMap.get('first-visit') === "true") {
        this.first_visit = true;
      }
    }

    getStarted() {
      this.router.navigate(['/home/environments', {'first-visit': true}]);
    }
}