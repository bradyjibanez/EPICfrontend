import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title }     from '@angular/platform-browser';
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
  selector: 'environment_settings',
  templateUrl: './environment_settings.component.html',
  styleUrls: ['./environment_settings.component.css']
})

export class EnvironmentSettingsComponent implements OnInit, OnDestroy {

  first_visit: number = 0;
  environment_update_form: FormGroup;
  environment_state: Object = [];
  activated_env: Object = [];
  user: User[];
  readonly hub_websocket: string = environment.EPICHubWebSocket
  ssdp: any;
  socket: any;
  unclaimed_hub_present: boolean = false;
  claimed_hub_present: boolean = false;
  activate_btn_value: string;
  packages: string[] = ["No hub response for available packages"];
  autodefs: string[] = ["No hub response for configured automatic definitions"];
  registered_hub_users: string[] = ["No hub response for registered users"];

  constructor(
    private title_service: Title,
    private route: ActivatedRoute,
    private router: Router,
    private form_builder: FormBuilder,
    private env_service: EnvironmentService,
    private alert_service: AlertService,
    private modal_service: ModalService,
    private banner_message_service: BannerMessageService,
  	private general_message_service: GeneralMessageService) {
      this.user = JSON.parse(localStorage.getItem("currentUser"));
      this.socket = io(this.hub_websocket, { forceNew: true });
      this.environment_update_form = this.form_builder.group({
        // nothing yet
      });
	  }

  ngOnInit() {
    if (this.route.snapshot.paramMap.get('first-visit') === "true") {
      this.first_visit = 1;
    }
    this.general_message_service.getMessage().subscribe((message) => {
      if (message) {
        if (message.subject === "selected_environment") {
          this.environment_state = message.body;
          this.environment_state = JSON.parse(JSON.stringify(message.body));
          localStorage.setItem('env_settings_env', JSON.stringify(message.body))
        } 
      } else if (!message) {
          this.environment_state = JSON.parse(localStorage.getItem('env_settings_env'));
      }
    });
    this.setActivateButtonStatus();
    this.listenToHub();
    this.socket.on('connect', () => {
      this.env_service.talkToHub(this.socket, 'package_inquiry', null); 
      this.env_service.talkToHub(this.socket, 'autodefs_inquiry', null);
      this.env_service.talkToHub(this.socket, 'registered_users_inquiry', null);
    });
    this.socket.on('disconnect', () => {
      this.claimed_hub_present = false;
      this.packages = ["No hub response for available packages"];
      this.autodefs = ["No hub response for configured automatic definitions"]
      this.registered_hub_users = ["No hub response for registered users"]
    });
  }
  
  listenToHub() {
    this.env_service.listenForHub(this.socket, 'hub_connection').subscribe(
      (hub_message) => {

        /*** HUB CONFIG ***/

        if (hub_message['unclaimed'] && !this.environment_state['claimedStatus']) {
          if (!this.environment_state['claimedStatus']) {
            this.unclaimed_hub_present = true
          }
          this.socket.on('disconnect', () => {
            this.unclaimed_hub_present = false;
          });
        };
        if (hub_message['hub_connect'] &&
           hub_message['hub_connect'] != this.environment_state['hubID']) {
          this.claimed_hub_present = false;
          this.socket.disconnect();
        }
        if (hub_message['hub_connect'] && 
            hub_message['hub_connect'] === this.environment_state['hubID']) { 
          this.claimed_hub_present = true;           
        }
        if ((hub_message['new_hub_id'] && hub_message['new_hub_id'] != "failed") &&
          (hub_message['new_hub_admin'] && (hub_message['new_hub_admin'] === 
          this.user['_id']))) {
            this.environment_state['hubID'] = hub_message['new_hub_id'];
            localStorage.setItem('env_settings_env', 
              JSON.stringify(this.environment_state))
            if (this.activated_env){
              if (this.environment_state['envName'] === this.activated_env['envName']) {
                this.updateActiveEnv();
              }
            }
            this.env_service.talkToHub(this.socket, 'package_inquiry', null); 
            this.env_service.talkToHub(this.socket, 'autodefs_inquiry', null);
            this.env_service.talkToHub(this.socket, 'registered_users_inquiry', null);
        } 
        if (hub_message['new_hub_id'] && hub_message['new_hub_id'] === "failed" &&
          (hub_message['new_hub_admin'] && (hub_message['new_hub_admin'] === 
          this.user['_id']))) {
            this.environment_state['hubID'] = null;
        }

        /*** HUB STATUS READING ***/

        if (this.claimed_hub_present) {
          if (hub_message['loaded_packages'] && hub_message['loaded_packages'] 
            != "none") {
              this.packages = hub_message['loaded_packages'];
          }; 
          if (hub_message['loaded_packages'] && hub_message['loaded_packages'] 
            === "none") {
              this.packages = ["No packages are loaded on this hub"];
          };
          if (hub_message['autodefs_status'] && hub_message['autodefs_status'] 
            != "none") {
              this.autodefs = hub_message['autodefs_status'];
          };
          if (hub_message['autodefs_status'] && hub_message['autodefs_status'] 
            === "none") {
              this.autodefs = ["No autodefs are available on this hub "
                                +"-- feature yet to come"];
          };
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

  claimHub() {
    this.user = JSON.parse(localStorage.getItem('currentUser'));
    this.env_service.getUserEnvs(this.user['_id'])
      .pipe(first())
      .subscribe(
        (env_res: any[]) => {
          for (let i = 0; i < env_res.length; i++) {
            if (env_res[i]['envName'] === this.environment_state['envName']) {
              this.env_service.talkToHub(this.socket, 'client_claim', 
                {'user_token': env_res[i]['configToken'],
                'user_id': this.user['_id'],
                'name': env_res[i]['envName'],
                'type': env_res[i]['envType'],
                'location': env_res[i]['envLoc'],
                'description': env_res[i]['envDesc']});
              this.claimed_hub_present = true;
              this.unclaimed_hub_present = false;
              this.environment_state['claimedStatus'] = true;
              localStorage.setItem('env_settings_env', 
                JSON.stringify(this.environment_state)) 
              this.socket.on('disconnect', () => {
                this.claimed_hub_present = false;
              }); 
            }
          }
        },
        error => {
          this.alert_service.error("This hub could not be claimed due to <"
                                   +error+">...try again in a bit.");
        }
      );
  }

  releaseHub() {
    this.env_service.talkToHub(this.socket, 'client_release', 
      {'hubID': this.environment_state['hubID']});
    this.claimed_hub_present = false;
    this.unclaimed_hub_present = true;
    this.environment_state['claimedStatus'] = false;
    this.environment_state['hubID'] = "undefined";
    localStorage.setItem('env_settings_env', JSON.stringify(this.environment_state)) 
    if (this.activated_env != undefined) {
      this.activated_env['hubID'] = "undefined";
      if (this.activated_env['envName'] === this.environment_state['envName']) {
        this.updateActiveEnv()
      }
    }
    this.socket.on('disconnect', () => {
      this.claimed_hub_present = false;
    }); 
    this.packages = ["No hub response for available packages"];
    this.autodefs = ["No hub response for configured automatic definitions"]
    this.registered_hub_users = ["No hub response for registered users"]
  }

  confirmHubRelease(id: string) {
    this.releaseHub();
    this.closeModal(id);
  }

  deleteEnvironment() {
    this.env_service.deleteEnvironment(this.environment_state['_id'])
      .pipe(first())
      .subscribe(
        delete_res => {
          if (delete_res != 0) {
            for (let i = 0; i < this.user['environments'].length; i++) {
              if (this.user['environments'][i] === this.environment_state['envName']) {
                this.user['environments'].splice(i, 1);
              }
            };
            this.releaseHub();
            if (this.environment_state['envName'] === localStorage.getItem('env_settings_env')['envName']) {
              let message = JSON.parse(JSON.stringify({"environment": "EPIC IoT"}))
              localStorage.removeItem('active_env');
              this.banner_message_service.sendMessage('activeenvironment', message);
            }
            localStorage.setItem("currentUser", JSON.stringify(this.user));
            this.router.navigate(['/home/environments']);
          } else {
            this.alert_service.error("Unable to delete this environment due to"
                                       +"...try again in a bit.");
          }
        }
      )
  }
 
  confirmEnvDelete(id: string) {
    this.deleteEnvironment();
    this.closeModal(id);
  }

  updateActiveEnv() {
    let active_env = JSON.stringify({"envName": this.environment_state['envName'],
                                 "envLoc": this.environment_state['envLoc'],
                                 "envID": this.environment_state['_id'],
                                 "hubID": this.environment_state['hubID']});
    localStorage.setItem('active_env', active_env)
    if (this.activated_env) {
      this.activated_env = JSON.parse(active_env);
    }
  }

  onUpdateEnvironment(update_form) {
    // nothin yet
  }

  activateEnvironment() {
    let message;
    let button_text = document.getElementById("activatebtn");
    button_text.innerHTML = (button_text.innerHTML === 'Activate') ? 
                            'Deactivate': 'Activate';
    if (button_text.innerHTML === "Deactivate") {
      message = JSON.parse(JSON.stringify(
              {"environment": this.environment_state['envName']}));
      this.title_service.setTitle(this.environment_state['envName']+" IoT")
      let active_env = JSON.stringify({"envName": this.environment_state['envName'],
                                       "envLoc": this.environment_state['envLoc'],
                                       "envID": this.environment_state['_id']});
      localStorage.setItem('active_env', active_env)
      this.updateActiveEnv();
      localStorage.setItem('env_settings_env', JSON.stringify(this.environment_state))
    } else {
      message = JSON.parse(JSON.stringify(
              {"environment": "EPIC IoT"}))
      this.title_service.setTitle("EPIC IoT")
      localStorage.removeItem('active_env');
      this.activated_env = undefined;
    }
    this.banner_message_service.sendMessage('activeenvironment', message);
  }

  setActivateButtonStatus() {
    if (localStorage.getItem('active_env')) {
      this.activated_env = JSON.parse(localStorage.getItem('active_env'))
      this.activate_btn_value = JSON.parse(localStorage.getItem('active_env'))['envName'] 
        === this.environment_state['envName'] ? "Deactivate" : "Activate";
    } else {
      this.activate_btn_value = "Activate";
    }
  }

  openModal(id: string) {
    if (this.first_visit == null || this.first_visit == 0) {
      this.modal_service.open(id, null);
    }
  }

  closeModal(id: string) {
    if (id) {
      this.modal_service.close(id);
    }
  }

  skipIntro() {
    this.first_visit = null;
    this.router.navigate(["/home/environments/environment-settings/"+this.environment_state['envName']]);
  }

  ngOnDestroy() {
    this.socket.off();
    localStorage.removeItem('env_settings_env');
  }


  /*ONBOARDING ANIMATION*/


  get animateInstruction(): any {
    if (this.first_visit) {
      return {
        type: 'slide',
        direction: 'down',
        duration: 500,
      };
    }
    return false;
  }

  get animateInstructionLeft(): any {
    if (this.first_visit) {
      return {
        type: 'slide',
        direction: 'left',
        duration: 500,
      };
    }
    return false;
  }

  incrementVisit() {
    this.first_visit += 1;
    if (this.first_visit == 6) {
      let message = JSON.parse(JSON.stringify(
              {"environment": this.environment_state['envName']}));
      let active_env = JSON.stringify({"envName": this.environment_state['envName'],
                                   "envID": this.environment_state['_id'],
                                   "hubID": this.environment_state['hubID']});
      this.banner_message_service.sendMessage('activeenvironment', message);
    }
    if (this.first_visit == 7) {
      let message = JSON.parse(JSON.stringify(
              {"environment": "EPIC IoT"}));
      localStorage.removeItem('active_env');
      this.banner_message_service.sendMessage('activeenvironment', message);
    }
    if (this.first_visit == 10) {
      this.first_visit = null;
      this.router.navigate(["/home/environments/environment-settings/"+this.environment_state['envName']]);
    }
  }

}
