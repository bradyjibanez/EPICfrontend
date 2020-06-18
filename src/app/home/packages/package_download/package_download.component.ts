import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { first } from 'rxjs/operators';
import * as io from 'socket.io-client';

import { AlertService,
         PackageService,
         ModalService,
         EnvironmentService } from '../../../_services';

import { environment } from '../../../../environments/environment';

import { Package } from '../../../_models/epic_package';


@Component({
  selector: 'package_download',
  templateUrl: './package_download.component.html',
  styleUrls: ['./package_download.component.css']
})
export class PackageDownloadComponent implements OnInit, OnDestroy {

  user = JSON.parse(localStorage.getItem('currentUser'));
  hub_present: boolean = false;
  hub_package_requested: string = "none";
  readonly hub_socket: string = environment.EPICHubWebSocket;
  socket: any;
  recent_packages: Array<Package> = [];
  active_env: Object = [];
  active_modal: string;
  modal_package: object;
  modal_package_admin: string;
  modal_package_name: string;
  modal_package_author: string;
  modal_package_createdDate: string;
  modal_package_description: string;
  modal_package_packageID: string; 
  refresh_interval: any;

  constructor(
    private alert_service: AlertService,
    private modal_service: ModalService,
    private env_service: EnvironmentService,
    private package_service: PackageService,
    //private local_hub_interaction: NgZone,
  	) { }

  ngOnInit() {
    this.active_env = JSON.parse(localStorage.getItem('active_env'));
    this.socket = io(this.hub_socket, { });
    //this.local_hub_interaction.run(() => {
      this.socket.on('connect', () => {
        if (this.active_env) {
          this.env_service.listenForHub(this.socket, 'hub_connection')
            .subscribe((hub_message) => {
              if (hub_message['hub_connect'] &&
                 hub_message['hub_connect'] == this.active_env['hubID']) {
                 this.hub_present = true;
              } else if (hub_message['hub_connect'] &&
                         hub_message['hub_connect'] == !this.active_env['hubID']){  
                this.socket.disconnect();
              }
              if (hub_message['package_received'] === "failed") {
                if (this.hub_package_requested == "none") {
                  this.alert_service.error("There was an error loading this package to "
                                            +this.active_env['envName']+"'s hub");
                } else {
                  this.alert_service.error("There was an error loading <"+this.hub_package_requested 
                                           +"> to "+this.active_env['envName']+"'s hub");
                }
                this.hub_package_requested = "none";
              }
              if (hub_message['package_received'] === "success") {
                if (this.hub_package_requested == "none") {
                  this.alert_service.success("Successfully loaded this package to "
                                            +this.active_env['envName']+"'s hub");
                } else {
                  this.alert_service.success("Successfully loaded <"+this.hub_package_requested 
                                           +"> to "+this.active_env['envName']+"'s hub");
                }
                this.hub_package_requested = "none";
              }
              if (hub_message['package_received'] === "duplicate") {
                if (this.hub_package_requested == "none") {
                  this.alert_service.error("This package is already loaded on "
                                            +this.active_env['envName']+"'s hub");
                } else {
                  this.alert_service.error("<"+this.hub_package_requested 
                                           +"> is already loaded on "+this.active_env['envName']+"'s hub");
                }
                this.hub_package_requested = "none";
              }
          })
        }
      });
      this.socket.on('disconnect', reason => {
        this.hub_present = false;
      })
  	//});
    this.showMostRecentPackages();
  }

  showMostRecentPackages(package_deleted: boolean = false) {
    this.package_service.findMostRecentPackages()
      .pipe(first())
      .subscribe(
        (packages: any[]) => {
          this.recent_packages = [];
          for (let i=0; i < packages.length; i++) {
            this.recent_packages[i] = packages[i];
          }
        },
        error => {
          this.alert_service.error("The latest created packages are not available at this time due to <"
                                   +error+">...try again in a bit.");
        });
  }

  downloadPackage(package_info: string,
                  browser_download: boolean = false, 
                  hub_sync: boolean = false) {
    let file_name = package_info['packageName']
    this.package_service.downloadPackage(package_info['packageID'])
      .pipe(first())
      .subscribe(
        (package_file: any) => {
          if (hub_sync) {
            if (file_name) {
              this.hub_package_requested = file_name;
              let package_representation = {"packageName": file_name,
                                            "_id": package_info['packageID'],
                                            "package": package_file}
              this.env_service.talkToHub(this.socket, 'package_upload', 
                                          package_representation);
            } else {
              this.env_service.talkToHub(this.socket, 'package_upload', package_file);
            }
            this.closeModal(this.active_modal);
          } 
          if (browser_download) {   
            let binary_data = [];
            binary_data.push(package_file);
            let downloadLink = document.createElement('a');
            downloadLink.href = window.URL.createObjectURL(new Blob(binary_data, 
                                                           {type: "octet/stream"}));
            if (file_name) {
                downloadLink.setAttribute('download', file_name);
            }
            document.body.appendChild(downloadLink);
            downloadLink.click();
            this.closeModal(this.active_modal);
          }       
        });
  }

  deletePackage(package_info: string) {
    this.package_service.deletePackage(package_info['packageID'])
      .pipe(first())
      .subscribe(
        (package_deleted: any[]) => {
          this.closeModal(this.active_modal)
          this.recent_packages = [];
          this.alert_service.success(this.modal_package_name+" was successfully deleted...");
          this.refresh_interval = setInterval(() => {
            this.showMostRecentPackages(true);
            clearInterval(this.refresh_interval);    
          }, 100);
        },
        error => {
          this.closeModal(this.active_modal);
          this.alert_service.error("An error was experienced while "+ 
                                   "deleting "+this.modal_package_name+"...try again in a bit.");
        });
  }

  openModal(id: string, input_obj: object) {
    this.modal_service.open(id, input_obj);
    this.active_modal = id;
  }

  syncModal($event) {
    this.modal_package = $event;
    this.modal_package_admin = this.modal_package['admin'];
    this.modal_package_name = this.modal_package['packageName'];
    this.modal_package_author = this.modal_package['authoruserName'];
    this.modal_package_createdDate = this.modal_package['createdDate'];
    this.modal_package_description = this.modal_package['packageDescription'];
    this.modal_package_packageID = this.modal_package['PackageID'];
  }

  closeModal(id: string) {
    if (id) {
      this.modal_service.close(id);
    }
  }

  ngOnDestroy() {
    this.socket.off();
    this.socket.disconnect();
  }

}
