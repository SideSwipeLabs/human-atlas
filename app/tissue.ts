import type {Part} from './anatomy';

export type TissueId =
 | 'skin'|'hair'|'eyebrow'|'lip'|'pubicHair'|'eyelid'
 | 'cornea'|'iris'|'sclera'|'lens'|'vitreous'|'retina'|'choroid'|'aqueous'|'lacrimal'|'csf'
 | 'ear'|'cartilage'|'default';

const exact:Record<string,TissueId>={
 'skin':'skin',
 'hair of head':'hair',
 'eyebrow':'eyebrow',
 'lip':'lip',
 'pubic hair':'pubicHair',
 'left cornea':'cornea','right cornea':'cornea',
 'left iris':'iris','right iris':'iris',
 'left sclera':'sclera','right sclera':'sclera',
 'left lens':'lens','right lens':'lens',
 'left vitreous body':'vitreous','right vitreous body':'vitreous',
 'optic part of left retina':'retina','optic part of right retina':'retina',
 'anterior chamber of left eyeball':'aqueous','anterior chamber of right eyeball':'aqueous',
 'external ear':'ear',
};

export function tissueOf(part:Part):TissueId{
 const n=part.name.toLowerCase();
 if(exact[n])return exact[n];
 if(n.includes('tarsal plate'))return 'eyelid';
 if(/^(third ventricle|fourth ventricle|left lateral ventricle|right lateral ventricle|interventricular foramen)$/.test(n)||n.includes('cerebral aqueduct'))return 'csf';
 if(n.includes('choroid')&&!n.includes('plexus')&&!n.includes('artery'))return 'choroid';
 if(n.includes('lacrimal'))return 'lacrimal';
 if(n.includes('cartilage'))return 'cartilage';
 return 'default';
}

export function uniqueMesh(tissue:TissueId){
 return tissue!=='default';
}

export function isCovering(tissue:TissueId){
 return tissue==='skin'||tissue==='hair'||tissue==='pubicHair'||tissue==='eyebrow'||tissue==='lip';
}

export function laterality(name:string){
 const n=name.toLowerCase();
 if(n.startsWith('left ')||n.includes(' of left '))return 'Left';
 if(n.startsWith('right ')||n.includes(' of right '))return 'Right';
 return 'Unpaired';
}
