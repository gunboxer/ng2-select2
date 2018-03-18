import {
    AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy,
    Output, ViewChild, ViewEncapsulation, Renderer
} from '@angular/core';

import {S2Option} from './rselect2.interface';

@Component({
    selector: 'rselect2',
    styles: ["CSS"],
    template: `
        <select #selector>
            <ng-content select="option, optgroup">
            </ng-content>
        </select>`,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RSelect2Component implements AfterViewInit, OnDestroy {
    @ViewChild('selector') selector: ElementRef;

    // data for select2 drop down
    _data: Array<S2Option>;
    @Input() set data(data: Array<S2Option>) {
        if (this._data === data || (data === undefined && this._data === undefined) || (data === null && this._data === null)) {
            return;
        }
        this._data = data;
        if (this.element) {
            this.initPlugin();

            if (this.autoSelect) {
                this.setValueFromElement();
            }
        }
    }

    get data(): Array<S2Option> {
        return this._data;
    }

    // value for select2
    _value: string | string[];
    @Input() set value(value: string | string[]) {
        if (RSelect2Component.isValuesEqual(this._value, value)) {
            return;
        }
        this._value = value;
        if (this.element) {
            this.setElementValue(value);
        }
        if (this.entity && !value) {
            this.entity = null;
        } else {
            if (!RSelect2Component.isValuesEqual(this.getEntityId(this.entity), value)) {
                if (Array.isArray(value)) {
                    let newEntity = [];
                    value.forEach(v => {
                        let e = null;
                        for (const i in this.data) {
                            if (this.getEntityId(this.data[i]) === v) {
                                e = this.data[i];
                                break;
                            }
                        }
                        if (e) {
                            newEntity.push(e);
                        }
                    });
                    this.entity = newEntity;
                } else {
                    for (const i in this.data) {
                        if (this.getEntityId(this.data[i]) === value) {
                            this.entity = this.data[i];
                            break;
                        }
                    }
                }
            }
        }
        this.emitValue(value);
    }

    get value(): string | string[] {
        return this._value;
    }

    _entity: S2Option | S2Option[];
    @Input() set entity(entity: S2Option | S2Option[]) {
        if (RSelect2Component.isValuesEqual(this._entity, entity)) {
            return;
        }
        this._entity = entity;
        if (this.value && !entity) {
            this.value = null;
        } else {
            const entityId = this.getEntityId(entity);
            if (!RSelect2Component.isValuesEqual(this.value, entityId)) {
                this.value = entityId;
            }
        }
    }

    get entity(): S2Option | S2Option[] {
        return this._entity;
    }

    // width of select2 input
    _width: string;
    @Input() set width(width: string) {
        this._width = width;
    }

    get width(): string {
        return this._width
    }

    // enable / disable select2
    _disabled: boolean = false;
    @Input() set disabled(disabled: boolean) {
        this._disabled = disabled;
        if (this.element) {
            this.renderer.setElementProperty(this.selector.nativeElement, 'disabled', disabled);
        }
    }

    get disabled(): boolean {
        return this._disabled;
    }

    // all additional options
    _options: Select2Options;
    @Input() set options(options: Select2Options) {
        this._options = options;
    }

    get options(): Select2Options {
        return this._options
    }

    _idProperty: string | undefined;
    @Input() set idProperty(idProperty: string | undefined) {
        this._idProperty = idProperty;
    }

    get idProperty(): string | undefined {
        return this._idProperty
    }

    _textProperty: string | undefined;
    @Input() set textProperty(textProperty: string | undefined) {
        this._textProperty = textProperty;
    }

    get textProperty(): string | undefined {
        return this._textProperty
    }

    _idGetter: Function | undefined;
    @Input() set idGetter(idGetter: Function | undefined) {
        this._idGetter = idGetter;
    }

    get idGetter(): Function | undefined {
        return this._idGetter
    }

    _textGetter: Function | undefined;
    @Input() set textGetter(textGetter: Function | undefined) {
        this._textGetter = textGetter;
    }

    get textGetter(): Function | undefined {
        return this._textGetter
    }

    _autoSelect = true;
    @Input() set autoSelect(autoSelect: boolean) {
        this._autoSelect = autoSelect;
    }

    get autoSelect(): boolean {
        return this._autoSelect
    }

    // emitter when value is changed
    @Output() valueChanged = new EventEmitter<{ value: string | string[], data: any }>();

    @Output() valueChange = new EventEmitter<string | string[]>();
    @Output() entityChange = new EventEmitter<S2Option | S2Option[]>();

    private element: JQuery = undefined;
    private check: boolean = false;

    constructor(private renderer: Renderer) {
    }

    ngAfterViewInit() {
        this.element = jQuery(this.selector.nativeElement);
        this.initPlugin();

        if (typeof this.value !== 'undefined') {
            this.setElementValue(this.value);
        }

        this.element.on('select2:select select2:unselect', (event: {type: string}) => {
            switch (event.type) {
                case 'select2:select':
                    this.setValueFromElement();
                    break;
                case 'select2:unselect':
                    if (Array.isArray(this.element.val())) {
                        this.setValueFromElement();
                    } else {
                        this.value = null;
                    }
                    break;
            }
        });
        this.element.on('select2:unselecting', () => {
            this.element.data('s2state', 'unselected');
        });
        this.element.on('select2:opening', (e) => {
            if (this.element.data('s2state') === 'unselected') {
                this.element.removeData('s2state');
                e.preventDefault();
            }
        });
    }

    ngOnDestroy() {
        this.element.off("select2:select");
    }

    private setValueFromElement() {
        if (!this.element) {
            return;
        }
        const value = this.element.val();
        if (value) {
            if (Array.isArray(value)) {
                if (!this.entity || !Array.isArray(this.entity) ||
                    this.entity.length !== value.length) {
                    let equal = true;
                    for (let i in this.entity) {
                        if (!this.entity[i] || this.getEntityId(this.entity[i]) !== value[i]) {
                            equal = false;
                            break;
                        }
                    }
                    if (!equal) {
                        this.entity = this.getEntityFromElement(true);
                    }
                }
            } else {
                if (!this.entity || this.getEntityId(this.entity) !== value) {
                    this.entity = this.getEntityFromElement(false);
                }
            }
        } else {
            this.value = null;
        }
    }

    private getEntityFromElement(isArray: boolean): S2Option | S2Option[] {
        const s2entities = this.element.select2('data') as Object[];
        const entities = [];
        if (s2entities) {
            for (let i in s2entities) {
                const s2entity = s2entities[i];
                let found = false;
                if (this.data) {
                    if (isArray) {
                        for (const i in this.data) {
                            if (this.getEntityId(this.data[i]) === s2entity['id']) {
                                entities.push(this.data[i]);
                                found = true;
                            }
                        }
                    } else {
                        for (const i in this.data) {
                            if (this.getEntityId(this.data[i]) === s2entity['id']) {
                                return this.data[i];
                            }
                        }
                    }
                }
                if (!found) {
                    const entity = {};
                    for (let key in s2entity) {
                        if (['element', "_resultId", "selected"].indexOf(key) === -1)
                            entity[key] = s2entity[key];
                    }
                    if (isArray) {
                        entities.push(entity);
                    } else {
                        return entity as S2Option;
                    }
                }
            }
        }
        return null;
    }

    private emitValue(value: string | string[]) {
        if (this.element) {
            this.valueChange.emit(value);
            this.entityChange.emit(this.entity);
            this.valueChanged.emit({
                value: value,
                data: this.element.select2('data')
            });
        }
    }

    private initPlugin() {
        if (!this.element.select2) {
            if (!this.check) {
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

        if (this.data) {
            this.initIdText();
        }

        if (!this.autoSelect) {
            if ((!this.options || !this.options.placeholder)) {
                this.options = this.options ? this.options : {};
                this.options.placeholder = ' ';
            }
            this.renderer.createElement(this.selector.nativeElement, 'option');
        }

        let options: Select2Options = {
            data: this.data,
            width: (this.width) ? this.width : 'resolve',
        };

        Object.assign(options, this.options);

        if (options.matcher) {
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

        if (this.entity && this.value === undefined) {
            this.value = this.getEntityId(this.entity);
        }

        if (this.disabled) {
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

    private getEntityId(entity: S2Option | S2Option[]): string | string[] {
        if (!entity) {
            return null;
        }
        if (Array.isArray(entity)) {
            if (this.idProperty) {
                return entity.map(e => e[this.idProperty]);
            }
            if (this.idGetter) {
                return entity.map(e => this.idGetter(e));
            }
            return entity.map(e => e.id);
        } else {
            if (this.idProperty) {
                return entity[this.idProperty];
            }
            if (this.idGetter) {
                return this.idGetter(entity);
            }
            return entity.id;
        }
    }

    private setElementValue(newValue: string | string[]) {
        if (Array.isArray(newValue)) {
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

    private static isValuesEqual(value1: string | string[] | S2Option | S2Option[], value2: string | string[] | S2Option | S2Option[]): boolean {
        if ((value1 === undefined && value2 === undefined) || (value1 === null && value2 === null)) {
            return true;
        }
        if (!Array.isArray(value1) && !Array.isArray(value2)) {
            return value1 === value2;
        }
        if (Array.isArray(value1) && Array.isArray(value2) && value1.length === value2.length) {
            for (let i in value1) {
                if (value1[i] !== value2[i]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
}
