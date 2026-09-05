import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRecommendation, formatBalance } from './advisor.ts';
test('recommendations require a description, selected rate and bounded decimal quantity',()=>{
 const f=new FormData();f.set('title',' Farm review ');f.set('rate_id','11111111-1111-4111-8111-111111111111');f.set('quantity','2.5');
 assert.deepEqual(parseRecommendation(f),{title:'Farm review',rate_id:'11111111-1111-4111-8111-111111111111',quantity:2.5});
 for(const q of ['0','-1','1.001','10001','NaN','1e3']) {f.set('quantity',q);assert.equal(parseRecommendation(f),null);}
 f.set('quantity','2');f.set('title','');assert.equal(parseRecommendation(f),null);
});
test('balance formatting preserves whole cents beyond JavaScript safe integers',()=>{
 assert.equal(formatBalance('15000'),'€150.00');
 assert.equal(formatBalance('0'),'€0.00');
 assert.equal(formatBalance('9007199254740993'),'€90,071,992,547,409.93');
});
