// Salesforce object/field API names for the Learner Verification feature,
// confirmed against scripts/objects.json.
//
// Branch access is NOT filtered by an explicit lookup field - DMs only see
// the Master_Branch__c (and child Apprenticeship_Learner__c) records their
// Public Group sharing rules grant them, enforced by Salesforce itself
// since /auth/login authenticates as that DM's own user.
export default {
  learnerObject: process.env.SF_LEARNER_OBJECT || 'Apprenticeship_Learner__c',
  branchObject: process.env.SF_BRANCH_OBJECT || 'Master_Branch__c',
  fields: {
    learnerName: process.env.SF_LEARNER_NAME_FIELD || 'Name',
    learnerGender: process.env.SF_LEARNER_GENDER_FIELD || 'Learner_Gender__c',
    learnerPhone: process.env.SF_LEARNER_PHONE_FIELD || 'Learner_Mobile_Number__c',
    learnerStatus: process.env.SF_LEARNER_STATUS_FIELD || 'Verification_Status__c',
    learnerBranch: process.env.SF_LEARNER_BRANCH_FIELD || 'Master_Branch__c',
    learnerPvcCode: process.env.SF_LEARNER_PVC_CODE_FIELD || 'PVC__c',
    learnerSelection: process.env.SF_LEARNER_SELECTION_FIELD || 'Selection__c',
    branchName: process.env.SF_BRANCH_NAME_FIELD || 'Name',
  },
};
