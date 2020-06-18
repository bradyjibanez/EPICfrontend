import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

import { Package, User } from '../_models';


@Injectable({providedIn: 'root'})

export class PackageService {

    package_data = new FormData();

    constructor(private http: HttpClient) { 
    }

    uploadPackage(package_file: File, package_file_form: FormGroup, user: User[]) {
    	this.package_data.append('package', package_file);
    	this.package_data.append('packageName', package_file_form.value.packageName);
    	this.package_data.append('packageDescription', package_file_form.value.packageDescription);
        this.package_data.append('user', JSON.stringify(user['_id']));
        return this.http.post<any>(environment.EPICPackageServerURI+'upload_package', 
            this.package_data).pipe(map(
                confirmed_pack => {
                    return confirmed_pack;
                },
                error => {
                    return error;
                }
            ));
    }

    findMostRecentPackages() {
        return this.http.get<Package[]>(environment.EPICPackageServerURI+'most_recently_submitted');
    }

    downloadPackage(package_id: string) {
        return this.http.get<any>(environment.EPICPackageServerURI+'download/'+package_id,
            {responseType: 'arrayBuffer' as 'json'}).pipe(map(
            (response: any) => {
                return response;
            }));
    }

    deletePackage(package_id: string) {
        return this.http.delete(environment.EPICPackageServerURI+'delete/'+package_id);
    }

}