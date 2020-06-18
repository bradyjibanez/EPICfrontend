export class ModalService {
    private modals: any[] = [];

    add(modal: any) {
        this.modals.push(modal);
    }

    remove(id: string) {
        this.modals = this.modals.filter(x => x.id !== id);
    }

    open(id: string, input_obj: object) {
        let modal: any = this.modals.filter(x => x.id === id)[0];
        modal.open(input_obj);
    }

    close(id: string) {
        let modal: any = this.modals.filter(x => x.id === id)[0];
        modal.close();
    }
}