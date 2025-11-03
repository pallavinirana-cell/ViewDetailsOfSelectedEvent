import { LightningElement, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';

import NAME_FIELD from '@salesforce/schema/User.Name';
import EMAIL_FIELD from '@salesforce/schema/User.Email';
import TITLE_FIELD from '@salesforce/schema/User.Title';
import PHOTO_URL_FIELD from '@salesforce/schema/User.SmallPhotoUrl';

import getAllJobs from '@salesforce/apex/JobPostingController.getAllJobs';
import getCasesByRecordType from '@salesforce/apex/CaseRequestController.getCasesByRecordType';
import getRecordTypeIdByType from '@salesforce/apex/CaseRequestController.getRecordTypeIdByType'; 

import { loadStyle } from 'lightning/platformResourceLoader';
import caseRequest from '@salesforce/resourceUrl/caseRequest';

export default class CaseRequest extends LightningElement {

    @track selectedType = 'All Requests';
    @track cases = [];
    @track columns = [];
    @track menuOptions = [];

    @track showCaseList = true;
    @track showForm = false;
    @track isJobPosting = false;
    @track ismembership = false;
    @track isProfileUpdate = false;
    @track isAllRequests = true;
    @track isLoading = false;
    @track recordTypeId; 

    @track currentUser = {
        name: '',
        email: '',
        title: '',
        photoUrl: ''
    };

    jobPostingColumns = [
        { label: 'Job Title', fieldName: 'JobTitle' },
        { label: 'Company Name', fieldName: 'CompanyName' },
        { label: 'Status', fieldName: 'Status' },
        { label: 'Job Type', fieldName: 'JobType' },
        { label: 'Work Mode', fieldName: 'WorkMode' }
    ];

    caseColumns = [
        { label: 'Request Number', fieldName: 'CaseNumber' },
        { label: 'Request Type', fieldName: 'Type' },
        { label: 'Status', fieldName: 'Status' },
        { label: 'Created Date', fieldName: 'CreatedDateFormatted' },
        { label: 'Last Modified Date', fieldName: 'LastModifiedDateFormatted' }
    ];

    formatIST(dateValue) {
        if (!dateValue) return '';
        const date = new Date(dateValue);
        return new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    @wire(getRecord, { recordId: USER_ID, fields: [NAME_FIELD, EMAIL_FIELD, TITLE_FIELD, PHOTO_URL_FIELD] })
    wiredUser({ error, data }) {
        if (data) {
            this.currentUser = {
                name: data.fields.Name.value,
                email: data.fields.Email.value,
                title: data.fields.Title.value,
                photoUrl: data.fields.SmallPhotoUrl.value
            };
        } else if (error) {
            console.error('Error fetching user: ', error);
        }
    }

    connectedCallback() {
        loadStyle(this, caseRequest)
            .then(() => console.log('CSS Loaded'))
            .catch(() => console.log('CSS Failed'));

        this.menuOptions = [
            { label: 'All Requests', value: 'All Requests' },
            { label: 'Membership', value: 'Membership' },
            { label: 'Job Posting', value: 'Job Posting' },
            { label: 'Gate Pass', value: 'Gate Pass' },
            { label: 'Guest House', value: 'Guest House' },
            { label: 'Donation', value: 'Donation' },
            { label: 'Event Registration', value: 'Event Registration' }
            //{ label: 'Profile Update', value: 'Profile Update' }
        ].map(opt => ({
            ...opt,
            class: opt.value === this.selectedType ? 'menu-btn active' : 'menu-btn'
        }));

        this.fetchCases();
    }

    fetchCases() {
    this.isLoading = true;

    if (this.selectedType === 'Job Posting') {
        getAllJobs()
            .then(result => {
                this.columns = this.jobPostingColumns;
                this.cases = result.map(j => ({
                    Id: j.Id,
                    jobUrl: `/iitb/s/job-posting/${j.Id}/${encodeURIComponent(j.Job_Title__c)}`,
                    JobTitle: j.Job_Title__c,
                    CompanyName: j.Company_Name__c,
                    Status: j.Approval_Status__c,
                    JobType: j.Job_Type__c,
                    WorkMode: j.Work_Mode__c
                }));
            })
            .catch(error => console.error('Error fetching job postings: ', error))
            .finally(() => (this.isLoading = false));

    } else {
        let recordTypeName = this.selectedType === 'All Requests' ? null : this.selectedType;

        getCasesByRecordType({ recordTypeName })
            .then(result => {
                this.columns = this.caseColumns;
                this.cases = result.map(c => ({
                    Id: c.Id,
                    caseUrl: `/iitb/s/case/${c.Id}/${encodeURIComponent(c.CaseNumber)}`,
                    CaseNumber: c.CaseNumber,
                    Type: c.Type,
                    Status: c.Status,
                    CreatedDateFormatted: this.formatIST(c.CreatedDate),
                    LastModifiedDateFormatted: this.formatIST(c.LastModifiedDate)
                }));
            })
            .catch(error => console.error('Error fetching cases: ', error))
            .finally(() => (this.isLoading = false));
    }
}


    handleTypeChange(event) {
        this.selectedType = event.target.dataset ? event.target.dataset.value : event.detail.value;

        this.showForm = false;
        this.showCaseList = true;

        this.isJobPosting = this.selectedType === 'Job Posting';
        this.ismembership = this.selectedType === 'Membership';
        this.isProfileUpdate = this.selectedType === 'Profile Update';
        this.isAllRequests = this.selectedType === 'All Requests';

        this.menuOptions = this.menuOptions.map(opt => ({
            ...opt,
            class: opt.value === this.selectedType ? 'menu-btn active' : 'menu-btn'
        }));

        this.fetchCases();
    }

    openForm() {
        this.isLoading = true;
        this.showForm = false;
        this.showCaseList = false;

       
        getRecordTypeIdByType({ typeName: this.selectedType })
            .then(result => {
                this.recordTypeId = result;
                console.log(' Record Type ID fetched:', result);
                setTimeout(() => {
                    this.showForm = true;
                    this.isLoading = false;
                }, 400);
            })
            .catch(error => {
                console.error('Error fetching Record Type ID:', error);
                this.isLoading = false;
                this.showForm = true; // fallback
            });
    }

    get showDefaultForm() {
        return !this.ismembership && !this.isJobPosting;
    }

    handleSuccess() {
        this.isLoading = false;
        this.showForm = false;
        this.showCaseList = true;
        this.fetchCases();
    }

    handleCancel() {
        this.isLoading = false;
        this.showForm = false;
        this.showCaseList = true;
    }

    handleChildFormSuccess() {
        this.showForm = false;
        this.showCaseList = true;
        this.fetchCases();
    }

    handleChildFormCancel() {
        this.showForm = false;
        this.showCaseList = true;
    }
}
