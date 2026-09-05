export type WorkRecommendation = {
  job_id:string; consultant_id:string; rate_id:string; rate_name:string;
  unit:'fixed'|'hour'|'unit'; price_cents:number; quantity:number; estimate_cents:number; created_at:string;
};
export type ClientWorkBalance = {owed_cents:string;overdue_cents:string;estimated_cents:string;open_jobs:string;completed_jobs:string};

export function parseRecommendation(form:FormData) {
  const read=(key:string)=>typeof form.get(key)==='string'?(form.get(key) as string).trim():'';
  const title=read('title'),rate_id=read('rate_id'),quantity=read('quantity');
  if(!title||title.length>120||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rate_id)||!/^\d{1,5}(\.\d{1,2})?$/.test(quantity)||Number(quantity)<=0||Number(quantity)>10000) return null;
  return {title,rate_id,quantity:Number(quantity)};
}
export function formatBalance(cents:string) {
  const value=BigInt(cents);
  const hundred=BigInt(100);
  return `€${new Intl.NumberFormat('en-IE').format(value/hundred)}.${(value%hundred).toString().padStart(2,'0')}`;
}
