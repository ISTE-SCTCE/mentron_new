// Only subscribe to tables already in the backend's Realtime publication.
// Other collections revalidate on resume, reconnect, and the visible-tab timer.
export function startWorkspaceSync(client,userId,changed,timers={setTimeout:(...args)=>setTimeout(...args),clearTimeout:value=>clearTimeout(value)}){
 let stopped=false;let timer;
 const invalidate=()=>{if(stopped)return;timers.clearTimeout(timer);timer=timers.setTimeout(()=>{if(!stopped)changed();},250);};
 let channel=client.channel(`mentronplus-workspace-${userId}`);
 for(const [schema,table,filter] of [
  ['mentron','notes'],['mentron','projects'],['public','events'],
  ['mentron','notifications',`user_id=eq.${userId}`],
  ['public','session_attendance',`profile_id=eq.${userId}`],
 ])channel=channel.on('postgres_changes',{event:'*',schema,table,...(filter?{filter}:{})},invalidate);
 channel.subscribe(status=>{if(status==='SUBSCRIBED')invalidate();});
 return()=>{stopped=true;timers.clearTimeout(timer);client.removeChannel(channel);};
}
