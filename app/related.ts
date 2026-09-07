import type {Atlas,Concept} from './anatomy';

export function buildConceptIndex(atlas:Atlas){
 const byPart=new Map<string,Concept[]>();
 for(const concept of atlas.concepts){
  if(concept.elements.length>120)continue;
  for(const id of concept.elements){
   const list=byPart.get(id);
   if(list)list.push(concept);
   else byPart.set(id,[concept]);
  }
 }
 return byPart;
}

/** Named concepts that contain every selected piece, smallest first. */
export function relatedConcepts(index:Map<string,Concept[]>,selected:string[],currentId?:string){
 if(!selected.length)return [] as Concept[];
 const counts=new Map<Concept,number>();
 for(const id of selected){
  for(const concept of index.get(id)??[]){
   if(concept.id===currentId)continue;
   counts.set(concept,(counts.get(concept)??0)+1);
  }
 }
 return [...counts.entries()]
  .filter(([concept,n])=>n===selected.length&&concept.elements.length>=selected.length)
  .map(([concept])=>concept)
  .sort((a,b)=>a.elements.length-b.elements.length||a.name.localeCompare(b.name))
  .slice(0,8);
}
