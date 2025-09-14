import { LolStatusContentDTO } from '../../src/models-dto/status/status-v4';

export function hasSamePropertyNames(obj: any, ref: any): boolean {
  if (typeof ref !== 'object' || ref === null) return true;
  if (typeof obj !== 'object' || obj === null) return false;

  return Object.keys(ref).every(key => Object.keys(obj).includes(key) && hasSamePropertyNames(obj[key], ref[key]));
}

const ref = new LolStatusContentDTO();
ref.content="";
ref.locale="";

const obj = {
  locale: "",
  content: "",
  another: "",
};

if (!hasSamePropertyNames(obj, ref)) {
  throw "Identical structures should return true.";
}

if (hasSamePropertyNames({}, ref)) {
  throw "Different structures should return false.";
}
