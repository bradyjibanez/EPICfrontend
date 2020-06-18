import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './_guards';
import { LoginComponent } from './login';
import { RegisterComponent } from './register';
import { HomeComponent } from './home';
import { ProfileSettingsComponent } from './home/profile_settings';
import { PackagesComponent } from './home/packages';
import { EnvironmentsComponent } from './home/environments';
import { EnvironmentSettingsComponent } from './home/environments/environment_settings';
import { CreateEnvironmentComponent } from './home/environments/create_environment';
import { PackageDownloadComponent } from './home/packages/package_download/package_download.component';
import { PackageControlTemplateComponent } from './home/packages/package_control_template/package_control_template.component';


const appRoutes: Routes = [
    { 
    	path: 'login', 
    	component: LoginComponent 
    },
    { 
    	path: 'register', 
    	component: RegisterComponent 
    },
    { 
    	path: 'home', 
        canActivate: [AuthGuard],
        //redundent and causes login to stick...StackOver recommends an authguard and edit guard
        //former for the parent latter for the children being a warning static
        //page saying user not validated to edit the children content
        //canActivateChild: [AuthGuard],
    	children: [
            {
                path: '',
                component: HomeComponent,
                pathMatch: 'full'
            },
    		{
   	    		path: 'profile_settings', 
	    		component: ProfileSettingsComponent, 
    		},
            {
                path: ':environment/:package/control',
                component: PackageControlTemplateComponent
            },
    		{
    			path: 'packages',
                children: [
                {
                    path: '',
                    component: PackagesComponent,
                    pathMatch: 'full' 
                },
                {
                    path: 'packages_download',
                    component: PackageDownloadComponent
                }
                ]
            },
    		{
    			path: 'environments',
                children: [
                    {
                        path: '',
                        component: EnvironmentsComponent,
                        pathMatch: 'full'
                    },
                    {
                        path: 'environment-settings/:environment',
                        component: EnvironmentSettingsComponent
                    },
                    {
                        path: 'create-environment',
                        component: CreateEnvironmentComponent
                    }
                ]
    		}
    	]
    },
    // authguard redirect not necessary since checks again once gets back on
    // redirect
    { 
    	path: '**', 
    	redirectTo: 'home'
    },
    {
        path: '', 
        redirectTo: 'home', 
        pathMatch: 'full'
    } 
];

export const routing = RouterModule.forRoot(appRoutes);