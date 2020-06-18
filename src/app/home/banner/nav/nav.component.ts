import { Component } from '@angular/core';
import { Router }  from '@angular/router';

import { AuthenticationService, BannerMessageService } from '../../../_services';

@Component({
  selector: 'navigate',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})


export class NavComponent {

  private _opened: Boolean = false;
  private _icon_live: Boolean = true;

  constructor (
    private authentication_service: AuthenticationService,
    private banner_message_service: BannerMessageService,
    private router: Router) { }

  private toggleSidebar() {
    this._opened = !this._opened;
    if (!this._opened) {
	  	setTimeout(() => {
		    this._icon_live = !this._icon_live;
		  }, 275);
	  } else {
		  this._icon_live = !this._icon_live;
	  } 
  }

  private logOut() {
    localStorage.removeItem('active_env');
    localStorage.removeItem('env_settings_env');
    this.banner_message_service.sendMessage('loggedout', null);
    this.authentication_service.logout();
  }

}
