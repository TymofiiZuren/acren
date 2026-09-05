"use server";
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {requireSession} from '@/lib/require-session';
import {parseRecommendation} from '@/lib/advisor';
import {billingUuid} from '@/lib/billing';
export type RecommendationState={error?:string};
export async function recommendWork(clientId:string,requestId:string,_:RecommendationState,form:FormData):Promise<RecommendationState> {
  const {supabase}=await requireSession();
  const values=parseRecommendation(form);
  if(!billingUuid.test(clientId)||!billingUuid.test(requestId)||!values) return {error:'Enter a work description, choose a rate and enter a quantity from 0.01 to 10,000 with at most two decimal places.'};
  const {error}=await supabase.rpc('recommend_work',{p_id:requestId,p_client_id:clientId,p_title:values.title,p_rate_id:values.rate_id,p_quantity:values.quantity});
  if(error) return {error:'Recommendation not saved. Check that the client and rate are active. Per-job rates require quantity 1. Refresh to see whether an earlier attempt succeeded.'};
  revalidatePath(`/clients/${clientId}`);revalidatePath('/jobs');
  redirect(`/clients/${clientId}?notice=recommended#jobs`);
}
