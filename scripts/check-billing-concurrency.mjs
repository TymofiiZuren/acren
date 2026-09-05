// Local-only integration check. Each worker opens an independent SQL session.
// Fixtures use a fresh owner and cleanup never touches other accounts.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';

const owner = randomUUID(), client = randomUUID(), rate = randomUUID();
const jobs = Array.from({length: 4}, () => randomUUID());
const invoices = jobs.map(() => randomUUID());
function sql(input) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', ['exec', '-i', 'supabase_db_acren', 'psql', '-U', 'postgres', '-d', 'postgres', '-Atq', '-v', 'ON_ERROR_STOP=1']);
    let output = '';
    child.stdout.on('data', value => { output += value; });
    child.stderr.resume();
    child.on('error', () => reject(new Error('Local database worker could not start.')));
    child.on('close', code => code === 0 ? resolve(output.trim()) : reject(new Error('Local database assertion failed.')));
    child.stdin.end(`set statement_timeout='15s';\n${input}`);
  });
}
const session = `set role authenticated; set request.jwt.claim.sub='${owner}';`;
const issue = id => sql(`${session} select public.transition_invoice('${id}','issue',null);`);
try {
  await sql(`begin;
    insert into auth.users(id,email) values ('${owner}','${owner}@example.test');
    ${session}
    insert into public.billing_profiles(business_name,business_address,vat_registered) values ('Concurrency fixture','Fictional address',false);
    insert into public.clients(id,name,herd_number,county,phone,email) values ('${client}','Concurrency fixture','DEMO-CONCURRENT','Cork','0000000000','fixture@example.test');
    insert into public.rates(id,name,unit,price_cents) values ('${rate}','Fixture service','fixed',15000);
    ${jobs.map(id=>`insert into public.jobs(id,client_id,title) values ('${id}','${client}','Fixture work');`).join('\n')}
    update public.jobs set status='in_progress'; update public.jobs set status='completed';
    ${jobs.map((id,i)=>`select public.create_invoice_draft('${invoices[i]}','${id}','${rate}',1,'Fixture address',current_date,current_date+30,null);`).join('\n')}
    commit;`);
  const replay = await Promise.allSettled(Array.from({length:8},()=>issue(invoices[0])));
  assert.ok(replay.every(r=>r.status==='fulfilled'), 'Concurrent issue retries must all succeed');
  const independent = await Promise.allSettled(invoices.slice(1).map(issue));
  assert.ok(independent.every(r=>r.status==='fulfilled'), 'Concurrent different invoices must all succeed');
  const numbers = await sql(`${session} select string_agg(invoice_number::text,',' order by invoice_number) from public.invoices;`);
  assert.equal(numbers,'1,2,3,4');
  assert.equal(await sql(`${session} select count(*) from public.invoice_events where action='issued';`),'4');
  console.log('PASS: 8 simultaneous retries issue once; 4 invoices have unique consecutive numbers and 4 issue events.');
} catch (error) {
  console.error(error instanceof assert.AssertionError ? error.message : 'Billing concurrency check failed; inspect the local database setup.');
  process.exitCode = 1;
} finally {
  try {
    await sql(`begin;
      delete from public.invoice_events where consultant_id='${owner}';
      delete from public.invoices where consultant_id='${owner}';
      delete from public.invoice_counters where consultant_id='${owner}';
      delete from public.jobs where consultant_id='${owner}';
      delete from public.rate_events where consultant_id='${owner}';
      delete from public.rates where consultant_id='${owner}';
      delete from public.billing_profiles where consultant_id='${owner}';
      delete from public.clients where consultant_id='${owner}';
      delete from auth.users where id='${owner}';
      commit;`);
    console.log('Temporary fixture account and records removed; existing accounts untouched.');
  } catch {
    console.error('Fixture cleanup failed. Local fixture owner requiring cleanup: '+owner);
    process.exitCode = 1;
  }
}
