import { Component, OnInit } from '@angular/core';
import { RouterEvent, Router, Event } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})

export class FooterComponent implements OnInit {

  make_active: Boolean = false;

  constructor(private router: Router) {
    router.events.pipe(
      filter((event: Event) => event instanceof RouterEvent)
      ).subscribe((event: any) => {
        event.url === '/login' || event.url === '/register' ? this.make_active = false : this.make_active = true;
      });
  }

  ngOnInit() {
  }

}
