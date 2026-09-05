import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBillingProfile, parseInvoiceDraft, invoiceNumber } from './billing.ts';
const form = (values: Record<string,string>) => { const f=new FormData(); for(const [k,v] of Object.entries(values)) f.set(k,v); return f; };
test('billing setup requires explicit VAT status and registered business details',()=>{
  assert.equal(parseBillingProfile(form({business_name:'Demo practice',business_address:'Demo address',vat_status:'not_registered'})).ok,true);
  const invalid: Record<string,string>[] = [{vat_status:''},{vat_status:'registered',vat_number:''},{business_name:''}];
  for(const extra of invalid) {
    assert.equal(parseBillingProfile(form({business_name:'Demo',business_address:'Demo address',vat_status:'not_registered',...extra})).ok,false);
  }
});
test('draft inputs keep exact decimal quantities and explicit tax rates',()=>{
  const valid={job_id:'11111111-1111-4111-8111-111111111111',rate_id:'22222222-2222-4222-8222-222222222222',quantity:'1.25',customer_address:'Demo address',supply_date:'2026-09-04',due_date:'2026-10-04',vat_percent:'23'};
  const result=parseInvoiceDraft(form(valid));
  assert.equal(result.ok,true);
  if(result.ok) { assert.equal(result.values.quantity,1.25); assert.equal(result.values.vat_basis_points,2300); }
  for(const extra of [{quantity:'0'},{quantity:'1.001'},{quantity:'1e2'},{vat_percent:'23.001'},{vat_percent:'101'},{supply_date:'2026-02-30'},{customer_address:''},{job_id:'bad'}]) assert.equal(parseInvoiceDraft(form({...valid,...extra})).ok,false);
  assert.equal(invoiceNumber(null),'Draft');
  assert.equal(invoiceNumber(12),'INV-000012');
});
