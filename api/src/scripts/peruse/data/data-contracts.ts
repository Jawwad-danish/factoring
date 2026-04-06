/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface Address {
    /**
     * Address line 1
     * @example "1234 Hometown Rd"
     */
    street?: string | null;
    /**
     * Address line 2
     * @example "APT 1"
     */
    street2?: string | null;
    /** @example "P.O. Box 1" */
    po?: string | null;
    /** @example "Denver" */
    city?: string | null;
    /** @example "Denver" */
    county?: string | null;
    /** @example "CO" */
    state?: string | null;
    /** @example "US" */
    country?: string | null;
    /** @example "12345" */
    zip?: string | null;
  }
  
  export interface BatchBodyRequest {
    ids: string[];
  }
  
  export interface BatchGroupAndVerifyLoadsCarrierRequest {
    client: GroupAndVerifyLoadsCarrierClientInput;
    /** @example true */
    verify_load: boolean;
    /** @example "wire" */
    funding_type?: string | null;
    structured_load_entries: GroupAndVerifyLoadsCarrierStructuredLoadEntriesInput[];
    /** @example [{"external_id":"","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/rate_confirmation.pdf"},{"external_id":"","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/BOL.pdf"}] */
    documents: BatchGroupAndVerifyLoadsCarrierRequestDocuments[];
    /** @example "https://api-service.staging.peruseml.com/echo" */
    callback_url?: string;
    /** @example "12345" */
    external_batch_id: string;
    funding_methods?: FundingMethodsDataInput[];
  }
  
  export interface BatchGroupAndVerifyLoadsCarrierRequestDocuments {
    external_id: string;
    document_ref: string;
  }
  
  export interface Broker {
    load_reference_numbers?: (string | null)[];
    address?: Address | null;
    /** @example "ACH" */
    payment_method?: string | null;
    /** @example "John Doe" */
    name?: string | null;
    rate?: Rate | null;
    /** @example "1234567890" */
    dot_number?: string | null;
    /** @example "1234567890" */
    mc_number?: string | null;
    phones?: (Phone | null)[];
    /** @example "" */
    billing_instructions?: string | null;
    /** @example "website" */
    website?: string | null;
    driver?: Person | null;
    emails?: (string | null)[];
    contact?: Person | null;
  }
  
  export interface BulkCorrectionsRequest {
    /** @example "" */
    corrections_file_url?: string;
    /** @example "<payload schema version>" */
    version: string;
  }
  
  export interface BulkCorrectionsResponse {
    status: BulkCorrectionsResponseStatusEnum;
  }
  
  export interface BulkImportLoadsRequest {
    /** @example "<publicly available url to loads file>" */
    loads_file_url: string;
    /** @example "<debtor name>" */
    debtor_name: string;
    /** @example "csv" */
    file_type: BulkImportLoadsRequestFileTypeEnum;
  }
  
  export interface BulkImportLoadsResponse {
    status: BulkImportLoadsResponseStatusEnum;
  }
  
  export interface BulkVerifyLoadRequest {
    /** @example "123456" */
    external_id?: string | null;
    /** @example "wire" */
    funding_type?: string | null;
    funding_methods?: FundingMethodsDataInput[];
    loads: VerifyLoadRequest[];
  }
  
  /** @example {"external_id":"","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/BOL.pdf","classify":true} */
  export interface BulkVerifyLoadRequestLoadsBol {
    external_id?: string;
    document_ref: string;
    classify: boolean;
  }
  
  /** @example {"external_id":"","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/carrier_invoice.pdf","classify":true} */
  export interface BulkVerifyLoadRequestLoadsCarrierInvoice {
    external_id?: string;
    document_ref: string;
    classify: boolean;
  }
  
  /** @example {"external_id":"","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/rate_confirmation.pdf","classify":true} */
  export interface BulkVerifyLoadRequestLoadsRateConfirmation {
    external_id?: string;
    document_ref: string;
    classify: boolean;
  }
  
  export interface Carrier {
    load_reference_numbers?: (string | null)[];
    address?: Address | null;
    /** @example "ACH" */
    payment_method?: string | null;
    /** @example "John Doe" */
    name?: string | null;
    /** @example "ABCD" */
    scac_code?: string | null;
    rate?: Rate | null;
    /** @example "1234567890" */
    dot_number?: string | null;
    /** @example "1234567890" */
    mc_number?: string | null;
    phones?: (Phone | null)[];
    /** @example "website" */
    website?: string | null;
    driver?: Person | null;
    emails?: (string | null)[];
    contact?: Person | null;
  }
  
  export interface CategoryFieldsResponse {
    status: CategoryFieldsResponseStatusEnum;
    /** @example ["billing_instructions","bol_reference_number","broker_address","broker_billing_information","broker_carrier_dot","broker_carrier_mc","broker_contact","broker_driver","broker_driver_cellphone","broker_email","broker_ext","broker_fax","broker_name","broker_phone","broker_reference_number","broker_trailer","broker_website","cargo_value","carrier_address","carrier_carrier_dot","carrier_carrier_mc","carrier_contact","carrier_driver","carrier_driver_cellphone","carrier_email","carrier_ext","carrier_fax","carrier_name","carrier_phone","carrier_trailer","carrier_truck","carrier_website","commodity","delivery_appointment_notes","delivery_appointment_number","delivery_appointment_time","delivery_contact","delivery_date","delivery_directions","delivery_end_time","delivery_notes","delivery_reference_number","delivery_start_time","detention","dimensions","dispatch_notes","driver_instructions","equipment","equipment_size","food_grade","fuel_surcharge","hazmat_un_number","ishazmat","layover","line_haul_rate","load_bars","load_type","lumper","miles","number_of_units","other_accessorial_charges","pages","pickup_appointment_notes","pickup_appointment_number","pickup_appointment_time","pickup_contact","pickup_date","pickup_directions","pickup_end_time","pickup_notes","pickup_reference_number","pickup_start_time","po_reference_number","quickpay_email","receiver_address","receiver_carrier_dot","receiver_carrier_mc","receiver_contact","receiver_email","receiver_ext","receiver_name","receiver_phone","roll_doors","scac_code","shipment_requirements","shipper_address","shipper_contact","shipper_email","shipper_ext","shipper_name","shipper_phone","shipper_reference_number","shipper_trailer","shipper_truck","straps_needed","temp_mode_cycle_continue","temperature","total_rate","type_of_hazmat","type_of_units","value_of_items","weight"] */
    fields: string[];
  }
  
  export interface CategoryResponse {
    status: CategoryResponseStatusEnum;
    /** @example ["BOL","annual_review_of_driving_record","background_check_auth","breath_alcohol_test","broker_carrier_agreement","car_shipment_dispatch","carrier_invoice","check","child_support","commercial_invoice","company_driver_checklist","critical_event_report","deposit_enrollment_form","driver_lease_agreement","driver_license","driver_pay_settlement","drug_alcohol_clearinghouse_consent","drug_test","drver_vehicle_examination","emergency_contact_form","employee_benefits","employment_application","employment_verification","form_1099","form_i9","form_w2","form_w4","form_w9","fuel_receipt","fuel_report","hos_log","hos_record","hos_violation","inspection","insurance","lease_agreement","load_list","load_offer","lumper","maintenance","medical_card","mvr_check","other","packing_list","passenger_authorization","payment_assignment","personal_conveyance","port_ticket","preemployment_clearinghouse_query","psp_report","rate_confirmation","road_test","rut7","scales","ssn","tire_inspection","traffic_ticket","training_accident_policy_and_procedure","training_cell_phone_policy","training_defensive_driving_certificate","training_dispatch_protocol","training_dot_hazmat_certificate","training_dot_hos_certificate","training_dot_inspection_certificate","training_dot_packaging_certificate","training_eld_certificate","training_hazmat_awareness_certificate","training_hazmat_highway_certificate","training_hazmat_safety_certificate","training_hazmat_security_certificate","training_pc_policy","training_placarding_policy","training_safety_incentive","training_safety_manual","training_seat_belt_policy","training_tire_check_procedure","training_violation_policies","training_vir_procedure","transportation_agreement","vehicle_purchase","vehicle_registration"] */
    categories: string[];
  }
  
  export interface ClassifyRequest {
    document: ClassifyRequestDocument;
    /** @example true */
    extract?: boolean;
    /**
     * @format int64
     * @example 3600000
     */
    url_expiration_millis?: number;
    /** @example "https://api-service.staging.peruseml.com/echo" */
    callback_url?: string;
  }
  
  export interface ClassifyRequestDocument {
    /** @example "07afde13-8cf3-4628-a535-aec0443afb08" */
    external_id: string;
    /** @example "https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/rate_confirmation.pdf" */
    url: string;
  }
  
  export interface ClassifyResponse {
    /**
     * @format uuid
     * @example "6412571a-d9eb-49e4-b9d8-7a3cfa6a68db"
     */
    job_id: string;
    /** @example "classification" */
    job_type: ClassifyResponseJobTypeEnum;
    /** @example "pending" */
    status: ClassifyResponseStatusEnum;
    message: string;
    /** @format uuid */
    duplicate_of_job_id?: string;
    input: ClassifyResponseInput;
    /** @example null */
    result: any;
  }
  
  export interface ClassifyResponseInput {
    document: ClassifyRequestDocument;
    /** @example true */
    extract: boolean;
    /** @example "https://api-service.staging.peruseml.com/echo" */
    callback_url: string;
  }
  
  export interface Company {
    /** @example "John Doe" */
    name?: string | null;
    phones?: (Phone | null)[];
    emails?: (string | null)[];
    contact?: Person | null;
    /** @example "website" */
    website?: string | null;
    address?: Address | null;
    load_reference_numbers?: (string | null)[];
  }
  
  export interface CorrectionsRequest {
    /** @example "<document id>" */
    document_id?: string;
    /** @example "<job id>" */
    job_id?: string;
    /** @example "<payload schema version>" */
    version: string;
    /** @example "<arbitrary JSON correction data>" */
    data: any;
  }
  
  export interface CorrectionsResponse {
    status: CorrectionsResponseStatusEnum;
  }
  
  export interface CreateLoadRequest {
    structured_load_data?: CreateLoadStructuredLoadDataInput | null;
    documents?: DocumentRecord[] | null;
    /** @example "https://api-service.staging.peruseml.com/echo" */
    callback_url?: string;
  }
  
  export interface CreateLoadRequestDocumentsSystemOfRecord {
    use_as_structured_load_data?: boolean | null;
    structured_system_data: CreateLoadRequestDocumentsSystemOfRecordStructuredSystemData;
  }
  
  export interface CreateLoadRequestDocumentsSystemOfRecordStructuredSystemData {
    rate_confirmation: TMSStructuredSystemData;
  }
  
  export interface CreateLoadStructuredLoadDataInput {
    quick_pay_fee?: string | null;
    less_advance?: string | null;
    /** @example [{"type":"shipper","value":"SN-123"},{"type":"broker","value":"BN-123"}] */
    load_reference_numbers?: SLDReferenceNumber[] | null;
    delivery_address?: string | null;
    broker_invoice_number?: string | null;
    carrier_invoice_number?: string | null;
    broker_mc?: string | null;
    carrier_pay_fee_funding_method?: string | null;
    carrier_rate?: string | null;
    carrier_name?: string | null;
    shipper_name?: string | null;
    total_pay_to_broker?: string | null;
    carrier_mc?: string | null;
    broker_name?: string | null;
    total_pay_to_carrier?: string | null;
    line_haul_rate?: string | null;
    pickup_address?: string | null;
    broker_dot?: string | null;
    external_id?: string | null;
    carrier_pay_fee?: string | null;
    broker_id?: string | null;
    /** Deprecated in favor of load_reference_numbers.broker. */
    po_reference_number?: string | null;
    carrier_dot?: string | null;
    /** Deprecated in favor of load_reference_numbers.shipper. */
    shipper_reference_number?: string | null;
    broker_email?: string | null;
  }
  
  export interface Currency {
    /** @example "USD" */
    type: string;
    /**
     * @format double
     * @example 1
     */
    exchange_rate?: number | null;
  }
  
  /** @example {"value":300,"unit":"miles"} */
  export interface Distance {
    /**
     * @format double
     * @example 100
     */
    value: number;
    /** @example "pallets" */
    unit: string;
  }
  
  export interface DocumentRecord {
    /** @example "" */
    external_id?: string | null;
    /** @example "https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/BOL.pdf" */
    document_ref?: string | null;
    system_of_record?: CreateLoadRequestDocumentsSystemOfRecord | null;
  }
  
  export interface Equipment {
    /** @example "flatbed" */
    type: EquipmentTypeEnum;
    /** @example "53'" */
    size?: string | null;
    /** @example "over_the_road" */
    mode?: EquipmentModeEnum;
  }
  
  export interface EquipmentCategoryResponse {
    status: EquipmentCategoryResponseStatusEnum;
    /** @example ["cargovan","drayage","dryvan","flatbed","hotshot","power only","reefer","straight box truck"] */
    categories: string[];
  }
  
  export interface FileUploadErrorResponse {
    /** @example "Failed to upload file. Try again later." */
    message: string;
  }
  
  export interface FileUploadResponse {
    /** @example "upload-6412571a-d9eb-49e4-b9d8-7a3cfa6a68db" */
    upload_id: string;
    /** @example "File uploaded successfully." */
    message: string;
  }
  
  /** @example {"type":"Wire","name":"Account name","amount":2000} */
  export interface FundingMethodsDataInput {
    /** @example "Wire" */
    type?: string | null;
    /** @example "Account name" */
    name?: string | null;
    /**
     * @format double
     * @example 2000
     */
    amount?: number | null;
  }
  
  export interface GetChangedBatchesBodyRequest {
    /** @example "2024-05-14T22:03:31.909" */
    date_since: string;
  }
  
  export interface GetChangedBatchesResponse {
    status: GetChangedBatchesResponseStatusEnum;
    ids: string[];
  }
  
  /** @example {"broker_name":"Skyline Transportation","broker_id":"#6490"} */
  export interface GroupAndVerifyLoadsBrokerClientInput {
    broker_name: string;
    broker_mc?: string | null;
    broker_id?: string | null;
    broker_dot?: string | null;
    broker_email?: string | null;
  }
  
  export interface GroupAndVerifyLoadsBrokerRequest {
    client: GroupAndVerifyLoadsBrokerClientInput;
    /** @example true */
    verify_load: boolean;
    /** @example "wire" */
    funding_type?: string | null;
    /** @example [{"quick_pay_fee":"-$45.00","carrier_pay_fee_funding_method":"ACH","carrier_rate":"$1125.00","carrier_name":"MARTINEZ EXPRESS","shipper_name":"MARUCHAN","total_pay_to_broker":"$1575.00","carrier_mc":"532437","total_pay_to_carrier":"$1070.00","carrier_pay_fee":"-$10.00","po_reference_number":"54468","shipper_reference_number":"50681102"},{"quick_pay_fee":"-$34.00","carrier_pay_fee_funding_method":"ACH","carrier_rate":"$850.00","carrier_name":"MARTINEZ EXPRESS","shipper_name":"MARUCHAN","total_pay_to_broker":"$1175.00","carrier_mc":"532437","total_pay_to_carrier":"$816.00","po_reference_number":"54492","shipper_reference_number":"50681220"}] */
    structured_load_entries: GroupAndVerifyLoadsBrokerStructuredLoadEntriesInput[];
    /** @example [{"external_id":"","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/exhibit_b.pdf"},{"external_id":"","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/rate_confirmation.pdf"},{"external_id":"","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/BOL.pdf"}] */
    documents: GroupAndVerifyLoadsBrokerRequestDocuments[];
    /** @example "https://api-service.staging.peruseml.com/echo" */
    callback_url?: string;
  }
  
  export interface GroupAndVerifyLoadsBrokerRequestDocuments {
    external_id: string;
    document_ref: string;
  }
  
  export interface GroupAndVerifyLoadsBrokerStructuredLoadEntriesInput {
    quick_pay_fee?: string | null;
    less_advance?: string | null;
    delivery_address?: string | null;
    broker_invoice_number?: string | null;
    carrier_invoice_number?: string | null;
    carrier_pay_fee_funding_method?: string | null;
    carrier_rate?: string | null;
    carrier_name: string;
    shipper_name: string;
    total_pay_to_broker?: string | null;
    carrier_mc?: string | null;
    total_pay_to_carrier?: string | null;
    pickup_address?: string | null;
    carrier_pay_fee?: string | null;
    po_reference_number: string;
    carrier_dot?: string | null;
    shipper_reference_number: string;
  }
  
  /** @example {"carrier_name":"LOGIFLEX INC","carrier_mc":"","carrier_dot":""} */
  export interface GroupAndVerifyLoadsCarrierClientInput {
    carrier_name: string;
    carrier_mc?: string | null;
    carrier_dot?: string | null;
  }
  
  export interface GroupAndVerifyLoadsCarrierRequest {
    client: GroupAndVerifyLoadsCarrierClientInput;
    /** @example true */
    verify_load: boolean;
    /** @example "wire" */
    funding_type?: string | null;
    structured_load_entries: GroupAndVerifyLoadsCarrierStructuredLoadEntriesInput[];
    /** @example [{"external_id":"","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/rate_confirmation.pdf"},{"external_id":"","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/BOL.pdf"}] */
    documents: GroupAndVerifyLoadsCarrierRequestDocuments[];
    /** @example "https://api-service.staging.peruseml.com/echo" */
    callback_url?: string;
  }
  
  export interface GroupAndVerifyLoadsCarrierRequestDocuments {
    external_id: string;
    document_ref: string;
  }
  
  /** @example {"broker_name":"CROWLEY LOGISTICS, INC.","line_haul_rate":"687.50","po_reference_number":"10025","pickup_address":"9400 BLUE MOUND RD FORT WORTH,TX 76131","delivery_address":"12619 PORT ROAD HOUSTON,TX, 77001","broker_email":"Brianna.Reynolds@crowley.com","external_id":"123456"} */
  export interface GroupAndVerifyLoadsCarrierStructuredLoadEntriesInput {
    broker_name: string;
    line_haul_rate?: string | null;
    po_reference_number: string;
    pickup_address?: string | null;
    delivery_address?: string | null;
    broker_email?: string | null;
    external_id?: string | null;
  }
  
  export interface GroupAndVerifyLoadsResponse {
    /** @example "12345" */
    job_id: string;
    /** @example "bulkClassification" */
    job_type: string;
    status: GroupAndVerifyLoadsResponseStatusEnum;
  }
  
  export interface ImportCanonicalDataRequest {
    /** @example "broker" */
    company_role: ImportCanonicalDataRequestCompanyRoleEnum;
    /** @example "<payload schema version>" */
    version: string;
    /** @example "<arbitrary JSON canonical data>" */
    data: any;
  }
  
  export interface ImportCanonicalDataResponse {
    status: ImportCanonicalDataResponseStatusEnum;
  }
  
  export interface ImportLoadDataByQueryRequest {
    load_data: ImportLoadDataByQueryRequestLoadData;
    query: ImportLoadDataByQueryRequestQuery;
  }
  
  export interface ImportLoadDataByQueryRequestLoadData {
    factor: ImportLoadDataByQueryRequestLoadDataFactor;
  }
  
  export interface ImportLoadDataByQueryRequestLoadDataFactor {
    /** @example "key2" */
    load_reference_number: string;
  }
  
  export interface ImportLoadDataByQueryRequestQuery {
    broker: ImportLoadDataByQueryRequestQueryBroker;
    carrier: ImportLoadDataByQueryRequestQueryCarrier;
  }
  
  export interface ImportLoadDataByQueryRequestQueryBroker {
    load_reference_number: string;
    external_id: string;
  }
  
  export interface ImportLoadDataByQueryRequestQueryCarrier {
    load_reference_number: string;
    external_id: string;
  }
  
  export interface ImportLoadDataByQueryResponse {
    /** @example ["key1","key2"] */
    hits: string[];
    /** @example ["key3","key4"] */
    misses: string[];
  }
  
  export interface ImportLoadResponse {
    status: ImportLoadResponseStatusEnum;
  }
  
  export interface InformationExtractionRequest {
    /** @example "rate_confirmation" */
    category: string;
    document: ClassifyRequestDocument;
    /** @example "https://api-service.staging.peruseml.com/echo" */
    callback_url?: string;
    /**
     * @format int64
     * @example 3600000
     */
    url_expiration_millis?: number;
  }
  
  export interface JobBatchResponse {
    /** @example "success" */
    status: JobBatchResponseStatusEnum;
    /**
     * @format uuid
     * @example "6412571a-d9eb-49e4-b9d8-7a3cfa6a68db"
     */
    job_id: string;
    job_type: JobBatchResponseJobTypeEnum;
  }
  
  export interface JobResponse {
    /** @example "success" */
    status: JobResponseStatusEnum;
    /**
     * @format uuid
     * @example "6412571a-d9eb-49e4-b9d8-7a3cfa6a68db"
     */
    job_id: string;
    job_type: JobResponseJobTypeEnum;
    input: JobResponseInput;
    message: string;
    /** @format uuid */
    duplicate_of_job_id: string;
    result: any;
    document_ids: string[];
  }
  
  export interface JobResponseInput {
    document: ClassifyRequestDocument;
    /** @example true */
    extract: boolean;
  }
  
  export interface JobResponseInputDocumentsSystemOfRecord {
    use_as_structured_load_data?: boolean | null;
    structured_system_data: JobResponseInputDocumentsSystemOfRecordStructuredSystemData;
  }
  
  export interface JobResponseInputDocumentsSystemOfRecordStructuredSystemData {
    rate_confirmation: TMSStructuredSystemData;
  }
  
  export interface JobTestCallbackRequest {
    /** @example "https://api-service.staging.peruseml.com/echo" */
    callback_url?: string;
  }
  
  export interface JobTestCallbackResponse {
    /** @example "https://api-service.staging.peruseml.com/echo" */
    callback_url: string;
    response: JobTestCallbackResponseResponse;
  }
  
  export interface JobTestCallbackResponseResponse {
    /**
     * @format int64
     * @example 200
     */
    status: number;
    /** @example {"message":"your callback message"} */
    body: any;
  }
  
  export interface LineItem {
    /** @example "line_haul" */
    type: LineItemTypeEnum;
    /** @example "$200" */
    value: string;
  }
  
  export interface LoadBodyRequest {
    ids: string[];
  }
  
  export interface MatchDocumentsRequest {
    input: MatchDocumentsRequestInput;
    candidate: MatchDocumentsRequestCandidate;
    /**
     * @format int64
     * @example 3600000
     */
    url_expiration_millis?: number;
    /** @example "https://api-service.staging.peruseml.com/echo" */
    callback_url?: string;
  }
  
  export interface MatchDocumentsRequestCandidate {
    /** @example "rate_confirmation" */
    category: string;
    document: MatchDocumentsRequestCandidateDocument;
  }
  
  /** @example {"external_id":"ee76506d-a8a6-4dd2-b8e1-a34304bfe283","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/rate_confirmation.pdf"} */
  export interface MatchDocumentsRequestCandidateDocument {
    external_id: string;
    document_ref: string;
  }
  
  export interface MatchDocumentsRequestInput {
    /** @example "BOL" */
    category: string;
    document: MatchDocumentsRequestInputDocument;
  }
  
  /** @example {"external_id":"fb9a9e2d-77b3-4171-9996-f44ca67f9bc5","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/BOL.pdf"} */
  export interface MatchDocumentsRequestInputDocument {
    external_id: string;
    document_ref: string;
  }
  
  export interface MatchDocumentsResponse {
    /**
     * @format uuid
     * @example "6413375d-8b21-48cd-9538-49254ec4e650"
     */
    job_id: string;
    /** @example "match" */
    job_type: MatchDocumentsResponseJobTypeEnum;
    /** @example "pending" */
    status: MatchDocumentsResponseStatusEnum;
    message: string;
    /** @format uuid */
    duplicate_of_job_id: string;
    input: MatchDocumentsResponseInput;
  }
  
  export interface MatchDocumentsResponseInput {
    input: MatchDocumentsResponseInputInput;
    candidate: MatchDocumentsResponseInputCandidate;
    /** @example "https://api-service.staging.peruseml.com/echo" */
    callback_url: string;
  }
  
  export interface MatchDocumentsResponseInputCandidate {
    /** @example "rate_confirmation" */
    category: string;
    document: ResponseMatchDocument;
  }
  
  export interface MatchDocumentsResponseInputInput {
    document: ResponseMatchDocument;
    /** @example "BOL" */
    category: string;
  }
  
  export interface Measurement {
    /**
     * @format double
     * @example 100
     */
    value: number;
    /** @example "pallets" */
    unit: string;
  }
  
  export interface OAuthClientCredentialsAccessTokenResponse {
    access_token: string;
    /** @format int64 */
    expires_in: number;
    /** @example "Bearer" */
    token_type: OAuthClientCredentialsAccessTokenResponseTokenTypeEnum;
  }
  
  export interface Person {
    /** @example "John Doe" */
    name?: string | null;
    phones?: (Phone | null)[];
    emails?: (string | null)[];
  }
  
  export interface Phone {
    /** @example "867-5309" */
    number: string;
    /** @example "123" */
    ext?: string | null;
    /** @example "mobile" */
    type?: PhoneTypeEnum;
  }
  
  export interface Probability {
    category: string;
    /** @format double */
    confidence: number;
    /** @format double */
    raw_prob: number;
  }
  
  export interface Rate {
    currency?: Currency | null;
    line_items?: LineItem[] | null;
    /** @example "1.15" */
    per_mile?: string | null;
    /** @example "$2300" */
    total?: string | null;
  }
  
  export interface ResponseMatchDocument {
    /** @example "2e801bb3-951d-40f2-90e0-f16ba4deb05f" */
    external_id: string;
    /** @example "2e801bb3-951d-40f2-90e0-f16ba4deb05f" */
    document_ref: string;
  }
  
  export interface SLDReferenceNumber {
    /** @example "broker" */
    type: SldReferenceNumberTypeEnum;
    /** @example "1234567890" */
    value: string;
  }
  
  export interface Shipper {
    /** @example "John Doe" */
    name?: string | null;
    phones?: (Phone | null)[];
    emails?: (string | null)[];
    contact?: Person | null;
    /** @example "website" */
    website?: string | null;
    address?: Address | null;
    load_reference_numbers?: (string | null)[];
  }
  
  export interface SingleJobResponse {
    classification_result: SingleJobResponseClassificationResult;
    information_extraction_result: SingleJobResponseInformationExtractionResult;
    /** @example "success" */
    status: SingleJobResponseStatusEnum;
    result: SingleJobResponseResult;
    /** @example ["ee76506d-a8a6-4dd2-b8e1-a34304bfe283"] */
    document_ids: string[];
    /** @format uuid */
    duplicate_of_job_id?: string;
    /** @example "classification" */
    job_type: SingleJobResponseJobTypeEnum;
    input: SingleJobResponseInput;
    /**
     * @format uuid
     * @example "6412571a-d9eb-49e4-b9d8-7a3cfa6a68db"
     */
    job_id: string;
    message: string;
  }
  
  export interface SingleJobResponseClassificationResult {
    page_1: SingleJobResponseClassificationResultPage1;
  }
  
  export interface SingleJobResponseClassificationResultPage1 {
    /** @example [{"category":"rate_confirmation”","confidence":0.4514377343021764,"raw_prob":0.06051518514679017},{"category":"other","confidence":0.14953722432081135,"raw_prob":0.020045450631412505},{"category":"BOL","confidence":0.14004015306177287,"raw_prob":0.018772369136615976},{"category":"transportation_agreement","confidence":0.13254665593114695,"raw_prob":0.017767866562284802},{"category":"car_shipment_dispatch","confidence":0.12643823238409238,"raw_prob":0.01694903296948286}] */
    probabilities: Probability[];
    /** @example "success" */
    status: SingleJobResponseClassificationResultPage1StatusEnum;
  }
  
  export interface SingleJobResponseInformationExtractionResult {
    rate_confirmation: Partial<SingleJobResponseInformationExtractionResultRateConfirmation>;
  }
  
  export interface SingleJobResponseInformationExtractionResultRateConfirmation {
    /** @example "Street Address" */
    receiver_address_address_type: string;
    /** @example ["11:02"] */
    delivery_start_time: string[];
    /** @example "76131" */
    shipper_address_zip: string;
    /** @example ["9400 BLUE MOUND RD","FORT WORTH,TX 76131"] */
    shipper_address: string[];
    /** @example ["BAYPORT CONTAINER TERMINAL"] */
    receiver_name: string[];
    /** @example "12619 PORT ROAD" */
    receiver_address_street: string;
    /** @example ["Brianna Reynolds"] */
    broker_contact: string[];
    /** @example "32225" */
    broker_address_zip: string;
    /** @example ["9487 Regency Square Blvd, Jacksonville, FL 32225"] */
    broker_address: string[];
    /** @example ["2023-01-20"] */
    delivery_date: string[];
    /** @example ["40HC","Hook Empty"] */
    equipment: string[];
    /** @example "9400 BLUE MOUND RD" */
    shipper_address_street: string;
    /** @example "Jacksonville" */
    broker_address_city: string;
    /** @example "FL" */
    broker_address_state: string;
    /** @example "HOUSTON" */
    receiver_address_city: string;
    /** @example ["12619 PORT ROAD","HOUSTON,TX, 77001"] */
    receiver_address: string[];
    /** @example ["LOGIFLEX INC","WILLIAMSON"] */
    carrier_name: string[];
    /** @example "FORT WORTH" */
    shipper_address_city: string;
    /** @example ["2023-01-19"] */
    pickup_date: string[];
    /** @example ["DICKIE MANUFACTURING"] */
    shipper_name: string[];
    /** @example "Street Address" */
    shipper_address_address_type: string;
    /** @example ["9047264399"] */
    broker_phone: string[];
    /** @example ["CROWLEY LOGISTICS, INC.","US Transportation and Distribution","CROWLEY"] */
    broker_name: string[];
    /** @example "9487 Regency Square Blvd" */
    broker_address_street: string;
    /** @example ["687.50","640.00"] */
    line_haul_rate: string[];
    /** @example ["MRSU,6564391"] */
    pickup_reference_number: string[];
    /** @example ["42000"] */
    weight: string[];
    /** @example ["23:59"] */
    pickup_end_time: string[];
    /** @example "success" */
    status: SingleJobResponseInformationExtractionResultRateConfirmationStatusEnum;
    /** @example ["1,327.50"] */
    total_rate: string[];
    /** @example ["12:00"] */
    pickup_start_time: string[];
    /** @example ["11:02"] */
    delivery_end_time: string[];
    /** @example "TX" */
    shipper_address_state: string;
    /** @example "Street Address" */
    broker_address_address_type: string;
    /** @example "77001" */
    receiver_address_zip: string;
    /** @example ["Brianna.Reynolds@crowley.com","adminlogistics@crowley.com","RSMCommPmtStatus@crowley.com"] */
    broker_email: string[];
    /** @example ["4288132","6495419","4288132"] */
    broker_reference_number: string[];
    /** @example "TX" */
    receiver_address_state: string;
  }
  
  export interface SingleJobResponseInput {
    document: ClassifyRequestDocument;
    /** @example true */
    extract: boolean;
    /** @example "https://api-service.staging.peruseml.com/echo" */
    callback_url: string;
  }
  
  export interface SingleJobResponseResult {
    /** @example ["https://peruse-staging-ocr-output.s3.amazonaws.com/otr/api/6412571a-d9eb-49e4-b9d8-7a3cfa6a68db/07afde13-8cf3-4628-a535-aec0443afb08.pdf.page_1.png.ocr.json?<aws-security-token>"] */
    ocr_urls: string[];
  }
  
  export interface Stop {
    load_reference_numbers?: (string | null)[];
    address?: Address | null;
    /** @example "2024-05-12" */
    date?: string | null;
    /** @example "1234567890" */
    appointment_number?: string | null;
    /** @example "John Doe" */
    name?: string | null;
    /** @example "2024-05-12" */
    time?: string | null;
    /** @example "10:00" */
    start_time?: string | null;
    /** @example "pickup" */
    type: StopTypeEnum;
    /** @example "10:00" */
    end_time?: string | null;
    phones?: (Phone | null)[];
    /** @example "2024-05-12" */
    end_date?: string | null;
    weight?: Weight | null;
    /** @example "2024-05-12" */
    start_date?: string | null;
    /** @example "" */
    notes?: string | null;
    /** @example "website" */
    website?: string | null;
    commodities?: string[] | null;
    units?: (Measurement | null)[];
    /** @example "1234567890" */
    location_code?: string | null;
    emails?: (string | null)[];
    contact?: Person | null;
  }
  
  export interface TMSStructuredSystemData {
    bol_reference_numbers?: string[] | null;
    stops?: Stop[] | null;
    consignor?: Company | null;
    equipment?: Equipment | null;
    carrier?: Carrier | null;
    consignee?: Company | null;
    broker?: Broker | null;
    /** @example "" */
    billing_instructions?: string | null;
    weight?: Weight | null;
    /** @example "" */
    notes?: string | null;
    units?: (Measurement | null)[];
    distance?: Distance | null;
    /** @example "1234567890" */
    container_number?: string | null;
    shipper?: Shipper | null;
    /**
     * Any additional data to be passed through.
     * @example ""
     */
    metadata?: any;
  }
  
  export interface UpdateLoadRequest {
    /**
     * @format uuid
     * @example ""
     */
    load_id: string;
    structured_load_data?: CreateLoadStructuredLoadDataInput;
    documents_to_add?: DocumentRecord[];
    document_ids_to_remove?: string[];
    /** @example "https://api-service.staging.peruseml.com/echo" */
    callback_url?: string;
  }
  
  export interface UpdateLoadRequestDocumentsToAddSystemOfRecord {
    use_as_structured_load_data?: boolean | null;
    structured_system_data: UpdateLoadRequestDocumentsToAddSystemOfRecordStructuredSystemData;
  }
  
  export interface UpdateLoadRequestDocumentsToAddSystemOfRecordStructuredSystemData {
    rate_confirmation: TMSStructuredSystemData;
  }
  
  export interface VerifyLoadRequest {
    BOL: VerifyLoadRequestBol;
    rate_confirmation: VerifyLoadRequestRateConfirmation;
    carrier_invoice?: VerifyLoadRequestCarrierInvoice;
    structured_load_data?: VerifyLoadStructuredDataInput;
    /**
     * @format int64
     * @example 3600000
     */
    url_expiration_millis?: number;
    /** @example "https://api-service.staging.peruseml.com/echo" */
    callback_url?: string;
  }
  
  /** @example {"external_id":"","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/BOL.pdf","classify":true} */
  export interface VerifyLoadRequestBol {
    external_id?: string;
    document_ref: string;
    classify: boolean;
  }
  
  /** @example {"external_id":"","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/carrier_invoice.pdf","classify":true} */
  export interface VerifyLoadRequestCarrierInvoice {
    external_id?: string;
    document_ref: string;
    classify: boolean;
  }
  
  /** @example {"external_id":"","document_ref":"https://peruse-staging-examples-public.s3.us-west-2.amazonaws.com/rate_confirmation.pdf","classify":true} */
  export interface VerifyLoadRequestRateConfirmation {
    external_id?: string;
    document_ref: string;
    classify: boolean;
  }
  
  /** @example {"delivery_address":"12619 PORT ROAD HOUSTON,TX, 77001","carrier_name":"LOGIFLEX INC","carrier_mc":"","broker_name":"CROWLEY LOGISTICS, INC.","line_haul_rate":"687.50","pickup_address":"9400 BLUE MOUND RD FORT WORTH,TX 76131","external_id":"123456","po_reference_number":"12345","carrier_dot":"","broker_email":"Brianna.Reynolds@crowley.com","broker_reference_number":"DEPRECATED"} */
  export interface VerifyLoadStructuredDataInput {
    delivery_address?: string | null;
    carrier_name?: string | null;
    carrier_mc?: string | null;
    broker_name?: string | null;
    line_haul_rate?: string | null;
    pickup_address?: string | null;
    external_id?: string | null;
    po_reference_number?: string | null;
    carrier_dot?: string | null;
    broker_email?: string | null;
    broker_reference_number?: string | null;
  }
  
  /** @example {"value":10000,"unit":"lbs"} */
  export interface Weight {
    /**
     * @format double
     * @example 100
     */
    value: number;
    /** @example "pallets" */
    unit: string;
  }
  
  export enum BulkCorrectionsResponseStatusEnum {
    Success = "success",
  }
  
  /** @example "csv" */
  export enum BulkImportLoadsRequestFileTypeEnum {
    Pdf = "pdf",
    Csv = "csv",
    Xlsx = "xlsx",
  }
  
  export enum BulkImportLoadsResponseStatusEnum {
    Success = "success",
  }
  
  export enum CategoryFieldsResponseStatusEnum {
    Success = "success",
  }
  
  export enum CategoryResponseStatusEnum {
    Success = "success",
  }
  
  /** @example "classification" */
  export enum ClassifyResponseJobTypeEnum {
    Grouping = "grouping",
    VerifyLoad = "verifyLoad",
    BulkClassification = "bulkClassification",
    InformationExtraction = "informationExtraction",
    Classification = "classification",
  }
  
  /** @example "pending" */
  export enum ClassifyResponseStatusEnum {
    Success = "success",
    Error = "error",
    Pending = "pending",
  }
  
  export enum CorrectionsResponseStatusEnum {
    Success = "success",
  }
  
  /** @example "flatbed" */
  export enum EquipmentTypeEnum {
    Hotshot = "hotshot",
    Drayage = "drayage",
    PowerOnly = "power only",
    StraightBoxTruck = "straight box truck",
    Flatbed = "flatbed",
    Other = "other",
    Cargovan = "cargovan",
    Dryvan = "dryvan",
    Reefer = "reefer",
  }
  
  /** @example "over_the_road" */
  export enum EquipmentModeEnum {
    OverTheRoad = "over_the_road",
    Drayage = "drayage",
    Intermodal = "intermodal",
  }
  
  export enum EquipmentCategoryResponseStatusEnum {
    Success = "success",
  }
  
  export enum GetChangedBatchesResponseStatusEnum {
    Success = "success",
  }
  
  export enum GroupAndVerifyLoadsResponseStatusEnum {
    Success = "success",
  }
  
  /** @example "broker" */
  export enum ImportCanonicalDataRequestCompanyRoleEnum {
    Broker = "broker",
    Carrier = "carrier",
  }
  
  export enum ImportCanonicalDataResponseStatusEnum {
    Success = "success",
  }
  
  export enum ImportLoadResponseStatusEnum {
    Success = "success",
  }
  
  /** @example "success" */
  export enum JobBatchResponseStatusEnum {
    Success = "success",
    Error = "error",
    Pending = "pending",
  }
  
  export enum JobBatchResponseJobTypeEnum {
    Grouping = "grouping",
    VerifyLoad = "verifyLoad",
    BulkClassification = "bulkClassification",
    InformationExtraction = "informationExtraction",
    Classification = "classification",
  }
  
  /** @example "success" */
  export enum JobResponseStatusEnum {
    Success = "success",
    Error = "error",
    Pending = "pending",
  }
  
  export enum JobResponseJobTypeEnum {
    Grouping = "grouping",
    VerifyLoad = "verifyLoad",
    BulkClassification = "bulkClassification",
    InformationExtraction = "informationExtraction",
    Classification = "classification",
  }
  
  /** @example "line_haul" */
  export enum LineItemTypeEnum {
    LineHaul = "line_haul",
    Advance = "advance",
    FuelSurcharge = "fuel_surcharge",
    Accessorial = "accessorial",
    Lumper = "lumper",
  }
  
  /** @example "match" */
  export enum MatchDocumentsResponseJobTypeEnum {
    Grouping = "grouping",
    VerifyLoad = "verifyLoad",
    BulkClassification = "bulkClassification",
    InformationExtraction = "informationExtraction",
    Classification = "classification",
  }
  
  /** @example "pending" */
  export enum MatchDocumentsResponseStatusEnum {
    Success = "success",
    Error = "error",
    Pending = "pending",
  }
  
  /** @example "Bearer" */
  export enum OAuthClientCredentialsAccessTokenResponseTokenTypeEnum {
    Bearer = "Bearer",
  }
  
  /** @example "mobile" */
  export enum PhoneTypeEnum {
    Fax = "fax",
    Home = "home",
    Other = "other",
    Work = "work",
    Mobile = "mobile",
  }
  
  /** @example "broker" */
  export enum SldReferenceNumberTypeEnum {
    MasterBol = "master_bol",
    Consignor = "consignor",
    Other = "other",
    Delivery = "delivery",
    Manifest = "manifest",
    Carrier = "carrier",
    ScaleTicket = "scale_ticket",
    Pickup = "pickup",
    Consignee = "consignee",
    Broker = "broker",
    Bol = "bol",
    Shipper = "shipper",
  }
  
  /** @example "success" */
  export enum SingleJobResponseStatusEnum {
    Success = "success",
    Error = "error",
    Pending = "pending",
  }
  
  /** @example "classification" */
  export enum SingleJobResponseJobTypeEnum {
    Grouping = "grouping",
    VerifyLoad = "verifyLoad",
    BulkClassification = "bulkClassification",
    InformationExtraction = "informationExtraction",
    Classification = "classification",
  }
  
  /** @example "success" */
  export enum SingleJobResponseClassificationResultPage1StatusEnum {
    Success = "success",
    Error = "error",
    Pending = "pending",
  }
  
  /** @example "success" */
  export enum SingleJobResponseInformationExtractionResultRateConfirmationStatusEnum {
    Success = "success",
    Error = "error",
    Pending = "pending",
  }
  
  /** @example "pickup" */
  export enum StopTypeEnum {
    Delivery = "delivery",
    Pickup = "pickup",
  }
  
  export enum GetCategoriesV2ParamsClassificationLevelEnum {
    Document = "document",
    Page = "page",
  }
  