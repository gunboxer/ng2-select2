import { writeFileSync, readFileSync } from 'fs';

let lib = readFileSync('lib/rselect2.component.ts').toString();
writeFileSync('lib/rselect2.component.ts.bak', lib);

const styles = readFileSync('lib/rselect2.component.css');
lib = lib.replace(/CSS/, `${styles}`);

writeFileSync('lib/rselect2.component.ts', lib);