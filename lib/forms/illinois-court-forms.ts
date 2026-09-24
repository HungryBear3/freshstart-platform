/** Evidence-bound form catalog. Presence here is never release authority. */
import { UNVERIFIED_CATALOG_VALUE, type FormCategory } from "@/lib/forms/court-forms-presentation"

export type FormAuthority = "illinois_supreme_court" | "federal_acf" | "freshstart_template" | "county_or_non_statewide" | "unverified_identity"
export type AutomationStatus = "artifact_and_mapping_review_required" | "unmapped" | "unsupported" | "separately_guarded"
/**
 * Whether a source class may enter an AUTOMATICALLY composed packet.
 *
 * Deliberately separate from `mayCarryOfficialArtifact`. That flag answers a
 * provenance question — "may a row of this class name an official PDF?" — and
 * answering the distribution question with it gets the county case backwards:
 * a county artifact carries no statewide official URL, yet it is precisely the
 * thing a packet for THAT county may need, and precisely the thing that must
 * never appear in another county's packet. So the county class carries its own
 * value, and composition has to supply a county context to satisfy it.
 */
export type AutoPacketComposability = "composable" | "requires_county_context" | "never_composable"
/**
 * The five source classes, kept distinct on purpose.
 *
 * `county_or_non_statewide` asserts that some county or other body actually
 * issues the artifact. `unverified_identity` asserts the opposite kind of thing:
 * we hold a local name and found NO corroborating official artifact for it.
 * Collapsing the two would turn an absence of evidence into a source claim, so
 * a row may only sit in the county class on affirmative county evidence.
 *
 * `freshstart_template` is a third, separate statement again: authorship is
 * KNOWN and it is ours. It is withheld from packets because a template we wrote
 * is not an official court form — not because we failed to corroborate it.
 */
export const FORM_AUTHORITY_CLASSES: Record<FormAuthority, { description: string; mayCarryOfficialArtifact: boolean; autoPacketComposability: AutoPacketComposability }> = {
  illinois_supreme_court: { description: "Statewide Illinois Courts standardized (ATJ) form, bound to an exact retrieved PDF.", mayCarryOfficialArtifact: true, autoPacketComposability: "composable" },
  federal_acf: { description: "Federal ACF/OMB form. Separately guarded; artifact currentness is not distribution authority.", mayCarryOfficialArtifact: true, autoPacketComposability: "composable" },
  county_or_non_statewide: { description: "Artifact affirmatively evidenced as issued by a county or other non-statewide body.", mayCarryOfficialArtifact: false, autoPacketComposability: "requires_county_context" },
  freshstart_template: { description: "Authored by FreshStart. Never presented as an official court form.", mayCarryOfficialArtifact: false, autoPacketComposability: "never_composable" },
  unverified_identity: { description: "A local name with no corroborated official artifact. Not a source claim of any kind.", mayCarryOfficialArtifact: false, autoPacketComposability: "never_composable" },
}
// `UNVERIFIED_CATALOG_VALUE`, `formatCatalogLastUpdated`, `FORM_CATEGORIES` and
// `FormCategory` now live in the client-safe leaf `court-forms-presentation.ts`
// and are re-exported here so every existing importer of this module is
// unchanged. A CLIENT component must import them from the leaf directly: any
// value import from THIS file drags `ILLINOIS_COURT_FORMS` into the browser
// bundle, because the rows are built by top-level `il()`/`unsupported()` calls
// that no bundler can shake out. See the leaf module's header.
export {
  UNVERIFIED_CATALOG_VALUE,
  formatCatalogLastUpdated,
  FORM_CATEGORIES,
} from "@/lib/forms/court-forms-presentation"
export type { FormCategory } from "@/lib/forms/court-forms-presentation"
export interface ArtifactProvenance { printedCode: string; printedRevision: string; retrievedAt: string; contentType: "application/pdf"; bytes: number; sha256: string }
export interface CourtForm {
  id: string; name: string; description: string; category: FormCategory; filename: string
  officialUrl: string | null
  /** `UNVERIFIED_CATALOG_VALUE`, or the printed code and revision. */
  version: string
  /** `UNVERIFIED_CATALOG_VALUE`, or a date at the precision the artifact states. */
  lastUpdated: string
  authority: FormAuthority
  automationStatus: AutomationStatus; provenance?: ArtifactProvenance
  /** Required for `county_or_non_statewide` rows; meaningless for any other class. */
  issuingCountyId?: string
  requiredFor: ("with_children" | "no_children" | "both")[]; instructions?: string; relatedQuestionnaires: string[]
}
const B="https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources", R="2026-09-14"
type V=Omit<CourtForm,"authority"|"automationStatus"|"provenance"|"version"|"lastUpdated">&{code:string;revision:string;bytes:number;sha256:string;automationStatus?:"artifact_and_mapping_review_required"|"unmapped"}
// `lastUpdated` keeps the artifact's own precision: a printed revision of
// "03/25" states a month, so the catalog states a month. Expanding it to
// "2025-03-01" invented a day no artifact ever printed, and that invented day
// then travelled into the manifest and the UI as if it had been observed.
function il(x:V):CourtForm { const {code,revision,bytes,sha256,automationStatus,...f}=x; return {...f,authority:"illinois_supreme_court",automationStatus:automationStatus??"artifact_and_mapping_review_required",version:`${code} (${revision})`,lastUpdated:`20${revision.slice(3)}-${revision.slice(0,2)}`,provenance:{printedCode:code,printedRevision:revision,retrievedAt:R,contentType:"application/pdf",bytes,sha256}} }
type U=Omit<CourtForm,"officialUrl"|"version"|"lastUpdated"|"automationStatus">&{authority:"freshstart_template"|"county_or_non_statewide"|"unverified_identity"}
// An uncorroborated row gets the sentinel for BOTH fields. It previously carried
// the reconciliation date in `lastUpdated`, which read as an artifact date for an
// artifact that was never found.
function unsupported(x:U):CourtForm{return {...x,officialUrl:null,version:UNVERIFIED_CATALOG_VALUE,lastUpdated:UNVERIFIED_CATALOG_VALUE,automationStatus:"unsupported"}}
const q={basic:["basic-information"],financial:["financial-information"],assets:["assets-debts"]}
export const ILLINOIS_COURT_FORMS:CourtForm[]=[
 il({id:"petition-no-children",name:"Petition for Divorce",description:"Statewide petition without minor children.",category:"petition",filename:"petition-dissolution-no-children.pdf",officialUrl:`${B}/f41da79e-f087-483e-9dd8-d71d2739d231/DNC%20Petition.pdf`,code:"ATJ 103.4",revision:"03/25",bytes:1245011,sha256:"46a08e8fb11ad258dc97f08d32d9a8a5ec1a94054755e0e6f703528792576a4d",requiredFor:["no_children"],relatedQuestionnaires:[...q.basic,"marriage-details"]}),
 il({id:"petition-with-children",name:"Petition for Divorce with Children",description:"Statewide petition with minor children.",category:"petition",filename:"petition-dissolution-with-children.pdf",officialUrl:`${B}/29fc2ee4-ddda-47f4-af12-f3f4d38f6a70/DWC%20Petition.pdf`,code:"ATJ 105.3",revision:"03/25",bytes:1257293,sha256:"730927bbbe825ee2fc65287ece4776a9d61826a957dbcea67de8a0e1c89faa76",requiredFor:["with_children"],relatedQuestionnaires:[...q.basic,"marriage-details","children-information"]}),
 il({id:"summons",name:"Summons (Divorce)",description:"Statewide divorce summons.",category:"petition",filename:"summons-dissolution.pdf",officialUrl:`${B}/2b052cc8-5066-4ffb-a678-e17edd400ef6/DIV%20Summons.pdf`,code:"ATJ 113.8",revision:"03/25",bytes:1006581,sha256:"a5ab81435b670cb5873f1554eaca7ca7dfb7460a471e26e93d73a662db588d99",requiredFor:["both"],relatedQuestionnaires:q.basic}),
 il({id:"appearance",name:"Appearance (Divorce)",description:"Statewide appearance and military notice.",category:"petition",filename:"appearance.pdf",officialUrl:`${B}/ea73b648-a088-4ca8-81cd-b8bc00c7da37/DIV%20Divorce%20Entry%20of%20Appearance%20Military%20Notice.pdf`,code:"ATJ 111.5",revision:"03/25",bytes:871630,sha256:"d85df304f4fa41d45c1e2abc629683f1bad141670ec316092c9983dd146b8924",requiredFor:["both"],relatedQuestionnaires:[]}),
 il({id:"financial-affidavit",name:"Financial Affidavit",description:"Statewide financial affidavit that may be required in some family and divorce cases.",category:"financial",filename:"financial-affidavit.pdf",officialUrl:`${B}/2cb2c0ce-20f8-4eb5-9d23-05664d7f4404/FA%20Financial%20Affidavit.pdf`,code:"ATJ 251.5",revision:"06/25",bytes:1268882,sha256:"210d2994672764d877d14e8a2e34214f40f26b72c833f57f870792de87105d49",requiredFor:["both"],relatedQuestionnaires:[...q.financial,"income-employment",...q.assets]}),
 // ATJ 253.1 and ATJ 254.3 continue the child-support and health-insurance
 // sections of the Financial Affidavit. `both` put them in every no-children
 // packet; the remaining five continuations are genuinely case-type neutral.
 il({id:"financial-additional-child-support",name:"Additional My Child Support",description:"Financial Affidavit continuation page only.",category:"financial",filename:"financial-additional-child-support.pdf",officialUrl:`${B}/7b643e9a-9cfd-471f-9c4d-27f688282832/FA%20Additional%20Child%20Support.pdf`,code:"ATJ 253.1",revision:"06/25",bytes:850689,sha256:"284f19b45263551a2c77e026497f0af199df61bcf98f9c2862fd59d6bdf24172",automationStatus:"unmapped",requiredFor:["with_children"],relatedQuestionnaires:q.financial}),
 il({id:"financial-additional-health-insurance",name:"Additional Health Insurance",description:"Financial Affidavit continuation page only.",category:"financial",filename:"financial-additional-health-insurance.pdf",officialUrl:`${B}/f49ad4ac-75d1-4349-8ae2-f19758626a82/FA%20Additional%20Health%20Insurance.pdf`,code:"ATJ 254.3",revision:"06/25",bytes:802482,sha256:"692858aeedfc647b3944f476c006ecc67a4d2c36036fd0ee97b1bd7dffa63bca",automationStatus:"unmapped",requiredFor:["with_children"],relatedQuestionnaires:q.financial}),
 il({id:"financial-additional-debts",name:"Additional My Debts",description:"Financial Affidavit continuation page only.",category:"financial",filename:"financial-additional-debts.pdf",officialUrl:`${B}/91a6366b-69e5-47fe-b2a5-5d7bb17ff879/FA%20Additional%20My%20Debts.pdf`,code:"ATJ 255.3",revision:"06/25",bytes:800987,sha256:"7b96c3ad6e8540ec053cbe678fcabdfa3ed662c6b715dde1a72665b1eea51983",automationStatus:"unmapped",requiredFor:["both"],relatedQuestionnaires:q.assets}),
 il({id:"financial-additional-cash",name:"Additional Cash and Cash Equivalents",description:"Financial Affidavit continuation page only.",category:"financial",filename:"financial-additional-cash.pdf",officialUrl:`${B}/f1b093cd-5997-40a9-af81-6bcb0c332005/FA%20Additional%20Cash%20and%20Cash%20Equivalents.pdf`,code:"ATJ 256.3",revision:"06/25",bytes:815733,sha256:"b075551375ff2287f5302d65c421f1fbf8f0a9f6df5eabc61796080bddc18e1c",automationStatus:"unmapped",requiredFor:["both"],relatedQuestionnaires:q.assets}),
 il({id:"financial-additional-investments",name:"Additional Investment Accounts and Securities",description:"Financial Affidavit continuation page only.",category:"financial",filename:"financial-additional-investments.pdf",officialUrl:`${B}/be5344c5-6ad0-465a-95e7-b3d7483d6bfc/FA%20Additional%20Investment%20Accounts%20and%20Securities.pdf`,code:"ATJ 257.3",revision:"06/25",bytes:789418,sha256:"c094fc28409f2a9798656fb829e12b541d029fef276497f7a072587b7044ad0d",automationStatus:"unmapped",requiredFor:["both"],relatedQuestionnaires:q.assets}),
 il({id:"financial-additional-business-interests",name:"Additional Property and Business Interests",description:"Financial Affidavit continuation page only.",category:"financial",filename:"financial-additional-business-interests.pdf",officialUrl:`${B}/180bcc84-8e70-495e-af35-b139cbe1230d/FA%20Additional%20Business%20Interests.pdf`,code:"ATJ 258.3",revision:"06/25",bytes:808358,sha256:"6ad339f236f901a31881123ba44ae6971cd4d0118b6a4e37af719f6b2d63206c",automationStatus:"unmapped",requiredFor:["both"],relatedQuestionnaires:[...q.assets,"income-employment"]}),
 il({id:"financial-additional-life-insurance",name:"Additional Life Insurance Policies",description:"Financial Affidavit continuation page only; it is not a generic retirement schedule.",category:"financial",filename:"financial-additional-life-insurance.pdf",officialUrl:`${B}/e0ccfa97-279a-467e-ac21-96c37a43fe13/FA%20Additional%20Life%20Insurance%20Policies.pdf`,code:"ATJ 259.3",revision:"06/25",bytes:796483,sha256:"8b0e9788dad69f78e201b1fd65cd525d563f523cdb79a7f8942f964b0f17959f",automationStatus:"unmapped",requiredFor:["both"],relatedQuestionnaires:q.assets}),
 il({id:"parenting-plan",name:"Parenting Plan",description:"Statewide proposed parenting plan.",category:"parenting",filename:"parenting-plan.pdf",officialUrl:`${B}/a601856a-12e7-44fe-9076-88a8e150c3a7/DWC%20Parenting%20Plan.pdf`,code:"ATJ 108.4",revision:"03/25",bytes:1485062,sha256:"0a715dc0ae48f7409aab450e4dad73f1483f68b5fad65c5a2af3d483d8cdbc2c",requiredFor:["with_children"],relatedQuestionnaires:["children-information","parenting-plan"]}),
 il({id:"judgment-no-children",name:"Judgment for Dissolution",description:"Statewide judgment without minor children.",category:"judgment",filename:"judgment-dissolution-no-children.pdf",officialUrl:`${B}/ee611252-2582-4546-9426-72234f6582af/DNC%20Judgment%20for%20Dissolution.pdf`,code:"ATJ 104.4",revision:"03/25",bytes:1426509,sha256:"0e83e660ac783c82f62e808fae0dc13eebc07da847e8afbd545104c6034a140b",requiredFor:["no_children"],relatedQuestionnaires:[...q.basic,"marriage-details",...q.assets]}),
 il({id:"judgment-with-children",name:"Judgment for Dissolution with Children",description:"Statewide judgment with children; no separate statewide allocation-judgment artifact is claimed.",category:"judgment",filename:"judgment-dissolution-with-children.pdf",officialUrl:`${B}/28a17a49-16ea-415f-9642-6c186e387d94/DWC%20Judgment%20for%20Dissolution.pdf`,code:"ATJ 106.2",revision:"03/25",bytes:1316160,sha256:"9b7980335f317d36623231536a399a8f1693f281def14427c63422161ec4c564",requiredFor:["with_children"],relatedQuestionnaires:[...q.basic,"marriage-details","children-information","parenting-plan"]}),
 unsupported({id:"certificate-of-service",name:"Certificate of Service (unverified identity)",description:"No exact statewide divorce-suite artifact admitted, and no county issuer evidenced.",category:"service",filename:"certificate-of-service.pdf",authority:"unverified_identity",requiredFor:["both"],relatedQuestionnaires:[]}),
 unsupported({id:"affidavit-service-special-process",name:"Affidavit of Service by Special Process Server (unverified identity)",description:"No exact statewide artifact admitted, and no county issuer evidenced.",category:"service",filename:"affidavit-service-special.pdf",authority:"unverified_identity",requiredFor:["both"],relatedQuestionnaires:[]}),
 unsupported({id:"waiver-service",name:"Waiver of Service (unverified identity)",description:"No statewide waiver admitted and no county issuer evidenced; certification agreements are distinct artifacts.",category:"service",filename:"waiver-service.pdf",authority:"unverified_identity",requiredFor:["both"],relatedQuestionnaires:[]}),
 unsupported({id:"marital-settlement-agreement",name:"Marital Settlement Agreement",description:"FreshStart template, not an Illinois standardized form.",category:"judgment",filename:"marital-settlement-agreement.pdf",authority:"freshstart_template",requiredFor:["both"],relatedQuestionnaires:[...q.assets,"property-division"]}),
 il({id:"child-support-order",name:"Order for Support (Child Support and Maintenance)",description:"Statewide support order, distinct from the federal IWO.",category:"support",filename:"child-support-order.pdf",officialUrl:`${B}/e3440546-6e6b-4904-9cab-2b029894c518/DCS%20Order%20For%20Support.pdf`,code:"ATJ 129.5",revision:"09/25",bytes:926396,sha256:"dd227345187a6d5cfe7f000a46d8a49362577d794d06649b2858649e25db4c08",requiredFor:["with_children"],relatedQuestionnaires:[...q.financial,"children-information"]}),
 {id:"income-withholding-order",name:"Income Withholding for Support (federal OMB 0970-0154)",description:"Federal withholding form; inclusion and download remain separately guarded.",category:"support",filename:"income-withholding-order.pdf",officialUrl:"https://acf.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf?download=1",version:"OMB 0970-0154 (printed date 2026-08-31)",lastUpdated:"2026-07-21",authority:"federal_acf",automationStatus:"separately_guarded",provenance:{printedCode:"OMB 0970-0154",printedRevision:"2026-08-31",retrievedAt:"2026-07-21T00:00:00Z",contentType:"application/pdf",bytes:505412,sha256:"2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551"},requiredFor:["with_children"],relatedQuestionnaires:q.financial,instructions:"Availability is determined only by the guarded IWO boundary."},
]
export function getFormsByCategory(category:FormCategory){return ILLINOIS_COURT_FORMS.filter(f=>f.category===category)}
export function getFormsForCaseType(hasChildren:boolean){const t=hasChildren?"with_children":"no_children";return ILLINOIS_COURT_FORMS.filter(f=>f.requiredFor.includes(t)||f.requiredFor.includes("both"))}
export function getFormById(id:string){return ILLINOIS_COURT_FORMS.find(f=>f.id===id)}
export function getFormsForQuestionnaire(slug:string){return ILLINOIS_COURT_FORMS.filter(f=>f.relatedQuestionnaires.includes(slug))}
/**
 * Statuses that clear an entry for a locally served static artifact.
 *
 * Deliberately empty. No catalog row has passed pinned-artifact, field-mapping
 * and generated-output review, so none may resolve to `/forms/<file>`.
 * `separately_guarded` is NOT listed: it is the most restricted status in the
 * catalog, and reading it as an eligibility grant is what would let the federal
 * IWO fall through to a public static path if the id check below were relaxed.
 */
const AUTOMATION_ELIGIBLE_STATUSES:readonly AutomationStatus[]=[]
export function isFormAutomationEligible(form:CourtForm){return AUTOMATION_ELIGIBLE_STATUSES.includes(form.automationStatus)}
/** The county whose packet is being composed. Required — there is no default. */
export interface AutoPacketContext { countyId: string }
/**
 * Whether an entry may be placed in an automatically composed packet.
 *
 * This is an IDENTITY question, not a mapping one: a row whose semantic identity
 * has no corroborating official artifact must not be presented as a form the
 * case needs. Corroborated statewide artifacts stay composable — their open
 * question is field mapping — and the federal IWO keeps its own separate gate.
 *
 * It is decided from each class's own `autoPacketComposability`, NOT from
 * `mayCarryOfficialArtifact`. Reading the provenance flag as a composition
 * decision made the county case unrepresentable: a county artifact names no
 * statewide URL, so the flag is false, yet withholding it from its OWN county's
 * packet is not the rule — the rule is that it may appear there and NOWHERE
 * else. A county row therefore composes only when it names its issuing county
 * and that county matches the packet being built; a row that names no issuing
 * county never composes, so an unlabelled county artifact fails closed.
 */
export function isAutoPacketComposable(form:CourtForm,context:AutoPacketContext):boolean {
  const rule=FORM_AUTHORITY_CLASSES[form.authority].autoPacketComposability
  if(rule==="never_composable")return false
  if(rule==="requires_county_context")return typeof form.issuingCountyId==="string" && form.issuingCountyId.length>0 && form.issuingCountyId===context.countyId
  return rule==="composable"
}
export function getFormPath(form:CourtForm):string {if(form.id==="income-withholding-order")throw new Error("income-withholding-order has no static path; use the guarded route");if(!isFormAutomationEligible(form))throw new Error(`${form.id} is not automation-eligible: ${form.automationStatus}`);return `/forms/${form.filename}`}
export async function checkFormExists(form:CourtForm){try{return (await fetch(getFormPath(form),{method:"HEAD"})).ok}catch{return false}}
export const FORMS_DOWNLOAD_INSTRUCTIONS=`Catalog metadata is not download authority. Illinois artifacts must remain outside public/forms and pass pinned artifact, field-mapping, and generated-output verification. The federal IWO retains all existing separate gates.`
