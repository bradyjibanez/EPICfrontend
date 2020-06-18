import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule }    from '@angular/forms';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { PopupModule } from '@progress/kendo-angular-popup';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { GooglePlaceModule } from "ngx-google-places-autocomplete";
import { NgxSpinnerModule } from "ngx-spinner";

import { AppComponent }  from './app.component';
import { routing }        from './app.routing';

import { AuthGuard } from './_guards';
import { JwtInterceptor, ErrorInterceptor } from './_helpers';
import { AlertService, 
        AuthenticationService, 
        ModalService,
        UserService, 
        EnvironmentService } from './_services';

import { AlertComponent } from './alert/alert.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { FooterComponent } from './home/footer/footer.component';
import { NavComponent } from './home/banner/nav/nav.component';
import { BannerComponent } from './home/banner/banner.component';
import { ProfileSettingsComponent } from './home/profile_settings/profile_settings.component';
import { PackagesComponent } from './home/packages/packages.component';
import { EnvironmentsComponent } from './home/environments/environments.component';
import { EnvironmentSettingsComponent } from './home/environments/environment_settings/environment_settings.component';
import { CreateEnvironmentComponent } from './home/environments/create_environment/create_environment.component';
import { ConfirmationModalComponent } from './confirmation_modal/confirmation_modal.component';
import { PackageDownloadComponent } from './home/packages/package_download/package_download.component';
import { EnvironmentHomeComponent } from './home/environments/environment_home/environment_home.component';
import { PackageControlTemplateComponent } from './home/packages/package_control_template/package_control_template.component';

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        HttpModule,
        FormsModule,
        HttpClientModule,
        routing,
        GooglePlaceModule,
        PopupModule,
        NgxSpinnerModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [
        AppComponent,
        AlertComponent,
        HomeComponent,
        LoginComponent,
        RegisterComponent,
        FooterComponent,
        NavComponent,
        BannerComponent,
        ProfileSettingsComponent,
        PackagesComponent,
        EnvironmentsComponent,
        EnvironmentSettingsComponent,
        CreateEnvironmentComponent,
        ConfirmationModalComponent,
        PackageDownloadComponent,
        EnvironmentHomeComponent,
        PackageControlTemplateComponent,
    ],
    providers: [
        AuthGuard,
        AlertService,
        ModalService,
        AuthenticationService,
        UserService,
        EnvironmentService,
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },

    ],
    bootstrap: [AppComponent]
})

export class AppModule { }