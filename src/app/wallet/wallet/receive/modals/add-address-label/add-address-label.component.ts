import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Log } from 'ng2-logger';

import { RpcService, RpcStateService, SnackbarService, DiviService } from '../../../../../core';
import { ModalsService } from '../../../../../modals/modals.service';

@Component({
  selector: 'app-add-address-label',
  templateUrl: './add-address-label.component.html',
  styleUrls: ['./add-address-label.component.scss']
})
export class AddAddressLabelComponent implements OnInit {

  @Output() onAddressAdd: EventEmitter<Object> = new EventEmitter<Object>();

  public addLableForm: FormGroup;
  public type: string;
  public label: string;
  public address: string;
  log: any = Log.create('receive.component');

  constructor(
    public dialogRef: MatDialogRef<AddAddressLabelComponent>,
    private formBuilder: FormBuilder,
    private rpc: RpcService,
    private rpcState: RpcStateService,
    private flashNotificationService: SnackbarService,
    private dialog: MatDialog,
    private divi: DiviService,
    private _modals: ModalsService) {
  }

  ngOnInit() {
    this.buildForm();
  }

  buildForm(): void {
    this.addLableForm = this.formBuilder.group({
      label: this.formBuilder.control(null, [Validators.required]),
    });
  }

  onSubmitForm(): void {
    if (this.rpcState.get('locked')) {
      // unlock wallet
      this._modals.open('unlock', {forceOpen: true, timeout: 3, callback: this.addNewLabel.bind(this)});
    } else {
      // wallet already unlocked
      this.addNewLabel();
    }
  }

  addNewLabel(): void {
    let call = (this.type === 'public' ? 'getnewaddress' : (this.type === 'private' ? 'getnewstealthaddress' : ''));
    let callParams = [this.label];
    let msg = `New ${this.type} address generated, with label ${this.label}!`;
    if (this.address !== '') {
      msg = `Updated label of ${this.address} to ${this.label}`;
      this.divi.addAddressLabel(this.address, this.label);
      this.divi.addAddressCreationDate(this.address);
      this.onAddressAdd.emit(this.address);
      this.dialogRef.close();
      this.flashNotificationService.open(msg);
      return;
    }

    if (!!call) {
      this.rpc.call(call, callParams)
        .subscribe(response => {
          if (['getnewaddress', 'getnewstealthaddress'].includes(call)) {
            this.divi.addAddressLabel(response, this.label);
            this.divi.addAddressCreationDate(response);
          }
          this.onAddressAdd.emit(response);
          this.dialogRef.close();
          this.flashNotificationService.open(msg)
        });
    }
  }

  dialogClose(): void {
    this.dialogRef.close();
  }

}
