import { Component, 
         ElementRef, 
         Input, 
         Output, 
         EventEmitter,
         OnInit, 
         OnDestroy } from '@angular/core';

import { ModalService } from '../_services';

@Component({
    selector: 'confirmation-modal',
    template: 
        `<div class="confirmation-modal">
            <div class="confirmation-modal-body">
                <ng-content></ng-content>
            </div>
        </div>
        <div class="confirmation-modal-background">
        </div>`,
    styleUrls: ['./confirmation_modal.component.css']
})

export class ConfirmationModalComponent implements OnInit, OnDestroy {
    @Input() id: string;
    @Output() shared_obj = new EventEmitter<object>();
    private element: any;

    constructor(
    	private modalService: ModalService, 
    	private el: ElementRef) {
        	this.element = el.nativeElement;
    }

    ngOnInit(): void {
        let modal = this;

        // ensure id attribute exists
        if (!this.id) {
            console.error('modal must have an id');
            return;
        }

        this.element.style.display = 'none';
        // move element to bottom of page (just before </body>) so it can be displayed above everything else
        document.body.appendChild(this.element);
        // add self (this modal instance) to the modal service so it's accessible from controllers
        this.modalService.add(this);
    }

    // remove self from modal service when directive is destroyed
    ngOnDestroy(): void {
        this.modalService.remove(this.id);
        this.element.remove();
    }

    // open modal
    open(input_obj: object): void {
        this.shared_obj.emit(input_obj);
        this.element.style.display = 'block';
        document.body.classList.add('confirmation-modal-open');
    }

    // close modal
    close(): void {
        this.element.style.display = 'none';
        document.body.classList.remove('confirmation-modal-open');
    }
}
