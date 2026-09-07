import {EXPLANATIONS,SYSTEMS,type SystemId} from './anatomy';
import {laterality} from './tissue';

export interface Fact {
 latin?:string;
 kind:string;
 summary:string;
 function?:string;
 relations?:string;
 source?:string;
}

const K:Record<string,Fact>={
 'skin':{latin:'Integumentum commune',kind:'Integument',summary:'The entire cutaneous covering of the body. In this atlas it is a single whole-body mesh (FMA 7163) derived from the TARO MRI surface, not split by dermatome or region.',function:'Barrier, sensation, thermoregulation, and vitamin D synthesis. Epidermis is avascular; dermis carries vessels, nerves, and appendages.',relations:'Continuous with mucosa at the lips, eyelids, nares, and anogenital orifices. Superficial fascia lies deep to the dermis.',source:'Standring, Gray\'s Anatomy, integument chapter; FMA 7163.'},
 'hair of head':{latin:'Capilli',kind:'Skin appendage',summary:'Terminal scalp hair. Modeled as a surface layer over the calvaria, not as individual follicles.',function:'Mechanical protection and heat conservation of the scalp.',source:'FMA 54241.'},
 'eyebrow':{latin:'Supercilium',kind:'Skin appendage',summary:'Short hairs along the supraorbital ridge. They divert sweat and particulates away from the palpebral fissure.',function:'Protect the globe and contribute to facial expression via frontalis and corrugator supercilii.',source:'FMA 54237.'},
 'lip':{latin:'Labium oris',kind:'Integument',summary:'The muscular-mucosal folds of the oral fissure, with a keratinized cutaneous zone and a vermilion of thin, highly vascular epithelium.',function:'Speech, feeding, and oral seal. Motor supply is facial nerve; sensation is trigeminal.',source:'FMA 59816.'},
 'pubic hair':{latin:'Pubes',kind:'Skin appendage',summary:'Terminal hair of the mons pubis and adjacent skin, an androgen-dependent secondary sexual character.',source:'FMA 54319.'},
 'left cornea':{latin:'Cornea',kind:'Fibrous tunic',summary:'Transparent anterior sixth of the fibrous coat. About 11-12 mm in diameter and 0.5 mm thick centrally. Five layers: epithelium, Bowman, stroma, Descemet, endothelium.',function:'Principal refractive surface of the eye (about two-thirds of total dioptric power). Avascular; nutrition from tears, aqueous, and limbal vessels.',relations:'Continuous with sclera at the limbus. Covers iris and pupil. Innervation: long ciliary nerves (V1).',source:'Remington, Clinical Anatomy and Physiology of the Visual System; FMA 58240.'},
 'right cornea':{latin:'Cornea',kind:'Fibrous tunic',summary:'Transparent anterior sixth of the fibrous coat. About 11-12 mm in diameter and 0.5 mm thick centrally.',function:'Principal refractive surface of the eye. Avascular.',source:'FMA 58239.'},
 'left iris':{latin:'Iris',kind:'Vascular tunic',summary:'Pigmented diaphragm with a central pupil. Stroma contains the sphincter pupillae (parasympathetic, CN III) and dilator pupillae (sympathetic). Color depends on melanin in the stroma and epithelium.',function:'Controls retinal illuminance by changing pupil diameter, typically 2-4 mm in indoor light and up to 8 mm in darkness.',relations:'Anterior to the lens; peripheral root meets the cornea at the iridocorneal angle, where aqueous drains via trabecular meshwork and Schlemm canal.',source:'FMA 58237; NIH NCBI Bookshelf, anatomy of the eye.'},
 'right iris':{latin:'Iris',kind:'Vascular tunic',summary:'Pigmented diaphragm with a central pupil. Sphincter pupillae is parasympathetic (CN III); dilator is sympathetic.',function:'Regulates light entering the eye.',source:'FMA 58236.'},
 'left sclera':{latin:'Sclera',kind:'Fibrous tunic',summary:'Dense collagenous white of the eye, about 0.3-1.0 mm thick. Continuous with the cornea at the limbus and with dura at the optic nerve sheath.',function:'Protects the globe and provides insertion for extraocular muscles.',relations:'Covered by episclera. Posteriorly pierced at the lamina cribrosa by the optic nerve.',source:'FMA 58272; Medscape ocular anatomy.'},
 'right sclera':{latin:'Sclera',kind:'Fibrous tunic',summary:'Dense collagenous coat forming the white of the eye, continuous with the cornea at the limbus.',function:'Mechanical support and extraocular muscle insertion.',source:'FMA 58271.'},
 'left lens':{latin:'Lens crystallina',kind:'Refractive media',summary:'Biconvex, avascular, transparent body suspended by zonular fibers from the ciliary crown. Adult equatorial diameter is about 9-10 mm.',function:'Fine focusing (accommodation) via ciliary muscle. With the cornea it forms a sharp image on the retina.',relations:'Sits in the patellar fossa of the vitreous. Cataract is opacification of this structure.',source:'FMA 58243.'},
 'right lens':{latin:'Lens crystallina',kind:'Refractive media',summary:'Biconvex avascular lens suspended by zonules from the ciliary body.',function:'Accommodation and image formation.',source:'FMA 58242.'},
 'left vitreous body':{latin:'Corpus vitreum',kind:'Refractive media',summary:'Transparent gel filling the posterior segment, about 4 mL, 99% water with collagen and hyaluronan. Adherent at the vitreous base, optic disc, and macula.',function:'Maintains globe shape and optical path. Posterior vitreous detachment is a common age change.',source:'FMA 58829.'},
 'right vitreous body':{latin:'Corpus vitreum',kind:'Refractive media',summary:'Transparent gel of the posterior segment.',function:'Optical medium and structural filler of the globe.',source:'FMA 58828.'},
 'optic part of left retina':{latin:'Pars optica retinae',kind:'Nervous tunic',summary:'Photosensitive inner layer from the ora serrata to the optic disc. Ten histologic layers; rods and cones face the pigment epithelium and choroid.',function:'Phototransduction. Ganglion-cell axons form the optic nerve (CN II) at the disc, a blind spot without photoreceptors.',relations:'Nourished by choroidal and central retinal circulations. Macula lies temporal to the disc.',source:'FMA 58608; Gray\'s Anatomy, visual system.'},
 'optic part of right retina':{latin:'Pars optica retinae',kind:'Nervous tunic',summary:'Photosensitive inner layer of the globe. Photoreceptors overlie retinal pigment epithelium and choroid.',function:'Converts photons to neural signals carried by the optic nerve.',source:'FMA 58607.'},
 'left choroid':{latin:'Choroidea',kind:'Vascular tunic',summary:'Pigmented, highly vascular layer between sclera and retina. The choriocapillaris supplies the outer retina.',function:'Nutrition of photoreceptors and light absorption to reduce scatter.',source:'FMA 58300.'},
 'right choroid':{latin:'Choroidea',kind:'Vascular tunic',summary:'Pigmented vascular coat deep to the sclera, feeding the outer retina.',source:'FMA 58299.'},
 'anterior chamber of left eyeball':{latin:'Camera anterior bulbi',kind:'Aqueous space',summary:'Space between cornea and iris filled with aqueous humor, produced by the ciliary processes and drained at the angle.',function:'Maintains intraocular pressure and nourishes cornea and lens.',source:'FMA 58082.'},
 'anterior chamber of right eyeball':{latin:'Camera anterior bulbi',kind:'Aqueous space',summary:'Space between cornea and iris containing aqueous humor.',source:'FMA 58081.'},
 'external ear':{latin:'Auris externa',kind:'Special sense',summary:'Auricle and external acoustic meatus that collect and funnel sound to the tympanic membrane. Inner-ear ossicles and cochlea are not segmented in BodyParts3D 4.0.',function:'Sound collection and protection of the meatus.',source:'FMA 52781. Coverage note: cochlea, vestibule, and ossicles are absent from this dataset.'},
 'heart':{latin:'Cor',kind:'Muscular organ',summary:'Four-chambered pump in the middle mediastinum. Right heart sends blood to the lungs; left heart to the systemic circuit. Valves (tricuspid, pulmonary, mitral, aortic) enforce one-way flow.',function:'Cardiac output. Intrinsic conduction: SA node, AV node, His bundle, Purkinje fibers.',relations:'Rests on the diaphragm, between the lungs, behind the sternum. Enclosed in pericardium.',source:'Moore, Clinically Oriented Anatomy; FMA 7088.'},
 'liver':{latin:'Hepar',kind:'Gland',summary:'Largest solid abdominal organ, mostly in the right hypochondrium. Dual blood supply: portal vein and hepatic artery. Bile leaves via hepatic ducts to the gallbladder and duodenum.',function:'Metabolism, bile production, plasma protein synthesis, detoxification, and glycogen storage.',relations:'Under the right hemidiaphragm. Porta hepatis transmits portal vein, hepatic artery, and common hepatic duct.',source:'Standring, Gray\'s Anatomy; FMA 7197.'},
 'brain':{latin:'Encephalon',kind:'Nervous organ',summary:'Intracranial CNS: cerebrum, diencephalon, brainstem, and cerebellum. Gyri and white-matter tracts are separately meshed in this atlas.',function:'Perception, movement, language, memory, and autonomic control.',relations:'Enclosed by meninges and CSF in the ventricular system. Cranial nerves I-XII arise from it.',source:'Nieuwenhuys, The Human Central Nervous System; FMA 50801.'},
 'stomach':{latin:'Ventriculus',kind:'Hollow viscus',summary:'J-shaped muscular reservoir between esophagus and duodenum, with cardia, fundus, body, and pylorus.',function:'Stores and churns food, secretes acid and pepsinogen, and meters chyme into the duodenum.',source:'FMA 7148.'},
 'spleen':{latin:'Lien',kind:'Lymphoid organ',summary:'Soft organ in the left hypochondrium, under ribs 9-11. White pulp is lymphoid; red pulp filters blood.',function:'Immune surveillance and removal of senescent erythrocytes. Not essential for life but important in encapsulated-bacteria defense.',source:'FMA 7196.'},
 'pancreas':{latin:'Pancreas',kind:'Gland',summary:'Retroperitoneal gland from duodenum to splenic hilum. Exocrine acini drain to the duodenum; islets secrete insulin and glucagon.',function:'Digestion and glucose homeostasis.',source:'FMA 7198.'},
 'left kidney':{latin:'Ren sinister',kind:'Solid viscus',summary:'Bean-shaped retroperitoneal organ at about T12-L3. Cortex, medulla, and pelvis. The left kidney sits slightly higher than the right.',function:'Filters plasma, regulates volume, electrolytes, acid-base, and blood pressure (renin).',relations:'Adrenal gland sits on the superior pole. Ureter leaves the hilum.',source:'FMA 7205.'},
 'right kidney':{latin:'Ren dexter',kind:'Solid viscus',summary:'Right retroperitoneal kidney, a little lower than the left because of the liver.',function:'Filtration and homeostasis of extracellular fluid.',source:'FMA 7204.'},
 'urinary bladder':{latin:'Vesica urinaria',kind:'Hollow viscus',summary:'Muscular reservoir in the pelvis. Ureters enter the trigone; urethra leaves at the neck.',function:'Stores urine and voids under detrusor contraction with sphincter relaxation.',source:'FMA 15900.'},
 'trachea':{latin:'Trachea',kind:'Airway',summary:'Fibrocartilaginous tube from cricoid to the sternal angle, where it bifurcates into main bronchi. C-shaped cartilages keep it patent.',function:'Conducts air. Mucociliary clearance traps particles.',source:'FMA 6869.'},
 'diaphragm':{latin:'Diaphragma',kind:'Skeletal muscle',summary:'Dome-shaped partition between thorax and abdomen. Central tendon with crura on the lumbar vertebrae. Openings for IVC (T8), esophagus (T10), and aorta (T12).',function:'Primary muscle of inspiration. Phrenic nerves (C3-C5).',source:'FMA 13295.'},
 'left lung':{latin:'Pulmo sinister',kind:'Respiratory organ',summary:'Two lobes (upper, lower) separated by the oblique fissure. In this dataset the lung is represented by its bronchial tree, not by a separate parenchymal shell.',function:'Gas exchange. Pulmonary arteries bring deoxygenated blood; pulmonary veins return oxygenated blood.',source:'FMA 7310. Coverage note: BodyParts3D 4.0 models airways, not alveolar parenchyma.'},
 'right lung':{latin:'Pulmo dexter',kind:'Respiratory organ',summary:'Three lobes (upper, middle, lower). Represented here by segmental bronchi.',function:'Gas exchange. More vertical main bronchus, so inhaled objects more often enter the right lung.',source:'FMA 7309. Coverage note: parenchyma is not a separate mesh.'},
 'aorta':{latin:'Aorta',kind:'Elastic artery',summary:'The systemic arterial trunk: ascending aorta, arch, descending thoracic, and abdominal segments ending at the common iliac bifurcation.',function:'Distributes left-ventricular output. Elastic recoil maintains diastolic pressure.',source:'FMA 3734.'},
 'esophagus':{latin:'Oesophagus',kind:'Hollow viscus',summary:'Muscular tube from pharynx to cardia, with cervical, thoracic, and abdominal parts. Upper sphincter is striated; lower is smooth with a physiologic sphincter.',function:'Transports the bolus by peristalsis.',source:'FMA 7131.'},
 'gallbladder':{latin:'Vesica biliaris',kind:'Hollow viscus',summary:'Pear-shaped sac on the visceral liver surface. Stores and concentrates bile, then ejects it via the cystic duct.',function:'Bile reservoir for fat digestion.',source:'FMA 7202.'},
 'prostate':{latin:'Prostata',kind:'Gland',summary:'Walnut-sized gland around the proximal male urethra, inferior to the bladder. Zones: peripheral, central, transition, anterior fibromuscular.',function:'Contributes proteolytic fluid to semen. Palpable rectally.',source:'FMA 9600.'},
 'left femur':{latin:'Femur sinistrum',kind:'Long bone',summary:'Thigh bone: head, neck, greater and lesser trochanters, shaft, and distal condyles. Longest bone of the body.',function:'Transmits body weight from hip to knee; muscle lever.',source:'FMA 24475.'},
 'right femur':{latin:'Femur dextrum',kind:'Long bone',summary:'Right thigh bone from hip to knee.',source:'FMA 24474.'},
 'skull':{latin:'Cranium',kind:'Bone',summary:'Neurocranium plus viscerocranium. Protects the brain and houses special-sense organs.',source:'FMA 46565.'},
 'spinal cord':{latin:'Medulla spinalis',kind:'Nervous organ',summary:'CNS inside the vertebral canal, from foramen magnum to about L1-L2, then cauda equina. Cervical and lumbar enlargements serve the limbs.',function:'Ascending sensory and descending motor tracts; segmental reflexes.',source:'FMA 7647.'},
 'cerebellum':{latin:'Cerebellum',kind:'Nervous organ',summary:'Dorsal to the brainstem, two hemispheres and a vermis, cortex over white matter with deep nuclei.',function:'Coordination, posture, and motor learning.',source:'FMA 67944.'},
 'pituitary gland':{latin:'Hypophysis',kind:'Endocrine organ',summary:'Pea-sized gland in the sella turcica, with anterior (adenohypophysis) and posterior (neurohypophysis) lobes.',function:'Master endocrine control: ACTH, TSH, GH, FSH, LH, prolactin; ADH and oxytocin from the posterior lobe.',source:'FMA 13889.'},
 'pineal body':{latin:'Glandula pinealis',kind:'Endocrine organ',summary:'Midline epithalamic structure that secretes melatonin and tracks photoperiod.',source:'FMA 62033.'},
 'left adrenal gland':{latin:'Glandula suprarenalis sinistra',kind:'Endocrine organ',summary:'On the left kidney. Cortex makes aldosterone, cortisol, and androgens; medulla makes catecholamines.',source:'FMA 15630.'},
 'right adrenal gland':{latin:'Glandula suprarenalis dextra',kind:'Endocrine organ',summary:'On the right kidney, pyramidal, related to the IVC and liver.',source:'FMA 15629.'},
 'left testis':{latin:'Testis sinister',kind:'Gonad',summary:'Left gonad in the scrotum. Seminiferous tubules produce sperm; Leydig cells produce testosterone.',source:'FMA 7212.'},
 'right testis':{latin:'Testis dexter',kind:'Gonad',summary:'Right gonad in the scrotum.',source:'FMA 7211.'},
 'left lobe of thymus':{latin:'Thymus',kind:'Lymphoid organ',summary:'Left lobe of the anterior mediastinal lymphoid organ. In adults it is largely involuted to fat but remains identifiable.',function:'T-cell maturation in childhood.',source:'FMA 71195.'},
 'right lobe of thymus':{latin:'Thymus',kind:'Lymphoid organ',summary:'Right lobe of the thymus in the superior/anterior mediastinum.',source:'FMA 71194.'},
 'tongue':{latin:'Lingua',kind:'Muscular organ',summary:'Muscular organ of the floor of the mouth. Extrinsic muscles alter position; intrinsic muscles alter shape. Taste buds on papillae.',function:'Taste, speech, and bolus formation. Motor: hypoglossal nerve except palatoglossus (vagus).',source:'FMA 54640.'},
 'appendix':{latin:'Appendix vermiformis',kind:'Hollow viscus',summary:'Blind diverticulum of the cecum containing lymphoid tissue. Position is variable (retrocecal, pelvic).',source:'FMA 14542.'},
 'left eye':{latin:'Oculus sinister',kind:'Special sense',summary:'Left globe in the orbit. Wall: sclera-cornea, uvea (iris, ciliary body, choroid), retina. Contents: aqueous, lens, vitreous.',function:'Vision. Extraocular muscles move the globe; lacrimal gland and drainage protect the surface.',source:'FMA 54441. BodyParts3D 4.0 includes internal coats and appendages of the eyeball.'},
 'right eye':{latin:'Oculus dexter',kind:'Special sense',summary:'Right globe in the orbit, with the same coats and refractive media as the left.',source:'FMA 54440.'},
};

export const COVERAGE=[
 'Thyroid and parathyroid glands are not segmented. Thyroid cartilage, thyrohyoid muscles, and inferior thyroid arteries are present.',
 'Lymph nodes are not modeled. Lymphoid organs in this atlas are spleen and thymus.',
 'Lung parenchyma is not a separate shell. The respiratory system is the bronchial tree, trachea, and nasal cartilages.',
 'Inner ear (cochlea, vestibule, ossicles) is absent. The external ear is present.',
 'Most spinal nerves and plexuses are absent. Orbital and selected cranial nerves are present.',
 'Latissimus dorsi and the inguinal ligament are not segmented, so the posterior axillary fold and femoral triangle are incomplete.',
 'This is an adult male TARO MRI reference, not a universal human or a surgical atlas.',
];

export function factFor(name:string,system:SystemId):Fact&{side:string}{
 const n=name.toLowerCase();
 const side=laterality(name);
 if(K[n])return {...K[n],side};
 const stripped=n.replace(/^(left|right)\s+/,'').replace(/\s+of\s+(left|right)\s+/g,' of ');
 if(K[stripped])return {...K[stripped],side};
 if(n.includes('iris'))return {...K['left iris'],side};
 if(n.includes('cornea'))return {...K['left cornea'],side};
 if(n.includes('sclera'))return {...K['left sclera'],side};
 if(n.includes('retina'))return {...K['optic part of left retina'],side};
 if(n.includes('vitreous'))return {...K['left vitreous body'],side};
 if(n.includes('lens')&&!n.includes('ligament'))return {...K['left lens'],side};
 const explained=EXPLANATIONS[n]??EXPLANATIONS[stripped];
 const sys=SYSTEMS.find(s=>s.id===system);
 return {kind:sys?.name??'Anatomical part',summary:explained??sys?.description??'Named structure from BodyParts3D, mapped to an FMA concept.',side,source:'BodyParts3D 4.0 / FMA.'};
}
