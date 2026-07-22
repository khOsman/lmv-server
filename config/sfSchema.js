// Salesforce object/field API names for the Learner Verification feature.
// These are placeholders until confirmed against the real org schema - see .env.
export default {
  learnerObject: process.env.SF_LEARNER_OBJECT || 'Learner__c',
  branchObject: process.env.SF_BRANCH_OBJECT || 'Branch__c',
  fields: {
    learnerName: process.env.SF_LEARNER_NAME_FIELD || 'Name',
    learnerPhone: process.env.SF_LEARNER_PHONE_FIELD || 'Phone__c',
    learnerStatus: process.env.SF_LEARNER_STATUS_FIELD || 'Verification_Status__c',
    learnerBranch: process.env.SF_LEARNER_BRANCH_FIELD || 'Branch__c',
    learnerPvcCode: process.env.SF_LEARNER_PVC_CODE_FIELD || 'PVC_Code__c',
    learnerPvcExpiry: process.env.SF_LEARNER_PVC_EXPIRY_FIELD || 'PVC_Expiry__c',
    branchName: process.env.SF_BRANCH_NAME_FIELD || 'Name',
    branchDM: process.env.SF_BRANCH_DM_FIELD || 'District_Manager__c',
  },
};
