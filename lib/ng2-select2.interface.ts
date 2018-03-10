export interface S2Option extends Select2SelectionObject {
    children?: Array<S2Option>;
    fixed: boolean;
}

export interface Select2TemplateFunction {
    (state: S2Option): JQuery | string;
}
