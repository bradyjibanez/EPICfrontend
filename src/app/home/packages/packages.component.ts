import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AlertService, 
         PackageService,
       	 ModalService } from '../../_services';

import { User } from '../../_models';

@Component({
  selector: 'packages',
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.css']
})
export class PackagesComponent implements OnInit {

  uploaded_package_name: any;
  upload_package_form: FormGroup;
  package_content: File = null;
  submitted: boolean = false;
  user: User[];

  constructor(
  	  private form_builder: FormBuilder,
      private modal_service: ModalService,
      private package_service: PackageService,
      private alert_service: AlertService) 
  { }

  ngOnInit() {
    this.buildPackageForm();
    this.user = JSON.parse(localStorage.getItem('currentUser'));
  }

  get fPackage() { return this.upload_package_form.controls; }

  buildPackageForm() {
    this.upload_package_form = this.form_builder.group({
      packageName: ['', Validators.required],
      packageDescription: ['', Validators.required]
    });
  }

  onUploadRequest(pack: File, modal_id) {
    this.package_content = pack;
  	this.uploaded_package_name = this.package_content.name;
  	this.openModal(modal_id)
  }

  confirmPackageUpload(modal_id: string, event) {
    this.submitted = true;
    if (this.upload_package_form.invalid) {
      return;
    }
    this.package_service.uploadPackage(this.package_content, this.upload_package_form, this.user)
      .pipe(first())
      .subscribe(
        (pack: string) => {
          this.user['packages'].push(pack);
          localStorage.setItem('currentUser', JSON.stringify(this.user));
        },
        error => {
          this.alert_service.error("Package failed to upload due to <"
                                    +error+">...try again in a bit.");
        });
    this.closeModal(modal_id, true);
  }

  openModal(id: string) {
    this.modal_service.open(id, null);
  }

  closeModal(id: string, valid: boolean) {
    if (!valid) {
      this.uploaded_package_name = null;
    }
    if (id) {
      this.modal_service.close(id);
    }
  }

}
