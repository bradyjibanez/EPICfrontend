import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import * as io from 'socket.io-client';

import { GeneralMessageService, 
         AlertService,
         ModalService,
         EnvironmentService,
         BannerMessageService } from '../../../_services';
import { User } from '../../../_models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'environment_home',
  templateUrl: './environment_home.component.html',
  styleUrls: ['./environment_home.component.css']
})
export class EnvironmentHomeComponent implements OnInit, OnDestroy {

  first_visit: number = 0;
  environment_name: string;
  environment_location: string;
  environment_state: Object = {};
  user: User[];
  readonly hub_websocket: string = environment.EPICHubWebSocket
  socket: any;
  hub_present: boolean = false;
  loaded_packages: string[] = ["No hub response for loaded packages"];
  installed_packages: string[] = ["No hub response for installed packages"]
  autodefs: string[] = ["No hub response for configured automatic definitions"];
  registered_hub_users: string[] = ["No hub response for registered users"];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private env_service: EnvironmentService,
    private alert_service: AlertService,
    private modal_service: ModalService,
    private banner_message_service: BannerMessageService,
  	private general_message_service: GeneralMessageService) {
      this.user = JSON.parse(localStorage.getItem("currentUser"));
      this.socket = io(this.hub_websocket);
	  }

  ngOnInit() {
    this.environment_state = JSON.parse(localStorage.getItem("active_env"));

  	if (this.environment_state) {
	    this.environment_name = this.environment_state['envName'];
  	  this.environment_location = this.environment_state['envLoc'];
	  } else {
      this.router.navigate(['/home/environments']);
    }

    if (this.socket.onclose()) {
      this.hub_present = false;
    }

    this.listenToHub();
    this.socket.on('connect', () => {
      //pass
    });
    this.socket.on('disconnect', () => {
      this.hub_present = false;
      this.loaded_packages = ["No hub response for loaded packages"];
      this.installed_packages = ["No hub response for loaded packages"];
      this.autodefs = ["No hub response for configured automatic definitions"]
      this.registered_hub_users = ["No hub response for registered users"]
    });
  }

  listenToHub() {
      this.env_service.listenForHub(this.socket, 'hub_connection').subscribe(
      (hub_message) => {

        //Connection Interaction//
        
        if (this.environment_state){
          if (hub_message['hub_connect'] && 
                  hub_message['hub_connect'] === this.environment_state['hubID']) { 
                  this.hub_present = true;
                  this.env_service.talkToHub(this.socket, 'package_inquiry', null);  
              }
          if (hub_message['hub_connect'] && this.environment_state) {
             if(hub_message['hub_connect'] != this.environment_state['hubID']) {
                this.hub_present = false;
                this.socket.disconnect();
            }
          }
          if ((hub_message['new_hub_id'] && hub_message['new_hub_id'] != "failed") &&
            (hub_message['new_hub_admin'] && (hub_message['new_hub_admin'] === 
            this.user['_id']))) {
              this.environment_state['hubID'] = hub_message['new_hub_id'];
              localStorage.setItem('env_settings_env', 
                JSON.stringify(this.environment_state));
          } 
          if (hub_message['new_hub_id'] && hub_message['new_hub_id'] === "failed" &&
            (hub_message['new_hub_admin'] && (hub_message['new_hub_admin'] === 
            this.user['_id']))) {
              this.environment_state['hubID'] = null;
          }
          if (hub_message['hub_connect'] && 
              hub_message['hub_connect'] === this.environment_state['hubID']) { 
            this.hub_present = true;
          }
        }
            
        //Package_ref.name Control Interaction//

        if (this.hub_present) {
          if (hub_message['loaded_packages'] && hub_message['loaded_packages'][0] 
            != "none") {
              this.loaded_packages = hub_message['loaded_packages'];
          }; 
          if (hub_message['loaded_packages'] && hub_message['loaded_packages'][0] 
            === "none") {
              this.loaded_packages = ["No packages are loaded on this hub"];
          };
          if (hub_message['installed_packages'] && hub_message['installed_packages'][0] 
            != "none") {
              this.installed_packages = hub_message['installed_packages'];
          }; 
          if (hub_message['installed_packages'] && hub_message['installed_packages'][0] 
            === "none") {
              this.installed_packages = ["No packages are installed on this hub"];
          };
          if (hub_message['package_install'] && hub_message['package_install']
            === "success") {
              this.alert_service.success("Install successfull!")
          }
          if (hub_message['package_install'] && hub_message['package_install']
            === "failed") {
              this.alert_service.error("There was an error during installation...")
          }
          if (hub_message['package_uninstall'] && hub_message['package_uninstall']
            === "success") {
              this.alert_service.success("Uninstall successfull!")
          }
          if (hub_message['package_uninstall'] && hub_message['package_uninstall']
            === "failed") {
              this.alert_service.error("There was an error during uninstallation...")
          }
          
          //AutoDefs Control Interaction//
          
          if (hub_message['autodefs_status'] && hub_message['autodefs_status'] 
            != "none") {
              this.autodefs = hub_message['autodefs_status'];
          };
          if (hub_message['autodefs_status'] && hub_message['autodefs_status'] 
            === "none") {
              this.autodefs = ["No autodefs are available on this hub" 
                                +"-- feature yet to come"];
          };

          //Users Control Interaction//

          if (hub_message['registered_users_status'] 
            && hub_message['registered_users_status'] != "none") {
              this.registered_hub_users = hub_message['registered_users_status'];
          }; 
          if (hub_message['registered_users_status'] 
            && hub_message['registered_users_status'] === "none") {
              this.registered_hub_users = ["No users are registered on this hub"];
          };
        };
    });
  }

  installPackage(package_ref: Object) {
    this.env_service.talkToHub(this.socket, 'install_package', package_ref); 
  }

  uninstallPackage(package_ref: Object) {
    this.env_service.talkToHub(this.socket, 'uninstall_package', package_ref); 
  }

  goToSettings() {
    let environments = []
    if (this.user) {
      this.env_service.getUserEnvs(this.user['_id'])
        .pipe(first())
        .subscribe(
          (env_res: any[]) => {
            for (let i = 0; i < env_res.length; i++) {
              if (env_res[i]['envName'] === this.environment_name) {
                this.general_message_service.sendMessage("selected_environment", env_res[i])
                this.router.navigate(['/home/environments/environment-settings/'
                          +this.environment_name]);              
              }
            }
          },
          error => {
            this.alert_service.error("This navigation isn't working due to <"
                                     +error+">...try again in a bit.");
          });
    }
  }

  navigatePackageControl(environment_name, package_ref) {
    let loader = {"name": package_ref['name'],
                  "_id": package_ref['_id'],
                 "active": "false"}
    localStorage.setItem('initialized_package_control', JSON.stringify(loader))
    this.router.navigate(['/home/'+environment_name+'/'+package_ref.name
                            +'/control']);
  }

  ngOnDestroy() {
    this.socket.disconnect();
  }
}
