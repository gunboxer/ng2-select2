import {
    AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy,
    Output, ViewChild, ViewEncapsulation, Renderer, OnInit
} from '@angular/core';

import { S2Option } from './ng2-select2.interface';

@Component({
    selector: 'select2',
    template: `
        <select #selector>
            <ng-content select="option, optgroup">
            </ng-content>
        </select>`,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Select2Component implements AfterViewInit, OnDestroy, OnInit {
    @ViewChild('selector') selector: ElementRef;

    // data for select2 drop down
    _data: Array<S2Option>;
    @Input() set data(data: Array<S2Option>) {
        if (this._data === data || (data === undefined && this._data === undefined)) {
            return;
        }
        this._data = data;
        if(this.element) {
            this.initPlugin();

            if (this.autoSelect) {
                this.value = this.element.val();
            }
        }
    }
    get data(): Array<S2Option> {
        return this._data;
    }

    // value for select2
    _value: string ;
    @Input() set value(value: string ) {
        if (this._value === value || (value === undefined && this._value === undefined)) {
            return;
        }
        this._value = value;
        if(this.element) {
            const newValue: string  = value;
            this.setElementValue(newValue);
            if (!this.entity || this.entity.id !== newValue) {
                for (const id in this.data) {
                    if (this.data[id].id === newValue) {
                        this.entity = this.data[id];
                        break;
                    }
                }
            }
            this.emitValue(newValue);
        }
    }
    get value(): string  {
        return this._value;
    }

    _entity: S2Option;
    @Input() set entity(entity: S2Option) {
        if (this._entity === entity || (entity === undefined && this._entity === undefined)) {
            return;
        }
        this._entity = entity;
        if(this.element) {
            const newValue: S2Option = entity;
            if (this.value !== newValue.id) {
                this.value = newValue.id;
            }
        }
    }
    get entity(): S2Option {
        return this._entity;
    }

    // enable / disable default style for select2
    @Input() cssImport: boolean = false;

    // width of select2 input
    @Input() width: string;

    // enable / disable select2
    _disabled: boolean = false;
    @Input() set disabled(disabled: boolean) {
        this._disabled = disabled;
        if(this.element) {
            this.renderer.setElementProperty(this.selector.nativeElement, 'disabled', disabled);
        }
    }
    get disabled(): boolean {
        return this._disabled;
    }

    // all additional options
    @Input() options: Select2Options;

    @Input() idProperty: string | undefined;

    @Input() textProperty: string | undefined;

    @Input() idGetter: Function | undefined;

    @Input() textGetter: Function | undefined;

    @Input() public autoSelect = true;

    // emitter when value is changed
    @Output() valueChanged = new EventEmitter<{value: string , data: any}>();

    @Output() valueChange = new EventEmitter<string >();
    @Output() entityChange = new EventEmitter<S2Option | S2Option[]>();

    private element: JQuery = undefined;
    private check: boolean = false;

    constructor(private renderer: Renderer) { }

    ngOnInit() {
        if(this.cssImport) {
            const head = document.getElementsByTagName('head')[0];
            const link: any = head.children[head.children.length-1];

            if(!link.version) {
                const newLink = this.renderer.createElement(head, 'style');
                this.renderer.setElementProperty(newLink, 'type', 'text/css');
                this.renderer.setElementProperty(newLink, 'version', 'select2');
                this.renderer.setElementProperty(newLink, 'innerHTML', this.style);
            }
        }
    }

    ngAfterViewInit() {
        this.element = jQuery(this.selector.nativeElement);
        this.initPlugin();

        if (typeof this.value !== 'undefined') {
            this.setElementValue(this.value);
        }

        this.element.on('select2:select select2:unselect', () => {
            this.value = this.element.val();
        });
    }

    ngOnDestroy() {
        this.element.off("select2:select");
    }

    private emitValue(newValue: string) {
        this.valueChange.emit(newValue);
        this.entityChange.emit(this.entity);
        this.valueChanged.emit({
            value: newValue,
            data: this.element.select2('data')
        });
    }

    private initPlugin() {
        if(!this.element.select2) {
            if(!this.check) {
                this.check = true;
                console.log("Please add Select2 library (js file) to the project. You can download it from https://github.com/select2/select2/tree/master/dist/js.");
            }

            return;
        }

        // If select2 already initialized remove him and remove all tags inside
        if (this.element.hasClass('select2-hidden-accessible') == true) {
            this.element.select2('destroy');
            this.renderer.setElementProperty(this.selector.nativeElement, 'innerHTML', '');
        }

        this.initIdText();
        if ((!this.options || !this.options.placeholder) && !this.autoSelect) {
            this.options = this.options ? this.options : {};
            this.options.placeholder = ' ';
            this.renderer.createElement(this.selector.nativeElement, 'option')
        }

        let options: Select2Options = {
            data: this.data,
            width: (this.width) ? this.width : 'resolve',
        };

        Object.assign(options, this.options);

        if(options.matcher) {
            jQuery.fn.select2.amd.require(['select2/compat/matcher'], (oldMatcher: any) => {
                options.matcher = oldMatcher(options.matcher);
                this.element.select2(options);

                if (typeof this.value !== 'undefined') {
                    this.setElementValue(this.value);
                }
            });
        } else {
            this.element.select2(options);
        }

        if(this.disabled) {
            this.renderer.setElementProperty(this.selector.nativeElement, 'disabled', this.disabled);
        }
    }

    private initIdText() {
        if (this.idProperty) {
            this.data.forEach(prop => prop.id = prop[this.idProperty]);
        }
        if (this.idGetter) {
            this.data.forEach(prop => prop.id = this.idGetter(prop));
        }
        if (this.textProperty) {
            this.data.forEach(prop => prop.text = prop[this.textProperty]);
        }
        if (this.textGetter) {
            this.data.forEach(prop => prop.text = this.textGetter(prop));
        }
    }

    private setElementValue (newValue: string) {
        if(Array.isArray(newValue)) {
            for (let option of this.selector.nativeElement.options) {
                if (newValue.indexOf(option.value) > -1) {
                    this.renderer.setElementProperty(option, 'selected', 'true');
                }
           }
        } else {
            this.renderer.setElementProperty(this.selector.nativeElement, 'value', newValue);
        }

        this.element.trigger('change.select2');
    }

    private style: string = `CSS`;
}
