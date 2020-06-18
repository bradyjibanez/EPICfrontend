import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { NgxSpinnerService } from "ngx-spinner";
import * as io from 'socket.io-client';

import { EnvironmentService,
         AlertService } from '../../../_services';
import { User } from '../../../_models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'package-control-template',
  templateUrl: './package_control_template.component.html',
  styleUrls: ['./package_control_template.component.css']
})

export class PackageControlTemplateComponent implements OnInit, OnDestroy {

  user: User[];
  environment_state: Object = {};
  initialized_package: Object = {};
  things: any = {};
  //seen_thing: any = {};
  reader = new FileReader();
  readonly hub_websocket: string = environment.EPICHubWebSocket
  socket: any;
  logo: any;
  package_name: string;
  hub_present: Boolean = true;
  dont_activate: Boolean = false;
  activated: Boolean = false;
  table_rows_count: number;
  actdeacttitle: string = "activate"

  constructor(
    private sanitizer: DomSanitizer,
    private router: Router,
    //private local_hub_interaction: NgZone,
    private alert_service: AlertService,
    private env_service: EnvironmentService,
    private spinner: NgxSpinnerService,
  ) {
      this.user = JSON.parse(localStorage.getItem("currentUser"));
      this.socket = io(this.hub_websocket, { forceNew: true });
  }

  ngOnInit() {
    this.spinner.show();
    this.environment_state = JSON.parse(localStorage.getItem('active_env'));
    this.initialized_package = JSON.parse(localStorage.getItem('initialized_package_control'));
    this.package_name = this.initialized_package['name'];
    this.activated = this.initialized_package['activate']
    //this.local_hub_interaction.run(() => {
      if (this.socket.onclose()) {
        this.hub_present = false;
        this.router.navigate(['/home']);
      }

      this.listenToHub();
      this.socket.on('connect', () => {
        //pass
      });
      this.socket.on('disconnect', () => {
        this.hub_present = false;
        localStorage.removeItem('initialized_package_control');
      });
    //});
  }

  listenToHub() {
      this.env_service.listenForHub(this.socket, 'hub_connection').subscribe(
      (hub_message) => {

        //Connection Interaction//
        if (this.environment_state){
          if (hub_message['hub_connect'] && 
              hub_message['hub_connect'] === this.environment_state['hubID']) { 
                this.hub_present = true;
                this.initializePackage();
              }
          if (hub_message['hub_connect'] && this.environment_state) {
             if(hub_message['hub_connect'] != this.environment_state['hubID']) {
                this.hub_present = false;
                this.socket.disconnect();
            }
          }
        }
            
        //Package Config/Status Interaction//

        if (this.hub_present) {

          //Package Specifcations Acquisition//

          if (hub_message['package_initialization'] && hub_message['package_initialization'] 
            != "failed") {
              this.spinner.hide();
              this.socket.connect();
              this.initialized_package = hub_message['package_initialization'];
              let new_things = this.initialized_package['things'];
              this.updateThings(new_things)  
              this.getPackageLogo(hub_message['package_initialization'])
              this.activated = this.initialized_package['active'] === "true" ? true : false;
              this.actdeacttitle = this.activated ? 
                "deactivate "+this.package_name : "activate "+this.package_name;   
              localStorage.setItem('initialized_package_control', JSON.stringify(hub_message['package_initialization']))
          }; 
          if (hub_message['package_initialization'] && hub_message['package_initialization'] 
            === "failed") {
              this.spinner.hide();
              this.alert_service.error("This package could not be configured. Refresh the browser. If that fails, restart your hub.")
          };

          //Package Activation//

          if (hub_message['activation_status'] && hub_message['activation_status']
            === this.package_name) {
            this.activated = true;
            this.actdeacttitle = "deactivate "+this.package_name;
            this.initialized_package['active'] = "true";
            localStorage.setItem('initialized_package_control', JSON.stringify(this.initialized_package))
            this.spinner.hide();
            this.alert_service.success("<"+this.package_name+"> was successfully activated");
          };
          if (hub_message['activation_status'] && hub_message['activation_status']
            === "failed") {
            this.spinner.hide();
            this.alert_service.error("<"+this.package_name+"> was not activated...refresh your browser...then reset you hub if nogo.");
          };          
          if (hub_message['deactivation_status'] && hub_message['deactivation_status']
            === this.package_name) {
            this.activated = false;
            this.actdeacttitle = "activate "+this.package_name;
            this.initialized_package['active'] = "false";
            localStorage.setItem('initialized_package_control', JSON.stringify(this.initialized_package))
            this.spinner.hide();
            this.alert_service.success("<"+this.package_name+"> was successfully deactivated");
          };
          if (hub_message['deactivation_status'] && hub_message['deactivation_status']
            === "failed") {
            this.spinner.hide();
            this.alert_service.error("<"+this.package_name+"> failed to deactivate...please restart your hub");
          };

          //Things Operation//

          //Things Status Update//
          if (hub_message['things_status_update'] && hub_message['things_status_update']
            != "failed") {
            this.spinner.hide();
            let updated_things = JSON.parse(JSON.stringify(hub_message['things_status_update']))
            this.updateThings(updated_things)  
          }
          if (hub_message['things_status_update'] && hub_message['things_status_update']
            === "failed") {
            this.alert_service.error("The <"+this.package_name+"> package failed to respond...");
          }
          if (hub_message['thing_status_update'] && hub_message['thing_status_update']
            != "failed") {
            this.spinner.hide();
            let updated_thing = JSON.parse(JSON.stringify(hub_message['thing_status_update']))
            this.updateThing(updated_thing)  
          }
          if (hub_message['thing_status_update'] && hub_message['thing_status_update']
            === "failed") {
            let seen_thing = hub_message['thing']
            if (seen_thing['value']['status'] === "deactive") {
              this.things[seen_thing['key']]['display_status'] = seen_thing['value']['deactive_readable']
            } else {
              this.things[seen_thing['key']]['display_status'] = seen_thing['value']['active_readable']
            }           
            this.alert_service.error("The <"+this.package_name+"> package failed to respond...");
          }   
          //Things State Alteration//
          if (hub_message['thing_state'] && hub_message['thing_state']
            != "failed") {
            this.spinner.hide();
            this.alternateThingReadableValue(hub_message['thing']);
            let seen_thing = hub_message['thing']
            if (seen_thing['value']['status'] === this.things[seen_thing['key']]['status']) {
              this.alternateThingReadableValue(seen_thing);
    
            }
          };
          if (hub_message['thing_state'] && hub_message['thing_state']
            === "failed") {
            let seen_thing = hub_message['thing']
            let error_thing = this.things[seen_thing['key']]['thing_id']
            this.spinner.hide();
            this.alert_service.error("<"+seen_thing['value']['thing_id']+
              "> did not respond as expected...try again...if the problem persists,"+
              " reset the <"+this.package_name+"> package")  
          };
        };
    });
  }

  initializePackage() {
    this.env_service.talkToHub(this.socket, 'initialize_package', this.initialized_package);
  }

  act_deactPackage() {
    if (!this.activated) {
      this.env_service.talkToHub(this.socket, 'activate_package', this.initialized_package);
      this.spinner.show();
    } else {
      this.alert_service.success("Deactivating <"+this.package_name+">...functionality will no longer operate as expected...")
      this.env_service.talkToHub(this.socket, 'deactivate_package', this.initialized_package);
      //this.spinner.show();
    }
  }

  getPackageLogo(message_content: Object) {
    let bytes = [message_content['logo']];
    let units = new Uint8Array(bytes[0]);
    let string_char = String.fromCharCode.apply(null, units);
    let base64 = btoa(string_char);
    this.logo = this.sanitizer.bypassSecurityTrustUrl('data:image;base64,' + base64);
  }

  alternateThingStatus(thing: Object) {
    this.spinner.show();
    let operation_request = {"thing": thing,
                             "package_id": this.initialized_package['_id'],
                             "package_name": this.initialized_package['name']}
    this.env_service.talkToHub(this.socket, 'alternate_thing_status', operation_request)
  }

  refreshAllThings() {
    this.spinner.show();
    let operation_request = {"package_id": this.initialized_package['_id'],
                             "package_name": this.initialized_package['name']}
    this.env_service.talkToHub(this.socket, 'update_things_status', operation_request)
  }  

  refreshThing(thing: Object) {
    let operation_request = {"thing": thing,
                             "package_id": this.initialized_package['_id'],
                             "package_name": this.initialized_package['name']}
    this.env_service.talkToHub(this.socket, 'update_thing_status', operation_request)
    this.things[thing['key']]['display_status'] = "refreshing..."
  }


//GENERAL CONTROL//


  updateThings(updated_things: Object) {
    this.things = Object.keys(updated_things).map(function(things) {
        let the_things = updated_things[things]
        return the_things; 
      });
    for (let i = 0; i < this.things.length; i++) {
      this.things[i]['display_status'] = this.things[i]['status'] === "deactive" ? 
        this.things[i]['deactive_readable'] : this.things[i]['active_readable'];
    }
  }

  updateThing(updated_thing: Object) {
    for (let i = 0; i < this.things.length; i++) {
      if (this.things[i]['thing_id'] === updated_thing['thing_id']) {
        this.things[i] = updated_thing;
      }
    }
  }

  alternateThingReadableValue(thing: Object) {
    this.things[thing['key']]['status'] = this.things[thing['key']]['status'] 
      === 'active' ? 'deactive' : 'active';
    this.things[thing['key']]['display_status'] = this.things[thing['key']]['status'] 
      === 'active' ? this.things[thing['key']]['active_readable'] : 
      this.things[thing['key']]['deactive_readable'];
  }

  ngOnDestroy() {
    localStorage.removeItem('initialized_package_control');
    this.socket.disconnect();
  }
}
